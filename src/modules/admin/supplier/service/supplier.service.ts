import { SupplierMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierRequestDto } from '../dto/request/create-supplier.request.dto';
import { GetSuppliersQueryDto } from '../dto/request/get-suppliers.query.dto';
import { SupplierItemResponseDto } from '../dto/response/supplier-item.response.dto';
import { SupplierListResponseDto } from '../dto/response/supplier-list.response.dto';
import { toSupplierItem } from '../mapper';
import { SupplierRepository } from '../repository/supplier.repository';

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

    return buildPaginatedResult(
      rows.map((row) => toSupplierItem(row)),
      total,
      page,
      limit,
    );
  }

  async createSupplier(
    body: CreateSupplierRequestDto,
  ): Promise<SupplierItemResponseDto> {
    const created = await this.supplierRepository.createSupplier(
      body.name,
      body.code,
    );
    return toSupplierItem(created);
  }

  // Cho phép domain khác (vd AdminBookService) lấy supplier theo id qua service thay vì repository
  findSupplierById(supplierId: number) {
    return this.supplierRepository.findSupplierById(supplierId);
  }

  async toggleSupplierActive(
    supplierId: number,
  ): Promise<SupplierItemResponseDto> {
    const supplier = await this.supplierRepository.findSupplierById(supplierId);

    if (!supplier) {
      throw new NotFoundException(SupplierMessage.SUPPLIER_NOT_FOUND);
    }

    const updated = await this.supplierRepository.updateSupplierActive(
      supplierId,
      !supplier.isActive,
    );

    return toSupplierItem(updated);
  }
}
