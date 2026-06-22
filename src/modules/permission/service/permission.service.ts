import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { Injectable } from '@nestjs/common';
import {
    CreateManyPermissionRequestDto,
    CreatePermissionRequestDto,
    UpdatePermissionRequestDto,
} from '../dto/request';
import { PermissionRepository } from '../repository/permission.repository';

@Injectable()
export class PermissionService {
    constructor(private readonly permissionRepository: PermissionRepository,
        private readonly transactionService: TransactionService
    ) { }

    findAllPermissions() {
        return this.permissionRepository.findAllPermissions();
    }

    findPermissionByName(name: string) {
        return this.permissionRepository.findPermissionByName(
            new String(name).toLowerCase(),
        );
    }
    createPermission(body: CreatePermissionRequestDto, actorUserId: number) {
        return this.permissionRepository.createPermission(body, actorUserId);
    }

    updatePermission(
        id: number,
        body: UpdatePermissionRequestDto,
        actorUserId: number,
    ) {
        return this.permissionRepository.updatePermission(id, body, actorUserId);
    }

    deletePermission(id: number, actorUserId: number) {
        return this.permissionRepository.softDeletePermission(id, actorUserId);
    }

    createManyPermission(keys: CreateManyPermissionRequestDto) {
        return this.transactionService.doInTransaction((tx) => {
            return Promise.all(
                keys.map((key) => {
                    return this.permissionRepository.upsert(key, tx);
                }),
            );
        });
    }
}
