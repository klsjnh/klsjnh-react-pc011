/** 认证 UI 类型 */
export interface CurrentUser {
  id: number;
  username: string;
  realName: string;
  avatar: string;
  roles: string[];
}
