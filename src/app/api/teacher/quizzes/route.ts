import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    // Optimized query using _count instead of loading all records
    const quizzes = await prisma.quiz.findMany({
      where: {
        teacherId: teacherId
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const quizzesWithStats = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      createdAt: quiz.createdAt,
      questionCount: quiz._count.questions,
      attemptCount: quiz._count.attempts
    }))

    const duration = Date.now() - startTime
    console.log(`[API] GET /api/teacher/quizzes?teacherId=${teacherId} - ${duration}ms (${quizzes.length} quizzes)`)

    return NextResponse.json({ quizzes: quizzesWithStats })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] GET /api/teacher/quizzes - ERROR after ${duration}ms:`, error)
    return NextResponse.json({ 
      error: 'Failed to fetch quizzes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const body = await request.json()
    const { title, teacherId } = body

    if (!title || !teacherId) {
      return NextResponse.json({ error: 'Title and teacher ID are required' }, { status: 400 })
    }

    // First check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        teacherId
      }
    })

    const duration = Date.now() - startTime
    console.log(`[API] POST /api/teacher/quizzes - ${duration}ms`)

    return NextResponse.json({ quiz })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] POST /api/teacher/quizzes - ERROR after ${duration}ms:`, error)
    return NextResponse.json({ 
      error: 'Failed to create quiz', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
