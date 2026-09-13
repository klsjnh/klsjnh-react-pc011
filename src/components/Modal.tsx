/** 通用弹窗（封装 antd Modal，保留原调用方式：条件渲染 + onSave 可选） */
import React from 'react';
import { Modal as AntModal } from 'antd';
import type { ModalProps } from '@/types/view/components';

export const Modal: React.FC<ModalProps> = ({ title, onClose, onSave, saveDisabled, width, children }) => (
  <AntModal
    open
    title={title}
    width={width}
    onCancel={onClose}
    onOk={onSave}
    okButtonProps={{ disabled: saveDisabled }}
    confirmLoading={saveDisabled}
    footer={onSave ? undefined : null}
    destroyOnClose
  >
    {children}
  </AntModal>
);
