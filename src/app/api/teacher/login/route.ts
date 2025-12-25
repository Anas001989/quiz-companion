import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailOrUsername, password } = body

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 })
    }

    // Find teacher by email or username
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, teacher.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 })
    }

    // Don't return the password in the response
    return NextResponse.json({ 
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        username: teacher.username,
        email: teacher.email
      }
    })
  } catch (error) {
    console.error('Error finding teacher:', error)
    return NextResponse.json({ error: 'Failed to find teacher' }, { status: 500 })
  }
}
