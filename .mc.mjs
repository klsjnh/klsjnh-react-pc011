// src/mock/system011.ts
function ok(data) {
  return {
    statusCode: 200,
    message: "success",
    errorMessage: "",
    timestamp: Date.now(),
    traceId: "mock-" + Math.random().toString(36).slice(2, 12),
    data
  };
}
function fail(message, statusCode = 401) {
  return {
    statusCode,
    message: "error",
    errorMessage: message,
    timestamp: Date.now(),
    traceId: "mock-" + Math.random().toString(36).slice(2, 12),
    data: null
  };
}
function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}
var mockOrgs = [
  {
    id: "org0001root000000000000000001",
    parentId: "",
    orgCode: "HX",
    orgName: "\u534E\u4FE1\u96C6\u56E2",
    pkUser: null,
    orgLevel: 1,
    sortOrder: 9999,
    status: "1",
    memberCount: null,
    children: [],
    createTime: "2026-09-12T23:20:32",
    updateTime: "2026-09-13T11:36:07"
  }
];
var orgNameById = /* @__PURE__ */ new Map();
(function indexOrgs(list) {
  for (const o of list) {
    orgNameById.set(o.id, o.orgName);
    if (o.children) indexOrgs(o.children);
  }
})(mockOrgs);
var mockRoles = [
  { id: "9b1c1b8c9b8e444ea53de7c0f9bf821e", roleCode: "admin", roleName: "\u8D85\u7EA7\u7BA1\u7406\u5458", isBuiltin: "1", remark: "\u5185\u7F6E", status: "1", createTime: "2026-09-12T22:29:43", updateTime: "2026-09-13T09:50:29" }
];
var mockExtraRoles = [
  { id: "role-demo-manager", roleCode: "manager", roleName: "\u90E8\u95E8\u7ECF\u7406", isBuiltin: "0", remark: "\u7BA1\u7406\u90E8\u95E8\u5185\u7528\u6237", status: "1", createTime: "2026-02-15 10:00:00" },
  { id: "role-demo-editor", roleCode: "editor", roleName: "\u7F16\u8F91\u4EBA\u5458", isBuiltin: "0", remark: "\u8D1F\u8D23\u5185\u5BB9\u7F16\u8F91\u4E0E\u53D1\u5E03", status: "1", createTime: "2026-03-01 10:00:00" },
  { id: "role-demo-viewer", roleCode: "viewer", roleName: "\u53EA\u8BFB\u7528\u6237", isBuiltin: "0", remark: "\u4EC5\u53EF\u67E5\u770B\u6570\u636E", status: "1", createTime: "2026-04-10 10:00:00" }
];
var ORG_ROOT = "org0001root000000000000000001";
var mockUsers = [
  { id: "42996f6ce509409aae527ab777500488", userAccount: "lisi", userName: "\u674E\u56DB", mobile: null, email: null, avatar: null, pkOrg: null, lastLoginTime: null, status: "1", createBy: "8070b9deec124a4bb0913e2ea56023c2", updateBy: "8070b9deec124a4bb0913e2ea56023c2", createTime: "2026-09-13T07:11:38", updateTime: "2026-09-13T07:11:38" },
  { id: "8070b9deec124a4bb0913e2ea56023c2", userAccount: "zhangsan", userName: "\u5F20\u4E09", mobile: null, email: null, avatar: "https://cdn.example.com/avatar/zs.png", pkOrg: ORG_ROOT, lastLoginTime: null, status: "1", createBy: null, updateBy: null, createTime: "2026-09-12T22:29:43", updateTime: "2026-09-13T09:50:29" },
  { id: "19a2c9b330ab46078079e557e732d1ab", userAccount: "klsjnh", userName: "klsjnh-\u6539", mobile: null, email: null, avatar: null, pkOrg: null, lastLoginTime: null, status: "1", createBy: null, updateBy: null, createTime: "2026-09-13T09:26:39", updateTime: "2026-09-13T09:50:29" }
];
var userNameById = /* @__PURE__ */ new Map();
mockUsers.forEach((u) => userNameById.set(u.id, u.userName || u.userAccount));
var mockUserRoles = {
  klsjnh: ["admin"],
  zhangsan: ["admin"],
  lisi: ["admin"]
};
var mockCredentials = {
  klsjnh: "klsjnh",
  zhangsan: "zhangsan",
  lisi: "lisi"
};
var mockRolePermissions = {
  admin: ["system:menu:list", "organization:view", "system:user:list", "system:role:list", "scheduler:view", "datasource:view", "storage:view", "audit:login:view"],
  manager: ["system:user:list", "organization:view", "audit:login:view"],
  editor: ["system:user:list"],
  viewer: []
};
var mockNotifications = [
  { id: 1, title: "\u7CFB\u7EDF\u66F4\u65B0\u901A\u77E5", content: "\u7CFB\u7EDF\u5C06\u4E8E\u4ECA\u665A 22:00-22:30 \u8FDB\u884C\u7EF4\u62A4\u5347\u7EA7\uFF0C\u5347\u7EA7\u671F\u95F4\u53EF\u80FD\u65E0\u6CD5\u6B63\u5E38\u8BBF\u95EE\u3002", type: "system", read: false, createTime: "2026-09-12 09:30:00" },
  { id: 2, title: "\u65B0\u7528\u6237\u6CE8\u518C\u5BA1\u6838", content: "\u7528\u6237\u300Cklsjnh\u300D\u5DF2\u5B8C\u6210\u6CE8\u518C\u7533\u8BF7\uFF0C\u8BF7\u524D\u5F80\u7528\u6237\u7BA1\u7406\u9875\u9762\u8FDB\u884C\u5BA1\u6838\u3002", type: "user", read: false, createTime: "2026-09-12 09:25:00" },
  { id: 3, title: "\u8BA2\u5355\u652F\u4ED8\u6210\u529F", content: "\u8BA2\u5355 #20260912001 \u5DF2\u652F\u4ED8\u6210\u529F\uFF0C\u91D1\u989D \xA5299.00\u3002", type: "order", read: true, createTime: "2026-09-12 09:00:00" },
  { id: 4, title: "\u6743\u9650\u53D8\u66F4\u63D0\u9192", content: "\u60A8\u7684\u89D2\u8272\u6743\u9650\u5DF2\u88AB\u4FEE\u6539\u3002\u5F53\u524D\u89D2\u8272\uFF1A\u90E8\u95E8\u7ECF\u7406\u3002", type: "system", read: true, createTime: "2026-09-12 08:00:00" },
  { id: 5, title: "\u6570\u636E\u5907\u4EFD\u5B8C\u6210", content: "\u7CFB\u7EDF\u6570\u636E\u5DF2\u4E8E 2026-09-12 06:00 \u81EA\u52A8\u5907\u4EFD\u5B8C\u6210\u3002", type: "system", read: true, createTime: "2026-09-12 06:00:00" },
  { id: 6, title: "\u5B89\u5168\u8B66\u544A", content: "\u68C0\u6D4B\u5230\u5F02\u5E38\u767B\u5F55\u5C1D\u8BD5\uFF0C\u5982\u975E\u672C\u4EBA\u64CD\u4F5C\u8BF7\u7ACB\u5373\u4FEE\u6539\u5BC6\u7801\u3002", type: "system", read: false, createTime: "2026-09-11 14:00:00" }
];
var mockMenus = [
  {
    id: "menu0000000000000000000000root1",
    parentId: "",
    menuCode: "system",
    menuName: "\u7CFB\u7EDF\u7BA1\u7406",
    menuType: "1",
    menuIcon: "\u2699\uFE0F",
    menuRoute: "/system",
    permissionCode: null,
    component: null,
    sortOrder: 1,
    status: "1",
    children: [
      { id: "menu0000000000000000000000000101", parentId: "menu0000000000000000000000root1", menuCode: "menu", menuName: "\u83DC\u5355\u7BA1\u7406", menuType: "2", menuIcon: "\u{1F4CB}", menuRoute: "/menu", permissionCode: "system:menu:list", component: null, sortOrder: 1, status: "1", children: [] },
      { id: "menu0000000000000000000000000102", parentId: "menu0000000000000000000000root1", menuCode: "organization", menuName: "\u7EC4\u7EC7\u7BA1\u7406", menuType: "2", menuIcon: "\u{1F3E2}", menuRoute: "/organization", permissionCode: "organization:view", component: null, sortOrder: 2, status: "1", children: [] },
      { id: "menu0000000000000000000000000103", parentId: "menu0000000000000000000000root1", menuCode: "user", menuName: "\u7528\u6237\u7BA1\u7406", menuType: "2", menuIcon: "\u{1F465}", menuRoute: "/user", permissionCode: "system:user:list", component: null, sortOrder: 3, status: "1", children: [] },
      { id: "menu0000000000000000000000000104", parentId: "menu0000000000000000000000root1", menuCode: "permission", menuName: "\u6743\u9650\u7BA1\u7406", menuType: "2", menuIcon: "\u{1F511}", menuRoute: "/permission", permissionCode: "system:role:list", component: null, sortOrder: 4, status: "1", children: [] }
    ]
  },
  {
    id: "menu0000000000000000000000root2",
    parentId: "",
    menuCode: "business",
    menuName: "\u4E1A\u52A1\u4E2D\u5FC3",
    menuType: "1",
    menuIcon: "\u{1F4BC}",
    menuRoute: "/business",
    permissionCode: null,
    component: null,
    sortOrder: 2,
    status: "1",
    children: [
      { id: "menu0000000000000000000000000201", parentId: "menu0000000000000000000000root2", menuCode: "config", menuName: "\u914D\u7F6E\u7BA1\u7406", menuType: "2", menuIcon: "\u2699\uFE0F", menuRoute: "/business/config", permissionCode: null, component: null, sortOrder: 1, status: "1", children: [] },
      { id: "menu0000000000000000000000000202", parentId: "menu0000000000000000000000root2", menuCode: "scheduler", menuName: "\u5B9A\u65F6\u4EFB\u52A1", menuType: "2", menuIcon: "\u23F0", menuRoute: "/business/scheduler", permissionCode: "scheduler:view", component: null, sortOrder: 2, status: "1", children: [] },
      { id: "menu0000000000000000000000000203", parentId: "menu0000000000000000000000root2", menuCode: "datasource", menuName: "\u6570\u636E\u6E90", menuType: "2", menuIcon: "\u{1F5C4}", menuRoute: "/business/datasource", permissionCode: "datasource:view", component: null, sortOrder: 3, status: "1", children: [] },
      { id: "menu0000000000000000000000000204", parentId: "menu0000000000000000000000root2", menuCode: "storage", menuName: "\u5B58\u50A8\u4E2D\u5FC3", menuType: "2", menuIcon: "\u{1F4BE}", menuRoute: "/business/storage", permissionCode: "storage:view", component: null, sortOrder: 4, status: "1", children: [] }
    ]
  },
  {
    id: "menu0000000000000000000000root3",
    parentId: "",
    menuCode: "tools",
    menuName: "\u7CFB\u7EDF\u5DE5\u5177",
    menuType: "1",
    menuIcon: "\u{1F6E0}",
    menuRoute: "/tools",
    permissionCode: null,
    component: null,
    sortOrder: 3,
    status: "1",
    children: [
      { id: "menu0000000000000000000000000301", parentId: "menu0000000000000000000000root3", menuCode: "audit", menuName: "\u5BA1\u8BA1\u65E5\u5FD7", menuType: "2", menuIcon: "\u{1F4DD}", menuRoute: "/audit", permissionCode: "audit:login:view", component: null, sortOrder: 1, status: "1", children: [] },
      { id: "menu0000000000000000000000000302", parentId: "menu0000000000000000000000root3", menuCode: "settings", menuName: "\u7CFB\u7EDF\u8BBE\u7F6E", menuType: "2", menuIcon: "\u2699\uFE0F", menuRoute: "/settings", permissionCode: null, component: null, sortOrder: 2, status: "1", children: [] }
    ]
  }
];
function pageResult(rows, pageIndex, pageSize) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (pageIndex - 1) * pageSize;
  return { pageIndex, pageSize, total, totalPages, rows: rows.slice(start, start + pageSize) };
}
var handlers = {
  // ===== 登录（两端点都返回 JulyUserSessionVo011） =====
  "/julyUser/v1/login": async (body) => {
    await delay(400);
    const acct = (body?.userAccount || "").trim();
    const pwd = body?.password || "";
    const u = mockUsers.find((x) => x.userAccount === acct);
    if (!u) return fail("\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF");
    if (mockCredentials[acct] === void 0 || mockCredentials[acct] !== pwd) return fail("\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF");
    return ok({ token: `mock-${acct}-${Date.now()}`, userAccount: u.userAccount, userName: u.userName, roles: mockUserRoles[acct] || ["viewer"] });
  },
  "/julyUser/v1/loginByUserName": async (body) => {
    await delay(300);
    const acct = (body?.userAccount || "").trim();
    const u = mockUsers.find((x) => x.userAccount === acct);
    if (!u) return fail(`\u7528\u6237\u4E0D\u5B58\u5728\uFF1A${acct}`);
    return ok({ token: `mock-${acct}-${Date.now()}`, userAccount: u.userAccount, userName: u.userName, roles: mockUserRoles[acct] || ["viewer"] });
  },
  // ===== 用户分页 =====
  "/julyUser/v1/selectListByPage": async (body) => {
    await delay(350);
    let rows = [...mockUsers];
    const kw = (body?.userAccount || body?.userName || "").trim().toLowerCase();
    if (kw) rows = rows.filter((u) => u.userAccount.toLowerCase().includes(kw) || (u.userName || "").toLowerCase().includes(kw));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  // ===== 角色分页 =====
  "/julyRole/v1/selectListByPage": async (body) => {
    await delay(350);
    let rows = [...mockRoles, ...mockExtraRoles];
    const kw = (body?.keyword || "").trim().toLowerCase();
    if (kw) rows = rows.filter((r) => r.roleCode.toLowerCase().includes(kw) || (r.roleName || "").toLowerCase().includes(kw));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  // ===== 菜单：当前用户菜单树（RBAC） / 全量树 / 分页 =====
  "/julyMenu/v1/selectUserMenuTree": async () => {
    await delay(300);
    return ok(structuredClone(mockMenus));
  },
  "/julyMenu/v1/selectTree": async () => {
    await delay(300);
    return ok(structuredClone(mockMenus));
  },
  "/julyMenu/v1/selectListByPage": async (body) => {
    await delay(300);
    const flat = [];
    (function walk(list) {
      for (const m of list) {
        flat.push(m);
        if (m.children) walk(m.children);
      }
    })(mockMenus);
    return ok(pageResult(flat, body?.pageIndex || 1, body?.pageSize || 20));
  },
  // ===== 组织：真实后端返回 PageResult011（rows 内为组织树） =====
  "/julyOrganization/v1/selectListByPage": async (body) => {
    await delay(300);
    return ok(pageResult(structuredClone(mockOrgs), body?.pageIndex || 1, body?.pageSize || 10));
  },
  // ===== 通知（独立于 system011 模块，沿用统一信封；menu/role 之外的轻量模块） =====
  "/notification/v1/selectListByPage": async () => {
    await delay(300);
    return ok(structuredClone(mockNotifications));
  },
  "/notification/v1/read": async (body) => {
    await delay(150);
    const n = mockNotifications.find((x) => x.id === body?.id);
    if (n) n.read = true;
    return ok(null);
  },
  "/notification/v1/readAll": async () => {
    await delay(150);
    mockNotifications.forEach((n) => n.read = true);
    return ok(null);
  },
  "/notification/v1/logicDelete": async (body) => {
    await delay(150);
    const i = mockNotifications.findIndex((x) => x.id === body?.id);
    if (i >= 0) mockNotifications.splice(i, 1);
    return ok(null);
  }
};
function getMockResponse(action, body) {
  const handler = handlers[action];
  if (!handler) return null;
  return handler(body);
}
var mockRelations = {
  orgName: (id) => id ? orgNameById.get(id) || "" : "",
  userName: (id) => id ? userNameById.get(id) || "" : "",
  userRoles: (userAccount) => mockUserRoles[userAccount] || [],
  rolePermissions: (roleCode) => mockRolePermissions[roleCode] || [],
  roleUserAccounts: (roleCode) => Object.entries(mockUserRoles).filter(([, codes]) => codes.includes(roleCode)).map(([acct]) => acct)
};
export {
  getMockResponse,
  mockRelations
};
