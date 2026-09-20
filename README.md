# pc-admin · 企业管理系统 PC 端

基于 **React 19 + TypeScript + Vite + Ant Design 6** 实现的 PC 端管理后台。已内置 **Mock / API 双数据模式**，可随时切换对接真实后端（协作规范见 [Agent.md](Agent.md)，项目事实见 [docs/015.project-info.md](docs/015.project-info.md)，接口契约见 `docs/013.api-contract.md`）。

> 当前状态：框架与系统管理、低代码、数据服务、存储中心等模块已可用；部分路由仍为占位页（见文末「已知遗留事项」）。

> 本项目属于「PC 前端 + Java 后端」体系：前端 React 19 + TS + Vite + antd 6，后端 Java + Spring Boot + MyBatis-Plus，通讯机制为统一响应信封 + POST + JSON body + camelCase。

## 技术栈

| 项 | 选型 |
|---|---|
| 框架 | React 19（函数组件 + Hooks） |
| 语言 | TypeScript 5.6（`strict`） |
| 构建 | Vite 6 |
| UI | Ant Design 6 + @ant-design/icons 6 |
| 样式 | Sass（`src/styles/**/*.scss`）—— **未使用 Tailwind CSS** |
| 路由 | react-router-dom 7（`HashRouter`，`#/xxx`） |
| 状态管理 | zustand 5（封装为 `src/stores/createStore.ts` 工厂，对外暴露 `useStoreState` / `useStore`） |
| 请求 | 原生 `fetch`（**非 Axios**），收口于 `src/api/request.ts` |
| 内容渲染 | react-markdown / remark-gfm / turndown / sql-formatter |
| 包管理器 | pnpm 10（锁文件 `pnpm-lock.yaml` 入库） |

## 快速开始

```bash
# Node 18+（本机 v22）· pnpm 10（首次可用 corepack enable pnpm）
pnpm install       # 依赖安装（以 pnpm-lock.yaml 为准）
pnpm dev           # 开发服务器，端口 11161，可加 -- --port 18765 覆盖
pnpm build         # 产物在 dist/
pnpm preview       # 预览构建产物
pnpm typecheck     # tsc --noEmit
pnpm lint          # ESLint
pnpm standards     # 规范自检

./script011.sh gate        # 门禁：tsc → eslint → 规范自检
./script011.sh build011    # 门禁 + 生产构建
./script011.sh start011    # 启动开发服务器
./script011.sh             # 门禁 → 版本自增 → 提交白名单路径 → push
```

登录账号（Mock 模式）：**klsjnh / zhangsan / lisi**，密码与用户名相同（如 `klsjnh` / `klsjnh`）。开发态还支持免密登录（仅填用户名）。

## 数据模式（Mock / API）

顶栏左侧有 **MOCK**（绿）/ **API**（蓝）徽标，点击可运行时切换，选择持久化在 localStorage（`pc011-data-mode`）。

| 模式 | 行为 |
|---|---|
| **Mock**（默认） | 所有请求走内置 mock 后端 `src/mock/system011`，按真实 action 路径（`/julyXxx/v1/{动作}`）分发，离线可用 |
| **API** | 请求发往 `{apiBaseUrl}/{julyXxx}/v1/{动作}`；默认 `apiBaseUrl` 为 `/klsjnh/system011`（经 vite proxy 转发到后端 `http://192.168.3.160:11160`，免去 CORS） |

- **API 地址**：模式下拉里可直接修改，默认 `/klsjnh/system011`，持久化在 localStorage（`pc011-api-base-url`）。
- **环境变量**（可建 `.env.local`）：
  - `VITE_DATA_MODE`：`mock`（默认）| `api`，构建期默认模式
  - `VITE_API_BASE_URL`：默认 `/klsjnh/system011`
  - `VITE_RUN_STATE`：`development` | `production`，开发态可用免密登录

## 目录结构

```
├── Agent.md                     # 协作铁律 / 工作流（必读）
├── docs/                        # 文档库（项目信息 / 编码标准 / 接口契约 / 工作日志）
│   └── contracts/               # 运行时 OpenAPI 契约快照
├── tools/                       # check-klsjnh-react-standards.mjs 规范自检
├── script011.sh                 # 一体化脚本（gate / build011 / start011 / 默认提交）
├── vite.config.ts               # Vite 配置（含 /klsjnh 代理、@ 别名）
└── src/
    ├── main.tsx                 # 入口：StrictMode + HashRouter + antd reset.css
    ├── App.tsx                  # 根组件：ConfigProvider + 登录态分流路由
    ├── styles/                  # SCSS 主题与样式（_tokens / _base / components/ / pages/）
    ├── api/
    │   └── request.ts           # 请求封装：mock/API 统一路由 + 统一响应信封解包
    ├── config/
    │   ├── appConfig.ts         # 数据模式 / 运行态 / API 地址（localStorage 持久化）
    │   ├── routes.ts            # 路由常量 + 懒加载页面映射（唯一可信来源）
    │   ├── constants.ts         # 应用级静态配置
    │   └── theme.ts             # antd 主题（SEEDS 驱动多套换肤）
    ├── stores/                  # 状态管理（zustand 封装）
    │   ├── createStore.ts       # 通用 store 工厂（useStoreState / useStore）
    │   ├── authStore.ts         # 登录态 / 当前用户（token 与 user 均持久化）
    │   ├── uiStore.ts           # UI 状态（侧边栏收起等）
    │   ├── notificationStore.ts # 通知 + 未读数
    │   └── system011/           # 各模块 store（julyUser / julyRole / julyOrganization / julyMenu ...）
    ├── services/                # 业务编排（page → service → store）
    │   ├── system011/           # 各模块 service + actions.ts（action 路径常量）
    │   └── dataservice011(=datasource) / storageCenter / aiCenter(=aicenter) / lowcode011(已停用)
    ├── mock/                    # 内置 mock 后端（按真实 action 路径分发）
    ├── components/layout/       # 布局：Top（顶栏）/ Left（侧边栏）/ index
    ├── pages/
    │   ├── home/                # 仪表盘 + 登录页
    │   ├── system011/           # ★ 系统管理模块（julyXxx 全单词命名）
    │   ├── lowcode011/          # 低代码设计器 + 运行时（后端已迁往新项目，侧边栏入口隐藏，代码保留待处置）
    │   └── storageCenter/       # 存储中心
    ├── hooks/                   # useTableFillHeight
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

> 路由的**唯一可信来源**是 `src/config/routes.ts`（路径常量 + 懒加载页面映射），上表仅列常用项，未穷举低代码 / 存储中心 / 数据服务等路由。
> 侧边栏菜单分组（系统管理 / 系统工具等）来自 `config/constants.ts` 的 `GLOBAL_MENUS`（开发态默认），非开发态走接口 `julyMenu/v1/getUserMenuTree`（低代码 / 业务建模入口已按 2026-09-20 后端换版隐藏，见 `stores/system011/julyMenuStore.ts` 的 `HIDDEN_NAV_ROUTES`）。

## 架构要点

### 分层与数据流

统一按 **page → service → store** 分层，职责清晰：

- **page**：渲染 + 事件绑定，只读写 store 状态，不直接调 API；
- **service**（`src/services/system011/*`）：业务编排（拼装参数、写 store、刷新列表）；
- **store**（`src/stores/system011/*`）：只持有状态（基于 zustand 封装的 `createStore`）；
- **mock**（`src/mock/system011/*`）：内置 mock 后端，按 `actions.ts` 里的真实 action 路径分发，前端无需感知是否 mock。

`src/api/request.ts` 负责 mock / API 双模式路由：mock 模式直接命中内置 handler 并按统一信封解包；API 模式发真实 `fetch`。两者解包逻辑一致，业务代码无差别。

### 布局（components/layout）

- **Top（顶栏）**：数据模式切换（MOCK/API + API 地址配置 + 最近错误）→ 通知铃铛（红点未读数，点击跳消息通知页）→ 用户下拉（个人信息 / 修改密码 / 退出登录；修改密码为真实接口 `julyUser/v1/changePassword`）。
- **Left（侧边栏）**：分组菜单，依据当前路由自动展开所属分组（同时兼容配置菜单与接口菜单两种 key 形态），可折叠，状态经 `uiStore` 持久化。

### 状态管理

所有 store 基于 `zustand` 封装的 `createStore` 工厂（`src/stores/createStore.ts`），对外暴露 `useStoreState` / `useStore`（selector 订阅）。

| Store | 职责 | 持久化 |
|---|---|---|
| authStore | token + 当前用户 | 两者均存 localStorage（`token` / `pc011-auth-user`） |
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

- 错误码：`200` 成功；`400` 入参失败；`401` 未认证；`403` 无权限；`500` 服务端异常。非 200 时前端抛 `ApiError`；401（凭据类接口除外）统一清会话并由守卫跳登录（不做静默刷新）；失败信息记录在顶栏模式下拉的「最近错误」里。
- 兜底口径：仅 **消息通知列表**（`notificationStore`）在请求失败时保留本地数据不白屏，其余读取失败一律上抛，由页面处理。

## 前端开发约定（速览，完整版见 Agent.md）

- **提交时机**：仅在用户明确发出「提交 / push」指令时提交，禁止主动提交。
- **提交前置**：`./script011.sh gate` 全绿（tsc → eslint → 规范自检），且功能自测通过。
- **HTTP 规范**：业务接口统一 POST + JSON body；GET 仅用于无参/少参纯查询（如树查询），`api.get` 会把 body 序列化为 query string。
- **红线**：堆栈/SQL 不出站、凭证一律走环境变量、对外契约禁止破坏性变更。

## 已知遗留事项

- **路由形态待裁决**：现为 `App.tsx` `path="/*"` + `PAGE_MAP` 分发，与 `017.tech-debt-redlines` §A2「禁通配分发」冲突（见 `docs/2026-09-17.md` §三）。
- **未落地的规划能力**：`useCrudTable` / `createCrudStore` / `usePermission`；测试与 CI、`ErrorBoundary`、404/403 页面均未实现。
- **路由占位**：`online`、数据宝宝 `overview` / `query`、`settings` 等路由仍兜底到 `BusinessPage` / `Demo011`。
- **代理地址硬编码**：`vite.config.ts` 中 `/klsjnh` 指向 `192.168.3.160:11160`，待改为环境变量。
- `docs/` 规划的 `infrastructure011/`、`requirement011|013|015/`、`archive011/` 目录尚未建立。
