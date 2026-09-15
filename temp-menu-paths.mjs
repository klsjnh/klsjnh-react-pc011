import fs from 'fs';
const data = fs.readFileSync('docs/swagger-live.json', 'utf8');
const json = JSON.parse(data);
const paths = Object.keys(json.paths);
const menuPaths = paths.filter(p => p.toLowerCase().includes('menu'));
fs.writeFileSync('docs/menu-paths.json', JSON.stringify(menuPaths, null, 2));
console.log('Menu paths:', menuPaths);
