/**
 * 认证状态管理
 */
import { useSyncExternalStore } from 'react';
import { isMockMode } from '../config/appConfig';
import { login as apiLogin, loginByUserName as apiLoginByUserName, logout as apiLogout } from '../services/system011';
import type { JulyUserSessionVo011 } from '../types/system011';

export interface CurrentUser {
  id: number;
  username: string;
  realName: string;
  avatar: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'pc011-user';

/** 从 localStorage 恢复当前用户（刷新后保持登录态信息） */
function loadStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

/** 持久化当前用户信息（登录后缓存到本地） */
function persistUser(user: CurrentUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

let state: AuthState = {
  token: localStorage.getItem(TOKEN_KEY),
  user: loadStoredUser(),
};

const listeners = new Set<() => void>();

function getSnapshot(): AuthState {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((l) => l());
}

export const authStore = {
  getSnapshot,
  subscribe,

  /** Mock 态登录（由 LoginPage 本地校验后调用） */
  login: (token: string, user: CurrentUser) => {
    state = { ...state, token, user };
    if (token) localStorage.setItem(TOKEN_KEY, token);
    persistUser(user);
    emitChange();
  },

  /**
   * API 态【账号密码】登录：调用后端 julyUser/v1/login，把会话映射为 CurrentUser。
   * 任何运行态可用（生产/开发通用）。
   */
  loginWithApi: async (userAccount: string, password: string): Promise<CurrentUser> => {
    const session: JulyUserSessionVo011 = await apiLogin(userAccount, password);
    const user: CurrentUser = {
      id: 0,
      username: session.userAccount,
      realName: session.userName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.userAccount}`,
      roles: session.roles || [],
    };
    state = { ...state, token: session.token, user };
    localStorage.setItem(TOKEN_KEY, session.token);
    persistUser(user);
    emitChange();
    return user;
  },

  /**
   * API 态【免密】登录：调用后端 julyUser/v1/loginByUserName（仅填用户名）。
   * 仅 development 运行态可用；production 后端会拒绝。调用方需先判断 isDevelopment()。
   */
  loginByUserNameApi: async (userAccount: string): Promise<CurrentUser> => {
    const session: JulyUserSessionVo011 = await apiLoginByUserName(userAccount);
    const user: CurrentUser = {
      id: 0,
      username: session.userAccount,
      realName: session.userName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.userAccount}`,
      roles: session.roles || [],
    };
    state = { ...state, token: session.token, user };
    localStorage.setItem(TOKEN_KEY, session.token);
    persistUser(user);
    emitChange();
    return user;
  },

  /** 登出：API 态通知后端（失败不影响本地清理），随后清 token 与缓存用户 */
  logout: async () => {
    if (!isMockMode() && state.token) {
      try { await apiLogout(); } catch { /* 后端登出失败仍清本地 */ }
    }
    state = { token: null, user: null };
    localStorage.removeItem(TOKEN_KEY);
    persistUser(null);
    emitChange();
  },
  isAuthenticated: () => !!state.token,
};

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()));
}

export function useCurrentUser(): CurrentUser | null {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => !!s.token);
}
