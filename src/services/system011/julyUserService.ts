/**
 * 用户服务（julyUser/v1/*）
 * 注意（运行态区分，来自 Swagger 标注）：
 *  - login          账号密码登录，任何环境可用（生产/开发通用）
 *  - loginByUserName 免密登录，仅 debug / development 运行态（生产拒用）
 *  - logout         登出（客户端清除 token）
 * ⚠️ 2026-09-20 后端换版（192.168.3.160:11160）：user 全部迁到 iam 模块，
 * 统一传 baseOverride = IAM_BASE（'/klsjnh/iam'）。
 */
import { api } from '@/api/request';
import { IAM_BASE, SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { julyUserStore } from '@/stores/system011/julyUserStore';
import { downloadExportResult } from '@/utils/system011/exportFile';
import type {
  JulyUserLoginVo011,
  JulyUserLoginByNameVo011,
  JulyUserSessionVo011,
  JulyUserVo011,
  JulyUserQueryVo011,
  JulyUserInsertVo011,
  JulyUserUpdateVo011,
  JulyUserAssignRolesVo011,
  SaveUserParams,
  PageResult011,
  IdVo011,
  IdsVo011,
  ExportResult011,
  BackupResult011,
  BatchDeleteResultVo011,
} from '@/types/system011';

export type { SaveUserParams };

/** 账号密码登录（任何运行态可用） */
export function login(userAccount: string, password: string): Promise<JulyUserSessionVo011> {
  return api.post<JulyUserSessionVo011>(SYSTEM011_ACTIONS.user.login, { userAccount, password } as JulyUserLoginVo011, IAM_BASE);
}

/** 免密登录（仅 debug / development 运行态；生产后端会拒绝） */
export function loginByUserName(userAccount: string): Promise<JulyUserSessionVo011> {
  return api.post<JulyUserSessionVo011>(SYSTEM011_ACTIONS.user.loginByUserName, { userAccount } as JulyUserLoginByNameVo011, IAM_BASE);
}

/** 登出 */
export function logout(): Promise<void> {
  return api.post<void>(SYSTEM011_ACTIONS.user.logout, {}, IAM_BASE);
}

/** 本人修改密码（验旧密） */
export function changePassword(params: {
  userAccount: string;
  oldPassword: string;
  newPassword: string;
}): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.user.changePassword, params, IAM_BASE);
}

/** 用户分页查询 */
export function selectUserListByPage(body: object = {}): Promise<PageResult011<JulyUserVo011>> {
  return api.post<PageResult011<JulyUserVo011>>(SYSTEM011_ACTIONS.user.selectListByPage, body, IAM_BASE);
}

// ==================== 业务编排（写 store 状态） ====================

/** 拉取用户分页并写入 store（patch 与当前查询合并） */
export async function fetchUserPage(patch: Partial<JulyUserQueryVo011> = {}): Promise<void> {
  const query = { ...julyUserStore.getSnapshot().query, ...patch } as JulyUserQueryVo011;
  julyUserStore.setState({ loading: true, query });
  try {
    const res = await selectUserListByPage(query);
    julyUserStore.setState({
      list: res.rows || [],
      total: res.total || 0,
      totalPages: res.totalPages || 1,
      loading: false,
    });
  } catch {
    julyUserStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 新增 / 修改用户 + 分配角色，成功后刷新列表（返回用户 id） */
export async function saveUser(params: SaveUserParams): Promise<string> {
  const { id, userAccount, userName, password, mobile, email, pkOrg, status, roleIds = [] } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(SYSTEM011_ACTIONS.user.update, { id, userName, mobile, email, pkOrg, status } as JulyUserUpdateVo011, IAM_BASE)
    : await api.post<IdVo011>(SYSTEM011_ACTIONS.user.insert, {
        userAccount,
        userName,
        password: password || '',
        mobile,
        email,
        pkOrg,
        status,
      } as JulyUserInsertVo011, IAM_BASE);

  if (roleIds.length > 0) {
    await api.post<IdVo011>(SYSTEM011_ACTIONS.user.assignRoles, { id: savedId, pkRoles: roleIds } as JulyUserAssignRolesVo011, IAM_BASE);
  }
  const q = julyUserStore.getSnapshot().query;
  await fetchUserPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/**
 * 导出全部用户（POST /julyUser/v1/export）并按 json/csv 触发浏览器下载。
 * 拆包 / 序列化 / 下载细节收敛在 `@/utils/system011/exportFile`，页面只需调用并反馈结果。
 */
export async function exportUsers(format: 'json' | 'csv' = 'csv'): Promise<{ objectCode: string; rowCount: number }> {
  const res = await api.post<ExportResult011>(SYSTEM011_ACTIONS.user.export, {}, IAM_BASE);
  return downloadExportResult(res, format, 'julyUser');
}

/** 备份全部用户到存储中心（POST /julyUser/v1/backup011，无 body，返回 object key） */
export function backupUser011(): Promise<BackupResult011> {
  return api.post<BackupResult011>(SYSTEM011_ACTIONS.user.backup011, {}, IAM_BASE);
}

/**
 * 批量逻辑删除（POST /julyUser/v1/logicDeleteBatch，body 为 { ids: [...] }）
 * 删除成功后内部刷新当前分页列表（dataSource 从 store 同步），返回删除汇总。
 */
export async function removeUsers(ids: string[]): Promise<BatchDeleteResultVo011> {
  const res = await api.post<BatchDeleteResultVo011>(SYSTEM011_ACTIONS.user.logicDeleteBatch, { ids } as IdsVo011, IAM_BASE);
  await fetchUserPage();
  return res;
}
