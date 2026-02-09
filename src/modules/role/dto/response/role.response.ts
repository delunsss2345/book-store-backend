import { RoleCode } from "@prisma/client";

export type RoleDTO = {
    id: bigint;
    code: RoleCode;
    name: string;
};