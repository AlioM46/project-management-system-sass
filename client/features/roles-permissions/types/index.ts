import { Permission, Role } from "@/features/team/types";

export type { Permission, Role } from "@/features/team/types";

export interface CreateRoleInput {
    name: string;
    slug?: string;
    description?: string;
}

export interface UpdateRoleInput {
    name?: string;
    slug?: string;
    description?: string;
}

export interface GroupedPermissions {
    resource: string;
    label: string;
    permissions: Permission[];
}
