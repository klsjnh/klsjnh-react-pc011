/**
 * 认证状态管理
 * 迁移至 zustand，保留原有 API 表面（login / loginWithApi / loginByUserNameApi / logout / isAuthenticated）。
 */
import { useStore } from 'zustand';
import { isMockMode } from '@/config/appConfig';
import { login as apiLogin, loginByUserName as apiLoginByUserName, logout as apiLogout } from '@/services/system011';
import { createStore } from '@/stores/createStore';
import type { AuthState, CurrentUser } from '@/types/view/auth';

export type { CurrentUser };

const base = createStore<AuthState>({
  token: localStorage.getItem('token'),
  user: null,
});

/** 订阅 token 变化 → 同步 localStorage */
base.subscribe((state) => {
  const token = state.token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
});

export const authStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,

  /** Mock 态登录（由 LoginPage 本地校验后调用） */
  login: (token: string, user: CurrentUser) => {
    base.setState({ token, user });
  },

  /**
   * API 态【账号密码】登录：调用后端 julyUser/v1/login，把会话映射为 CurrentUser。
   * 任何运行态可用（生产/开发通用）。
   */
  loginWithApi: async (userAccount: string, password: string): Promise<CurrentUser> => {
    const session = await apiLogin(userAccount, password);
    const user: CurrentUser = {
      id: 0,
      username: session.userAccount,
      realName: session.userName,
      avatar: '',
      roles: session.roles || [],
    };
    base.setState({ token: session.token, user });
    return user;
  },

  /**
   * API 态【免密】登录：调用后端 julyUser/v1/loginByUserName（仅填用户名）。
   * 仅 development 运行态可用；production 后端会拒绝。调用方需先判断 isDevelopment()。
   */
  loginByUserNameApi: async (userAccount: string): Promise<CurrentUser> => {
    const session = await apiLoginByUserName(userAccount);
    const user: CurrentUser = {
      id: 0,
      username: session.userAccount,
      realName: session.userName,
      avatar: '',
      roles: session.roles || [],
    };
    base.setState({ token: session.token, user });
    return user;
  },

  /** 登出：API 态通知后端（失败不影响本地清理），随后清 token */
  logout: async () => {
    if (!isMockMode() && base.getSnapshot().token) {
      try { await apiLogout(); } catch { /* 后端登出失败仍清本地 */ }
    }
    base.setState({ token: null, user: null });
  },

  isAuthenticated: () => !!base.getSnapshot().token,
};

/** 认证状态（全量订阅） */
export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  return useStore(base.api, selector);
}

export function useCurrentUser(): CurrentUser | null {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => !!s.token);
}
