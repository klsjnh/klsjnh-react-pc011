/**
 * 低代码「运行时」服务 —— 业务对象数据页（按元数据动态渲染列表 / 表单 / 查询）
 *
 * ★ **分流矩阵**（用户口径：接口有的对上，没有的说明是 mock）
 *
 *   | 能力 | 来源 | 说明 |
 *   |------|------|------|
 *   | 对象元数据（字段 / 显示列 / 服务开关） | ✅ 真实接口 | `lowcode011/julyMetadata/v1/getByObjectName` |
 *   | 数据分页 / 新增 / 修改 / 删除 | ⚠️ PENDING-BACKEND | 见下 |
 *
 * 数据 CRUD 为何是占位：老项目打 `/klsjnh/runtime/{objectName}/*`
 * （老 `services/july011/runtimeCrud.ts`），新后端**无此端点**；
 * docs 038「本期只做 CRUD（不生成物理表 / 代码 / 页面）」把 runtime 划在边界外。
 * 占位实现见 `src/mock/lowcode011/pendingRuntime.ts`（内存态，刷新即重置）。
 *
 * 后端补齐后：把本文件 4 个 `pending*` 调用换成
 * `api.post('/runtime/{objectName}/selectListByPage', ...)`（base 另传 `/klsjnh`）即可，页面无需改动。
 */
import {
  pendingRuntimeDelete, pendingRuntimeInsert, pendingRuntimePage, pendingRuntimeUpdate,
} from '@/mock/lowcode011/pendingRuntime';
import { getMetadataByObjectName } from '@/services/lowcode011/julyMetadataService';
import type { PageResult011 } from '@/types/common';
import type { JulyMetadataVo011 } from '@/types/lowcode011';

/** 运行时数据行（后端动态对象，无固定结构，字段随元数据变化） */
export type RuntimeRow = Record<string, unknown>;

/** 运行时查询条件 */
export interface RuntimePageQuery {
  pageIndex?: number;
  pageSize?: number;
  /** 关键字（跨列模糊，仅占位实现支持） */
  keyword?: string;
  /** 按列查询条件（eq 精确 / like 模糊） */
  filters?: { field: string; op: string; value: unknown }[];
}

/** 读取对象元数据（**真实接口**）—— 列 / 表单 / 查询区 / 服务开关均由此派生 */
export function getRuntimeMeta(objectName: string): Promise<JulyMetadataVo011> {
  return getMetadataByObjectName(objectName);
}

/** 分页查询（PENDING-BACKEND） */
export function pageRuntime(objectName: string, query: RuntimePageQuery = {}): Promise<PageResult011<RuntimeRow>> {
  return pendingRuntimePage(objectName, query);
}

/** 新增（PENDING-BACKEND） */
export function insertRuntime(objectName: string, data: RuntimeRow): Promise<string> {
  return pendingRuntimeInsert(objectName, data);
}

/** 修改（PENDING-BACKEND） */
export function updateRuntime(objectName: string, data: RuntimeRow): Promise<void> {
  return pendingRuntimeUpdate(objectName, data);
}

/** 逻辑删除（PENDING-BACKEND） */
export function deleteRuntime(objectName: string, id: string): Promise<void> {
  return pendingRuntimeDelete(objectName, id);
}
