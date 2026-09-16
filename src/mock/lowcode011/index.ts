/** 统一 Mock 后端出口（lowcode011）：聚合各子模块 handler */
import { handlers as julyMetadataHandlers } from '@/mock/lowcode011/julyMetadata';

export const handlers: Record<string, import('@/mock/system011/common').Handler> = {
  ...julyMetadataHandlers,
};
