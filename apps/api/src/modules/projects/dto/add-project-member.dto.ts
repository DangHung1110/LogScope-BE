import { ProjectRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum } from 'class-validator';

export class AddProjectMemberDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsEnum(ProjectRole)
  role: ProjectRole = ProjectRole.VIEWER;
}
