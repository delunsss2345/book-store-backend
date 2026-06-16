import { Injectable, Logger } from '@nestjs/common';
import {
    CreateUserRoleParams,
    DeleteUserRoleParams,
    UpdateUserRoleParams,
    UserRoleAuditOptions,
    UserRoleRepository,
} from '../repository/user-role.repository';

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

    async getRoleIdsByUserId(userId: bigint) {
        const rows = await this.userRoleRepository.findRolesByUserId(userId);
        Logger.debug('role user')
        return rows.map((row) => row.role.id);
    }

    getUserRolesByUserId(userId: bigint) {
        return this.userRoleRepository.findUserRolesByUserId(userId);
    }
}
