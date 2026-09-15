import fs from 'fs';
const json = JSON.parse(fs.readFileSync('docs/swagger-live.json', 'utf8'));
const paths = Object.keys(json.paths);
const menuPaths = paths.filter(p => p.toLowerCase().includes('menu'));
console.log('Count:', menuPaths.length);
menuPaths.forEach(p => console.log(p));
