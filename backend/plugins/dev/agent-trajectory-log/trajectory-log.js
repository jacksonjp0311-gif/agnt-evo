import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

const TRAJECTORY_DIR = path.join(APP_PATH, '.trajectory');

class TrajectoryLog {
  constructor() { this.name = 'trajectory-log'; }

  async execute(params, inputData, workflowEngine) {
    try {
      const actionType = params.action_type || 'tool_call';
      const toolName = params.tool_name || 'unknown';
      const sessionId = params.session_id || 'default';
      const context = params.context || '';
      const success = params.success !== false;

      const point = {
        action_type: actionType,
        tool_name: toolName,
        session_id: sessionId,
        context,
        success,
        timestamp: new Date().toISOString()
      };

      // Ensure trajectory dir exists
      try { fs.mkdirSync(TRAJECTORY_DIR, { recursive: true }); } catch(e) {}

      // Write to JSONL file (append mode)
      const fp = path.join(TRAJECTORY_DIR, sessionId + '.jsonl');
      try {
        fs.appendFileSync(fp, JSON.stringify(point) + '\n');
      } catch(e) {
        // If we can't write to disk, that's ok - still log in memory
      }

      // Also maintain in-memory for fast access
      if (!globalThis.__trajectory_points) globalThis.__trajectory_points = [];
      globalThis.__trajectory_points.push(point);
      if (globalThis.__trajectory_points.length > 1000) {
        globalThis.__trajectory_points = globalThis.__trajectory_points.slice(-1000);
      }

      return {
        logged: true,
        trajectory_length: globalThis.__trajectory_points.length
      };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }
}

export default new TrajectoryLog();
