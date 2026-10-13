export const UserType = {
  CANDIDATE: 'CANDIDATE',
  STAFF: 'STAFF',
}

export {
  StaffRole,
  ASSIGNABLE_STAFF_ROLES,
  ROLE_DISPLAY_NAMES,
} from './staffRoles.js'

export const PermissionAction = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  PUBLISH: 'publish',
}

export const ApplicationStatus = {
  PENDING: 'PENDING',
  REVIEW: 'REVIEW',
  INTERVIEW: 'INTERVIEW',
  OFFER: 'OFFER',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
}

export const TalentPoolStatus = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  CONVERTED: 'CONVERTED',
  ARCHIVED: 'ARCHIVED',
}

export const PipelineStage = {
  NEW: 'new',
  HR_REVIEW: 'hr_review',
  CONTACT: 'contact',
  INTERVIEW: 'interview',
  DOCUMENTATION: 'documentation',
  CLIENT_REVIEW: 'client_review',
  APPROVED: 'approved',
  HIRED: 'hired',
}
