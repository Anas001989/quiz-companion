import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

/**
 * GET /api/student/quiz/[quizId]
 * Fetch quiz settings for students (policy, answerMode, etc.)
 * Used to determine if authentication is required before starting quiz
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Fetch quiz with minimal data needed for student view
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        answerMode: true,
        _count: {
          select: {
            questions: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Get attemptPolicy from DB via raw query (same as attempts API) so we always
    // return the correct value even if Prisma client is out of sync
    let attemptPolicy = 'unlimited'
    try {
      const policyResult = await prisma.$queryRaw<Array<{ attemptPolicy: string }>>`
        SELECT "attemptPolicy" FROM "Quiz" WHERE id = ${quizId}
      `
      attemptPolicy = policyResult[0]?.attemptPolicy || 'unlimited'
    } catch (_) {
      // keep default 'unlimited' if raw query fails
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        answerMode: quiz.answerMode || 'retry-until-correct',
        attemptPolicy,
        questionCount: quiz._count.questions
      }
    })
  } catch (error) {
    console.error('Error fetching quiz for student:', error)
    return NextResponse.json({
      error: 'Failed to fetch quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}




