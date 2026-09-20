/**
 * 全局配置（globals）—— 应用级配置的单一真源（成长中）
 *
 * 接管路线（自上而下逐步迁移，迁移期间 appConfig.ts 原样运行不受影响）：
 *   第一步（当前）：静态默认值与开关落这里（DEFAULT_DATA_MODE / DICTIONARY_CACHE_ENABLED），
 *                   新代码一律只依赖 globals，不再依赖 appConfig
 *   后续：appConfig 的职责（运行时数据模式 / 运行态 / API 地址 / localStorage 持久化）
 *         逐步搬入本文件，appConfig 退化为薄壳直至移除
 *
 * 定位边界（迁移完成前）：
 *   - globals：静态配置（默认值 / 开关，改代码才变）+ 逐步吸收的运行时配置
 *   - appConfig：存量运行时状态（顶栏切换 / localStorage），只减不增
 *   - constants：枚举选项类常量（MENU_TYPE_OPTIONS 等），维持不动
 */
import type { DataMode } from '@/types/view/appConfig';

/**
 * 初始数据模式：localStorage 与 VITE_DATA_MODE 均未设置时的兜底默认值。
 * 运行时切换仍由 appConfig 承担（接管前），本值仅决定「出厂默认」。
 */
export const DEFAULT_DATA_MODE: DataMode = 'mock';

/**
 * 字典下拉（KlsjnhSelect021）是否启用本地缓存：
 *   - false（当前）= 每次挂载都走接口拉取，数据最新鲜
 *   - true  = 同一 dictionaryCode 复用请求结果（**未实装**）
 * 启用前需先设计缓存失效策略（字典管理改动后如何感知），以后再说。
 */
export const DICTIONARY_CACHE_ENABLED = false;

/**
 * 侧边栏菜单数据源（API 模式生效；mock 模式两个接口返回同一份数据，无差别）：
 *   - 'all'（当前）= getTree 全量树 —— 后端 RBAC 授权数据未就绪时兜底：
 *     账号无角色 / 无菜单授权时 getUserMenuTree 返回空数组，侧边栏会整个空白，
 *     联调期先用全量树保证菜单可见（⚠️ 此时导航不按权限过滤，仅限联调）
 *   - 'rbac' = getUserMenuTree 按授权过滤的当前登录人树 —— 正式口径；
 *     后端授权数据就绪（角色 assignMenus + 用户 assignRoles）后必须切回
 */
export const NAV_MENU_SOURCE: 'all' | 'rbac' = 'all';
