import { NextResponse } from 'next/server';

export async function POST() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  return NextResponse.json({ success: true });
}
