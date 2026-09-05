// ─── Auth & User ────────────────────────────────────────────────────────────

export type UserRole =
  | "EMPLOYEE"
  | "HR_MANAGER"
  | "HR_PAYROLL_USER"
  | "HR_PAYROLL_MANAGER"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export type EmployeeStatus = "ACTIVE" | "NOTICE_PERIOD" | "TERMINATED";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Employee {
  id: string;
  employeeCode: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  dateOfJoining: string;
  department: string;
  designation: string;
  managerId?: string;
  manager?: Pick<Employee, "id" | "firstName" | "lastName">;
  workingScheduleId?: string;
  workingSchedule?: WorkingSchedule;
  status: EmployeeStatus;
  panNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  uanNumber?: string;
  pfNumber?: string;
  esiNumber?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  // counts for smart buttons
  _count?: {
    contracts: number;
    attendanceRecords: number;
    timeOffRequests: number;
    allocations: number;
  };
}

export type EmployeeFormData = Omit<
  Employee,
  "id" | "employeeCode" | "createdAt" | "updatedAt" | "manager" | "workingSchedule" | "_count"
>;

// ─── Contract ─────────────────────────────────────────────────────────────────

export type ContractStatus = "ACTIVE" | "ENDED";

export interface Contract {
  id: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "employeeCode">;
  startDate: string;
  endDate?: string;
  department: string;
  designation: string;
  wage: number;
  salaryStructureId?: string;
  salaryStructure?: Pick<SalaryStructure, "id" | "name" | "code">;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export type ContractFormData = Omit<
  Contract,
  "id" | "createdAt" | "updatedAt" | "employee" | "salaryStructure"
>;

// ─── Working Schedule ─────────────────────────────────────────────────────────

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface ScheduleDay {
  id?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  breakMinutes: number;
  isWorking: boolean;
}

export interface WorkingSchedule {
  id: string;
  name: string;
  type: string;
  weeklyHours: number;
  company?: string;
  days: ScheduleDay[];
  createdAt: string;
  updatedAt: string;
}

// ─── Attendance ────────────────────────────────────────────────────────────────

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCEPTION";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "employeeCode" | "department">;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workedHours?: number;
  breakMinutes?: number;
  status: AttendanceStatus;
  isManuallyCorrected: boolean;
  correctedByUserId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Time Off ─────────────────────────────────────────────────────────────────

export type TimeOffUnit = "DAYS" | "HOURS";

export interface TimeOffType {
  id: string;
  name: string;
  code: string;
  unit: TimeOffUnit;
  requiresAllocation: boolean;
  approvalRequired: boolean;
  payrollIntegration: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeOffAllocation {
  id: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName">;
  timeOffTypeId: string;
  timeOffType?: Pick<TimeOffType, "id" | "name" | "code" | "unit">;
  periodStart: string;
  periodEnd: string;
  allocatedDays: number;
  takenDays: number;
  remainingDays: number;
  status: "ACTIVE" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
}

export type TimeOffRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "department">;
  timeOffTypeId: string;
  timeOffType?: Pick<TimeOffType, "id" | "name" | "code" | "unit">;
  fromDate: string;
  toDate: string;
  duration: number;
  reason?: string;
  status: TimeOffRequestStatus;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Salary Structure & Rules ─────────────────────────────────────────────────

export type SalaryRuleCategory =
  | "BASIC" | "ALLOWANCE" | "GROSS" | "DEDUCTION" | "NET" | "REIMBURSEMENT";

export type SalaryRuleComputationType = "FIXED" | "PERCENTAGE" | "FORMULA";

export interface SalaryRule {
  id: string;
  salaryStructureId: string;
  name: string;
  code: string;
  category: SalaryRuleCategory;
  sequence: number;
  computationType: SalaryRuleComputationType;
  value: number;     // amount for FIXED, percentage for PERCENTAGE, expression for FORMULA
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  salaryRules: SalaryRule[];
  createdAt: string;
  updatedAt: string;
}

// ─── Payrun ───────────────────────────────────────────────────────────────────

export type PayrunStatus = "DRAFT" | "COMPUTED" | "VALIDATED" | "PAID";

export interface Payrun {
  id: string;
  name: string;
  salaryStructureId: string;
  salaryStructure?: Pick<SalaryStructure, "id" | "name" | "code">;
  periodStart: string;
  periodEnd: string;
  status: PayrunStatus;
  createdByUserId: string;
  createdBy?: Pick<User, "id" | "name">;
  payslips?: Payslip[];
  _count?: { payslips: number };
  createdAt: string;
  updatedAt: string;
}

export interface PayrunCreateInput {
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  department?: string;
  employeeType?: string;
  employeeIds: string[];
}

// ─── Payslip ──────────────────────────────────────────────────────────────────

export type PayslipStatus = "DRAFT" | "COMPUTED" | "VALIDATED" | "PAID";

export interface PayslipLine {
  id: string;
  payslipId: string;
  salaryRuleId?: string;
  name: string;
  code: string;
  category: SalaryRuleCategory;
  amount: number;
  sequence: number;
}

export interface Payslip {
  id: string;
  payrunId: string;
  payrun?: Pick<Payrun, "id" | "name" | "periodStart" | "periodEnd">;
  employeeId: string;
  employee?: Pick<
    Employee,
    | "id" | "firstName" | "lastName" | "employeeCode"
    | "designation" | "department" | "dateOfJoining"
    | "panNumber" | "bankName" | "bankAccountNumber"
    | "uanNumber" | "location"
  >;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  status: PayslipStatus;
  grossEarnings: number;
  grossDeductions: number;
  netPay: number;
  totalReimbursement: number;
  netTransfer: number;
  payslipLines: PayslipLine[];
  createdAt: string;
  updatedAt: string;
}

// ─── Payroll Warning ──────────────────────────────────────────────────────────

export interface PayrollWarning {
  id?: string;
  entityType: "EMPLOYEE" | "PAYSLIP" | "PAYRUN";
  entityId: string;
  warningType:
    | "MISSING_BANK_DETAILS"
    | "MISSING_PAN"
    | "DUPLICATE_PAYSLIP"
    | "NO_ACTIVE_CONTRACT"
    | "OVERLAPPING_CONTRACT"
    | "MISSING_REQUIRED_FIELD";
  message: string;
  isResolved: boolean;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardFilters {
  period?: string;       // "2026-07"
  department?: string;
  employeeType?: string;
}

export interface DashboardKPIs {
  totalNetSalaryPaid: number;
  payslipsGenerated: number;
  averageSalary: number;
  approvedTimeOffDays: number;
  attendanceHealth: {
    present: number;
    late: number;
    absent: number;
    exception: number;
    total: number;
    presentPercent: number;
    latePercent: number;
    absentPercent: number;
  };
}

export interface SalaryByDepartment {
  department: string;
  totalSalary: number;
  headcount: number;
}

export interface MonthlySalaryTrend {
  month: string;    // "Jan 2026"
  netSalary: number;
  payslipCount: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  salaryByDepartment: SalaryByDepartment[];
  monthlySalaryTrend: MonthlySalaryTrend[];
  warnings: PayrollWarning[];
  attendanceOverview: {
    present: number;
    late: number;
    absent: number;
    overtime: number;
    missingCheckouts: number;
    manualEdits: number;
    coveragePercent: number;
  };
  departmentBreakdown: SalaryByDepartment[];
  pendingTimeOffRequests: number;
  expiringContracts: number;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
