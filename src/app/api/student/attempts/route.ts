import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId, studentFullName, nickname, answers } = body

    if (!quizId || !studentFullName) {
      return NextResponse.json({ error: 'Quiz ID and student full name are required' }, { status: 400 })
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array is required' }, { status: 400 })
    }

    // Verify quiz exists and load only what we need
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        questions: {
          select: {
            id: true,
            options: {
              select: {
                id: true,
                isCorrect: true
              }
            }
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Find or create student by full name
    let student = await prisma.student.findFirst({
      where: { fullName: studentFullName }
    })

    if (!student) {
      student = await prisma.student.create({
        data: {
          fullName: studentFullName,
          nickName: nickname || null
        }
      })
    } else if (nickname && student.nickName !== nickname) {
      // Update nickname if provided and different
      student = await prisma.student.update({
        where: { id: student.id },
        data: { nickName: nickname }
      })
    }

    // Check if student already has an attempt for this quiz
    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        studentId: student.id,
        quizId: quizId
      }
    })

    // Calculate score
    let score = 0
    const totalQuestions = quiz.questions.length

    for (const answerData of answers) {
      const { questionId, optionIds } = answerData
      const question = quiz.questions.find(q => q.id === questionId)
      
      if (!question) continue

      const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.id)
      const selectedOptionIds = Array.isArray(optionIds) ? optionIds : [optionIds]
      
      // Check if all correct options are selected and no incorrect options
      const allCorrectSelected = correctOptions.every(id => selectedOptionIds.includes(id))
      const noIncorrectSelected = selectedOptionIds.every(id => correctOptions.includes(id))
      
      if (allCorrectSelected && noIncorrectSelected && correctOptions.length === selectedOptionIds.length) {
        score++
      }
    }

    // Prepare answers for creation (used for both new and updated attempts)
    const answersToCreate = answers
      .map((answerData: any) => {
        const { questionId, optionIds } = answerData
        const selectedOptionIds = Array.isArray(optionIds) ? optionIds : [optionIds]
        
        // Create answer records for each selected option
        return selectedOptionIds
          .filter((optionId: string) => optionId) // Filter out null/undefined
          .map((optionId: string) => ({
            questionId,
            optionId
          }))
      })
      .flat()
      .filter((answer: any) => answer.optionId)

    // If attempt exists, update it; otherwise create new
    let attempt
    if (existingAttempt) {
      // Delete old answers
      await prisma.answer.deleteMany({
        where: { attemptId: existingAttempt.id }
      })

      // Update attempt
      attempt = await prisma.attempt.update({
        where: { id: existingAttempt.id },
        data: {
          score,
          createdAt: new Date()
        },
        include: {
          student: true
        }
      })

      // Re-create answers for updated attempt
      if (answersToCreate.length > 0) {
        await prisma.answer.createMany({
          data: answersToCreate.map(answer => ({
            ...answer,
            attemptId: attempt.id
          }))
        })
      }
    } else {
      // Create new attempt with answers
      attempt = await prisma.attempt.create({
        data: {
          studentId: student.id,
          quizId: quizId,
          score,
          answers: {
            create: answersToCreate
          }
        },
        include: {
          student: true
        }
      })
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions,
        student: {
          id: attempt.student.id,
          fullName: attempt.student.fullName,
          nickName: attempt.student.nickName
        },
        createdAt: attempt.createdAt
      }
    })
  } catch (error) {
    console.error('Error saving attempt:', error)
    return NextResponse.json({
      error: 'Failed to save attempt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

