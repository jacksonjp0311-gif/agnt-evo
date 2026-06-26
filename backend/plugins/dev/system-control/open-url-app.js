import { exec } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

class OpenUrlApp {
  constructor() {
    this.name = 'open-url-app';
  }

  async execute(params) {
    try {
      const { target, arguments: args, workingDirectory } = params;

      if (!target) {
        return { success: false, error: 'target is required' };
      }

      const trimmedTarget = target.trim();
      let command;

      // Detect if it's a URL
      if (/^https?:\/\//i.test(trimmedTarget)) {
        // Open URL in default browser
        command = `start "" "${trimmedTarget}"`;
      }
      // Detect if it's an absolute path to an executable
      else if (trimmedTarget.includes(':\\') || trimmedTarget.startsWith('\\\\')) {
        const resolved = path.resolve(trimmedTarget);
        if (!existsSync(resolved)) {
          return { success: false, error: `Program not found: ${resolved}` };
        }
        const argStr = args ? ` ${args}` : '';
        command = `start "" "${resolved}"${argStr}`;
      }
      // Otherwise treat as a program name or command
      else {
        const argStr = args ? ` ${args}` : '';
        command = `start "" ${trimmedTarget}${argStr}`;
      }

      const options = { windowsHide: false };
      if (workingDirectory) {
        options.cwd = path.resolve(workingDirectory.trim());
      }

      const child = exec(command, options, (error) => {
        if (error) {
          console.error(`[${this.name}] Error:`, error);
        }
      });

      const pid = child.pid;

      console.log(`[${this.name}] Launched: ${trimmedTarget} (PID: ${pid})`);

      return {
        success: true,
        pid: pid || -1
      };
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new OpenUrlApp();
