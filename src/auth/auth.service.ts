import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: AuthDto) {
    //generate hash
    const hash = await argon.hash(dto.password);
    //save user in database
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      return this.signToken(user);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ForbiddenException('Credentials taken.');
        }
      }
      throw e;
    }
  }

  async login(dto) {
    //find user in database
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    //if user not found, throw error
    if (!user) {
      throw new ForbiddenException('Wrong credentials.');
    }
    //compare hash with password
    const isPasswordValid = await argon.verify(user.hash, dto.password);
    //if password is wrong, throw error
    if (!isPasswordValid) {
      throw new ForbiddenException('Wrong credentials.');
    }
    //send back user
    return this.signToken(user);
  }

  async signToken(user: User): Promise<{ access_token: string }> {
    const payload = { email: user.email, sub: user.id };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '20m',
      secret: this.config.get<string>('JWT_SECRET'),
    });
    return {
      access_token: token,
    };
  }
}
