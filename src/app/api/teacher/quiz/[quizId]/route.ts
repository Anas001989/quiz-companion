import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    console.log('PATCH /api/teacher/quiz/[quizId] - quizId:', quizId)
    
    const body = await request.json()
    const { answerMode } = body
    console.log('Request body:', { answerMode })

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    if (!answerMode || !['single-pass', 'retry-until-correct'].includes(answerMode)) {
      return NextResponse.json({ error: 'Valid answerMode is required (single-pass or retry-until-correct)' }, { status: 400 })
    }

    // Check if quiz exists first
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!existingQuiz) {
      console.error('Quiz not found:', quizId)
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    console.log('Updating quiz answerMode from', existingQuiz.answerMode, 'to', answerMode)
    
    // Use raw SQL if Prisma client doesn't have the field yet
    try {
      const quiz = await prisma.quiz.update({
        where: { id: quizId },
        data: { answerMode } as any
      })
      console.log('Quiz updated successfully')
      return NextResponse.json({ quiz })
    } catch (updateError: any) {
      // If update fails, try raw SQL as fallback
      console.warn('Prisma update failed, trying raw SQL:', updateError.message)
      if (updateError.message && updateError.message.includes('Unknown arg `answerMode`')) {
        // Column exists in DB but Prisma client doesn't know about it yet
        await prisma.$executeRawUnsafe(
          `UPDATE "Quiz" SET "answerMode" = $1 WHERE id = $2`,
          answerMode,
          quizId
        )
        const quiz = await prisma.quiz.findUnique({
          where: { id: quizId }
        })
        console.log('Quiz updated via raw SQL successfully')
        return NextResponse.json({ quiz: { ...quiz, answerMode } })
      }
      throw updateError
    }

  } catch (error: any) {
    console.error('Error updating quiz:', error)
    console.error('Error name:', error?.name)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    return NextResponse.json({ 
      error: 'Failed to update quiz',
      details: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      name: error?.name || 'Error'
    }, { status: 500 })
  }
}

