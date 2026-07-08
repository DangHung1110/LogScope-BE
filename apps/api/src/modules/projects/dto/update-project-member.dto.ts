import { ProjectRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectMemberDto {
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
