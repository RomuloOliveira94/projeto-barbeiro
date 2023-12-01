import { Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmark(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });

    return bookmarks;
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
        userId
      },
    });

    if (!bookmark || bookmark.userId !== userId) {
      throw new Error('No bookmarks found');
    }

    return bookmark;
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        ...dto,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return bookmark;
  }

  async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    const bookmark =  await this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
        userId
      },
      data: {
        ...dto,
      },
    });
     
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error('Acess to this resource denied');
    }

    return bookmark;
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
        userId
      },
    });

    if (!bookmark || bookmark.userId !== userId) {
      throw new Error('Acess to this resource denied');
    }
  }
}
