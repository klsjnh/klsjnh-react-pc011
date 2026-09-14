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
export * from '../common';
export * from './julyUser';
export * from './julyUserAudit';
export * from './julyRole';
export * from './julyMenu';
export * from './julyOrganization';
export * from './julyConfig';
export * from './julyScheduler';
export * from './export';
