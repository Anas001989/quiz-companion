import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        questions: {
          select: {
            id: true
          }
        },
        attempts: {
          select: {
            id: true
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
      questionCount: quiz.questions.length,
      attemptCount: quiz.attempts.length
    }))

    return NextResponse.json({ quizzes: quizzesWithStats })
  } catch (error) {
    console.error('Error fetching teacher quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, teacherId } = body

    console.log('Creating quiz with:', { title, teacherId })

    if (!title || !teacherId) {
      return NextResponse.json({ error: 'Title and teacher ID are required' }, { status: 400 })
    }

    // First check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      console.error('Teacher not found:', teacherId)
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        teacherId
      }
    })

    console.log('Quiz created successfully:', quiz)
    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ 
      error: 'Failed to create quiz', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
