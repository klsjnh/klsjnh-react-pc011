/** Mock 数据层类型（前端演示数据，非后端契约） */

export interface User {
  id: number;
  username: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'locked';
  avatar: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Role {
  id: number;
  name: string;
  label: string;
  description: string;
  status: 'active' | 'inactive';
  userCount: number;
  permissions: string[];
  createdAt: string;
}

export interface MenuItem {
  id: number;
  parentId: number;
  name: string;
  path: string;
  icon: string;
  title: string;
  type: 'directory' | 'menu' | 'button';
  sort: number;
  children?: MenuItem[];
}

export interface PermissionItem {
  key: string;
  label: string;
}

export interface PermissionModule {
  module: string;
  icon: string;
  items: PermissionItem[];
}

/** 六字段响应信封（与后端 Response011<T> 一致） */
export interface MockEnvelope<T> {
  statusCode: number;
  message: string;
  errorMessage: string;
  timestamp: number;
  traceId: string;
  data: T;
}
