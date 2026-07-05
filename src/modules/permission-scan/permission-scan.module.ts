import { PermissionModule } from '@/modules/permission/permission.module';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionScanService } from './service/permission-scan.service';

@Module({
    imports: [DiscoveryModule, PermissionModule],
    controllers: [],
    providers: [PermissionScanService],
})
export class PermissionScanModule { };
