import { readFileSync } from 'fs';
for (const f of ['src/types/ai011/aiModelProvider/vo.ts', 'src/types/dataservice011/businessModeling.ts']) {
  const b = readFileSync(f);
  console.log('===', f, 'len=', b.length);
  const lines = b.toString().split('\n');
  for (const idx of [5, 6, 137, 138, 139]) {
    if (idx >= lines.length) continue;
    const line = lines[idx];
    console.log(`L${idx + 1}:`, JSON.stringify(line));
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const cp = c.codePointAt(0);
      if (cp > 0x7f || cp === 0x2f || cp === 0x2a) {
        console.log(`   [%d] %s U+%s`, j, c, cp.toString(16).padStart(4, '0'));
      }
    }
  }
}
