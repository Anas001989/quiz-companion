import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

/**
 * GET /api/student/attempts/check
 * Check if a user has already attempted a quiz
 * Query params: quizId, userId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const quizId = searchParams.get('quizId')
    const userId = searchParams.get('userId')

    if (!quizId || !userId) {
      return NextResponse.json({ 
        error: 'Quiz ID and User ID are required' 
      }, { status: 400 })
    }

    // Check if attempt exists for this quiz and user
    const attempt = await prisma.attempt.findFirst({
      where: {
        quizId,
        userId
      },
      select: {
        id: true,
        score: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      hasAttempt: !!attempt,
      attempt: attempt || null
    })
  } catch (error) {
    console.error('Error checking attempt:', error)
    return NextResponse.json({
      error: 'Failed to check attempt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}




