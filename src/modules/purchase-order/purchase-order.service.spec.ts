import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { PurchaseOrderRepository } from './purchase-order.repository';
import { PurchaseOrderService } from './purchase-order.service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  let repository: jest.Mocked<PurchaseOrderRepository>;

  const createBody = {
    supplierId: 1n,
    code: 'PO-20260312-001',
    createdAt: new Date('2026-03-12T10:00:00.000Z'),
    note: 'Nhap hang thang 3',
    totalAmount: 1500000,
    taxAmount: 150000,
    items: [
      {
        bookVariantId: 11n,
        quantity: 10,
        unitPrice: 120000,
        totalPrice: 1200000,
      },
    ],
  };

  const createdRow = {
    id: 'po_1',
    supplierId: 1n,
    code: createBody.code,
    status: 'PENDING',
    note: createBody.note,
    totalAmount: new Prisma.Decimal('1500000'),
    taxAmount: new Prisma.Decimal('150000'),
    createdAt: createBody.createdAt,
    updatedAt: new Date('2026-03-12T10:05:00.000Z'),
    items: [
      {
        id: 'poi_1',
        purchaseOrderId: 'po_1',
        bookVariantId: 11n,
        quantity: 10,
        unitPrice: new Prisma.Decimal('120000'),
        totalPrice: new Prisma.Decimal('1200000'),
        createdAt: createBody.createdAt,
        updatedAt: createBody.createdAt,
      },
    ],
  };

  beforeEach(() => {
    repository = {
      withTransaction: jest.fn(),
      createPurchaseOrder: jest.fn(),
      createPurchaseOrderItems: jest.fn(),
      findPurchaseOrderById: jest.fn(),
      findPurchaseOrderByCode: jest.fn(),
      findPurchaseOrders: jest.fn(),
      approvePurchaseOrder: jest.fn(),
    } as unknown as jest.Mocked<PurchaseOrderRepository>;

    service = new PurchaseOrderService(repository);
  });

  it('creates purchase order and items in a single transaction', async () => {
    const tx = {} as Prisma.TransactionClient;

    repository.withTransaction.mockImplementation(async (callback) =>
      callback(tx),
    );
    repository.createPurchaseOrder.mockResolvedValue({
      id: createdRow.id,
      supplierId: createdRow.supplierId,
      code: createdRow.code,
      status: createdRow.status,
      note: createdRow.note,
      totalAmount: createdRow.totalAmount,
      taxAmount: createdRow.taxAmount,
      createdAt: createdRow.createdAt,
      updatedAt: createdRow.updatedAt,
    });
    repository.createPurchaseOrderItems.mockResolvedValue(createdRow.items);
    repository.findPurchaseOrderById.mockResolvedValue(createdRow);

    const result = await service.createPurchaseOrder(99n, createBody);

    expect(repository.withTransaction).toHaveBeenCalledTimes(1);
    expect(repository.createPurchaseOrder).toHaveBeenCalledWith(
      99n,
      createBody,
      tx,
    );
    expect(repository.createPurchaseOrderItems).toHaveBeenCalledWith(
      createdRow.id,
      createBody.items,
      tx,
    );
    expect(repository.findPurchaseOrderById).toHaveBeenCalledWith(
      createdRow.id,
      tx,
    );
    expect(result).toEqual({
      id: createdRow.id,
      supplierId: '1',
      code: createdRow.code,
      status: createdRow.status,
      note: createdRow.note,
      totalAmount: 1500000,
      taxAmount: 150000,
      createdAt: createdRow.createdAt,
      updatedAt: createdRow.updatedAt,
      items: [
        {
          id: 'poi_1',
          purchaseOrderId: 'po_1',
          bookVariantId: '11',
          quantity: 10,
          unitPrice: 120000,
          totalPrice: 1200000,
          createdAt: createBody.createdAt,
          updatedAt: createBody.createdAt,
        },
      ],
    });
  });

  it('propagates repository error and leaves rollback to transaction', async () => {
    const expectedError = new BadRequestException('Invalid bookVariantId: 999');
    const tx = {} as Prisma.TransactionClient;

    repository.withTransaction.mockImplementation(async (callback) =>
      callback(tx),
    );
    repository.createPurchaseOrder.mockResolvedValue({
      id: createdRow.id,
      supplierId: createdRow.supplierId,
      code: createdRow.code,
      status: createdRow.status,
      note: createdRow.note,
      totalAmount: createdRow.totalAmount,
      taxAmount: createdRow.taxAmount,
      createdAt: createdRow.createdAt,
      updatedAt: createdRow.updatedAt,
    });
    repository.createPurchaseOrderItems.mockRejectedValue(expectedError);

    await expect(service.createPurchaseOrder(99n, createBody)).rejects.toBe(
      expectedError,
    );

    expect(repository.findPurchaseOrderById).not.toHaveBeenCalled();
  });
});
