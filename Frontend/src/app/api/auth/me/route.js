import { NextResponse } from 'next/server';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real app we would decode the token, for demo we just return a user
    return NextResponse.json({
      user: {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'ADMIN', 
      }
    });
  }

  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
