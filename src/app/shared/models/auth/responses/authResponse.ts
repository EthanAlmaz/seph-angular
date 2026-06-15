import { UserSession } from '../responses/userSession';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: UserSession;
}