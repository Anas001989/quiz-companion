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
    const { answerMode, attemptPolicy } = body
    console.log('Request body:', { answerMode, attemptPolicy })

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Validate answerMode if provided
    if (answerMode && !['single-pass', 'retry-until-correct'].includes(answerMode)) {
      return NextResponse.json({ error: 'Valid answerMode is required (single-pass or retry-until-correct)' }, { status: 400 })
    }

    // Validate attemptPolicy if provided
    if (attemptPolicy && !['unlimited', 'single-attempt'].includes(attemptPolicy)) {
      return NextResponse.json({ error: 'Valid attemptPolicy is required (unlimited or single-attempt)' }, { status: 400 })
    }

    // At least one field must be provided
    if (!answerMode && !attemptPolicy) {
      return NextResponse.json({ error: 'Either answerMode or attemptPolicy must be provided' }, { status: 400 })
    }

    // Check if quiz exists first
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!existingQuiz) {
      console.error('Quiz not found:', quizId)
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    console.log('Updating quiz settings:', { 
      answerMode: answerMode || existingQuiz.answerMode, 
      attemptPolicy: attemptPolicy || existingQuiz.attemptPolicy 
    })
    
    // Build update data object
    const updateData: any = {}
    if (answerMode) updateData.answerMode = answerMode
    if (attemptPolicy) updateData.attemptPolicy = attemptPolicy
    
    // Use raw SQL if Prisma client doesn't have the field yet
    try {
      const quiz = await prisma.quiz.update({
        where: { id: quizId },
        data: updateData as any
      })
      console.log('Quiz updated successfully')
      return NextResponse.json({ quiz })
    } catch (updateError: any) {
      // If update fails, try raw SQL as fallback
      console.warn('Prisma update failed, trying raw SQL:', updateError.message)
      if (updateError.message && (updateError.message.includes('Unknown arg') || updateError.message.includes('does not exist'))) {
        // Build SQL update dynamically
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1
        
        if (answerMode) {
          updates.push(`"answerMode" = $${paramIndex}`)
          values.push(answerMode)
          paramIndex++
        }
        
        if (attemptPolicy) {
          updates.push(`"attemptPolicy" = $${paramIndex}`)
          values.push(attemptPolicy)
          paramIndex++
        }
        
        if (updates.length > 0) {
          values.push(quizId)
          await prisma.$executeRawUnsafe(
            `UPDATE "Quiz" SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            ...values
          )
          const quiz = await prisma.quiz.findUnique({
            where: { id: quizId }
          })
          console.log('Quiz updated via raw SQL successfully')
          return NextResponse.json({ quiz: { ...quiz, ...updateData } })
        }
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

