/**
 * Pure frontend role-aware visibility helpers.
 * Used exclusively for toggling UI elements (tabs, buttons, navigation items).
 * Server-side authorization and RBAC are enforced by the backend.
 */

export function canAccessHR(role) {
  if (!role) return false;
  return ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function canAccessPayroll(role) {
  if (!role) return false;
  return ["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function canManagePayroll(role) {
  if (!role) return false;
  return ["HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function canApproveLeave(role) {
  if (!role) return false;
  return ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function isAdmin(role) {
  return role === "ADMIN";
}

export function isEmployee(role) {
  return role === "EMPLOYEE";
}
