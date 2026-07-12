import type { Request } from 'express';

export interface AuthenticatedProject {
  apiKeyId: string;
  id: string;
  slug: string;
}

export interface AuthenticatedRequest extends Request {
  project?: AuthenticatedProject;
}
