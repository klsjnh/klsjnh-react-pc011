/** 通用组件 Props 类型 */
import type { NodeId, OrgTreeNode } from '@/types/view/common';
import type { TransferUser } from '@/types/view/transfer';

export interface UserTransferModalProps {
  title: string;
  orgTree: OrgTreeNode[];
  allUsers: TransferUser[];
  excludedUserIds: NodeId[];
  onConfirm: (userIds: NodeId[]) => void;
  onCancel: () => void;
}
