# Agent.md — AI 协作入口（跨项目 / 跨语言通用）

> **本文是【项目无关】的门牌层** —— 只回答一件事：**进门先看什么、按什么顺序看**。
> 协议内容（协作铁律 / 标准开发流程 / 编号规则 / 归档规则）**一律不在本文展开**，全部归 `docs/011.agreements.md`。
> 可原样复制到任意项目（Go / Vue / React / Java / Python …），**只换内容，不改结构**。
> **首要原则**：文档的第一消费者是 AI —— 一个事实只有一个家，需要互引时用链接，**不复制正文**。

---

## 1. 知识库地图（按顺序读）

`docs/` 的**目录结构全项目恒定**，与语言无关。按以下顺序加载上下文 —— **从纪律到技术，再到业务**：

```text
docs/
├── 011.agreements.md          # Cooperation conventions (supreme rule) — read FIRST
├── 013.api-contract.md        # API contract (URL / envelope / auth / paging)
├── 015.project-info.md        # Project info (stack / build / run / capabilities)
├── 016.coding-standards.md    # Coding standards for THIS language
├── 017.tech-debt-redlines.md  # Tech-debt redlines (reference impl audit)
├── 019.lowcode011-findings.md # lowcode011 module findings (backend API inventory)
├── 020.lowcode011-interface-matrix.md # lowcode011 endpoint matrix (real / pending)
├── 021.aicenter-prompt-redesign-findings.md # aicenter prompt redesign findings
├── 031.pc-ui-standard.md      # PC UI standard (buttons / toolbar / page skeletons)
├── contracts/                 # Runtime OpenAPI snapshots ({YYYY-MM-DD}-openapi.json)
├── dev-guides/                # Per-form development guides (single-table / master-sub / tree-master-sub)
├── infrastructure011/         # Architecture topics — (待建)
├── requirement011/            # Raw requirements (business perspective) — (待建)
├── requirement013/            # High-level design (scheme & architecture)
├── requirement015/            # Detailed design (API / data model / constraints) — (待建)
├── {YYYY-MM-DD}.md            # Daily work log & task list
├── {YYYY-MM-DD}-chat.md       # Daily raw conversation log
└── archive011/                # Historical archives (flat storage)
```

> **注意**：本目录树中**根级文件**按**编号升序**排（回答「有哪些」），**目录**按其职能分组列于其后；下方**阅读顺序表**按「从纪律到技术，再到业务」排 —— **两处顺序不同是有意的，不是笔误**。

**阅读顺序（不可颠倒）** —— **编号即定位**，与 `011.agreements` §015 目录语义一一对应：

| 编号 | 位置（恒定） | 读什么 | 读它的目的 |
|------|-------------|--------|-----------|
| `011` | [011.agreements.md](docs/011.agreements.md) | 协作约定 · **最高准则** | **协议全集** —— 标准开发流程（七步）/ 协作铁律 / 编号规则 / 目录语义 / 归档规则 |
| `016` | [016.coding-standards.md](docs/016.coding-standards.md) | 本项目编码标准 | 本语言怎么编（分层 / 命名 / 风格 / 门禁） |
| `013` | [013.api-contract.md](docs/013.api-contract.md) | 接口契约 | 前后端怎么对话（信封 / 状态码 / 分页 / 鉴权） |
| `019` | [019.lowcode011-findings.md](docs/019.lowcode011-findings.md) | 低代码模块现状 | 后端 `lowcode011/julyMetadata` 接口清单与一主三子模型、实测踩坑 |
| `017` | [017.tech-debt-redlines.md](docs/017.tech-debt-redlines.md) | 技术债红线 | 参考实现踩过的坑，**不要重蹈** |
| `031` | [031.pc-ui-standard.md](docs/031.pc-ui-standard.md) | PC 端 UI 标准 | 页面按钮 / 工具栏 / 表格 / 表单动作的统一下限 |
| `contracts/` | [docs/contracts/](docs/contracts/) | 运行时 OpenAPI 快照 | 定义或核对接口字段时（契约唯一真源） |
| `dev-guides/` | [docs/dev-guides/](docs/dev-guides/) | 分形态开发手册（单表 / 主子表 / 树主子表） | 按页面形态照蓝本开发时 |
| `011→013→015` | `docs/requirement011/` → `docs/requirement013/` → `docs/requirement015/`（`requirement013` 已有落盘，其余**待建**） | 需求三档 | 这个需求要做什么（原始 → 概要 → 详细） |
| `infrastructure011` | `docs/infrastructure011/`（**待建**） | 架构专题 | 系统架构与技术体系（技术设计输入） |
| `015` | [015.project-info.md](docs/015.project-info.md) | 项目事实卡 | 本项目事实（栈 / 构建 / 运行 / 能力）—— **具体命令在这里** |

> **路径是协议，内容是实例**：上表每一项对应的**文件位置**在任意项目里一字不改（见上方目录树）；变的只是各文件里的文章。  
> **日常动态文件**：每日工作日志 (`docs/{YYYY-MM-DD}.md`)、原始对话 (`docs/{YYYY-MM-DD}-chat.md`) 与历史归档 (`docs/archive011/`) 按需在处理具体任务或追溯历史上下文时加载。  
> **`[PLANNED]` 标记与待建约束**：标注为 `[PLANNED]` 或（待建）的文件属规划态，禁止写成链接。若目标文件尚未落盘，AI 不得尝试强制读取该文件或报错，跳过并结合当前上下文补充即可。  
> **编号即定位** —— 全文（含 `011.agreements`、`015.project-info` 等）一律用编号指路，**不使用「第 N 序」**。
---

## 2. 六条红线（最高频 · 完整条款见 `docs/011.agreements.md`）

以下是**最高频、最易犯**的六条，故前置提示；**完整条款一律以 `docs/011.agreements.md` 为准** —— 前五条见 `§011.铁律`，第六条见 `§018.代码先行审查`。

- **禁止主动提交** —— 只有用户明确发出「提交 / 推送 / push」指令才能执行；写操作只经提交脚本，禁直接用原生 `git` 提交
- **只读可自主** —— `pull` / `status` / `diff` / `log` / `branch` / `checkout` / `switch` 等只读及本地状态操作可自主执行
- **高危需授权** —— 执行提交脚本、删除文件 / 分支、数据库 Destructive 变更，必须经用户明确授权
- **本机执行，禁沙箱** —— 长命令（编译 / 测试）脱钩执行：后台运行 + 输出写日志，再从文件读结果
- **契约优先，mock 不设限** —— 对齐接口以**真实契约**为唯一真源；用户没说「mock」就**不改 mock、不以 mock 为约束**（见 `§011 · 018`）
- **代码先行审查** —— 涉及底层公共库修改、多模块联动或破坏性重构时，**动手前**先汇报设计思路 / 关键路径 / 风险点，获认可再编码（条款见 `§018.代码先行审查`）
