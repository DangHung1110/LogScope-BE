import { ProjectRole } from '@prisma/client';

export interface ProjectUserResponse {
  email: string;
  id: string;
  name: string | null;
}

export interface ProjectMemberResponse {
  id: string;
  projectId: string;
  role: ProjectRole;
  user: ProjectUserResponse;
  userId: string;
}

export interface ProjectResponse {
  createdAt: Date;
  id: string;
  members: ProjectMemberResponse[];
  name: string;
  ownerId: string;
  slug: string;
  updatedAt: Date;
}
