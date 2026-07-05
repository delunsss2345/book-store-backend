import { SupplierItemResponseDto } from '../dto/response/supplier-item.response.dto';
import { SupplierRepository } from '../repository/supplier.repository';

type SupplierRow = Awaited<
  ReturnType<SupplierRepository['findSuppliers']>
>[number];
type SupplierDetailRow = Awaited<
  ReturnType<SupplierRepository['findSupplierById']>
>;

export function toSupplierItem(
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
