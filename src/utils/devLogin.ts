/**
 * Dev shortcut（对齐老项目 klsjnh-react-java8-dev011/src/util/devLogin.ts）：
 *   #/login?userName=klsjnh  → 打开登录页并预填用户名
 * 仅开发态生效；生产构建读取时返回 null。
 *
 * 老项目是 hash 路由（#/xxx?userName=），本项目是 BrowserRouter，
 * 因此这里同时兼容 location.search 与 hash 内的 query。
 */
export function readDevLoginUserName(search: string, hash?: string): string | null {
  if (!(import.meta as any).env?.DEV) return null;
  let name = new URLSearchParams(search).get('userName')?.trim() || '';
  if (!name && hash) {
    const q = hash.indexOf('?');
    if (q >= 0) name = new URLSearchParams(hash.slice(q + 1)).get('userName')?.trim() || '';
  }
  return name || null;
}
