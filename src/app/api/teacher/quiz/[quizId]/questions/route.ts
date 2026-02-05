import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const startTime = Date.now()
  try {
    const { quizId } = await params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Optimized query - only select needed fields
    // Note: If you see Prisma errors about questionImageUrl/answerImageUrl, 
    // run: npx prisma generate (after stopping dev server)
    let quiz
    try {
      quiz = await prisma.quiz.findUnique({
        where: {
          id: quizId
        },
        select: {
          id: true,
          title: true,
          answerMode: true,
          attemptPolicy: true,
          questions: {
            select: {
              id: true,
              text: true,
              type: true,
              questionImageUrl: true,
              options: {
                select: {
                  id: true,
                  text: true,
                  isCorrect: true,
                  answerImageUrl: true
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
    } catch (prismaError: any) {
      // If Prisma client is out of sync, provide helpful error
      if (prismaError.message?.includes('questionImageUrl') || 
          prismaError.message?.includes('answerImageUrl') ||
          prismaError.message?.includes('Unknown column')) {
        console.error('[API] Prisma client out of sync. Run: npx prisma generate')
        return NextResponse.json({ 
          error: 'Database schema mismatch',
          details: 'Prisma client needs to be regenerated. Stop dev server and run: npx prisma generate',
          hint: 'The database has new columns but Prisma client code is outdated'
        }, { status: 500 })
      }
      throw prismaError
    }

    if (!quiz) {
      console.error(`[API] Quiz not found: ${quizId}`)
      return NextResponse.json({ 
        error: 'Quiz not found',
        quizId,
        message: `No quiz found with ID: ${quizId}. Please check the quiz ID and try again.`
      }, { status: 404 })
    }

    // Quiz data is already in the right format (no transformation needed)
    const transformedQuiz = {
      id: quiz.id,
      title: quiz.title,
      answerMode: quiz.answerMode || 'retry-until-correct',
      attemptPolicy: quiz.attemptPolicy || 'unlimited',
      questions: quiz.questions
    }

    const duration = Date.now() - startTime
    console.log(`[API] GET /api/teacher/quiz/${quizId}/questions - ${duration}ms`)
    
    return NextResponse.json({ quiz: transformedQuiz })
  } catch (error) {
    const duration = Date.now() - startTime
    const quizIdForLog = await params.then(p => p.quizId)
    console.error(`[API] GET /api/teacher/quiz/${quizIdForLog}/questions - ERROR after ${duration}ms:`, error)
    
    // Check if it's a Prisma schema error (missing columns)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isSchemaError = errorMessage.includes('Unknown column') || 
                         errorMessage.includes('column') && errorMessage.includes('does not exist') ||
                         errorMessage.includes('questionImageUrl') ||
                         errorMessage.includes('answerImageUrl')
    
    return NextResponse.json({ 
      error: 'Failed to fetch quiz questions',
      details: errorMessage,
      hint: isSchemaError 
        ? 'Database schema may be out of sync. Try running: npx prisma generate && restart server'
        : 'Check server logs for more details',
      quizId: quizIdForLog
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const startTime = Date.now()
  try {
    const { quizId } = await params
    const body = await request.json()
    
    // Check if this is a batch request (array of questions) or single question
    const isBatch = Array.isArray(body.questions) || (body.questions && Array.isArray(body.questions))
    const questions = isBatch ? (body.questions || body) : null
    const singleQuestion = isBatch ? null : body

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Handle batch creation
    if (isBatch && questions && questions.length > 0) {
      // Validate all questions
      for (const q of questions) {
        if (!q.text || !q.type) {
          return NextResponse.json({ 
            error: 'All questions must have text and type', 
            details: `Invalid question: ${JSON.stringify(q).substring(0, 100)}`
          }, { status: 400 })
        }
      }

      // Optimized batch creation: Create questions in parallel, then batch insert options
      // This reduces from 50+ queries to ~12 queries (10 parallel question creates + 1 createMany + 1 fetch)
      const createdQuestions = await prisma.$transaction(async (tx) => {
        // Step 1: Create all questions in parallel (they don't depend on each other)
        // This is still 10 queries, but they run in parallel so total time ≈ 1 query time
        const questionData = questions.map((q: any) => ({
          text: q.text,
          type: q.type,
          questionImageUrl: q.questionImageUrl || null,
          quizId,
        }))

        const createdQuestions = await Promise.all(
          questionData.map(data => tx.question.create({ data }))
        )

        // Step 2: Prepare all options data with question IDs
        const allOptions = questions.flatMap((q: any, index: number) => 
          (q.options || []).map((opt: any) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            answerImageUrl: opt.answerImageUrl || null,
            questionId: createdQuestions[index].id,
          }))
        )

        // Step 3: Batch insert ALL options in a single query using createMany
        // This is the key optimization - 1 query instead of 40 queries
        if (allOptions.length > 0) {
          // Split into chunks if needed (some DBs have limits)
          const chunkSize = 100
          for (let i = 0; i < allOptions.length; i += chunkSize) {
            const chunk = allOptions.slice(i, i + chunkSize)
            await tx.option.createMany({
              data: chunk,
              skipDuplicates: false,
            })
          }
        }

        // Step 4: Fetch all created questions with their options (single query)
        return await tx.question.findMany({
          where: {
            id: { in: createdQuestions.map(q => q.id) }
          },
          include: {
            options: true
          },
          orderBy: {
            id: 'asc'
          }
        })
      }, {
        timeout: 30000, // 30 second timeout for large batches
      })

      const duration = Date.now() - startTime
      console.log(`[API] POST /api/teacher/quiz/${quizId}/questions (BATCH: ${questions.length} questions) - ${duration}ms`)
      
      return NextResponse.json({ 
        questions: createdQuestions,
        count: createdQuestions.length
      })
    }

    // Handle single question creation (backward compatibility)
    const { text, type, options } = singleQuestion || body

    if (!text || !type) {
      return NextResponse.json({ error: 'Question text and type are required' }, { status: 400 })
    }

    // Create the question with options
    const question = await prisma.question.create({
      data: {
        text,
        type,
        questionImageUrl: singleQuestion?.questionImageUrl || body.questionImageUrl || null,
        quizId,
        options: {
          create: (options || []).map((opt: any) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            answerImageUrl: opt.answerImageUrl || null
          }))
        }
      },
      include: {
        options: true
      }
    })

    const duration = Date.now() - startTime
    console.log(`[API] POST /api/teacher/quiz/${quizId}/questions (SINGLE) - ${duration}ms`)

    return NextResponse.json({ question })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] POST /api/teacher/quiz/${await params.then(p => p.quizId)}/questions - ERROR after ${duration}ms:`, error)
    return NextResponse.json({ 
      error: 'Failed to create question(s)',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}