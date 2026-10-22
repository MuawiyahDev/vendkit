export type UserRole = "USER" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}
