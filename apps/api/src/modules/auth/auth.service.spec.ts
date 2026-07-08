import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';
import { JwtTokenPayload } from './types/auth.types';

interface CreateUserArgs {
  data: {
    email: string;
    name?: string;
    passwordHash: string;
  };
}

interface FindUserArgs {
  where: {
    email?: string;
    id?: string;
  };
}

interface PrismaMock {
  user: {
    create: jest.Mock<Promise<User>, [CreateUserArgs]>;
    findUnique: jest.Mock<Promise<User | null>, [FindUserArgs]>;
  };
}

interface JwtServiceMock {
  signAsync: jest.Mock<Promise<string>, [JwtTokenPayload, Record<string, unknown>]>;
  verifyAsync: jest.Mock<Promise<JwtTokenPayload>, [string, Record<string, unknown>]>;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwtService: JwtServiceMock;

  const now = new Date('2026-07-08T00:00:00.000Z');
  const user: User = {
    createdAt: now,
    email: 'test@example.com',
    id: 'user-id',
    name: 'Test User',
    passwordHash: 'hash',
    updatedAt: now,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn<Promise<User>, [CreateUserArgs]>(),
        findUnique: jest.fn<Promise<User | null>, [FindUserArgs]>(),
      },
    };

    jwtService = {
      signAsync: jest.fn<Promise<string>, [JwtTokenPayload, Record<string, unknown>]>(
        (payload: JwtTokenPayload) =>
          Promise.resolve(payload.type === 'access' ? 'access-token' : 'refresh-token'),
      ),
      verifyAsync: jest.fn<Promise<JwtTokenPayload>, [string, Record<string, unknown>]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
                JWT_REFRESH_SECRET: 'refresh-secret',
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers a user and does not expose passwordHash', async () => {
    prisma.user.create.mockResolvedValue(user);

    const result = await service.register({
      email: 'TEST@example.com',
      name: 'Test User',
      password: 'password123',
    });

    const createArgs = prisma.user.create.mock.calls[0]?.[0];

    expect(createArgs).toBeDefined();
    expect(createArgs?.data.email).toBe('test@example.com');
    expect(createArgs?.data.name).toBe('Test User');
    expect(createArgs?.data.passwordHash).not.toBe('password123');
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(result.user).toEqual({
      createdAt: now,
      email: user.email,
      id: user.id,
      name: user.name,
      updatedAt: now,
    });
    expect(result).not.toHaveProperty('user.passwordHash');
  });

  it('throws conflict when email already exists', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        clientVersion: 'test',
        code: 'P2002',
      }),
    );

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in a user with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash,
    });

    const result = await service.login({
      email: 'TEST@example.com',
      password: 'password123',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid login credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash,
    });

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes tokens with a valid refresh token', async () => {
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({
      email: user.email,
      sub: user.id,
      type: 'refresh',
    });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.refresh('refresh-token');

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret',
    });
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
