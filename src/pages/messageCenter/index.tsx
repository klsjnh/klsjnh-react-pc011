/**
 * 消息中心（messageCenter）
 * 出入两套 × 三资源：出站（模板 / 通道 / 消息）· 入站（模板 / 通道 / 消息）。
 * pane 切换只渲染当前视图（与存储中心一致）：保证表格高度实测准确，也避免隐藏面板串数据。
 * 层级：page（本文件 + *Pane）→ service（messageCenter/*）→ store（outbound/inbound）。
 */
import React, { useState } from 'react';
import { Segmented, Tabs } from 'antd';
import { TemplatePane } from '@/pages/messageCenter/TemplatePane';
import { ChannelPane } from '@/pages/messageCenter/ChannelPane';
import { OutboundMessagePane } from '@/pages/messageCenter/OutboundMessagePane';
import { InboundMessagePane } from '@/pages/messageCenter/InboundMessagePane';

type Direction = 'outbound' | 'inbound';
type Pane = 'template' | 'channel' | 'message';

const PANE_LABELS: Record<Pane, string> = {
  template: '模板',
  channel: '通道',
  message: '消息记录',
};

export const MessageCenter = () => {
  // pane 状态提升到本层：出入两个方向各自记住上次看的 pane（切 Tab 不丢失）
  const [direction, setDirection] = useState<Direction>('outbound');
  const [panes, setPanes] = useState<Record<Direction, Pane>>({
    outbound: 'template',
    inbound: 'template',
  });

  const pane = panes[direction];

  const renderPane = () => {
    if (pane === 'template') return <TemplatePane direction={direction} />;
    if (pane === 'channel') return <ChannelPane direction={direction} />;
    return direction === 'outbound'
      ? <OutboundMessagePane />
      : <InboundMessagePane />;
  };

  return (
    <div className="page-fill" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Tabs
        activeKey={direction}
        onChange={(k) => setDirection(k as Direction)}
        items={[
          { key: 'outbound', label: '出站消息' },
          { key: 'inbound', label: '入站消息' },
        ]}
      />
      <Segmented
        value={pane}
        onChange={(v) => setPanes((p) => ({ ...p, [direction]: v as Pane }))}
        options={(Object.keys(PANE_LABELS) as Pane[]).map((k) => ({ label: PANE_LABELS[k], value: k }))}
      />
      <div key={`${direction}-${pane}`} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {renderPane()}
      </div>
    </div>
  );
};

export default MessageCenter;
