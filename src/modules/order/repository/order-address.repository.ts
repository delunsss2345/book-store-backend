import { PrismaService } from '@/database';
import { CreateOrderAddressDTO } from '@/modules/order/dto/request/create-order-address.dto';
import { Injectable } from '@nestjs/common';
import { OrderAddress, Prisma } from '@prisma/client';

@Injectable()
export class OrderAddressRepository {
    constructor(private readonly prisma: PrismaService) { }

    createGuestAddress(orderId: number, body: CreateOrderAddressDTO, orderNote?: string): Promise<OrderAddress> {
        const recipientName = this.buildRecipientName(body);

        const data: Prisma.OrderAddressUncheckedCreateInput = {
            orderId,
            recipientName,
            phoneNumber: body.phoneNumber,
            addressLine: body.addressLine,
            city: body.city,
        };

        const countryCode = body.countryCode ?? body.country;
        if (countryCode) {
            data.countryCode = countryCode;
        }

        if (body.ward) {
            data.ward = body.ward;
        }

        if (body.district) {
            data.district = body.district;
        }

        const note = body.note ?? orderNote;
        if (note) {
            data.note = note;
        }

        return this.prisma.orderAddress.create({ data });
    }

    private buildRecipientName(body: CreateOrderAddressDTO): string {
        if (body.recipientName) {
            return body.recipientName.trim();
        }

        const fullName = [body.firstName, body.lastName]
            .filter(Boolean)
            .map((part) => part.trim())
            .join(' ')
            .trim();

        return fullName;
    }
}
