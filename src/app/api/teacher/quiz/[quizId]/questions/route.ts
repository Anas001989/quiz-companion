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

    // Optimized query - only select needed fields
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId
      },
      select: {
        id: true,
        title: true,
        answerMode: true,
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            options: {
              select: {
                id: true,
                text: true,
                isCorrect: true
              },
              orderBy: {
                id: 'asc'
              }
            }
          },
          orderBy: {
            id: 'asc'
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Quiz data is already in the right format (no transformation needed)
    const transformedQuiz = {
      id: quiz.id,
      title: quiz.title,
      answerMode: quiz.answerMode || 'retry-until-correct',
      questions: quiz.questions
    }

    return NextResponse.json({ quiz: transformedQuiz })
  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch quiz questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const body = await request.json()
    const { text, type, options } = body

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    if (!text || !type) {
      return NextResponse.json({ error: 'Question text and type are required' }, { status: 400 })
    }

    // Create the question with options
    const question = await prisma.question.create({
      data: {
        text,
        type,
        quizId,
        options: {
          create: options || []
        }
      },
      include: {
        options: true
      }
    })

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ 
      error: 'Failed to create question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}