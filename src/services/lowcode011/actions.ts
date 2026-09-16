/**
 * lowcode011 模块 action 路径常量。
 * 与后端控制器前缀一致：/klsjnh/lowcode011/julyMetadata/v1/*。
 * 调用 api.post/get 时通过 baseOverride 传 '/klsjnh/lowcode011'，
 * 因此此处 action 只写相对路径（与 mock 分发 key 完全一致）。
 */
export const LOWCODE011_ACTIONS = {
  metadata: {
    getById: '/julyMetadata/v1/getById',
    getByObjectName: '/julyMetadata/v1/getByObjectName',
    selectListByPage: '/julyMetadata/v1/selectListByPage',
    insert: '/julyMetadata/v1/insert',
    update: '/julyMetadata/v1/update',
    logicDelete: '/julyMetadata/v1/logicDelete',
    logicDeleteBatch: '/julyMetadata/v1/logicDeleteBatch',
  },
} as const;
