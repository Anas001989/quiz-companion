import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateQuestionsRequest {
  description: string
  singleChoiceCount: number
  multiChoiceCount: number
  answerCount: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const body: GenerateQuestionsRequest = await request.json()
    const { description, singleChoiceCount, multiChoiceCount, answerCount } = body

    console.log('AI Generation Request:', { quizId, singleChoiceCount, multiChoiceCount, answerCount, descriptionLength: description?.length })

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    if (!description || singleChoiceCount === undefined || multiChoiceCount === undefined || answerCount === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (singleChoiceCount < 0 || multiChoiceCount < 0 || answerCount < 2) {
      return NextResponse.json({ error: 'Invalid question or answer counts' }, { status: 400 })
    }

    const totalQuestions = singleChoiceCount + multiChoiceCount
    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'At least one question type must be specified' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Build the prompt for OpenAI
    const prompt = `Generate ${totalQuestions} quiz questions based on the following description: "${description}"

Requirements:
- Generate exactly ${singleChoiceCount} single choice questions (each has exactly ONE correct answer)
- Generate exactly ${multiChoiceCount} multiple choice questions (each has ONE or MORE correct answers)
- Each question must have exactly ${answerCount} options
- For single choice questions: mark exactly ONE option as correct
- For multiple choice questions: mark at least ONE option as correct (can be multiple)

Format your response as a JSON object with a "questions" key containing an array. Each question should have this structure:
{
  "questions": [
    {
      "text": "Question text here",
      "type": "SINGLE_CHOICE" or "MULTI_CHOICE",
      "options": [
        {"text": "Option 1", "isCorrect": true or false},
        {"text": "Option 2", "isCorrect": true or false},
        ...
      ]
    },
    ...
  ]
}

Return ONLY the JSON object, no other text or explanation.`

    console.log('Calling OpenAI API...')
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful quiz question generator. Return a JSON object with a "questions" key containing an array of questions. No markdown, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    } catch (openaiError: any) {
      console.error('OpenAI API Error:', openaiError)
      
      // Extract error details
      const errorMessage = openaiError?.message || 'Unknown error from OpenAI'
      const errorCode = openaiError?.code || openaiError?.status || 'UNKNOWN'
      const errorType = openaiError?.type || 'APIError'
      
      // Check for quota/billing errors
      const isQuotaError = errorCode === 429 || 
                          errorMessage.includes('quota') || 
                          errorMessage.includes('billing') ||
                          errorMessage.includes('exceeded')
      
      return NextResponse.json({ 
        error: isQuotaError ? 'OpenAI API quota exceeded' : 'OpenAI API error',
        details: errorMessage,
        code: errorCode.toString(),
        type: errorType
      }, { status: 500 })
    }

    const responseText = completion.choices[0]?.message?.content
    console.log('OpenAI Response received, length:', responseText?.length)
    
    if (!responseText) {
      console.error('No response content from OpenAI')
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 })
    }

    // Parse the response - OpenAI returns a JSON object with a "questions" key
    let questions
    try {
      const parsed = JSON.parse(responseText)
      console.log('Parsed OpenAI response:', { keys: Object.keys(parsed), hasQuestions: !!parsed.questions })
      // Extract questions from the response object
      questions = parsed.questions || parsed.data || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0])
      
      if (!questions) {
        console.error('No questions found in response:', parsed)
        return NextResponse.json({ 
          error: 'Invalid response format from OpenAI',
          details: 'Response does not contain questions array',
          responsePreview: JSON.stringify(parsed).substring(0, 500)
        }, { status: 500 })
      }
    } catch (e: any) {
      console.error('JSON Parse Error:', e.message)
      console.error('Response text:', responseText.substring(0, 500))
      // Try to extract JSON from the response if it has markdown or other formatting
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          questions = parsed.questions || parsed.data || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0])
        } catch (e2: any) {
          return NextResponse.json({ 
            error: 'Failed to parse OpenAI response as JSON',
            details: e2.message,
            responsePreview: responseText.substring(0, 500)
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ 
          error: 'Failed to parse OpenAI response as JSON',
          details: e.message,
          responsePreview: responseText.substring(0, 500)
        }, { status: 500 })
      }
    }

    if (!Array.isArray(questions)) {
      console.error('Questions is not an array:', typeof questions, questions)
      return NextResponse.json({ 
        error: 'Invalid response format from OpenAI',
        details: `Expected array but got ${typeof questions}`,
        responsePreview: JSON.stringify(questions).substring(0, 500)
      }, { status: 500 })
    }

    console.log(`Parsed ${questions.length} questions from OpenAI response`)

    // Validate and clean the questions
    const validatedQuestions = questions
      .filter((q: any) => q.text && q.type && Array.isArray(q.options))
      .map((q: any) => ({
        text: q.text.trim(),
        type: q.type === 'SINGLE_CHOICE' ? 'SINGLE_CHOICE' : 'MULTI_CHOICE',
        options: q.options
          .filter((opt: any) => opt.text)
          .map((opt: any) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect)
          }))
      }))
      .filter((q: any) => {
        // Validate single choice has exactly one correct answer
        if (q.type === 'SINGLE_CHOICE') {
          const correctCount = q.options.filter((opt: any) => opt.isCorrect).length
          return correctCount === 1 && q.options.length === answerCount
        }
        // Validate multi choice has at least one correct answer
        const correctCount = q.options.filter((opt: any) => opt.isCorrect).length
        return correctCount >= 1 && q.options.length === answerCount
      })

    if (validatedQuestions.length === 0) {
      return NextResponse.json({ error: 'No valid questions generated' }, { status: 500 })
    }

    return NextResponse.json({ questions: validatedQuestions })
  } catch (error: any) {
    console.error('Unexpected error generating questions:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json({
      error: 'Failed to generate questions',
      details: error?.message || 'Unknown error',
      type: error?.name || 'Error'
    }, { status: 500 })
  }
}

