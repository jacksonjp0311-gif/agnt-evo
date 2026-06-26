const { execSync } = require('child_process');
const path = 'C:\\\\Users\\\\jacks\\\\OneDrive\\\\Desktop\\\\agnt-evo\\\\backend\\\\plugins\\\\dev\\\\chemiframe';

// Remove stray files
['final_verification.py', 'push_plugin.bat', 'run_git.js', 'rule-based)'].forEach(f => {
  try {
    execSync(`del /F /Q "${path}\\${f}" 2>nul`);
    console.log('Removed:', f);
  } catch(e) {}
});

// Check status
try {
  const status = execSync(`git -C "${path}" status --short`, { encoding: 'utf-8' });
  console.log('Git status:', status);
} catch(e) {
  console.log('Clean or error:', e.message);
}