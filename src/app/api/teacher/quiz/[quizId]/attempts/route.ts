import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Verify quiz exists and get question count efficiently
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
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

    const totalQuestions = quiz._count.questions

    // Fetch all attempts for this quiz (both with studentId and userId)
    const attempts = await prisma.attempt.findMany({
      where: {
        quizId: quizId
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickName: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'desc' }
      ]
    }) as any[]

    // Transform the data - handle both studentId (unlimited) and userId (single-attempt) attempts
    const attemptsWithDetails = attempts.map(attempt => {
      // For single-attempt quizzes, attempts have userId and studentName
      // For unlimited quizzes, attempts have studentId and student relation
      const studentName = attempt.student?.fullName || attempt.studentName || 'Unknown Student'
      const studentNickname = attempt.student?.nickName || null
      
      return {
        id: attempt.id,
        studentName,
        studentNickname,
        score: attempt.score,
        totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0,
        completedAt: attempt.createdAt
      }
    })

    // Find top performer (highest score, most recent if tie)
    const topPerformer = attemptsWithDetails.length > 0 ? attemptsWithDetails[0] : null

    return NextResponse.json({
      attempts: attemptsWithDetails,
      topPerformer,
      totalAttempts: attemptsWithDetails.length,
      totalQuestions
    })
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    return NextResponse.json({
      error: 'Failed to fetch quiz attempts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

