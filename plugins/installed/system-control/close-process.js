import { execSync, exec } from 'child_process';

class CloseProcess {
  constructor() {
    this.name = 'close-process';
  }

  async execute(params) {
    try {
      const { pid, processName, killAll = false, force = true } = params;

      if (!pid && !processName) {
        return { success: false, error: 'Either pid or processName is required' };
      }

      const killed = [];

      if (pid) {
        // Kill by PID
        const pidNum = parseInt(pid);
        if (isNaN(pidNum)) {
          return { success: false, error: `Invalid PID: ${pid}` };
        }

        const flag = force ? '/F' : '';
        const cmd = `taskkill ${flag} /PID ${pidNum}`.trim();

        try {
          const output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
          killed.push({ pid: pidNum, name: 'unknown', output: output.trim() });
        } catch (err) {
          // Check if process was already gone
          if (err.stderr && err.stderr.includes('not found')) {
            return { success: false, error: `Process with PID ${pidNum} not found (may already be closed)` };
          }
          return { success: false, error: `Failed to kill PID ${pidNum}: ${err.message}` };
        }
      } else if (processName) {
        // Kill by process name
        const name = processName.trim().endsWith('.exe')
          ? processName.trim()
          : processName.trim() + '.exe';

        const flag = force ? '/F' : '';
        const allFlag = killAll ? '/T' : '';  // /T kills child processes too
        const cmd = `taskkill ${flag} /IM ${name} ${allFlag}`.trim();

        try {
          const output = execSync(cmd, { encoding: 'utf8', timeout: 15000 });

          // Parse output to find killed PIDs
          const lines = output.split('\n');
          for (const line of lines) {
            const pidMatch = line.match(/PID:\s*(\d+)/i);
            const nameMatch = line.match(/SUCCESS:\s*The process\s+"([^"]+)"/i);
            if (pidMatch) {
              killed.push({
                pid: parseInt(pidMatch[1]),
                name: nameMatch ? nameMatch[1] : name,
                output: line.trim()
              });
            }
          }

          if (killed.length === 0) {
            // Might still have succeeded
            killed.push({ pid: -1, name: name, output: output.trim() });
          }
        } catch (err) {
          if (err.stderr && err.stderr.includes('not found')) {
            return { success: false, error: `No running process found matching '${name}'` };
          }
          return { success: false, error: `Failed to kill '${name}': ${err.message}` };
        }
      }

      console.log(`[${this.name}] Killed ${killed.length} process(es):`, killed.map(k => `${k.name} (PID: ${k.pid})`).join(', '));

      return {
        success: true,
        killed
      };
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new CloseProcess();
