// IssueSnap — Auth Module Types (OAuth-Only)

export type RoleTab = 'customer' | 'employee';
export type TargetRole = 'citizen' | 'staff';

export interface OAuthSignInParams {
  role: RoleTab | TargetRole;
  provider?: 'google';
}
