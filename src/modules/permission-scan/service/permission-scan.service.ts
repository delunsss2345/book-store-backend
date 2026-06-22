import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { PERMISSION_KEY } from '@/common/security/decorators/requirePermission.decorator';
import { PermissionService } from '@/modules/permission/service/permission.service';
import type { PermissionScanDto } from '@/modules/permission-scan/dto';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

@Injectable()
export class PermissionScanService implements OnApplicationBootstrap {
  constructor(
    private discovery: DiscoveryService,
    private scanner: MetadataScanner,
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async onApplicationBootstrap() {
    const controllers = this.discovery.getControllers();
    const permissionScan: PermissionScanDto[] = [];
    controllers.forEach((item) => {
      if (!item.instance) return;
      // Chứa các phương thức ở prototype
      // dùng vì không có phương thức .prototype chỉ dùng getPrototype
      // tương đương const instance = new UserController() , Object.getPrototypeOf(instance)
      const prototype = Object.getPrototypeOf(item.instance);

      // Duyệt qua tên phương thức của prototype
      // Helper giúp duyệt bỏ constructor , get set.., gom trùng nếu có kế thường, đảm bảo lấy không trùng
      // Có thể dùng Object.getOwnPropertyNames(prototype) để lấy nhưng cần tự xử lí

      this.scanner.getAllMethodNames(prototype).forEach((method) => {
        // Lấy địa chỉ hàm qua tên phương thức, vì nó ở trong weekMap chỉ lưu object và function
        const handler = prototype[method];

        // Truyền key vào từ key đó dùng relector kiểm tra KEY PERMISSION, vì nó có 2 map lồng nhau
        // [UserController.prototype] → Map {
        // 'deleteUser' → Map {
        //     'permission' → 'DELETE',
        //  },
        const namePermission = this.reflector.get<PermissionCode>(
          PERMISSION_KEY,
          handler,
        );
        const pathMetadata = this.reflector.get<string>(PATH_METADATA, handler);
        const methodName = this.reflector.get<string>(METHOD_METADATA, handler);

        permissionScan.push({
          namePermission,
          pathMetadata,
          methodName,
        });
      });
    });

    await this.permissionService.createManyPermission(permissionScan);
  }
}
