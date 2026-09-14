# pc-admin · 企业管理系统 PC 端

基于 **React 19 + TypeScript + Vite + Ant Design 6** 实现的 PC 端管理后台。当前为**前端完整功能 + Mock 数据**阶段，已内置 **Mock / API 双数据模式**，可随时切换对接真实后端（协作规范见 [Agent.md](Agent.md)，接口契约见 `docs/` 下的 api-contract 文档）。

> 本项目属于「PC 前端 + Java 后端」体系：前端 React 19 + TS + Vite + antd 6，后端 Java + Spring Boot + MyBatis-Plus，通讯机制为统一响应信封 + POST + JSON body + camelCase。

## 技术栈

| 项 | 选型 |
|---|---|
| 框架 | React 19（函数组件 + Hooks） |
| 语言 | TypeScript 5.6 |
| 构建 | Vite 6 |
| UI | Ant Design 6 + @ant-design/icons 6 |
| 路由 | react-router-dom 7（`HashRouter`，`#/xxx`） |
| 状态管理 | zustand 5（封装为 `src/stores/createStore.ts` 工厂，对外暴露 `useStoreState` / `useStore`） |
| 其他 | mermaid / react-markdown / remark-gfm / sql-formatter |

## 快速开始

```bash
# Node 18+（推荐 pnpm，仓库带 pnpm-lock.yaml）
npm install        # 或 pnpm install
npm run dev        # 默认端口 11181，可加 -- --port 18765 覆盖
npm run build      # 产物在 dist/
npm run preview    # 预览构建产物
```

登录账号（Mock 模式）：**klsjnh / zhangsan / lisi**，密码与用户名相同（如 `klsjnh` / `klsjnh`）。开发态还支持免密登录（仅填用户名）。

## 数据模式（Mock / API）

顶栏左侧有 **MOCK**（绿）/ **API**（蓝）徽标，点击可运行时切换，选择持久化在 localStorage（`pc011-data-mode`）。

| 模式 | 行为 |
|---|---|
| **Mock**（默认） | 所有请求走内置 mock 后端 `src/mock/system011`，按真实 action 路径（`/julyXxx/v1/{动作}`）分发，离线可用 |
| **API** | 请求发往 `{apiBaseUrl}/{julyXxx}/v1/{动作}`；默认 `apiBaseUrl` 为 `/klsjnh/system011`（经 vite proxy 转发到后端 `http://192.168.3.160:11610`，免去 CORS） |

- **API 地址**：模式下拉里可直接修改，默认 `/klsjnh/system011`，持久化在 localStorage（`pc011-api-base-url`）。
- **环境变量**（可建 `.env.local`）：
  - `VITE_DATA_MODE`：`mock`（默认）| `api`，构建期默认模式
  - `VITE_API_BASE_URL`：默认 `/klsjnh/system011`
  - `VITE_RUN_STATE`：`development` | `production`，开发态可用免密登录

## 目录结构

```
├── Agent.md                     # 协作铁律 / 工作流（必读）
├── docs/                        # 文档库（项目信息 / 编码标准 / 接口契约 / 工作日志）
├── mock-server.mjs              # ⚠️ 历史遗留的独立测试后端，当前前端未使用（改用内置 mock），建议删除
├── vite.config.ts               # Vite 配置（含 /klsjnh 代理、@ 别名）
└── src/
    ├── main.tsx                 # 入口：StrictMode + HashRouter + antd reset.css
    ├── App.tsx                  # 根组件：ConfigProvider + 登录态分流路由
    ├── styles/global.css        # 全局样式
    ├── api/
    │   └── request.ts           # 请求封装：mock/API 统一路由 + 统一响应信封解包
    ├── config/
    │   ├── appConfig.ts         # 数据模式 / 运行态 / API 地址（localStorage 持久化）
    │   ├── routes.ts            # 路由常量
    │   ├── global.ts            # 应用级静态配置（应用名 / 菜单来源）
    │   └── theme.ts             # antd 主题
    ├── stores/                  # 状态管理（zustand 封装）
    │   ├── createStore.ts       # 通用 store 工厂（useStoreState / useStore）
    │   ├── authStore.ts         # 登录态 / 当前用户
    │   ├── uiStore.ts           # UI 状态（侧边栏收起等）
    │   ├── notificationStore.ts  # 通知 + 未读数
    │   └── system011/           # 各模块 store（julyUser / julyRole / julyOrganization / julyMenu ...）
    ├── services/                # 业务编排（page → service → store）
    │   └── system011/           # 各模块 service + actions.ts（action 路径常量）
    ├── mock/                    # 内置 mock 后端（system011 各模块 handler）
    │   └── system011/
    ├── components/layout/       # 布局：top（顶栏）/ left（侧边栏）/ index
    ├── pages/
    │   ├── home/                # 仪表盘 + 登录页
    │   └── system011/           # ★ 系统管理模块（julyXxx 全单词命名）
    │       ├── julyMenu/        # 菜单管理
    │       ├── julyUser/        # 用户管理（index.tsx + JulyUserFormModal.tsx）
    │       ├── julyPermission/  # 权限管理（index.tsx + RoleFormModal.tsx）
    │       └── julyOrganization/# 组织机构（index.tsx + OrganizationFormModal.tsx）
    └── types/                   # 类型（前后端契约 DTO/VO + 前端视图类型）
```

## 路由（HashRouter）

| 路由 | 页面 | 来源 |
|---|---|---|
| `#/dashboard` | 仪表盘（默认页） | Home |
| `#/system011/julyUser` | 用户管理 | system011/julyUser |
| `#/system011/julyMenu` | 菜单管理 | system011/julyMenu |
| `#/system011/julyPermission` | 权限管理 | system011/julyPermission |
| `#/system011/julyOrganization` | 组织机构 | system011/julyOrganization |
| `#/notifications` | 消息通知 | NotificationsPage |
| `#/profile` | 个人中心 | ProfilePage |
| `#/login` | 登录页 | home/login |

> 侧边栏菜单分组（系统管理 / 系统工具等）来自 `config/global.ts` 的 `GLOBAL_MENUS`（开发态默认），非开发态走接口 `julyMenu/v1/selectUserMenuTree`。

## 架构要点

### 分层与数据流

统一按 **page → service → store** 分层，职责清晰：

- **page**：渲染 + 事件绑定，只读写 store 状态，不直接调 API；
- **service**（`src/services/system011/*`）：业务编排（拼装参数、写 store、刷新列表）；
- **store**（`src/stores/system011/*`）：只持有状态（基于 zustand 封装的 `createStore`）；
- **mock**（`src/mock/system011/*`）：内置 mock 后端，按 `actions.ts` 里的真实 action 路径分发，前端无需感知是否 mock。

`src/api/request.ts` 负责 mock / API 双模式路由：mock 模式直接命中内置 handler 并按统一信封解包；API 模式发真实 `fetch`。两者解包逻辑一致，业务代码无差别。

### 布局（components/layout）

- **top（顶栏）**：数据模式切换（MOCK/API + API 地址配置 + 最近错误）→ 通知铃铛（红点未读数，点击跳消息通知页）→ 用户下拉（个人信息 / 修改密码 / 退出登录；修改密码为真实接口 `julyUser/v1/changePassword`）。
- **left（侧边栏）**：分组菜单，依据当前路由自动展开所属分组（同时兼容配置菜单与接口菜单两种 key 形态），可折叠，状态经 `uiStore` 持久化。

### 状态管理

所有 store 基于 `zustand` 封装的 `createStore` 工厂（`src/stores/createStore.ts`），对外暴露 `useStoreState` / `useStore`（selector 订阅）。

| Store | 职责 | 持久化 |
|---|---|---|
| authStore | token + 当前用户 | token 存 localStorage |
| uiStore | 侧边栏收起等 UI 状态 | localStorage |
| julyUserStore / julyRoleStore / julyOrganizationStore / julyMenuStore | 各模块列表/树状态 | 内存 |
| notificationStore | 通知 + 未读数 | 内存 |

### 关键页面交互

- **用户管理（julyUser）**：antd 表格 + 弹窗。新增/编辑均为 `JulyUserFormModal`（含校验，用户名编辑时锁定，组织/角色为下拉多选）；邮箱、手机号为选填（仅做格式校验），保存走 `julyUserService.saveUser`（含分配角色），成功后刷新列表。
- **菜单管理（julyMenu）**：左树右编辑，支持右键菜单与拖拽调整层级。
- **权限管理（julyPermission）**：左右分栏，左侧角色列表（新建/编辑/删除），右侧「菜单权限」与「关联用户」。
- **组织机构（julyOrganization）**：树形表格，新建/编辑弹窗内可选上级组织（自己及下级置灰）。

## 接口契约摘要

详见 `docs/` 下的 api-contract 文档。要点：

- 业务接口统一 **POST + JSON body**，URL 结构 `{apiBaseUrl}/{julyXxx}/v1/{动作}`，默认 `apiBaseUrl = /klsjnh/system011`；标准动作 `selectListByPage / getById / insert / update / logicDelete / assignRoles` 等；
- 统一响应信封，前端 `src/api/request.ts` 自动解包 `data`：

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

- 错误码：`200` 成功；`400` 入参失败；`401` 未认证；`403` 无权限；`500` 服务端异常。非 200 时前端抛 `ApiError`，读取类失败自动回退本地数据，写入类失败记录在顶栏模式下拉的「最近错误」里。

## 前端开发约定（速览，完整版见 Agent.md）

- **提交时机**：仅在用户明确发出「提交 / push」指令时提交，禁止主动提交。
- **提交前置**：`npm run build` 无报错 + 功能自测通过。
- **HTTP 规范**：业务接口统一 POST + JSON body；GET 仅用于无参/少参纯查询（如树查询），`api.get` 已支持把 body 序列化为 query string。
- **红线**：堆栈/SQL 不出站、凭证一律走环境变量、对外契约禁止破坏性变更。

## 已知遗留事项

- `mock-server.mjs` 为早期独立测试后端，当前前端已改用内置 `src/mock/system011`，该文件未被引用，建议清理。
- `julyConfig` / `julyScheduler` 在 `actions.ts` 与 mock 中已定义 action，但暂无对应页面（菜单也未挂接）。
- `docs/` 存在少量编号重复（如 `013` / `015` / `016` 各有两份主题文档），后续需按编号约定归并。
