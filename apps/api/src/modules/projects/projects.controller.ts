import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../auth/types/auth.types';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import type { ProjectMemberResponse, ProjectResponse } from './types/project.types';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.createProject(user.id, dto);
  }

  @Get()
  listProjects(@CurrentUser() user: PublicUser): Promise<ProjectResponse[]> {
    return this.projectsService.listProjects(user.id);
  }

  @Get(':projectId')
  getProject(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
  ): Promise<ProjectResponse> {
    return this.projectsService.getProject(user.id, projectId);
  }

  @Patch(':projectId')
  updateProject(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.updateProject(user.id, projectId, dto);
  }

  @Delete(':projectId')
  @HttpCode(204)
  async deleteProject(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
  ): Promise<void> {
    await this.projectsService.deleteProject(user.id, projectId);
  }

  @Post(':projectId/members')
  addMember(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
  ): Promise<ProjectMemberResponse> {
    return this.projectsService.addMember(user.id, projectId, dto);
  }

  @Patch(':projectId/members/:memberId')
  updateMember(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ): Promise<ProjectMemberResponse> {
    return this.projectsService.updateMember(user.id, projectId, memberId, dto);
  }

  @Delete(':projectId/members/:memberId')
  @HttpCode(204)
  async removeMember(
    @CurrentUser() user: PublicUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    await this.projectsService.removeMember(user.id, projectId, memberId);
  }
}
