import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    console.log('Login attempt for email:', email)

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find teacher by email
    const teacher = await prisma.teacher.findFirst({
      where: {
        email: email
      }
    })

    console.log('Teacher found:', teacher ? { id: teacher.id, name: teacher.name, email: teacher.email } : 'Not found')

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      }
    })
  } catch (error) {
    console.error('Error finding teacher:', error)
    return NextResponse.json({ error: 'Failed to find teacher' }, { status: 500 })
  }
}
