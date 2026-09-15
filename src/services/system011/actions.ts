/**
 * system011 各模块 action 路径常量
 * 统一 action 路径 = 后端真实路径：/klsjnh/system011/{julyXxx}/v1/{动作}
 * 禁止在 store / 页面里再写分散的旧路径。
 */
export const SYSTEM011_ACTIONS = {
  user: {
    login: '/julyUser/v1/login',
    loginByUserName: '/julyUser/v1/loginByUserName',
    logout: '/julyUser/v1/logout',
    selectListByPage: '/julyUser/v1/selectListByPage',
    getById: '/julyUser/v1/getById',
    insert: '/julyUser/v1/insert',
    update: '/julyUser/v1/update',
    logicDelete: '/julyUser/v1/logicDelete',
    resetPassword: '/julyUser/v1/resetPassword',
    changePassword: '/julyUser/v1/changePassword',
    assignRoles: '/julyUser/v1/assignRoles',
  },
  userAudit: {
    selectListByPage: '/julyUserAudit/v1/selectListByPage',
  },
  menu: {
    selectUserMenuTree: '/julyMenu/v1/selectUserMenuTree',
    selectTree: '/julyMenu/v1/selectTree',
    selectListByPage: '/julyMenu/v1/selectListByPage',
    insert: '/julyMenu/v1/insert',
    update: '/julyMenu/v1/update',
    logicDelete: '/julyMenu/v1/logicDelete',
  },
  role: {
    selectListByPage: '/julyRole/v1/selectListByPage',
    insert: '/julyRole/v1/insert',
    update: '/julyRole/v1/update',
    logicDelete: '/julyRole/v1/logicDelete',
    assignMenus: '/julyRole/v1/assignMenus',
  },
  // ⚠️ 无 julyRoleUser 资源：后端（java17-web011）没有 JulyRoleUserController，
  // 角色↔用户的关联只能通过 julyUser/v1/assignRoles（用户 → 角色，整存替换）维护。
  organization: {
    selectListByPage: '/julyOrganization/v1/selectListByPage',
    selectTree: '/julyOrganization/v1/selectTree',
    getById: '/julyOrganization/v1/getById',
    insert: '/julyOrganization/v1/insert',
    update: '/julyOrganization/v1/update',
    logicDelete: '/julyOrganization/v1/logicDelete',
  },
  config: {
    selectListByPage: '/julyConfig/v1/selectListByPage',
    getById: '/julyConfig/v1/getById',
    insert: '/julyConfig/v1/insert',
    update: '/julyConfig/v1/update',
    logicDelete: '/julyConfig/v1/logicDelete',
  },
  scheduler: {
    selectListByPage: '/julyScheduler/v1/selectListByPage',
    getById: '/julyScheduler/v1/getById',
    insert: '/julyScheduler/v1/insert',
    update: '/julyScheduler/v1/update',
    logicDelete: '/julyScheduler/v1/logicDelete',
    start: '/julyScheduler/v1/start',
    stop: '/julyScheduler/v1/stop',
    runOnce: '/julyScheduler/v1/runOnce',
  },
  exportData: '/export/v1',
} as const;
