/** 通用弹窗容器（modal-overlay / modal-container 约定类） */
import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  /** 传了才渲染底部「取消 / 保存」 */
  onSave?: () => void;
  saveDisabled?: boolean;
  width?: number;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, onSave, saveDisabled, width, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-container" style={width ? { width } : undefined} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">{children}</div>
      {onSave && (
        <div className="modal-footer">
          <button className="btn btn-default" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saveDisabled}>保存</button>
        </div>
      )}
    </div>
  </div>
);
