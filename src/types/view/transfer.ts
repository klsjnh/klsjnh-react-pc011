/** 用户穿梭框 UI 类型 */
import type { NodeId } from './common';

export interface TransferUser {
  id: NodeId;
  username: string;
  realName: string;
  department: string;
  departmentId: NodeId;
}
