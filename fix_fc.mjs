import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const srcRoot = 'src';
const exts = new Set(['.tsx', '.ts']);
const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.has(extname(e.name))) files.push(p);
  }
})(srcRoot);

let touched = 0;
for (const file of files) {
  let s = readFileSync(file, 'utf8');
  const orig = s;

  // 1) export const X: React.FC = () =>   ->  export const X = () =>
  s = s.replace(/(\bexport const \w+): React\.FC = \(\) =>/g, '$1 = () =>');

  // 2) export const X: React.FC<Props> = () =>   (无参，仅占位类型) -> export const X = () =>
  s = s.replace(/(\bexport const \w+): React\.FC<\w+> = \(\) =>/g, '$1 = () =>');

  // 3) export const X: React.FC<Props> = (PARAMS) =>  ->  export const X = (PARAMS: Props) =>
  s = s.replace(
    /(\bexport const \w+): React\.FC<(\w+)> = \((\{[^}]*\}|[^)]*)\) =>/g,
    '$1 = ($3: $2) =>'
  );

  // 4) Record<string, React.FC<any>> 注解去除（让 TS 推断）
  s = s.replace(/: Record<string, React\.FC<any>>/g, '');

  if (s !== orig) {
    writeFileSync(file, s);
    touched++;
  }
}
console.log(`touched ${touched} files`);
