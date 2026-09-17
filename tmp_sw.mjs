import { readFileSync } from 'fs';
let txt = readFileSync('docs/swagger-live.json', 'utf8');
if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
const s = JSON.parse(txt);
const ep = s.paths?.['/klsjnh/storagecenter/julyStorage/v1/testConnection'];
if (!ep) { console.log('NO_ENDPOINT_FOUND'); process.exit(0); }
console.log('=== testConnection endpoint ===');
console.log(JSON.stringify(ep, null, 2));
