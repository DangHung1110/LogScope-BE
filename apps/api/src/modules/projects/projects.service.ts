import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectMember, ProjectRole, User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMemberResponse, ProjectResponse, ProjectUserResponse } from './types/project.types';

const PROJECT_MUTATION_ROLES: ProjectRole[] = [ProjectRole.OWNER, ProjectRole.ADMIN];
const PROJECT_OWNER_ONLY_ROLES: ProjectRole[] = [ProjectRole.OWNER];
const ASSIGNABLE_MEMBER_ROLES: ProjectRole[] = [
  ProjectRole.ADMIN,
  ProjectRole.DEVELOPER,
  ProjectRole.VIEWER,
];

const projectWithMembersInclude = Prisma.validator<Prisma.ProjectInclude>()({
  members: {
    include: {
      user: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
    },
  },
});

const memberWithUserInclude = Prisma.validator<Prisma.ProjectMemberInclude>()({
  user: {
    select: {
      email: true,
      id: true,
      name: true,
    },
  },
});

type ProjectWithMembers = Prisma.ProjectGetPayload<{
  include: typeof projectWithMembersInclude;
}>;

type MemberWithUser = Prisma.ProjectMemberGetPayload<{
  include: typeof memberWithUserInclude;
}>;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(userId: string, dto: CreateProjectDto): Promise<ProjectResponse> {
    const slug = await this.generateUniqueSlug(dto.name);

    const project = await this.prisma.project.create({
      data: {
        members: {
          create: {
            role: ProjectRole.OWNER,
            userId,
          },
        },
        name: dto.name,
        ownerId: userId,
        slug,
      },
      include: projectWithMembersInclude,
    });

    return this.toProjectResponse(project);
  }

  async listProjects(userId: string): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      include: projectWithMembersInclude,
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    });

    return projects.map((project) => this.toProjectResponse(project));
  }

  async getProject(userId: string, projectId: string): Promise<ProjectResponse> {
    const project = await this.findAccessibleProject(userId, projectId);
    return this.toProjectResponse(project);
  }

  async assertProjectAccess(userId: string, projectId: string): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      select: {
        id: true,
      },
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Project not found');
    }
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    await this.requireProjectRole(userId, projectId, PROJECT_MUTATION_ROLES);

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = await this.generateUniqueSlug(dto.name, projectId);
    }

    const project = await this.prisma.project.update({
      data,
      include: projectWithMembersInclude,
      where: {
        id: projectId,
      },
    });

    return this.toProjectResponse(project);
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    await this.requireProjectRole(userId, projectId, PROJECT_OWNER_ONLY_ROLES);

    await this.prisma.$transaction([
      this.prisma.apiKey.deleteMany({
        where: {
          projectId,
        },
      }),
      this.prisma.projectMember.deleteMany({
        where: {
          projectId,
        },
      }),
      this.prisma.project.delete({
        where: {
          id: projectId,
        },
      }),
    ]);
  }

  async addMember(
    actorUserId: string,
    projectId: string,
    dto: AddProjectMemberDto,
  ): Promise<ProjectMemberResponse> {
    await this.requireProjectRole(actorUserId, projectId, PROJECT_MUTATION_ROLES);
    this.assertAssignableRole(dto.role);

    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a project member');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        role: dto.role,
        userId: user.id,
      },
      include: memberWithUserInclude,
    });

    return this.toMemberResponse(member);
  }

  async updateMember(
    actorUserId: string,
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<ProjectMemberResponse> {
    await this.requireProjectRole(actorUserId, projectId, PROJECT_MUTATION_ROLES);
    this.assertAssignableRole(dto.role);

    const member = await this.findProjectMember(projectId, memberId);
    this.assertMutableMember(member);

    const updatedMember = await this.prisma.projectMember.update({
      data: {
        role: dto.role,
      },
      include: memberWithUserInclude,
      where: {
        id: memberId,
      },
    });

    return this.toMemberResponse(updatedMember);
  }

  async removeMember(actorUserId: string, projectId: string, memberId: string): Promise<void> {
    await this.requireProjectRole(actorUserId, projectId, PROJECT_MUTATION_ROLES);

    const member = await this.findProjectMember(projectId, memberId);
    this.assertMutableMember(member);

    await this.prisma.projectMember.delete({
      where: {
        id: memberId,
      },
    });
  }

  private async findAccessibleProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectWithMembers> {
    const project = await this.prisma.project.findFirst({
      include: projectWithMembersInclude,
      where: {
        id: projectId,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async requireProjectRole(
    userId: string,
    projectId: string,
    allowedRoles: ProjectRole[],
  ): Promise<ProjectMember> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient project permission');
    }

    return member;
  }

  private async findProjectMember(projectId: string, memberId: string): Promise<ProjectMember> {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    return member;
  }

  private assertAssignableRole(role: ProjectRole): void {
    if (!ASSIGNABLE_MEMBER_ROLES.includes(role)) {
      throw new BadRequestException('OWNER role is reserved for the project creator');
    }
  }

  private assertMutableMember(member: ProjectMember): void {
    if (member.role === ProjectRole.OWNER) {
      throw new BadRequestException('Project owner membership cannot be modified');
    }
  }

  private async generateUniqueSlug(name: string, ignoredProjectId?: string): Promise<string> {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.slugExists(slug, ignoredProjectId)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private async slugExists(slug: string, ignoredProjectId?: string): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      select: {
        id: true,
      },
      where: {
        id: ignoredProjectId
          ? {
              not: ignoredProjectId,
            }
          : undefined,
        slug,
      },
    });

    return project !== null;
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug.length > 0 ? slug : 'project';
  }

  private toProjectResponse(project: ProjectWithMembers): ProjectResponse {
    return {
      createdAt: project.createdAt,
      id: project.id,
      members: project.members.map((member) => this.toMemberResponse(member)),
      name: project.name,
      ownerId: project.ownerId,
      slug: project.slug,
      updatedAt: project.updatedAt,
    };
  }

  private toMemberResponse(member: MemberWithUser): ProjectMemberResponse {
    return {
      id: member.id,
      projectId: member.projectId,
      role: member.role,
      user: this.toProjectUserResponse(member.user),
      userId: member.userId,
    };
  }

  private toProjectUserResponse(user: Pick<User, 'email' | 'id' | 'name'>): ProjectUserResponse {
    return {
      email: user.email,
      id: user.id,
      name: user.name,
    };
  }
}
