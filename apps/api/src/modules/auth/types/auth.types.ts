import type { Request } from 'express';

export interface PublicUser {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
  updatedAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: TokenPair;
  user: PublicUser;
}

export interface JwtTokenPayload {
  email: string;
  sub: string;
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
}
