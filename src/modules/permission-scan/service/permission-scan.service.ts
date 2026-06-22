import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { PERMISSION_KEY } from '@/common/security/decorators/requirePermission.decorator';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

@Injectable()
export class PermissionScan implements OnApplicationBootstrap {
    constructor(
        private discovery: DiscoveryService,
        private scanner: MetadataScanner,
        private reflector: Reflector,
        // private permission: PermissionRepository,
    ) { }

    onApplicationBootstrap() {
        const controllers = this.discovery.getControllers();
        controllers.forEach((item) => {
            if (!item.instance) return;
            const prototype = Object.getPrototypeOf(item.instance);

            this.scanner.getAllMethodNames(prototype).forEach((methodName) => {
                const handler = prototype[methodName];

                const perm = this.reflector.get<PermissionCode>(PERMISSION_KEY, handler);

                if (perm) {
                    console.log(perm)
                }
            });
        });

    }
}
