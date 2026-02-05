import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId, studentFullName, nickname, answers, userId } = body

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // For single-attempt quizzes, userId is required
    // For unlimited quizzes, studentFullName is required
    if (!userId && !studentFullName) {
      return NextResponse.json({ 
        error: 'Either userId (for authenticated) or studentFullName (for unlimited) is required' 
      }, { status: 400 })
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array is required' }, { status: 400 })
    }

    // Verify quiz exists and load policy
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
    }) as any

    // Get attemptPolicy from database (using raw query since Prisma client may not be updated yet)
    const policyResult = await prisma.$queryRaw<Array<{ attemptPolicy: string }>>`
      SELECT "attemptPolicy" FROM "Quiz" WHERE id = ${quizId}
    `
    const attemptPolicy = policyResult[0]?.attemptPolicy || 'unlimited'

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Enforce single-attempt policy
    if (attemptPolicy === 'single-attempt') {
      if (!userId) {
        return NextResponse.json({ 
          error: 'Authentication required. This quiz allows only one attempt per student.' 
        }, { status: 403 })
      }

      // Check if user already has an attempt (using raw query since Prisma client may not be updated yet)
      const existingAttemptResult = await prisma.$queryRaw<Array<any>>`
        SELECT id FROM "Attempt" WHERE "quizId" = ${quizId} AND "userId" = ${userId}
      `
      const existingAttempt = existingAttemptResult[0] || null

      if (existingAttempt) {
        return NextResponse.json({ 
          error: 'You have already completed this quiz. Only one attempt is allowed per student.',
          attemptId: existingAttempt.id
        }, { status: 409 }) // 409 Conflict
      }
    }

    // Handle student record (only for unlimited mode)
    let studentId: string | null = null
    if (attemptPolicy === 'unlimited' && studentFullName) {
      // Find or create student by full name for unlimited mode
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
      studentId = student.id
    }

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

    // Prepare answers for creation
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

    // Create new attempt (never update existing for unlimited mode - always create new)
    const attemptData: any = {
      quizId: quizId,
      score,
      answers: {
        create: answersToCreate
      }
    }

    if (userId) {
      // Single-attempt mode: use userId
      attemptData.userId = userId
    } else if (studentId) {
      // Unlimited mode: use studentId
      attemptData.studentId = studentId
    }

    if (studentFullName && !userId) {
      // Store student name for unlimited mode when no userId
      attemptData.studentName = studentFullName
    }

    // Create new attempt (using raw SQL for new fields until Prisma client is regenerated)
    let attempt: any
    
    try {
      // Try Prisma first
      attempt = await prisma.attempt.create({
        data: attemptData as any,
        include: {
          student: true
        }
      })
    } catch (error: any) {
      // If Prisma fails due to new fields, use raw SQL
      if (error.message && error.message.includes('Unknown arg')) {
        // Insert using raw SQL
        const insertResult = await prisma.$queryRaw<Array<{ id: string; score: number; createdAt: Date; studentId: string | null; userId: string | null; studentName: string | null }>>`
          INSERT INTO "Attempt" ("quizId", "score", "studentId", "userId", "studentName", "createdAt")
          VALUES (${quizId}, ${score}, ${studentId || null}, ${userId || null}, ${studentFullName || null}, NOW())
          RETURNING id, score, "createdAt", "studentId", "userId", "studentName"
        `
        const newAttempt = insertResult[0]
        
        // Create answers
        if (answersToCreate.length > 0) {
          const answerValues = answersToCreate.map(a => `('${a.questionId}', '${a.optionId}', '${newAttempt.id}')`).join(', ')
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Answer" ("questionId", "optionId", "attemptId")
            VALUES ${answerValues}
          `)
        }
        
        // Fetch student if studentId exists
        let student = null
        if (newAttempt.studentId) {
          const studentResult = await prisma.$queryRaw<Array<any>>`
            SELECT id, "fullName", "nickName" FROM "Student" WHERE id = ${newAttempt.studentId}
          `
          student = studentResult[0] || null
        }
        
        attempt = {
          ...newAttempt,
          student
        }
      } else {
        throw error
      }
    }

    // Build response
    const response: any = {
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions,
        createdAt: attempt.createdAt
      }
    }

    // Include student info if available
    if (attempt.student) {
      response.attempt.student = {
        id: attempt.student.id,
        fullName: attempt.student.fullName,
        nickName: attempt.student.nickName
      }
    } else if (attempt.studentName) {
      response.attempt.studentName = attempt.studentName
    }

    if (attempt.userId) {
      response.attempt.userId = attempt.userId
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error saving attempt:', error)
    return NextResponse.json({
      error: 'Failed to save attempt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

