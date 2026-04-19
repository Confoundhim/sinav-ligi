import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service';
import { PrismaService } from '../common/database/prisma.service';
import { FriendshipStatus } from '@prisma/client';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  friendship: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
};

describe('FriendsService', () => {
  let service: FriendsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  describe('sendRequest', () => {
    it('arkadaşlık isteği göndermeli', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrisma.friendship.findFirst.mockResolvedValue(null);
      mockPrisma.friendship.create.mockResolvedValue({
        id: 'friendship-1',
        requesterId: 'user-1',
        addresseeId: 'user-2',
        status: FriendshipStatus.PENDING,
        requester: { displayName: 'User 1' },
        addressee: { displayName: 'User 2' },
      });

      const result = await service.sendRequest('user-1', 'user-2');
      expect(result.friendship).toBeDefined();
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('kendine istek göndermeye izin vermemeli', async () => {
      await expect(service.sendRequest('user-1', 'user-1')).rejects.toThrow(
        'Kendinize arkadaşlık isteği gönderemezsiniz',
      );
    });
  });

  describe('acceptRequest', () => {
    it('arkadaşlık isteğini kabul etmeli', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({
        id: 'friendship-1',
        addresseeId: 'user-2',
        requesterId: 'user-1',
        status: FriendshipStatus.PENDING,
      });
      mockPrisma.friendship.update.mockResolvedValue({
        id: 'friendship-1',
        status: FriendshipStatus.ACCEPTED,
        requester: { displayName: 'User 1' },
        addressee: { displayName: 'User 2' },
      });

      const result = await service.acceptRequest('user-2', 'friendship-1');
      expect(result.friendship.status).toBe(FriendshipStatus.ACCEPTED);
    });
  });

  describe('getFriends', () => {
    it('arkadaş listesini döndürmeli', async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'f-1',
          requesterId: 'user-1',
          addresseeId: 'user-2',
          createdAt: new Date(),
          requester: { id: 'user-1', displayName: 'User 1' },
          addressee: { id: 'user-2', displayName: 'User 2' },
        },
      ]);

      const result = await service.getFriends('user-1');
      expect(result.friends).toHaveLength(1);
      expect(result.friends[0].friend.id).toBe('user-2');
    });
  });
});
