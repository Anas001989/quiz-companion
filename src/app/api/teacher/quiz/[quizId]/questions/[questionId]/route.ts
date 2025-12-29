import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'
import { deleteImage, STORAGE_BUCKETS } from '@/lib/supabase/storage'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { quizId, questionId } = await params
    const body = await request.json()
    const { text, type, questionImageUrl, options } = body

    if (!quizId || !questionId) {
      return NextResponse.json({ error: 'Quiz ID and Question ID are required' }, { status: 400 })
    }

    if (!text || !type) {
      return NextResponse.json({ error: 'Question text and type are required' }, { status: 400 })
    }

    // Verify the question belongs to the quiz
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true }
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (existingQuestion.quizId !== quizId) {
      return NextResponse.json({ error: 'Question does not belong to this quiz' }, { status: 403 })
    }

    // Update the question and its options
    // First, delete existing options
    await prisma.option.deleteMany({
      where: { questionId }
    })

    // Validate answer-image consistency rule
    if (options && Array.isArray(options)) {
      const optionsWithImages = options.filter((opt: any) => opt.answerImageUrl)
      const optionsWithoutImages = options.filter((opt: any) => !opt.answerImageUrl)
      
      if (optionsWithImages.length > 0 && optionsWithoutImages.length > 0) {
        return NextResponse.json({ 
          error: 'If one answer has an image, all answers must have images' 
        }, { status: 400 })
      }
    }

    // Then update the question and create new options
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        type,
        questionImageUrl: questionImageUrl || null,
        options: {
          create: (options || []).map((opt: any) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            answerImageUrl: opt.answerImageUrl || null
          }))
        }
      },
      include: {
        options: true
      }
    })

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({
      error: 'Failed to update question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { quizId, questionId } = await params

    if (!quizId || !questionId) {
      return NextResponse.json({ error: 'Quiz ID and Question ID are required' }, { status: 400 })
    }

    // Verify the question belongs to the quiz and get all related data
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { 
        quiz: true,
        options: true
      }
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (existingQuestion.quizId !== quizId) {
      return NextResponse.json({ error: 'Question does not belong to this quiz' }, { status: 403 })
    }

    // Helper function to extract file path from Supabase storage URL
    const extractFilePath = (imageUrl: string, bucketName: string): string | null => {
      try {
        // Supabase storage URLs typically look like:
        // https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?...
        const url = new URL(imageUrl)
        const pathParts = url.pathname.split('/').filter(part => part)
        
        // Find the bucket name in the path
        const bucketIndex = pathParts.findIndex(part => part === bucketName)
        if (bucketIndex !== -1 && pathParts[bucketIndex + 1]) {
          // Return everything after the bucket name
          return pathParts.slice(bucketIndex + 1).join('/')
        }
        
        // Alternative: if the URL contains the bucket name, try to extract from the full path
        if (url.pathname.includes(bucketName)) {
          const match = url.pathname.match(new RegExp(`${bucketName}/(.+)`))
          if (match && match[1]) {
            // Remove query parameters if present
            return match[1].split('?')[0]
          }
        }
        
        return null
      } catch (error) {
        console.warn('Failed to parse image URL:', imageUrl, error)
        return null
      }
    }

    // Delete images from storage first (before deleting database records)
    // Note: If delete policies are not set, these will fail but won't block database deletion
    try {
      // Delete question image if it exists
      if (existingQuestion.questionImageUrl) {
        try {
          const filePath = extractFilePath(existingQuestion.questionImageUrl, STORAGE_BUCKETS.QUESTION_IMAGES)
          if (filePath) {
            await deleteImage(STORAGE_BUCKETS.QUESTION_IMAGES, filePath)
            console.log('Deleted question image from storage:', filePath)
          } else {
            console.warn('Could not extract file path from question image URL:', existingQuestion.questionImageUrl)
          }
        } catch (imageError: any) {
          // Log but don't fail - image deletion is not critical
          // This might fail if delete policies are not set, which is okay
          console.warn('Failed to delete question image from storage (this is okay if delete policies are not set):', imageError?.message || imageError)
        }
      }

      // Delete answer images if they exist
      for (const option of existingQuestion.options) {
        if (option.answerImageUrl) {
          try {
            const filePath = extractFilePath(option.answerImageUrl, STORAGE_BUCKETS.ANSWER_IMAGES)
            if (filePath) {
              await deleteImage(STORAGE_BUCKETS.ANSWER_IMAGES, filePath)
              console.log('Deleted answer image from storage:', filePath)
            } else {
              console.warn('Could not extract file path from answer image URL:', option.answerImageUrl)
            }
          } catch (imageError: any) {
            // Log but don't fail - image deletion is not critical
            // This might fail if delete policies are not set, which is okay
            console.warn('Failed to delete answer image from storage (this is okay if delete policies are not set):', imageError?.message || imageError)
          }
        }
      }
    } catch (storageError) {
      // Log but continue - storage deletion failures shouldn't block question deletion
      console.warn('Error deleting images from storage (continuing with database deletion):', storageError)
    }

    // Delete database records in the correct order to avoid foreign key violations
    // 1. Delete Answers first (they reference both Question and Option)
    await prisma.answer.deleteMany({
      where: { questionId }
    })

    // 2. Delete Options (they reference Question, and we need to delete them before Question due to RESTRICT constraint)
    await prisma.option.deleteMany({
      where: { questionId }
    })

    // 3. Finally delete the Question
    await prisma.question.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({
      error: 'Failed to delete question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

