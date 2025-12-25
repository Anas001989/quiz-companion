import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, username, email, password } = body

    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json({ error: 'First name, last name, username, email, and password are required' }, { status: 400 })
    }

    // Validate username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
    }

    // Check if teacher already exists by email or username
    const existingByEmail = await prisma.teacher.findUnique({
      where: { email }
    })

    if (existingByEmail) {
      return NextResponse.json({ error: 'Teacher with this email already exists' }, { status: 409 })
    }

    const existingByUsername = await prisma.teacher.findUnique({
      where: { username }
    })

    if (existingByUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    const teacher = await prisma.teacher.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword
      }
    })

    // Don't return the password in the response
    const { password: _, ...teacherWithoutPassword } = teacher

    return NextResponse.json({ teacher: teacherWithoutPassword })
  } catch (error) {
    console.error('Error creating teacher:', error)
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('email')) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      }
      if (error.message.includes('username')) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}
