import { PrismaService } from "@/database";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RoleRepository {
    constructor(private readonly prisma: PrismaService) {
    }

    findAll() {
        return this.prisma.role.findMany({
            select: {
                id: true,
                code: true,
                name: true
            }
        });
    }

    findRoleByName(name: string) {
        return this.prisma.role.findUnique({
            where: { name },
            select: {
                id: true,
                code: true,
                name: true
            }
        });
    }
}
