import { execSync, exec } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

class OpenFile {
  constructor() {
    this.name = 'open-file';
  }

  async execute(params) {
    try {
      const { filePath, selectInFolder = false } = params;

      if (!filePath) {
        return { success: false, error: 'filePath is required' };
      }

      // Resolve relative paths
      const resolvedPath = path.resolve(filePath.trim());

      if (!existsSync(resolvedPath)) {
        return { success: false, error: `File not found: ${resolvedPath}` };
      }

      let command;
      if (selectInFolder) {
        // Open folder and highlight the file
        command = `explorer.exe /select,"${resolvedPath}"`;
      } else {
        // Open file with default program
        command = `start "" "${resolvedPath}"`;
      }

      // Use exec (non-blocking) so we don't wait for the app to close
      const child = exec(command, { windowsHide: false }, (error) => {
        if (error) {
          console.error(`[${this.name}] Error:`, error);
        }
      });

      const pid = child.pid;

      console.log(`[${this.name}] Opened: ${resolvedPath} (PID: ${pid})`);

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

export default new OpenFile();
