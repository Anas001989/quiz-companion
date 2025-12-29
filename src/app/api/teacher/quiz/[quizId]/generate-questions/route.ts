import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type GenerationMode = 'teacher-controlled' | 'ai-controlled'
type ImageMode = 'none' | 'question-only' | 'answer-only' | 'both'

interface QuestionSet {
  count: number
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE'
  answerCount: number
  imageMode: ImageMode
}

interface GenerateQuestionsRequest {
  mode?: GenerationMode
  // Teacher-controlled mode
  questionSets?: QuestionSet[]
  description?: string
  // AI-controlled mode
  totalQuestions?: number
  // Legacy mode (backward compatibility)
  singleChoiceCount?: number
  multiChoiceCount?: number
  answerCount?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const startTime = Date.now()
  try {
    const { quizId } = await params
    const body: GenerateQuestionsRequest = await request.json()
    
    // Get base URL from request headers for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    const { mode, questionSets, description, totalQuestions, singleChoiceCount, multiChoiceCount, answerCount } = body

    console.log(`[API] POST /api/teacher/quiz/${quizId}/generate-questions - Starting...`)
    console.log('AI Generation Request:', { quizId, mode, questionSets, description, totalQuestions, singleChoiceCount, multiChoiceCount, answerCount })

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Determine generation mode (default to legacy mode for backward compatibility)
    const generationMode: GenerationMode = mode || (questionSets ? 'teacher-controlled' : (totalQuestions ? 'ai-controlled' : 'legacy'))

    // Validate based on mode
    if (generationMode === 'teacher-controlled') {
      if (!questionSets || questionSets.length === 0) {
        return NextResponse.json({ error: 'Question sets are required for teacher-controlled mode' }, { status: 400 })
      }
      const total = questionSets.reduce((sum, set) => sum + set.count, 0)
      if (total === 0) {
        return NextResponse.json({ error: 'At least one question must be specified' }, { status: 400 })
      }
    } else if (generationMode === 'ai-controlled') {
      if (!description || !description.trim()) {
        return NextResponse.json({ error: 'Description is required for AI-controlled mode' }, { status: 400 })
      }
      if (!totalQuestions || totalQuestions < 1) {
        return NextResponse.json({ error: 'Total questions must be at least 1' }, { status: 400 })
      }
    } else {
      // Legacy mode
      if (!description || singleChoiceCount === undefined || multiChoiceCount === undefined || answerCount === undefined) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
      }
      if (singleChoiceCount < 0 || multiChoiceCount < 0 || answerCount < 2) {
        return NextResponse.json({ error: 'Invalid question or answer counts' }, { status: 400 })
      }
      const total = singleChoiceCount + multiChoiceCount
      if (total === 0) {
        return NextResponse.json({ error: 'At least one question type must be specified' }, { status: 400 })
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Build the prompt for OpenAI based on mode
    let prompt = ''
    
    if (generationMode === 'teacher-controlled') {
      const total = questionSets!.reduce((sum, set) => sum + set.count, 0)
      prompt = `Generate ${total} quiz questions based on the following description: "${description || 'General quiz questions'}"

Question Sets:
${questionSets!.map((set, idx) => 
  `Set ${idx + 1}: ${set.count} ${set.type === 'SINGLE_CHOICE' ? 'single choice' : 'multiple choice'} questions with ${set.answerCount} options each. Image mode: ${set.imageMode}.`
).join('\n')}

Requirements:
${questionSets!.flatMap((set, setIdx) => {
  const questions: string[] = []
  for (let i = 0; i < set.count; i++) {
    questions.push(`- Question ${setIdx + 1}-${i + 1}: ${set.type === 'SINGLE_CHOICE' ? 'Single choice (exactly ONE correct answer)' : 'Multiple choice (ONE or MORE correct answers)'} with ${set.answerCount} options`)
    if (set.imageMode === 'question-only' || set.imageMode === 'both') {
      questions.push(`  * Include a question image (describe what image would be appropriate)`)
    }
    if (set.imageMode === 'answer-only' || set.imageMode === 'both') {
      questions.push(`  * Include answer images for ALL ${set.answerCount} answers (describe what image would be appropriate for EACH answer option - every single answer must have an answerImageUrl description, not null)`)
    }
  }
  return questions
}).join('\n')}

Format your response as a JSON object with a "questions" key containing an array. Each question should have this structure:
{
  "questions": [
    {
      "text": "Question text here",
      "type": "SINGLE_CHOICE" or "MULTI_CHOICE",
      "questionImageUrl": null or "description of image needed",
      "options": [
        {"text": "Option 1", "isCorrect": true or false, "answerImageUrl": null or "description of image needed"},
        ...
      ]
    },
    ...
  ]
}

IMPORTANT IMAGE REQUIREMENTS:
- If answer images are required (answer-only or both mode), you MUST provide answerImageUrl descriptions for ALL answer options. Do not use null for any answerImageUrl when images are required.
- If question images are required (question-only or both mode), you MUST provide a questionImageUrl description. Do not use null.
- The actual image generation will happen separately - you only need to provide descriptions here.
- If images are NOT needed (none mode), use null for all imageUrl fields.

Return ONLY the JSON object, no other text or explanation.`
    } else if (generationMode === 'ai-controlled') {
      prompt = `Generate ${totalQuestions} quiz questions based on the following description: "${description}"

You must decide:
1. How many question sets to create
2. Question types per set (SINGLE_CHOICE or MULTI_CHOICE)
3. Number of answers per question
4. Whether images are needed (question images, answer images, or both)
   - Consider: Math geometry quiz → likely needs images
   - Consider: Vocabulary quiz → likely no images
   - Consider: Science quiz → may need diagrams/images

Requirements:
- Total questions: exactly ${totalQuestions}
- Each question must have at least 2 options
- For single choice questions: mark exactly ONE option as correct
- For multiple choice questions: mark at least ONE option as correct (can be multiple)
- If images are needed, indicate in questionImageUrl or answerImageUrl fields with a description

Format your response as a JSON object with a "questions" key containing an array. Each question should have this structure:
{
  "questions": [
    {
      "text": "Question text here",
      "type": "SINGLE_CHOICE" or "MULTI_CHOICE",
      "questionImageUrl": null or "description of image needed",
      "options": [
        {"text": "Option 1", "isCorrect": true or false, "answerImageUrl": null or "description of image needed"},
        ...
      ]
    },
    ...
  ]
}

IMPORTANT IMAGE REQUIREMENTS:
- If you decide images are needed, you MUST provide answerImageUrl descriptions for ALL answer options. Do not use null for any answerImageUrl when images are needed.
- If you decide question images are needed, you MUST provide a questionImageUrl description. Do not use null.
- The actual image generation will happen separately - you only need to provide descriptions here.
- If images are NOT needed, use null for all imageUrl fields.

Return ONLY the JSON object, no other text or explanation.`
    } else {
      // Legacy mode
      const totalQuestions = singleChoiceCount! + multiChoiceCount!
      prompt = `Generate ${totalQuestions} quiz questions based on the following description: "${description}"

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
    }

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
        questionImageUrl: q.questionImageUrl || null,
        options: q.options
          .filter((opt: any) => opt.text)
          .map((opt: any) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
            answerImageUrl: opt.answerImageUrl || null
          }))
      }))
      .filter((q: any) => {
        // Validate single choice has exactly one correct answer
        if (q.type === 'SINGLE_CHOICE') {
          const correctCount = q.options.filter((opt: any) => opt.isCorrect).length
          return correctCount === 1 && q.options.length >= 2
        }
        // Validate multi choice has at least one correct answer
        const correctCount = q.options.filter((opt: any) => opt.isCorrect).length
        return correctCount >= 1 && q.options.length >= 2
      })

    if (validatedQuestions.length === 0) {
      return NextResponse.json({ error: 'No valid questions generated' }, { status: 500 })
    }

    // Generate images for descriptions (if image generation is enabled)
    const IMAGE_GENERATION_ENABLED = process.env.ENABLE_IMAGE_GENERATION === 'true'
    
    if (IMAGE_GENERATION_ENABLED) {
      console.log('Image generation enabled - generating images for descriptions...')
      
      // Helper function to check if a string is a URL or a description
      const isUrl = (str: string | null): boolean => {
        if (!str) return false
        return str.startsWith('http://') || str.startsWith('https://')
      }

      // Map question index to imageMode (for teacher-controlled mode)
      // This helps us filter which images to generate based on the selected mode
      const questionImageModeMap: Map<number, ImageMode> = new Map()
      
      if (generationMode === 'teacher-controlled' && questionSets) {
        let questionIndex = 0
        for (const set of questionSets) {
          for (let i = 0; i < set.count; i++) {
            questionImageModeMap.set(questionIndex, set.imageMode)
            questionIndex++
          }
        }
      } else {
        // For AI-controlled or legacy mode, we don't have per-question imageMode
        // So we'll generate all images that have descriptions (backward compatibility)
        for (let i = 0; i < validatedQuestions.length; i++) {
          questionImageModeMap.set(i, 'both') // Default to both for backward compatibility
        }
      }

      // Collect all image generation tasks
      interface ImageTask {
        description: string
        type: 'question' | 'answer'
        questionIndex: number
        optionIndex?: number
        setResult: (url: string | null) => void
      }

      const imageTasks: ImageTask[] = []

      // Collect image tasks based on imageMode
      for (let qIndex = 0; qIndex < validatedQuestions.length; qIndex++) {
        const question = validatedQuestions[qIndex]
        const imageMode = questionImageModeMap.get(qIndex) || 'both'
        
        // Only collect question images if imageMode allows it
        if ((imageMode === 'question-only' || imageMode === 'both') && 
            question.questionImageUrl && !isUrl(question.questionImageUrl)) {
          imageTasks.push({
            description: question.questionImageUrl,
            type: 'question',
            questionIndex: qIndex,
            setResult: (url) => {
              validatedQuestions[qIndex].questionImageUrl = url
            }
          })
        } else if (imageMode === 'answer-only' || imageMode === 'none') {
          // If answer-only or none, clear question image description
          if (question.questionImageUrl && !isUrl(question.questionImageUrl)) {
            validatedQuestions[qIndex].questionImageUrl = null
          }
        }

        // Only collect answer images if imageMode allows it
        if ((imageMode === 'answer-only' || imageMode === 'both')) {
          for (let optIndex = 0; optIndex < question.options.length; optIndex++) {
            const option = question.options[optIndex]
            if (option.answerImageUrl && !isUrl(option.answerImageUrl)) {
              imageTasks.push({
                description: option.answerImageUrl,
                type: 'answer',
                questionIndex: qIndex,
                optionIndex: optIndex,
                setResult: (url) => {
                  validatedQuestions[qIndex].options[optIndex].answerImageUrl = url
                }
              })
            }
          }
        } else if (imageMode === 'question-only' || imageMode === 'none') {
          // If question-only or none, clear answer image descriptions
          for (let optIndex = 0; optIndex < question.options.length; optIndex++) {
            if (question.options[optIndex].answerImageUrl && !isUrl(question.options[optIndex].answerImageUrl)) {
              validatedQuestions[qIndex].options[optIndex].answerImageUrl = null
            }
          }
        }
      }

      console.log(`\n📸 Found ${imageTasks.length} images to generate`)
      console.log(`   - Question images: ${imageTasks.filter(t => t.type === 'question').length}`)
      console.log(`   - Answer images: ${imageTasks.filter(t => t.type === 'answer').length}\n`)

      // Generate all images in ONE batch request (counts as 1 request against quota!)
      if (imageTasks.length > 0) {
        console.log(`🚀 Generating all ${imageTasks.length} images in a single batch request...`)
        
        try {
          // Prepare prompts and types arrays
          const prompts = imageTasks.map(task => task.description)
          const types = imageTasks.map(task => task.type)
          
          // Call batch endpoint
          const response = await fetch(`${baseUrl}/api/generate/image`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompts, types })
          })
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }))
            const errorMessage = error.error || error.details || 'Failed to generate images'
            console.error(`Failed to generate images (batch):`, errorMessage)
            // Set all to null on failure
            imageTasks.forEach(task => task.setResult(null))
          } else {
            const data = await response.json()
            const urls = data.urls || []
            
            // Map URLs back to tasks
            let successCount = 0
            let failureCount = 0
            
            for (let i = 0; i < imageTasks.length; i++) {
              const url = urls[i] || null
              
              // Validate URL before setting
              if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                imageTasks[i].setResult(url)
                successCount++
                console.log(`  ✓ Image ${i + 1} (${imageTasks[i].type}): ${url.substring(0, 80)}...`)
              } else {
                console.warn(`  ✗ Image ${i + 1} (${imageTasks[i].type}): Invalid or missing URL`)
                imageTasks[i].setResult(null)
                failureCount++
              }
            }
            
            console.log(`\n✅ Batch image generation complete: ${successCount} successful, ${failureCount} failed`)
            console.log(`   (Used only 1 API request instead of ${imageTasks.length} requests!)\n`)
            
            // Log final URLs for debugging
            console.log('Final question image URLs:', validatedQuestions.map((q, idx) => ({
              question: idx + 1,
              url: q.questionImageUrl,
              isValid: q.questionImageUrl ? (q.questionImageUrl.startsWith('http://') || q.questionImageUrl.startsWith('https://')) : false
            })))
            console.log('Final answer image URLs:', validatedQuestions.map((q, idx) => ({
              question: idx + 1,
              options: q.options.map((opt, optIdx) => ({
                option: optIdx + 1,
                url: opt.answerImageUrl,
                isValid: opt.answerImageUrl ? (opt.answerImageUrl.startsWith('http://') || opt.answerImageUrl.startsWith('https://')) : false
              }))
            })))
          }
        } catch (error: any) {
          console.error(`Error generating images (batch):`, error?.message || String(error))
          // Set all to null on error
          imageTasks.forEach(task => task.setResult(null))
        }
      }
    } else {
      console.log('Image generation disabled - descriptions will be saved as-is (or set to null)')
      // If image generation is disabled, set descriptions to null to avoid saving text as URLs
      for (const question of validatedQuestions) {
        if (question.questionImageUrl && !question.questionImageUrl.startsWith('http')) {
          question.questionImageUrl = null
        }
        for (const option of question.options) {
          if (option.answerImageUrl && !option.answerImageUrl.startsWith('http')) {
            option.answerImageUrl = null
          }
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`[API] POST /api/teacher/quiz/${quizId}/generate-questions - Completed in ${duration}ms (Generated ${validatedQuestions.length} questions)`)

    return NextResponse.json({ questions: validatedQuestions })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[API] POST /api/teacher/quiz/${await params.then(p => p.quizId)}/generate-questions - ERROR after ${duration}ms:`, error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json({
      error: 'Failed to generate questions',
      details: error?.message || 'Unknown error',
      type: error?.name || 'Error'
    }, { status: 500 })
  }
}

