# pc-admin · 企业管理系统 PC 端

React 18 + TypeScript + Vite 实现的 PC 端管理后台。当前为**前端完整功能 + Mock 数据**阶段，已内置 **Mock / API 双数据模式**，可随时切换对接真实后端（契约见 [docs/016.api-contract.md](docs/016.api-contract.md)，协作规范见 [Agent.md](Agent.md)）。

> 本项目属于「PC 前端 + Java 17 DDD 后端」体系：前端 React 18 + TS + Vite，后端 Java 17 + Spring Boot 3.4 + MyBatis-Plus，通讯机制为统一响应信封 + POST + JSON body + camelCase。

## 文档导航

| 文档 | 内容 |
|---|---|
| **README.md**（本文） | 项目总览：启动、目录、路由、架构、功能明细、双数据模式 |
| [Agent.md](Agent.md) | 协作手册（先读）：铁律、HTTP 规范、标准流程、红线、文档地图 |
| [docs/README.md](docs/README.md) | docs 知识库索引（含当日工作日志入口） |
| [docs/011.agreements.md](docs/011.agreements.md) | 文档体系与编号约定（编号序列 / 归档规则） |
| [docs/013.project-info.md](docs/013.project-info.md) | 项目信息：背景、前后端模块对应关系、技术栈 |
| [docs/015.coding-standards.md](docs/015.coding-standards.md) | 前端编码标准（页面统一写法 / store 模式 / 命名规范） |
| [docs/016.api-contract.md](docs/016.api-contract.md) | 接口通讯规则：响应信封、状态码、标准动作、前端请求行为 |
| `docs/{YYYY-MM-DD}.md` | 当日工作日志（历史归档至 docs/archive011/） |

---

## 技术栈

| 项 | 选型 |
|---|---|
| 框架 | React 18.3（函数组件 + Hooks） |
| 语言 | TypeScript 5.6 |
| 构建 | Vite 6 |
| 路由 | 无路由库，`App.tsx` 基于 hash（`#/xxx`）自行分发 |
| 状态管理 | 无第三方库，全部基于 `useSyncExternalStore` 的自研 store |
| UI | 无 UI 组件库，自研全局 CSS 约定（`src/styles/global.css`） |

## 快速开始

```bash
# Node 18+
npm install
npm run dev            # 默认 5173 端口，本机常用：npm run dev -- --port 5199
npm run build          # 产物在 dist/
npm run preview        # 预览构建产物
```

登录账号（Mock）：**admin / admin123**

## 数据模式（Mock / API）

顶栏左侧有 **MOCK**（绿）/ **API**（蓝）徽标，点击可运行时切换，选择持久化在 localStorage（`pc011-data-mode`）。

| 模式 | 行为 |
|---|---|
| **Mock**（默认） | 所有 store 使用内置本地数据，离线可用 |
| **API** | 读取走 `POST {apiBaseUrl}/{模块}/{动作}`；写入为乐观更新（本地先生效 + 静默请求后端，失败只记录在下拉面板的"最近错误"里，不打断页面） |

- **API 地址**：模式下拉里可直接修改，默认 `/api/v1`，持久化在 localStorage（`pc011-api-base-url`）。
- **环境变量**（可建 `.env.local`，参考 `.env.example`）：
  - `VITE_DATA_MODE`：`mock`（默认）| `api`，构建期默认模式
  - `VITE_API_BASE_URL`：默认 `/api/v1`
- **本地测试后端**：`node mock-server.mjs [端口]`（默认 18765），按契约返回统一信封；模式下拉里把 API 地址填成 `http://localhost:18765/api/v1` 即可联调。

### 各数据域的接口对接情况

| 数据域 | 读取（selectListByPage） | 写入动作 |
|---|---|---|
| 菜单 menuStore | `/menu/selectListByPage` | `/menu/insert` `/menu/update` `/menu/logicDelete` `/menu/move` |
| 角色 roleStore | `/role/selectListByPage`（返回 `{roles, users}`） | `/role/insert` `/role/update` `/role/logicDelete` `/role/updatePermission` `/roleUser/insert` `/roleUser/logicDelete` |
| 通知 notificationStore | `/notification/selectListByPage` | `/notification/read` `/notification/readAll` `/notification/logicDelete` |
| 用户列表（用户管理页） | ❌ 暂为页面本地 mock | 同左 |

API 请求失败自动回退：读取失败时 store 保留本地 mock 数据，页面不白屏。

## 目录结构

```
├── Agent.md                     # 协作铁律 / 工作流（必读）
├── docs/
│   └── 016.api-contract.md      # 接口契约：响应信封 / URL 结构 / 标准动作
├── mock-server.mjs              # API 模式联调用极简测试后端（node mock-server.mjs [端口]）
├── .env.example                 # 环境变量示例
└── src/
    ├── main.tsx                 # 入口
    ├── App.tsx                  # 根组件：登录态 + hash 路由分发（pageMap）
    ├── styles/global.css        # 全局样式与 PC 组件类约定
    ├── config/
    │   └── appConfig.ts         # 数据模式（mock/api）+ API 地址，localStorage 持久化
    ├── api/
    │   └── request.ts           # 请求封装：POST + 统一响应信封（对齐接口契约）
    ├── stores/                  # 自研状态管理（useSyncExternalStore）
    │   ├── authStore.ts         # 登录态 / 当前用户
    │   ├── menuStore.ts         # 菜单树（驱动侧边栏/宫格/菜单管理页）
    │   ├── roleStore.ts         # 角色 + 角色关联用户（权限管理页数据源）
    │   ├── notificationStore.ts # 通知 + 未读数（顶栏红点与消息通知页共用）
    │   └── uiStore.ts           # UI 状态持久化（localStorage）：侧边栏收起、菜单树展开/选中
    ├── components/
    │   ├── layout/SidebarLayout.tsx  # PC 布局：顶栏（模式徽标/通知铃铛/用户下拉）+ 侧边栏 + 面包屑
    │   ├── ConfirmDialog.tsx         # 确认弹窗
    │   ├── OrgPickerModal.tsx        # 组织架构树单选弹窗
    │   ├── RolePickerModal.tsx       # 角色多选弹窗
    │   ├── UserTransferModal.tsx     # 用户穿梭框（组织树 + 用户列表 + 已选面板）
    │   └── index.ts
    ├── pages/
    │   ├── system011/           # ★ 系统管理模块（命名规范：julyXxx 全单词）
    │   │   ├── julyMenu.tsx         # 菜单管理
    │   │   ├── julyUser.tsx         # 用户管理
    │   │   ├── julyPermission.tsx   # 权限管理
    │   │   └── julyOrganization.tsx # 组织机构
    │   ├── business-pages.tsx   # 业务中心 19 个子页面（PC 端统一布局）
    │   ├── management-pages.tsx # 遗留页集合（在用：审计日志、系统设置）
    │   ├── LoginPage.tsx / DashboardPage.tsx / BusinessPage.tsx ...
    │   └── ...                  # 其余见下方路由表
    └── mock/                    # 内置 mock 数据（menuConfig / permissionData / index）
```

## 路由表（hash 路由）

| 路由 | 页面 | 来源 |
|---|---|---|
| `#/dashboard` | 仪表盘（默认页，未知路由也落到这里） | DashboardPage |
| `#/user` | 用户管理 | system011/julyUser |
| `#/menu` | 菜单管理 | system011/julyMenu |
| `#/permission` | 权限管理 | system011/julyPermission |
| `#/organization` | 组织机构 | system011/julyOrganization |
| `#/business` | 业务中心（宫格入口） | BusinessPage |
| `#/business/{action}` | 19 个业务子页面，action：`config` `scheduler` `datasource` `storage` `params` `dict` `template` `push` `stats` `trend` `charts` `export` `dashboard` `calc` `query` `monitor` `online` `cache` `servicelog` | business-pages.tsx / 占位页 |
| `#/notifications` | 消息通知 | NotificationsPage |
| `#/audit` | 审计日志 | management-pages.AuditPage |
| `#/settings` | 系统设置 | management-pages.SettingsPage |
| `#/reports` | 数据报表 | ReportsPage |
| `#/profile` | 个人中心 | ProfilePage |
| `#/help` | 帮助反馈 | HelpPage |
| `#/about` | 关于系统 | AboutPage |

## 架构要点

### 布局（SidebarLayout）

- **顶栏**：数据模式徽标（MOCK/API 切换 + API 地址配置 + 最近错误展示）→ 通知铃铛（红点显示未读数，点击跳消息通知页）→ 用户对象（点击下拉：个人信息 / 修改密码 / 退出登录，修改密码为弹窗表单）。
- **侧边栏**：分组菜单（系统管理/系统工具为可展开组），"◀ 收起"可折叠，收起状态经 `uiStore` 持久化（刷新保留）。
- **面包屑**：根据当前路由在预定义菜单树中匹配，未匹配显示"仪表盘"。

### 状态管理

全部 store 使用 `useSyncExternalStore` + 模块级单例，模式一致：

| Store | 职责 | 持久化 |
|---|---|---|
| authStore | token + 当前用户 | token 存 localStorage |
| menuStore | 菜单树数据；增删改/拖拽移动/显隐 | 无（内存） |
| roleStore | 角色列表 + 角色用户关联 | 无（内存） |
| notificationStore | 通知 + 未读数 | 无（内存） |
| uiStore | 侧边栏收起、菜单树展开/选中 | localStorage（`pc011-ui-state`） |

各 store 均有 `reload()`：切换数据模式后由顶栏统一调用重新拉取。

### 关键页面交互

- **菜单管理（julyMenu）**：左树右编辑。树节点支持**右键菜单**（新建子菜单/编辑/删除）与**拖拽调整层级**（拖到目标节点下成为子级，拖到底部虚线区设为顶级；禁止拖入自己子孙）；点击树节点右侧直接出现该菜单的编辑表单（右上角保存，可改上级菜单）。树的展开/选中状态经 uiStore 持久化，默认仅展开第一个顶级节点。
- **用户管理（julyUser）**：PC 表格 + 弹窗模式。新增/编辑均为弹窗表单（含校验）；"组织"字段弹出组织架构树单选（OrgPickerModal）；"角色"字段弹出角色多选（RolePickerModal）；列表角色列支持多角色标签。
- **权限管理（julyPermission）**：左右分栏。左侧角色列表（新建/编辑/删除角色）；右侧页签"菜单权限"（默认收起的菜单权限树 + 右上角保存）与"关联用户"（右上角添加用户 → UserTransferModal 穿梭框）。
- **组织机构（julyOrganization）**：树形表格（集团 → 分公司 → 部门），新建/编辑弹窗内可选**上级组织**（编辑时可改上下级，自己及下级置灰）。
- **消息通知**：类型筛选 + 详情弹窗 + 删除 + 全部已读；与顶栏红点实时联动。

## 组件与样式约定（PC 端页面统一写法）

页面统一使用全局类拼装，不引第三方 UI：

```
page-header        → 页头（h2 标题 + p 副标题）
page-toolbar       → 工具栏（toolbar-left / toolbar-right）
form-input / form-select / form-checkbox 等表单类
table-wrapper      → 卡片容器（也可作面板，配 padding 使用）
data-table         → 数据表格
btn / btn-primary / btn-default / btn-danger / btn-sm；行内操作用 btn-link（danger 红字）
status-badge / status-active / status-inactive
pagination-bar     → 分页
modal-overlay / modal-container / modal-header / modal-body / modal-footer / modal-close
```

命名规范：系统管理模块页面文件/组件以 `july` + 全单词命名（julyMenu / julyUser / julyPermission / julyOrganization），位于 `src/pages/system011/`；单页直接放文件，多页模块用 `julyXxx/index.tsx` 目录形式。

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `VITE_DATA_MODE` | `mock` | 构建期默认数据模式（`mock` / `api`） |
| `VITE_API_BASE_URL` | `/api/v1` | API 模式请求基地址 |

## 接口契约摘要

详见 [docs/016.api-contract.md](docs/016.api-contract.md)。要点：

- 业务接口统一 **POST + JSON body**，URL 结构 `/api/v1/{模块}/{动作}`，标准动作 `selectOne / selectListByPage / insert / update / logicDelete`；
- 统一响应信封（六字段固定），`statusCode === 200` 视为成功，前端 `src/api/request.ts` 自动解包 `data`：

```json
{
  "statusCode": 200,
  "message": "select success",
  "errorMessage": "",
  "timestamp": 1788645689571,
  "traceId": "b7c1e2f0a3d94e8f",
  "data": null
}
```

- 错误码：`200` 成功；`400` 入参失败；`401` 未认证；`403` 无权限；`500` 服务端异常（非 200 时前端抛 `ApiError`，读取类失败自动回退本地数据，写入类失败记录在顶栏模式下拉的"最近错误"里）。

## 前端开发约定（速览，完整版见 Agent.md）

- **提交时机**：仅在用户明确发出「提交 / push」指令时提交，禁止主动提交。
- **提交前置**：`npm run build` 无报错 + 功能自测通过。
- **HTTP 规范**：业务接口统一 POST + JSON body；GET 仅用于无参纯查询；禁止路径参数。
- **红线**：堆栈/SQL 不出站、凭证一律走环境变量、对外契约禁止破坏性变更。
- **标准流程**：需求 → docs/ 记录决策 → 拆任务 → 编码 → 构建验证 → 自测 → 汇报 → 提交。

## 已知遗留事项

- 用户管理页列表数据仍为页面本地 mock（未纳入 store / API 体系）。
- `management-pages.tsx` 中 `RoleListPage / MenuListPage / PermissionPage` 为历史遗留导出（未接入路由，仅 `AuditPage / SettingsPage` 在用）。
- `RoleFormPage.tsx`、`PermissionRelationPage.tsx` 未接入任何路由（死代码，可删）。
- `npx tsc --noEmit` 存在少量历史类型报错（`roleStore` 初始 users 缺 `departmentId` 等），不影响 `npm run build`。

## 相关文档

- [Agent.md](Agent.md) — 协作手册：铁律、HTTP 规范、标准流程、红线、文档地图
- [docs/README.md](docs/README.md) — docs 知识库索引
- [docs/011.agreements.md](docs/011.agreements.md) — 文档体系与编号约定
- [docs/013.project-info.md](docs/013.project-info.md) — 项目信息与前后端模块对应关系
- [docs/015.coding-standards.md](docs/015.coding-standards.md) — 前端编码标准
- [docs/016.api-contract.md](docs/016.api-contract.md) — 接口通讯规则（响应信封 / 状态码 / 前端请求行为）
- [docs/2026-09-12.md](docs/2026-09-12.md) — 当日工作日志
