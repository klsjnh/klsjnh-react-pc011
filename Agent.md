# Agent.md — 协作手册（AI 助手 / 新开发者 · 跨语言通用）

> **定位**：本仓库的**协作铁律 · 标准工作流 · 架构原则**。
> **体系**：PC 前端 + Java 17 DDD 后端，统一沟通机制。

---

## 011.项目速览

- **一句话**：企业级管理系统 —— PC 前端 + Java 17 DDD 后端
- **技术栈**：React 18 + TypeScript + Vite（前端，本仓库 pc-admin）/ Java 17 + Spring Boot 3.4 + MyBatis-Plus（后端）
- **沟通机制**：统一响应信封 + POST + JSON body + camelCase

### 011.文档地图（前端仓库）

- 项目总览（启动 / 目录 / 路由 / 架构 / Mock-API 双模式）→ [`README.md`](README.md)
- 文档体系与编号约定（编号序列 / 归档规则）→ [`docs/011.agreements.md`](docs/011.agreements.md)
- 项目信息（背景 / 前后端模块对应关系）→ [`docs/013.project-info.md`](docs/013.project-info.md)
- 前端编码标准（页面统一写法 / store 模式 / 命名规范）→ [`docs/015.coding-standards.md`](docs/015.coding-standards.md)
- 接口契约（信封六键 / 状态码 / 前端请求行为）→ [`docs/016.api-contract.md`](docs/016.api-contract.md)
- docs 索引与工作日志 → [`docs/README.md`](docs/README.md)、`docs/{YYYY-MM-DD}.md`
- 后端框架仓库（权威契约源 / 业务设计 018 菜单 · 019 用户 · 022 角色）→ `klsjnh-java17-framework011` 的 `Agent.md` 与 `docs/`

## 015.铁律

### 011.提交时机
- 只有用户明确发出「提交 / push」指令时才提交，禁止主动提交

### 013.提交前置
- 前端：`npm run build` 无报错
- 后端：`mvn clean verify` 全绿
- 接口经过自测

### 017.HTTP 方法规范
- 业务接口统一 **POST + JSON body**
- GET 仅用于无参或简单参数的纯查询
- 禁止 `@PathVariable`
- URL 结构：`/api/v1/{模块}/{动作}`

### 018.架构原则（DDD 四层）

```
server-interfaces     → REST 控制器、DTO、统一信封
    ↓
server-application    → 应用服务、命令、查询
    ↓
server-domain         → 聚合根、实体、值对象、仓储接口
    ↓
server-infrastructure → 持久化实现、配置、安全
```

- **依赖单向**：interfaces → application → domain ← infrastructure
- **事务只在 application 层**
- **PO 不出站**：interfaces 层只接收/返回 DTO
- **构造器注入**，禁止字段注入

## 017.标准开发流程

```
需求 → docs/ 记录决策 → 拆任务 → 编码 → 构建验证 → 自测 → 汇报 → 提交
```

## 020.红线

- 堆栈/SQL 不出站
- 凭证一律环境变量
- PO 不出站（转 DTO）
- 对外契约禁止破坏性变更
