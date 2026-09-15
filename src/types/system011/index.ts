/**
 * system011 契约类型出口（按后端模块分层）
 * 来源：docs/swagger-api-docs.json（OpenAPI 3.1.0，springdoc）
 * 路径固定：POST /klsjnh/system011/{julyXxx}/v1/{动作}
 * 响应信封：Response011<T> = { statusCode, message, errorMessage, timestamp, traceId, data }
 * 
 * 结构：每个模块一个目录 src/types/system011/<module>/
 *   - vo.ts：后端契约类型（DTO/VO，与 swagger 一一对应）
 *   - view.ts：前端 UI 视图类型（表格行、store 状态、表单值等）
 *   - index.ts：出口
 */
export * from '@/types/common';
export * from '@/types/system011/julyUser';
export * from '@/types/system011/julyUserAudit';
export * from '@/types/system011/julyRole';
export * from '@/types/system011/julyMenu';
export * from '@/types/system011/julyOrganization';
export * from '@/types/system011/julyConfig';
export * from '@/types/system011/julyScheduler';
export * from '@/types/system011/julyDictionary';
export * from '@/types/system011/export';
