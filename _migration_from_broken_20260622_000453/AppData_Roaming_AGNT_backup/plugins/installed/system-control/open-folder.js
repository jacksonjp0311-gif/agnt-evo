import { exec } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

class OpenFolder {
  constructor() {
    this.name = 'open-folder';
  }

  async execute(params) {
    try {
      const { folderPath } = params;

      if (!folderPath) {
        return { success: false, error: 'folderPath is required' };
      }

      const resolvedPath = path.resolve(folderPath.trim());

      if (!existsSync(resolvedPath)) {
        return { success: false, error: `Folder not found: ${resolvedPath}` };
      }

      const command = `explorer.exe "${resolvedPath}"`;

      exec(command, { windowsHide: false }, (error) => {
        if (error) {
          console.error(`[${this.name}] Error:`, error);
        }
      });

      console.log(`[${this.name}] Opened folder: ${resolvedPath}`);

      return { success: true };
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new OpenFolder();
