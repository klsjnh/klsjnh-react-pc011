/**
 * 出站 store（messageCenter · outbound）
 * 三段状态：templates / channels / messages，各自分页 + 查询条件 + loading。
 * 只存状态；拉取与 CRUD 编排在 services/messageCenter/julyOutbound*Service（page 调）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type {
  JulyOutboundTemplateVo011, JulyOutboundTemplateQueryVo011,
  JulyOutboundChannelVo011, JulyOutboundChannelQueryVo011,
  JulyOutboundMessageVo011, JulyOutboundMessageQueryVo011,
} from '@/types/messageCenter';

export interface OutboundState {
  templates: JulyOutboundTemplateVo011[];
  templateTotal: number;
  templateTotalPages: number;
  templateQuery: JulyOutboundTemplateQueryVo011;
  channels: JulyOutboundChannelVo011[];
  channelTotal: number;
  channelQuery: JulyOutboundChannelQueryVo011;
  messages: JulyOutboundMessageVo011[];
  messageTotal: number;
  messageTotalPages: number;
  messageQuery: JulyOutboundMessageQueryVo011;
}

const base = createStore<OutboundState>({
  templates: [], templateTotal: 0, templateTotalPages: 1,
  templateQuery: { pageIndex: 1, pageSize: 10 },
  channels: [], channelTotal: 0,
  channelQuery: { pageIndex: 1, pageSize: 10 },
  messages: [], messageTotal: 0, messageTotalPages: 1,
  messageQuery: { pageIndex: 1, pageSize: 10 },
});

export const outboundStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,

  setTemplates: (payload: { rows: JulyOutboundTemplateVo011[]; total: number; totalPages: number }) => {
    base.setState({ templates: payload.rows, templateTotal: payload.total, templateTotalPages: payload.totalPages });
  },
  patchTemplateQuery: (patch: Partial<JulyOutboundTemplateQueryVo011>) => {
    base.setState({ templateQuery: { ...base.getSnapshot().templateQuery, ...patch } });
  },

  setChannels: (payload: { rows: JulyOutboundChannelVo011[]; total: number }) => {
    base.setState({ channels: payload.rows, channelTotal: payload.total });
  },
  patchChannelQuery: (patch: Partial<JulyOutboundChannelQueryVo011>) => {
    base.setState({ channelQuery: { ...base.getSnapshot().channelQuery, ...patch } });
  },

  setMessages: (payload: { rows: JulyOutboundMessageVo011[]; total: number; totalPages: number }) => {
    base.setState({ messages: payload.rows, messageTotal: payload.total, messageTotalPages: payload.totalPages });
  },
  patchMessageQuery: (patch: Partial<JulyOutboundMessageQueryVo011>) => {
    base.setState({ messageQuery: { ...base.getSnapshot().messageQuery, ...patch } });
  },
};

export function useOutboundState(): OutboundState {
  return useStoreState(base);
}
