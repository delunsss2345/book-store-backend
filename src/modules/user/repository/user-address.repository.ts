import { UserAddressMessage } from '@/common';
import { PrismaClientTransaction, PrismaService } from '@/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AddressType, Prisma, UserAddress } from '@prisma/client';
import { CreateUserAddressRequestDto } from '../dto/request/create-user-address.request.dto';
import { UpdateUserAddressRequestDto } from '../dto/request/update-user-address.request.dto';

@Injectable()
export class UserAddressRepository {
  constructor(private readonly prisma: PrismaService) { }

  getUserAddressByUserId(userId: number): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  createUserAddressByUserId(
    userId: number,
    body: CreateUserAddressRequestDto,
  ): Promise<UserAddress> {
    return this.prisma.$transaction(async (tx) => {
      const activeCount = await tx.userAddress.count({
        where: {
          userId,
          deletedAt: null,
        },
      });

      const data: Prisma.UserAddressUncheckedCreateInput = {
        userId,
        phoneNumber: body.phoneNumber,
        addressDetail: body.addressDetail,
        recipientName: body.recipientName,
        ward: body.ward,
        district: body.district,
        city: body.city,
        isDefault: activeCount === 0,
      };

      if (body.addressType !== undefined) {
        data.addressType = body.addressType as AddressType;
      }

      if (body.recipientName !== undefined) {
        data.recipientName = body.recipientName;
      }

      return tx.userAddress.create({ data });
    });
  }

  async updateUserAddressByIdAndUserId(
    id: number,
    userId: number,
    body: UpdateUserAddressRequestDto,
  ): Promise<UserAddress> {
    const found = await this.prisma.userAddress.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!found) {
      throw new NotFoundException(UserAddressMessage.USER_ADDRESS_NOT_FOUND);
    }

    const data: Prisma.UserAddressUncheckedUpdateInput = {};

    if (body.addressType !== undefined) {
      data.addressType = body.addressType as AddressType;
    }

    if (body.recipientName !== undefined) {
      data.recipientName = body.recipientName;
    }

    if (body.phoneNumber !== undefined) {
      data.phoneNumber = body.phoneNumber;
    }

    if (body.addressDetail !== undefined) {
      data.addressDetail = body.addressDetail;
    }

    if (body.ward !== undefined) {
      data.ward = body.ward;
    }

    if (body.district !== undefined) {
      data.district = body.district;
    }

    if (body.city !== undefined) {
      data.city = body.city;
    }

    return this.prisma.userAddress.update({
      where: { id },
      data,
    });
  }

  setDefaultByIdAndUserId(id: number, userId: number): Promise<UserAddress> {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.userAddress.findFirst({
        where: {
          id,
          userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!target) {
        throw new NotFoundException(UserAddressMessage.USER_ADDRESS_NOT_FOUND);
      }

      await tx.userAddress.updateMany({
        where: {
          userId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });

      return tx.userAddress.update({
        where: { id: target.id },
        data: {
          isDefault: true,
        },
      });
    });
  }

  softDeleteByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<{ success: boolean; deleteId: number }> {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.userAddress.findFirst({
        where: {
          id,
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
          isDefault: true,
        },
      });

      if (!target) {
        throw new NotFoundException(UserAddressMessage.USER_ADDRESS_NOT_FOUND);
      }

      const now = new Date();

      await tx.userAddress.update({
        where: { id: target.id },
        data: {
          deletedAt: now,
          isDefault: false,
        },
      });

      if (target.isDefault) {
        const newestActive = await tx.userAddress.findFirst({
          where: {
            userId,
            deletedAt: null,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { id: true },
        });

        if (newestActive) {
          await tx.userAddress.updateMany({
            where: {
              userId,
              deletedAt: null,
            },
            data: {
              isDefault: false,
            },
          });

          await tx.userAddress.update({
            where: { id: newestActive.id },
            data: {
              isDefault: true,
            },
          });
        }
      }

      return { deleteId: target.id, success: true };
    });
  }

  findByAddressIdAndUserId(addressId: number, userId: number, tx: PrismaClientTransaction) {
    return tx.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
  }
}
