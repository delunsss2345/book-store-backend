import { UNIQUE_INDEX_MESSAGE } from '@/database/errors/prisma-unique-map';
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();

        if (exception.code === 'P2002') {
            const index = (exception.meta as any)?.driverAdapterError?.cause?.constraint?.index;
            const mapped = UNIQUE_INDEX_MESSAGE[index];
            return res.status(HttpStatus.CONFLICT).json({
                statusCode: 409,
                message: mapped?.message ?? 'Duplicate value (unique constraint)',
            });
        }

        if (exception.code === 'P2025') {
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: 404,
                message: 'Record not found',
            });
        }

        return res.status(HttpStatus.BAD_REQUEST).json({
            statusCode: 400,
            message: exception.message,
            code: exception.code,
        });
    }
}
