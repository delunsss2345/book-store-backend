import { Injectable } from '@nestjs/common';
import {
    CreateUserRoleParams,
    DeleteUserRoleParams,
    UpdateUserRoleParams,
    UserRoleAuditOptions,
    UserRoleRepository,
} from './user-role.repository';

@Injectable()
export class UserRoleService {
    constructor(private readonly userRoleRepository: UserRoleRepository) { }

    createUserRole(params: CreateUserRoleParams, options?: UserRoleAuditOptions) {
        return this.userRoleRepository.createUserRole(params, options);
    }

    updateUserRole(params: UpdateUserRoleParams, options?: UserRoleAuditOptions) {
        return this.userRoleRepository.updateUserRole(params, options);
    }

    deleteUserRole(params: DeleteUserRoleParams, options?: UserRoleAuditOptions) {
        return this.userRoleRepository.softDeleteUserRole(params, options);
    }

    async getRolesByUserId(userId: bigint) {
        const rows = await this.userRoleRepository.findRolesByUserId(userId);
        return rows.map((row) => row.role.code);
    }

    getUserRolesByUserId(userId: bigint) {
        return this.userRoleRepository.findUserRolesByUserId(userId);
    }
}
