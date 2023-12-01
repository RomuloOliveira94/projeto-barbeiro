import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3001);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3001');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'r@r.com',
      password: '123456',
    };

    describe('Register', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({ ...dto, email: '' })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({ ...dto, password: '' })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if no body', () => {
        return pactum.spec().post('/auth/register').expectStatus(400).inspect();
      });

      it('should register a new user', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(201)
          .inspect();
      });
    });
    describe('Login', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, email: '' })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, password: '' })
          .expectStatus(400)
          .inspect();
      });

      it('should throw if no body', () => {
        return pactum.spec().post('/auth/login').expectStatus(400).inspect();
      });

      it('should login a user', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    const dto: EditUserDto = {
      email: 'rdoido@r.com',
      firstName: 'rometar',
    };
    describe('Get user', () => {
      it('should throw if no token', () => {
        return pactum.spec().get('/users/me').expectStatus(401).inspect();
      });

      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken('$S{userAt}')
          .expectStatus(200);
      });
    });
    describe('Update user', () => {
      it('should throw if no token', () => {
        return pactum.spec().patch('/users').expectStatus(401).inspect();
      });

      it('should update current user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName);
      });
    });
  });

  describe('Bookmarks', () => {
    const dto: CreateBookmarkDto = {
      link: 'https://google.com',
      title: 'Google',
    };
    describe('Got empty bookmark', () => {
      it('should throw if no token', () => {
        return pactum.spec().get('/bookmarks').expectStatus(401).inspect();
      });

      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .inspect()
          .expectBody([]);
      });
    });
    describe('Create bookmark', () => {
      it('shoud create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(201)
          .inspect()
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmark', () => {
      it('shoud get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .inspect()
          .expectJsonLength(1);
      });
    });
    describe('Get bookmark by id', () => {
      it('shoud get bookmarks by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .inspect();
      });
    });
    describe('Update bookmark by id', () => {
      it('shoud update bookmarks by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .withBody({ title: 'Google 2', description: 'afofada no alonso' })
          .expectStatus(200)
          .inspect()
          .expectBodyContains('afofada no alonso');
      });
    });
    describe('Delete bookmark by id', () => {
      it('shoud delete bookmarks by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(204)
          .inspect();
      });
      it('shoud get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
