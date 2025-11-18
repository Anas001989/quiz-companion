import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { quizId, questionId } = await params
    const body = await request.json()
    const { text, type, options } = body

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

    // Then update the question and create new options
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        type,
        options: {
          create: options || []
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

    // Delete the question (options will be deleted due to cascade)
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

