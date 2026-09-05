import { NextResponse } from 'next/server';

export async function GET(request) {
  // Return empty/zero initial states for the frontend contract
  return NextResponse.json({
    kpis: {
      totalNetSalaryPaid: 0,
      payslipsGenerated: 0,
      attendanceHealth: {
        presentPercent: 0,
        present: 0,
      },
      approvedTimeOffDays: 0,
    },
    pendingTimeOffRequests: 0,
    warnings: [],
    attendanceOverview: {
      present: 0,
      late: 0,
      absent: 0,
      coveragePercent: 0,
    }
  });
}
