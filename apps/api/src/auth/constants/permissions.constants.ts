import { Role } from '@repo/database';

export const Permissions = {
  user: ['user:read', 'user:update'],
  admin: ['user:read', 'user:update', 'user:delete'],
  category: [
    'category:read',
    'category:create',
    'category:update',
    'category:delete',
  ],
  brand: ['brand:read', 'brand:create', 'brand:update', 'brand:delete'],
  image: ['image:read', 'image:create', 'image:delete'],
  product: ['product:read', 'product:create', 'product:update', 'product:delete'],
  customer: [
    'customer:read',
    'customer:create',
    'customer:update',
    'customer:delete',
  ],
  order: ['order:read', 'order:create', 'order:update', 'order:delete'],
  inventory: ['inventory:read', 'inventory:update'],
  settingRead: ['setting:read'],
  settingUpdate: ['setting:update'],
  backup: ['backup:read', 'backup:create', 'backup:delete', 'backup:restore'],
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions][number];

type RolePermissions = {
  [K in Role]: readonly Permission[];
};

export const ROLE_PERMISSIONS: RolePermissions = {
  [Role.USER]: [
    ...Permissions.user,
    ...Permissions.category,
    ...Permissions.brand,
    ...Permissions.image,
    ...Permissions.product,
    ...Permissions.customer,
    ...Permissions.order,
    ...Permissions.inventory,
    ...Permissions.settingRead,
  ] as readonly Permission[],
  [Role.ADMIN]: [
    ...Permissions.admin,
    ...Permissions.category,
    ...Permissions.brand,
    ...Permissions.image,
    ...Permissions.product,
    ...Permissions.customer,
    ...Permissions.order,
    ...Permissions.inventory,
    ...Permissions.settingRead,
    ...Permissions.settingUpdate,
    ...Permissions.backup,
  ] as readonly Permission[],
};
