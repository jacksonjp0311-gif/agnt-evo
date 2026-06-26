import tar from 'tar';
import fs from 'fs';
import path from 'path';

const pluginDir = path.join("C:\\Users\\jacks\\OneDrive\\Desktop\\Tessera", 'agnt-plugin');
const outputFile = path.join("C:\\Users\\jacks\\OneDrive\\Desktop\\Tessera", 'tessera.agnt');

await tar.c({
  gzip: true,
  file: outputFile,
  cwd: pluginDir,
  filter: (filePath) => {
    const name = path.basename(filePath);
    return ['manifest.json', 'package.json', 'index.js', 'README.md'].includes(name);
  }
}, ['manifest.json', 'package.json', 'index.js', 'README.md']);

console.log('Package built:', outputFile);
console.log('Size:', fs.statSync(outputFile).size, 'bytes');
