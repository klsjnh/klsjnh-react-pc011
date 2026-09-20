/**
 * system011 各模块 action 路径常量
 * 统一 action 路径 = 相对路径：{julyXxx}/v1/{动作}
 * 前端请求 URL = apiBaseUrl（默认 /klsjnh/system011）+ action
 * 禁止在 action 中重复写 /klsjnh/system011 前缀，否则 URL 会重复。
 *
 * ⚠️ 2026-09-20 后端换版（192.168.3.160:11160）：user / role / userAudit 三类
 * 从 system011 迁到 iam 模块（iam => julyUser/v1, julyRole/v1, julyUserAudit/v1）。
 * 这三组的调用点统一传 baseOverride = IAM_BASE（样板见 storage011 / ai011）。
 * system011 内其余资源（menu / organization / config / scheduler / dictionary）不变。
 */
export const IAM_BASE = '/klsjnh/iam';

export const SYSTEM011_ACTIONS = {
  user: {
    // iam 模块（2026-09-20 后端换版）：调用需传 baseOverride = IAM_BASE
    login: '/julyUser/v1/login',
    loginByUserName: '/julyUser/v1/loginByUserName',
    logout: '/julyUser/v1/logout',
    selectListByPage: '/julyUser/v1/selectListByPage',
    getById: '/julyUser/v1/getById',
    insert: '/julyUser/v1/insert',
    update: '/julyUser/v1/update',
    logicDelete: '/julyUser/v1/logicDelete',
    logicDeleteBatch: '/julyUser/v1/logicDeleteBatch',
    resetPassword: '/julyUser/v1/resetPassword',
    changePassword: '/julyUser/v1/changePassword',
    assignRoles: '/julyUser/v1/assignRoles',
    export: '/julyUser/v1/export',
    backup011: '/julyUser/v1/backup011',
  },
  userAudit: {
    // iam 模块（2026-09-20 后端换版）：调用需传 baseOverride = IAM_BASE
    selectListByPage: '/julyUserAudit/v1/selectListByPage',
  },
  menu: {
    // 注意：接口名已变（后端新版本）selectUserMenuTree→getUserMenuTree、selectTree→getTree
    selectUserMenuTree: '/julyMenu/v1/getUserMenuTree',
    selectTree: '/julyMenu/v1/getTree',
    selectListByPage: '/julyMenu/v1/selectListByPage',
    insert: '/julyMenu/v1/insert',
    update: '/julyMenu/v1/update',
    logicDelete: '/julyMenu/v1/logicDelete',
    logicDeleteBatch: '/julyMenu/v1/logicDeleteBatch',
    export: '/julyMenu/v1/export',
    backup011: '/julyMenu/v1/backup011',
    getById: '/julyMenu/v1/getById',
  },
  role: {
    // iam 模块（2026-09-20 后端换版）：调用需传 baseOverride = IAM_BASE
    selectListByPage: '/julyRole/v1/selectListByPage',
    insert: '/julyRole/v1/insert',
    update: '/julyRole/v1/update',
    logicDelete: '/julyRole/v1/logicDelete',
    assignMenus: '/julyRole/v1/assignMenus',
    getById: '/julyRole/v1/getById',
    getMenusByRole: '/julyRole/v1/getMenusByRole',
    getUsersByRole: '/julyRole/v1/getUsersByRole',
    export: '/julyRole/v1/export',
    backup011: '/julyRole/v1/backup011',
  },
  // ⚠️ 无 julyRoleUser 资源：后端（java17-web011）没有 JulyRoleUserController，
  // 角色↔用户的关联只能通过 julyUser/v1/assignRoles（用户 → 角色，整存替换）维护。
  organization: {
    selectListByPage: '/julyOrganization/v1/selectListByPage',
    selectTree: '/julyOrganization/v1/getTree',
    getById: '/julyOrganization/v1/getById',
    insert: '/julyOrganization/v1/insert',
    update: '/julyOrganization/v1/update',
    logicDelete: '/julyOrganization/v1/logicDelete',
    export: '/julyOrganization/v1/export',
    backup011: '/julyOrganization/v1/backup011',
  },
  config: {
    selectListByPage: '/julyConfig/v1/selectListByPage',
    getById: '/julyConfig/v1/getById',
    insert: '/julyConfig/v1/insert',
    update: '/julyConfig/v1/update',
    logicDelete: '/julyConfig/v1/logicDelete',
    export: '/julyConfig/v1/export',
    backup011: '/julyConfig/v1/backup011',
  },
  scheduler: {
    selectListByPage: '/julyScheduler/v1/selectListByPage',
    getById: '/julyScheduler/v1/getById',
    insert: '/julyScheduler/v1/insert',
    update: '/julyScheduler/v1/update',
    logicDelete: '/julyScheduler/v1/logicDelete',
    logicDeleteBatch: '/julyScheduler/v1/logicDeleteBatch',
    start: '/julyScheduler/v1/start',
    stop: '/julyScheduler/v1/stop',
    runOnce: '/julyScheduler/v1/runOnce',
  },
  dictionary: {
    insert: '/julyDictionary/v1/insert',
    update: '/julyDictionary/v1/update',
    logicDelete: '/julyDictionary/v1/logicDelete',
    getById: '/julyDictionary/v1/getById',
    selectListByPage: '/julyDictionary/v1/selectListByPage',
    insertItem: '/julyDictionary/v1/insertItem',
    updateItem: '/julyDictionary/v1/updateItem',
    logicDeleteItem: '/julyDictionary/v1/logicDeleteItem',
    selectItemListByType: '/julyDictionary/v1/selectItemListByType',
  },
  exportData: '/export/v1',
} as const;