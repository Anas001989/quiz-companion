import { NextResponse } from 'next/server'
import { supabase } from '@/lib//supabase/supabaseClient'

export async function GET() {
  const { data, error } = await supabase.from('Teacher').select('*').limit(1)

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  return NextResponse.json({ success: true, data })
}
