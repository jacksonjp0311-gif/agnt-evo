import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

const TRAJECTORY_DIR = path.join(APP_PATH, '.trajectory');

class TrajectoryRecall {
  constructor() { this.name = 'trajectory-recall'; }

  async execute(params, inputData, workflowEngine) {
    try {
      const query = (params.query || '').trim();
      const limit = params.limit || 20;
      const sessionId = params.session_id || null;

      let allPoints = [];

      // Load from disk
      try {
        if (fs.existsSync(TRAJECTORY_DIR)) {
          const files = fs.readdirSync(TRAJECTORY_DIR).filter(f => f.endsWith('.jsonl'));
          const targets = sessionId ? files.filter(f => f.includes(sessionId)) : files;
          for (const file of targets.sort().reverse()) {
            const content = fs.readFileSync(path.join(TRAJECTORY_DIR, file), 'utf8');
            for (const line of content.split('\n')) {
              if (line.trim().length === 0) continue;
              try {
                const pt = JSON.parse(line);
                pt._src = file.replace('.jsonl', '');
                allPoints.push(pt);
              } catch(e) {}
            }
          }
        }
      } catch(e) {}

      // Merge with in-memory
      if (globalThis.__trajectory_points) {
        for (const p of globalThis.__trajectory_points) {
          const isDup = allPoints.some(a => a.timestamp === p.timestamp && a.tool_name === p.tool_name);
          if (!isDup) allPoints.push(p);
        }
      }

      // Sort by time
      allPoints.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime() || 0;
        const tb = new Date(b.timestamp).getTime() || 0;
        return ta - tb;
      });

      // Filter by query
      let results = allPoints;
      if (query.length > 0) {
        const q = query.toLowerCase();
        results = allPoints.filter(p => {
          const tn = (p.tool_name || '').toLowerCase();
          const at = (p.action_type || '').toLowerCase();
          const ctx = (p.context || '').toLowerCase();
          const sid = (p.session_id || '').toLowerCase();
          if (tn.indexOf(q) >= 0) return true;
          if (at.indexOf(q) >= 0) return true;
          if (ctx.indexOf(q) >= 0) return true;
          if (sid.indexOf(q) >= 0) return true;
          return false;
        });
      }

      results = results.slice(-limit);

      const sessions = [];
      const seen = new Set();
      for (const p of allPoints) {
        if (p.session_id && !seen.has(p.session_id)) {
          seen.add(p.session_id);
          sessions.push(p.session_id);
        }
      }

      return { results, count: results.length, sessions: sessions.slice(-20) };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }
}

export default new TrajectoryRecall();
