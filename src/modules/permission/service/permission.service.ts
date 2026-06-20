import { Injectable } from '@nestjs/common';
import { CreatePermissionRequestDto, UpdatePermissionRequestDto } from '../dto/request';
import { PermissionRepository } from '../repository/permission.repository';

@Injectable()
export class PermissionService {
    constructor(private readonly permissionRepository: PermissionRepository) { }

    findAllPermissions() {
        return this.permissionRepository.findAllPermissions();
    }

    findPermissionByName(name: string) {
        return this.permissionRepository.findPermissionByName(new String(name).toLowerCase());
    }
    createPermission(body: CreatePermissionRequestDto, actorUserId: number) {
        return this.permissionRepository.createPermission(body, actorUserId);
    }

    updatePermission(id: number, body: UpdatePermissionRequestDto, actorUserId: number) {
        return this.permissionRepository.updatePermission(id, body, actorUserId);
    }

    deletePermission(id: number, actorUserId: number) {
        return this.permissionRepository.softDeletePermission(id, actorUserId);
    }


}
