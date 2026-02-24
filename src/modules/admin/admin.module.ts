import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { LanguageModule } from '@/modules/language/language.module';
import { Module } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminBookController } from './controllers/admin-book.controller';
import { AdminBookSnapshotController } from './controllers/admin-book-snapshot.controller';
import { AdminBookTranslationController } from './controllers/admin-book-translation.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
import { AdminOrderDetailController } from './controllers/admin-order-detail.controller';
import { AdminUserController } from './controllers/admin-user.controller';

@Module({
    imports: [LanguageModule, AuditLogModule],
    controllers: [
        AdminBookController,
        AdminBookTranslationController,
        AdminBookSnapshotController,
        AdminUserController,
        AdminOrderController,
        AdminOrderDetailController,
    ],
    providers: [AdminService, AdminRepository],
    exports: [AdminService, AdminRepository],
})
export class AdminModule { }
