const fs = require('fs');
const path = require('path');

const pyDir = 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend\\plugins\\dev\\chemiframe\\chemiframe_py';

function fixImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixImports(fullPath);
    } else if (entry.name.endsWith('.py')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let original = content;
      
      content = content.replace(/from chemiframe\./g, 'from chemiframe_py.');
      content = content.replace(/import chemiframe\./g, 'import chemiframe_py.');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log('  Fixed:', path.relative(pyDir, fullPath));
      }
    }
  }
}

console.log('=== Fixing all Python imports ===');
fixImports(pyDir);
console.log('Done');
