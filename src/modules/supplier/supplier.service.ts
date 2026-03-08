import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierRequestDto } from './dto/request/create-supplier.request.dto';
import { GetSuppliersQueryDto } from './dto/request/get-suppliers.query.dto';
import { SupplierItemResponseDto } from './dto/response/supplier-item.response.dto';
import { SupplierListResponseDto } from './dto/response/supplier-list.response.dto';
import { SupplierRepository } from './supplier.repository';

type SupplierRow = Awaited<
  ReturnType<SupplierRepository['findSuppliers']>
>[number];
type SupplierDetailRow = Awaited<
  ReturnType<SupplierRepository['findSupplierById']>
>;

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async getSuppliers(
    query: GetSuppliersQueryDto,
  ): Promise<SupplierListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.supplierRepository.countSuppliers(),
      this.supplierRepository.findSuppliers(page, limit),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
      items: rows.map((row) => this.toSupplierItem(row)),
    };
  }

  async createSupplier(
    body: CreateSupplierRequestDto,
  ): Promise<SupplierItemResponseDto> {
    const created = await this.supplierRepository.createSupplier(body.name);
    return this.toSupplierItem(created);
  }

  async toggleSupplierActive(
    supplierId: bigint,
  ): Promise<SupplierItemResponseDto> {
    const supplier = await this.supplierRepository.findSupplierById(supplierId);

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const updated = await this.supplierRepository.updateSupplierActive(
      supplierId,
      !supplier.isActive,
    );

    return this.toSupplierItem(updated);
  }

  private toSupplierItem(
    row: SupplierRow | NonNullable<SupplierDetailRow>,
  ): SupplierItemResponseDto {
    return {
      id: row.id.toString(),
      name: row.name,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
