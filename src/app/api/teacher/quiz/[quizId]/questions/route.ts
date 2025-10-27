import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params

    console.log('Fetching quiz questions for quiz ID:', quizId)

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    console.log('Quiz found:', quiz ? { id: quiz.id, title: quiz.title, questionCount: quiz.questions.length } : 'Not found')

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Transform the data to match the frontend interface
    const transformedQuiz = {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map(question => ({
        id: question.id,
        text: question.text,
        type: question.type as 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'MIXED',
        options: question.options.map(option => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect
        }))
      }))
    }

    console.log('Transformed quiz:', { id: transformedQuiz.id, title: transformedQuiz.title, questionCount: transformedQuiz.questions.length })

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
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params
    const body = await request.json()
    const { text, type, options } = body

    console.log('Creating question for quiz ID:', quizId)

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

    console.log('Question created successfully:', question)

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ 
      error: 'Failed to create question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}