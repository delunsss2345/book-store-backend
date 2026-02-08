// src/modules/mail/mail.service.ts
import { AppModule } from '@/app.module';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
    private transporter: Transporter;

    constructor(private readonly config: ConfigService) {
        this.transporter = nodemailer.createTransport(AppModule.CONFIGURATION.NODEMAILER_CONFIG.transport);
    }

    // Kiểm tra kết nối trước khi gửi 
    async onModuleInit() {
        await this.transporter.verify();
    }

    sendVerifyEmail(to: string, html: string) {
        return this.transporter.sendMail({
            from: this.config.get<string>('MAIL_FROM'),
            to,
            subject: 'Verify your email',
            html,
        });
    }
}
