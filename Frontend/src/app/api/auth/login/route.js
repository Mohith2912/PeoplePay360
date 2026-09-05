import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (email && password) {
      let role = 'EMPLOYEE'; // Default fallback
      if (email.includes('admin')) role = 'ADMIN';
      else if (email.includes('hr_manager')) role = 'HR_MANAGER';
      else if (email.includes('payroll_user')) role = 'HR_PAYROLL_USER';
      else if (email.includes('payroll_manager')) role = 'HR_PAYROLL_MANAGER';
      else if (email.includes('employee')) role = 'EMPLOYEE';

      return NextResponse.json({
        token: 'mock-jwt-token-12345',
        user: {
          id: '1',
          name: 'Demo User',
          email,
          role,
        }
      });
    }

    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
