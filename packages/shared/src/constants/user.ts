import { OrganizationRole } from '../types/user'

export const USER_ROLE_LABELS: Record<keyof typeof OrganizationRole, string> = {
  [OrganizationRole.OWNER]: 'Owner',
  [OrganizationRole.ADMIN]: 'Administrator',
  [OrganizationRole.MEMBER]: 'Member',
  [OrganizationRole.VIEWER]: 'Viewer',
}

export const DEFAULT_USER_SETTINGS = {
  theme: 'system' as const,
  notifications: {
    email: true,
    push: true,
  },
  dealView: 'kanban' as const,
}
