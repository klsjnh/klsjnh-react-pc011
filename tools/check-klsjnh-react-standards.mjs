/**
 * klsjnh-react-pc011 规范自检脚本（Agent.md / 011.agreements / 015+016.coding-standards / 017.tech-debt-redlines）
 * 自包含：仅用 Node 内置模块，不依赖 eslint，可直接 `node tools/check-klsjnh-react-standards.mjs` 运行。
 *
 * 设计原则：
 *  - ERROR 级：明确违反「硬规矩」且本项目已整改到位者，必须为零（否则门禁失败）。
 *  - WARN 级：需人审的柔性项（如 `any` 的合理使用），仅提示不阻断。
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC = 'src';
const EXT = new Set(['.ts', '.tsx']);

// ERROR 级硬规则：正则 => 规则说明
const ERROR_RULES = [
  [/React\.FC\b/g, '禁止 React.FC 类型注解（§8.4：React19 下无必要且隐式 children）'],
  [/\bpassWord\b/g, '禁止字段别名 passWord，必须 password（§3.4/B2）'],
  [/import\.meta\s+as\s+any/g, '禁止 import.meta as any，改用 vite-env.d.ts 提供类型'],
  [/^\s*\/\/\s*@ts-ignore/gm, '禁止 @ts-ignore（§3.1/B3）'],
  [/^\s*\/\/\s*@ts-expect-error/gm, '禁止 @ts-expect-error（§3.1/B3）'],
  [/console\.(log|debug)\b/g, '禁止 console.log / console.debug（仅允许 toast 提示）'],
  [/(?:from|import\()\s*['"]\.\.?\/[^'"]+['"]/g, '禁止相对路径导入，统一使用 @/ 别名（§6）'],
];

// WARN 级：需人审项
const WARN_RULES = [
  [/\bas\s+any\b/g, '存在 as any（§3.1/B3 禁 any，仅异构组件注册表等少数场景允许，请确认）'],
  [/: any\b|<any>|any\[\]/g, '存在 any 类型标注（§3.1/B3 禁 any，请确认是否必要）'],
];

const errors = [];
const warnings = [];

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXT.has(extname(e.name))) scan(p);
  }
}

function scan(file) {
  const text = readFileSync(file, 'utf8');
  const rel = file;
  for (const [re, msg] of ERROR_RULES) {
    const hits = text.match(re);
    if (hits) errors.push({ file: rel, count: hits.length, msg });
  }
  for (const [re, msg] of WARN_RULES) {
    const hits = text.match(re);
    if (hits) warnings.push({ file: rel, count: hits.length, msg });
  }
}

walk(SRC);

function print(list, tag) {
  if (!list.length) return;
  for (const it of list) {
    console.log(`  [${tag}] ${it.file} (${it.count})  ${it.msg}`);
  }
}

console.log('=== klsjnh-react-pc011 规范自检 ===');
if (errors.length) {
  console.log(`\n发现 ${errors.length} 处硬规则违规（ERROR）：`);
  print(errors, 'ERROR');
}
if (warnings.length) {
  console.log(`\n提示 ${warnings.length} 处需人审项（WARN）：`);
  print(warnings, 'WARN');
}
if (!errors.length && !warnings.length) {
  console.log('未发现违规项。');
}

console.log(`\n结果：ERROR ${errors.length} / WARN ${warnings.length}`);
process.exit(errors.length ? 1 : 0);
