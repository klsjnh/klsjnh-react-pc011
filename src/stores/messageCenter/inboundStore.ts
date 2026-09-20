/**
 * 入站 store（messageCenter · inbound）
 * 三段状态：templates / channels / messages，与 outboundStore 对称。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type {
  JulyInboundTemplateVo011, JulyInboundTemplateQueryVo011,
  JulyInboundChannelVo011, JulyInboundChannelQueryVo011,
  JulyInboundMessageVo011, JulyInboundMessageQueryVo011,
} from '@/types/messageCenter';

export interface InboundState {
  templates: JulyInboundTemplateVo011[];
  templateTotal: number;
  templateTotalPages: number;
  templateQuery: JulyInboundTemplateQueryVo011;
  channels: JulyInboundChannelVo011[];
  channelTotal: number;
  channelQuery: JulyInboundChannelQueryVo011;
  messages: JulyInboundMessageVo011[];
  messageTotal: number;
  messageTotalPages: number;
  messageQuery: JulyInboundMessageQueryVo011;
}

const base = createStore<InboundState>({
  templates: [], templateTotal: 0, templateTotalPages: 1,
  templateQuery: { pageIndex: 1, pageSize: 10 },
  channels: [], channelTotal: 0,
  channelQuery: { pageIndex: 1, pageSize: 10 },
  messages: [], messageTotal: 0, messageTotalPages: 1,
  messageQuery: { pageIndex: 1, pageSize: 10 },
});

export const inboundStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,

  setTemplates: (payload: { rows: JulyInboundTemplateVo011[]; total: number; totalPages: number }) => {
    base.setState({ templates: payload.rows, templateTotal: payload.total, templateTotalPages: payload.totalPages });
  },
  patchTemplateQuery: (patch: Partial<JulyInboundTemplateQueryVo011>) => {
    base.setState({ templateQuery: { ...base.getSnapshot().templateQuery, ...patch } });
  },

  setChannels: (payload: { rows: JulyInboundChannelVo011[]; total: number }) => {
    base.setState({ channels: payload.rows, channelTotal: payload.total });
  },
  patchChannelQuery: (patch: Partial<JulyInboundChannelQueryVo011>) => {
    base.setState({ channelQuery: { ...base.getSnapshot().channelQuery, ...patch } });
  },

  setMessages: (payload: { rows: JulyInboundMessageVo011[]; total: number; totalPages: number }) => {
    base.setState({ messages: payload.rows, messageTotal: payload.total, messageTotalPages: payload.totalPages });
  },
  patchMessageQuery: (patch: Partial<JulyInboundMessageQueryVo011>) => {
    base.setState({ messageQuery: { ...base.getSnapshot().messageQuery, ...patch } });
  },
};

export function useInboundState(): InboundState {
  return useStoreState(base);
}
