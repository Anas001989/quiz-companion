import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/student/attempts/check-email
 * Check if an email has already attempted a quiz (for single-attempt quizzes)
 * Query params: quizId, email
 * 
 * Note: This is a best-effort check. If we can't verify, we allow the request (fail open)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const quizId = searchParams.get('quizId')
    const email = searchParams.get('email')

    if (!quizId || !email) {
      return NextResponse.json({ 
        error: 'Quiz ID and email are required' 
      }, { status: 400 })
    }

    // Get Supabase client with service role key if available (for admin operations)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      // No service key - can't check, fail open
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set, cannot check email attempts')
      return NextResponse.json({ hasAttempt: false })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find user by email in Supabase Auth (using admin API)
    let user = null
    try {
      const { data: users, error: userError } = await supabase.auth.admin.listUsers()
      
      if (!userError && users?.users) {
        user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      }
    } catch (error) {
      console.error('Error fetching users from Supabase:', error)
      // Fail open - allow the request
      return NextResponse.json({ hasAttempt: false })
    }
    
    if (!user) {
      // User doesn't exist yet, so no attempt
      return NextResponse.json({ hasAttempt: false })
    }

    // Check if attempt exists for this quiz and user
    const attempt = await prisma.attempt.findFirst({
      where: {
        quizId,
        userId: user.id
      },
      select: {
        id: true,
        score: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      hasAttempt: !!attempt,
      attempt: attempt || null
    })
  } catch (error) {
    console.error('Error checking attempt by email:', error)
    // Fail open - allow the request if we can't check
    return NextResponse.json({
      hasAttempt: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

