import { RoleCode } from "@prisma/client";

export type RoleDTO = {
    id: number;
    code: RoleCode;
    name: string;
};