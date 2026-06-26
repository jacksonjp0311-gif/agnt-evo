import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GitPullUpdates {
  constructor() { this.name = 'git-pull-updates'; }

  async execute(params, inputData, workflowEngine) {
    try {
      const baseDir = path.resolve(__dirname, '..', '..', '..', '..');
      const branch = params.branch || 'main';
      const strategy = params.strategy || 'fetch-only';
      const repoPath = baseDir;

      if (!fs.existsSync(path.join(repoPath, '.git'))) {
        return { error: 'Not a git repo: ' + repoPath };
      }

      const runCmd = (cmd) => {
        try { return execSync(cmd, { cwd: repoPath, encoding: 'utf8', timeout: 60000 }).trim(); }
        catch(e) { return 'ERR: ' + e.message.split('\n')[0]; }
      };

      // Ensure git user is set (fixes "Please tell me who you are")
      runCmd('git config user.email "jacksonjp0311@gmail.com"');
      runCmd('git config user.name "jacksonjp0311"');

      const currentBranch = runCmd('git branch --show-current');
      const localStatus = runCmd('git status --porcelain');

      // Fetch latest from origin
      runCmd('git fetch origin ' + branch);

      // Count incoming commits
      let commitCount = 0;
      try {
        commitCount = parseInt(runCmd('git rev-list HEAD..origin/' + branch + ' --count')) || 0;
      } catch(e) { commitCount = 0; }

      if (commitCount === 0) {
        return {
          report: 'Already up to date. No new commits on origin/' + branch + '. Local branch: ' + currentBranch + '. Status: ' + (localStatus || 'clean'),
          commits_pulled: 0,
          conflicts: [],
          status: 'up_to_date'
        };
      }

      if (strategy === 'fetch-only') {
        let commitLog = '';
        try { commitLog = runCmd('git log HEAD..origin/' + branch + ' --oneline'); } catch(e) {}
        const commits = commitLog.split('\n').filter(l => l.trim());
        const lines = [];
        lines.push('# Git Pull Preview (fetch-only)');
        lines.push('');
        lines.push('Branch: ' + currentBranch + ' -> origin/' + branch);
        lines.push('New commits: ' + commitCount);
        lines.push('Local changes: ' + (localStatus ? localStatus.split('\n').length + ' files' : 'none'));
        lines.push('');
        for (const c of commits) { lines.push('- ' + c); }
        if (localStatus) {
          lines.push('');
          lines.push('## Local Uncommitted Changes (will conflict)');
          lines.push(localStatus);
        }
        lines.push('');
        lines.push('To pull: run git pull origin ' + branch);
        return { report: lines.join('\n'), commits_pulled: 0, conflicts: localStatus ? localStatus.split('\n') : [], status: 'fetched' };
      }

      if (localStatus) {
        return {
          report: 'Local uncommitted changes detected. Commit or stash before pulling.\n\n' + localStatus,
          commits_pulled: 0,
          conflicts: localStatus.split('\n'),
          status: 'local_changes'
        };
      }

      // Pull
      if (strategy === 'rebase') {
        runCmd('git pull --rebase origin ' + branch);
      } else {
        runCmd('git pull origin ' + branch);
      }

      const log = runCmd('git log --oneline -' + commitCount);
      const lines = [];
      lines.push('# Git Pull Complete');
      lines.push('Strategy: ' + strategy);
      lines.push('Commits pulled: ' + commitCount);
      for (const l of log.split('\n')) { lines.push('- ' + l); }
      return { report: lines.join('\n'), commits_pulled: commitCount, conflicts: [], status: 'pulled' };
    } catch(e) {
      console.error('[' + this.name + '] Error:', e);
      return { error: e.message };
    }
  }
}

export default new GitPullUpdates();
