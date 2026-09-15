/**
 * 测试连接反馈展示组件（TestFeedbackAlert）
 * 三行结构（参照老前端）：
 *   1. 结果 message
 *   2. 耗时
 *   3. 数据库产品 / 版本
 * 供数据源等需要「测试连接」的模块复用。
 */
import React from 'react';
import { Alert } from 'antd';
import './TestFeedbackAlert.css';

/** 测试连接反馈数据（由调用方组装） */
export interface TestFeedback {
  ok: boolean;
  message: string;
  elapsedMs?: number;
  databaseProduct?: string | null;
  databaseVersion?: string | null;
}

interface TestFeedbackAlertProps {
  data: TestFeedback;
  /** 与下方内容之间的间距（默认 12px）；传 0 可用现有布局控制 */
  marginBottom?: number;
}

export function TestFeedbackAlert({ data, marginBottom = 12 }: TestFeedbackAlertProps) {
  const timing = data.elapsedMs != null
    ? data.elapsedMs < 1000 ? `${data.elapsedMs}ms` : `${(data.elapsedMs / 1000).toFixed(2)}s`
    : '';
  const db = data.databaseProduct ? `数据库：${data.databaseProduct}` : '';
  const version = data.databaseVersion ? `版本：${data.databaseVersion}` : '';
  return (
    <Alert
      type={data.ok ? 'success' : 'error'}
      showIcon
      closable
      className="test-feedback"
      style={{ marginBottom }}
      message={data.ok ? '连接成功' : '连接失败'}
      description={
        <div className="test-feedback-lines">
          <div className="tf-msg">{data.message || (data.ok ? '连接成功' : '连接失败')}</div>
          {timing && <div className="tf-timing">耗时：{timing}</div>}
          {(db || version) && (
            <div className="tf-db">
              {db && <div className="tf-db-line">{db}</div>}
              {version && <div className="tf-db-line">{version}</div>}
            </div>
          )}
        </div>
      }
    />
  );
}

export default TestFeedbackAlert;