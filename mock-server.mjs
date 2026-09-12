/**
 * 极简测试后端：验证前端 API 模式用
 * 对齐 docs/016.api-contract.md：POST + JSON body + 统一响应信封（六字段）
 * 启动：node mock-server.mjs [端口]   （默认 18765，前端 API 地址填 http://localhost:18765/api/v1）
 *
 * 接口：
 *   POST /api/v1/menu/selectListByPage         → MenuConfig[]
 *   POST /api/v1/role/selectListByPage         → { roles, users }
 *   POST /api/v1/notification/selectListByPage → NotificationItem[]
 *   其余 POST 动作：记录日志并返回 statusCode=200 空数据
 */
import http from 'node:http';

// 刻意与前端内置 mock 数据不同，便于在页面上确认数据确实来自后端
const menus = [
  {
    id: 1, parentId: 0, name: 'SystemRoot', path: '/system', icon: '⚙️', title: '系统管理(API)', type: 'page', sort: 1, visible: true,
    children: [
      { id: 101, parentId: 1, name: 'Menu', path: '/menu', icon: '📋', title: '菜单管理', type: 'page', sort: 1, visible: true },
      { id: 102, parentId: 1, name: 'Organization', path: '/organization', icon: '🏢', title: '组织管理', type: 'page', sort: 2, visible: true },
      { id: 103, parentId: 1, name: 'User', path: '/user', icon: '👥', title: '用户管理', type: 'page', sort: 3, visible: true },
      { id: 104, parentId: 1, name: 'Permission', path: '/permission', icon: '🔑', title: '权限管理', type: 'page', sort: 4, visible: true },
    ],
  },
  { id: 2, parentId: 0, name: 'BusinessRoot', path: '/business', icon: '💼', title: '业务中心(API)', type: 'page', sort: 2, visible: true },
];

const roles = {
  roles: [
    { id: 1, name: 'api_admin', label: 'API超级管理员', description: '来自后端的角色数据', status: 'active', permissions: ['/dashboard'], userIds: [1] },
    { id: 2, name: 'api_viewer', label: 'API只读用户', description: '来自后端的角色数据', status: 'active', permissions: ['/dashboard'], userIds: [] },
  ],
  users: [
    { id: 1, username: 'api_admin', realName: '后端张三', department: 'API技术中心', departmentId: 111 },
    { id: 2, username: 'api_user', realName: '后端李四', department: 'API产品部', departmentId: 112 },
  ],
};

let notifications = [
  { id: 1, title: 'API模式通知', content: '这条通知来自后端接口 /api/v1/notification/selectListByPage，说明 API 模式生效。', time: '2026-09-12 12:00:00', read: false, type: 'system' },
  { id: 2, title: 'API模式通知(已读)', content: '后端返回的第二条通知。', time: '2026-09-12 11:00:00', read: true, type: 'user' },
];

const envelope = (data) => JSON.stringify({
  statusCode: 200,
  message: 'select success',
  errorMessage: '',
  timestamp: Date.now(),
  traceId: 'mock-server',
  data,
});

const routes = {
  '/api/v1/menu/selectListByPage': () => menus,
  '/api/v1/role/selectListByPage': () => roles,
  '/api/v1/notification/selectListByPage': () => notifications,
};

const server = http.createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...cors });

  if (req.method === 'POST' && routes[pathname]) {
    return res.end(envelope(routes[pathname]()));
  }

  // 其余动作：记录日志并返回成功空数据（验证写入链路够用）
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    console.log(`[mock-server] ${req.method} ${pathname}${body ? ' body=' + body : ''}`);
    res.end(envelope(null));
  });
});

const port = Number(process.argv[2] || 18765);
server.listen(port, () => console.log(`[mock-server] API 测试后端已启动: http://localhost:${port}/api/v1`));
