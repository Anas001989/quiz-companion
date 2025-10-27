import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        email
      }
    })

    return NextResponse.json({ teacher })
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}
