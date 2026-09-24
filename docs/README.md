# docs — 前端知识库索引（pc-admin）

> 文档体系与编号约定：[011.agreements.md](011.agreements.md)（跨语言通用，含编号规则与归档规则）。
> 项目总览（启动 / 目录 / 路由 / 架构 / 双数据模式）：[../README.md](../README.md)。

## 阅读入口

| 文档 | 内容 |
|------|------|
| [../Agent.md](../Agent.md) | **协作手册**（先读）：铁律、HTTP 规范、标准流程、红线 |
| [../README.md](../README.md) | **项目总览**：快速开始、目录结构、路由表、架构要点、双数据模式 |
| [011.agreements.md](011.agreements.md) | 文档体系与编号约定（本文档体系宪法） |
| [015.project-info.md](015.project-info.md) | **项目事实卡**：定位、技术栈、目录、分层、构建运行、当前能力与缺口 |
| [016.coding-standards.md](016.coding-standards.md) | 前端编码标准（PC 页面统一写法 / store 模式 / 命名规范；未落地项标 `[PLANNED]`） |
| [013.api-contract.md](013.api-contract.md) | API 契约（信封六键 + 状态码 + 前端请求行为） |
| [017.tech-debt-redlines.md](017.tech-debt-redlines.md) | 技术债红线（架构 / 类型 / 契约 / 门禁 / 文档） |
| [019.lowcode011-findings.md](019.lowcode011-findings.md) | **低代码模块现状**：后端 `lowcode011/julyMetadata` 接口清单与一主三子模型、实测踩坑、与 `julyBusinessModeling` 的字段/方法错配清单、待拍板的实现方案 |
| [020.lowcode011-interface-matrix.md](020.lowcode011-interface-matrix.md) | **低代码接口对照矩阵**：三档分流 —— A 真实接口已对接 / B 契约错配已修正 / C PENDING-BACKEND 前端占位（附实时 OpenAPI 证据与后端补齐后的切换方式） |
| [021.aicenter-prompt-redesign-findings.md](021.aicenter-prompt-redesign-findings.md) | **AI 提示词线重构评估**：线上 bundle 新契约实测（julyAiDomain 域树+提示词明细+saveWhole）、当天两次快照对照、迁移实施记录（KlsjnhTreeList011 树面板组件 + 15 文件重写，已完成） |
| [031.pc-ui-standard.md](031.pc-ui-standard.md) | **PC 端 UI 标准**：按钮 / 工具栏 / 表单按钮 / 页面骨架统一写法与基准实现（【评审】类规则） |

## 专题与知识库

| 目录 / 文件 | 内容 |
|------|------|
| `contracts/` | 运行时 OpenAPI 契约快照（命名与脱敏见 [contracts/README.md](contracts/README.md)） |
| `dev-guides/` | 开发手册（文件名与标题英文、内容中文）：[011.single-table-dev-standard](dev-guides/011.single-table-dev-standard.md) — 以配置管理为蓝本的单表页面开发流水线（3 文件拆分 / 壳-表-弹窗职责 / 五色按钮 / 备注状态铁律 / 提交自查清单）；[013.master-sub-dev-standard](dev-guides/013.master-sub-dev-standard.md) — 以字典管理为蓝本的主子表（上下结构）开发流水线（4 文件拆分 / 单行靠左工具栏 / 固定分页 10 / 子表草稿模型）；[022.tree-master-sub-dev-standard](dev-guides/022.tree-master-sub-dev-standard.md) — 以 AI 提示词管理为蓝本的树主子表（左树右表）开发流水线（6 文件拆分 / KlsjnhTreeList011 树原语 / 右键菜单 / 明细按域直查 / 2026-09-22 金标准；原 014 违反「跳 4」铁律，2026-09-24 更正为 022） |
| `requirement011|013|015/` | 需求三档（原始 / 概要 / 详细）：[requirement013/013.backend-realign-11130](requirement013/013.backend-realign-11130.md) — 后端换版（11160 → 11130）对齐技术方案（模块搬家 / 端点重构 / 新增能力） |
| `2026-09-17.md` · `2026-09-24.md` | 当日工作日志（每日一份，历史归档至 `archive011/`） |
| `archive011/` | 历史工作日志归档 |
