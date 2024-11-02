export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  AUDITOR = "AUDITOR",
  APP_USER = "APP_USER"
}
export enum DashboardUserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  AUDITOR = "AUDITOR"
}

export const DASHBOARD_ROLES_SET = [
  DashboardUserRole.SUPER_ADMIN,
  DashboardUserRole.AUDITOR
]
