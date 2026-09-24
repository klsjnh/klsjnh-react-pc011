# docs/contracts — 运行时契约快照

> 本目录存放后端运行时 OpenAPI 的**落盘快照**，是前端类型字段名的唯一真源（见 [017.tech-debt-redlines](../017.tech-debt-redlines.md) §C1）。

## 命名约定

```
{YYYY-MM-DD}-openapi.json
```

- 日期 = **快照对应的后端时点**，不是导出当天（依据：与当时工作日志里记录的端点总数 / 模块条数核对）。
- 新增快照按此命名，**同一服务只保留最新一份**；旧快照确需留存时在文件名后补 `-{说明}`，不另起目录。

## 当前快照

| 文件 | 时点 | 端点总数 | 说明 |
|------|------|----------|------|
| `2026-09-24-openapi.json` | 2026-09-24 | 194 | **当前**。后端换版至 `192.168.3.160:11130`：`julyMenu` / `julyOrganization` 迁至 `iam`；`julyAiPrompt`（5）删除 → `julyAiDomain`（17）；新增 `iam/julyPermCatalog`、`julyRole.assignObjectActions/getPermissionCodes`、`julyDictionary.import`、storage/ai/datasource 的 `getWithChildren`·`saveWhole`、`julyObject` 4 个新动作；schema 240（新增 32 / 删除 8）。模块分布 iam 47 / system011 28 / messagecenter 33 / storagecenter 29 / aicenter 36 / datasource 16 / demo11 5 |
| `2026-09-20-openapi.json` | 2026-09-20（下午刷新） | 168 | 前版（11160）：新增 aicenter/julyAiPrompt（提示词，+5）与 datasource/julySql·julySync（+6）；模块分布 iam 25 / system011 45 / storagecenter 24 / messagecenter 33 / aicenter 22 / datasource 14 / demo11 5 |

> 差异明细（搬家 / 删除 / 新增 / 字段变化）见 [requirement013/013.backend-realign-11130.md](../requirement013/013.backend-realign-11130.md)。

## 脱敏与整理

- **已剔除 `servers`**：原快照含内网地址，入库前移除（`011.agreements` §017 脱敏口径）。
- 原始快照带 UTF-8 BOM，本文件已去除 BOM 并统一 2 空格缩进，便于 diff 与人工/AI 阅读。

## 与代码的对应

- `src/types/system011/**/vo.ts`：字段名与本快照**逐字一致**，不做「前端更顺眼」的改名（§B2 / §C3）。
- 若后端端点变更：**先取新快照落盘** → 再改 `types` 与 `services`，不要反过来。
