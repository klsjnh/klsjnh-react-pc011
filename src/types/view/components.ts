/** 通用组件 Props 类型 */
import type React from 'react';
import type { NodeId, OrgTreeNode } from './common';
import type { TransferUser } from './transfer';

export interface ModalProps {
  title: string;
  onClose: () => void;
  /** 传了才显示底部「确定」按钮 */
  onSave?: () => void;
  saveDisabled?: boolean;
  width?: number;
  children: React.ReactNode;
}

export interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface UserTransferModalProps {
  title: string;
  orgTree: OrgTreeNode[];
  allUsers: TransferUser[];
  excludedUserIds: NodeId[];
  onConfirm: (userIds: NodeId[]) => void;
  onCancel: () => void;
}
