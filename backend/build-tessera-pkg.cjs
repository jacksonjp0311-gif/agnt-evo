const tar = require('tar');
const fs = require('fs');
const path = require('path');
const pluginDir = path.join("C:\\Users\\jacks\\OneDrive\\Desktop\\Tessera", 'agnt-plugin');
const outputFile = path.join("C:\\Users\\jacks\\OneDrive\\Desktop\\Tessera", 'tessera.agnt');
tar.c({
  gzip: true, file: outputFile, cwd: pluginDir, prefix: 'tessera-neural-sidecar',
  filter: (fp) => ['manifest.json', 'package.json', 'index.js', 'README.md'].includes(path.basename(fp))
}, ['manifest.json', 'package.json', 'index.js', 'README.md']).then(() => {
  console.log('Built:', outputFile, fs.statSync(outputFile).size, 'bytes');
}).catch(e => console.error('Error:', e.message));
