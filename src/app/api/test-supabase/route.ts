import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/prisma'

export async function GET() {
  try {
    // Test basic connection
    await prisma.$connect()
    
    // Test a simple query
    const teacherCount = await prisma.teacher.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      teacherCount 
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}