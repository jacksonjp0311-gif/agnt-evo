import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

const TRAJECTORY_DIR = path.join(APP_PATH, '.trajectory');

class TrajectoryAnalyze {
  constructor() { this.name = 'trajectory-analyze'; }

  async execute(params, inputData, workflowEngine) {
    try {
      const windowSize = params.window_size || 20;
      const includeRecs = params.include_recommendations !== false;

      // Load trajectory points from disk
      const points = this._loadTrajectory(windowSize);

      if (points.length < 3) {
        return {
          signal: 'TRUST',
          confidence: 0.9,
          patterns: ['insufficient_data'],
          recommendations: [],
          error_rate: 0,
          report: 'Not enough trajectory data for analysis (need at least 3 points, have ' + points.length + '). Default: TRUST.'
        };
      }

      const patterns = [];
      const recommendations = [];

      // === PATTERN 1: Loop Detection ===
      // Look for repeated tool_name + context patterns
      const recentTools = points.slice(-10).map(p => p.tool_name);
      const loopScore = this._detectLoop(recentTools);
      if (loopScore > 0.6) {
        patterns.push('loop_detected');
        if (includeRecs) {
          recommendations.push('Break the loop: try a different approach or tool. Current pattern: ' + recentTools.slice(-3).join(' -> '));
        }
      }

      // === PATTERN 2: Error Rate Spike ===
      const errorRate = points.filter(p => !p.success).length / points.length;
      if (errorRate > 0.3) {
        patterns.push('high_error_rate');
        if (includeRecs) {
          recommendations.push('Error rate is ' + Math.round(errorRate * 100) + '%. Check if the issue is environmental (API down?) or logical (wrong approach?).');
        }
      }

      // === PATTERN 3: Stuck Detection (same tool, same result) ===
      const last5 = points.slice(-5);
      const allSameTool = last5.every(p => p.tool_name === last5[0].tool_name);
      const allFailed = last5.every(p => !p.success);
      if (allSameTool && allFailed && last5.length >= 5) {
        patterns.push('stuck');
        if (includeRecs) {
          recommendations.push('STUCK: 5+ consecutive failed calls to ' + last5[0].tool_name + '. Switch strategy immediately.');
        }
      }

      // === PATTERN 4: Degradation (increasing error rate over time) ===
      const firstHalf = points.slice(0, Math.floor(points.length / 2));
      const secondHalf = points.slice(Math.floor(points.length / 2));
      const firstErrorRate = firstHalf.length > 0 ? firstHalf.filter(p => !p.success).length / firstHalf.length : 0;
      const secondErrorRate = secondHalf.length > 0 ? secondHalf.filter(p => !p.success).length / secondHalf.length : 0;
      if (secondErrorRate > firstErrorRate + 0.2 && secondErrorRate > 0.3) {
        patterns.push('degradation');
        if (includeRecs) {
          recommendations.push('Performance degrading: error rate jumped from ' + Math.round(firstErrorRate * 100) + '% to ' + Math.round(secondErrorRate * 100) + '%. Consider simplifying the approach.');
        }
      }

      // === PATTERN 5: Rapid交替 between two tools (ping-pong) ===
      const pingPong = this._detectPingPong(recentTools);
      if (pingPong) {
        patterns.push('ping_pong');
        if (includeRecs) {
          recommendations.push('Ping-ponging between tools. Commit to one approach or escalate to user.');
        }
      }

      // === SIGNAL DETERMINATION ===
      let signal = 'TRUST';
      let confidence = 0.85;

      if (patterns.includes('stuck')) {
        signal = 'STUCK';
        confidence = 0.95;
      } else if (patterns.includes('loop_detected')) {
        signal = 'LOOP_DETECT';
        confidence = loopScore;
      } else if (patterns.includes('degradation')) {
        signal = 'DEGRADED';
        confidence = 0.8;
      } else if (patterns.includes('high_error_rate')) {
        signal = 'ABSTAIN';
        confidence = 0.7;
      }

      // Adjust confidence based on data volume
      if (points.length < 10) confidence = Math.min(confidence, 0.7);

      // === BUILD REPORT ===
      const lines = [];
      lines.push('# Agent Trajectory Analysis Report');
      lines.push('');
      lines.push('## Signal: **' + signal + '** (confidence: ' + Math.round(confidence * 100) + '%)');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push('| Points Analyzed | ' + points.length + ' |');
      lines.push('| Error Rate | ' + Math.round(errorRate * 100) + '% |');
      lines.push('| Unique Tools | ' + [...new Set(points.map(p => p.tool_name))].length + ' |');
      lines.push('| Patterns Found | ' + patterns.length + ' |');
      lines.push('');

      if (patterns.length > 0) {
        lines.push('## Detected Patterns');
        lines.push('');
        for (const p of patterns) {
          const desc = this._patternDescription(p);
          lines.push('- **' + p + '**: ' + desc);
        }
        lines.push('');
      }

      if (includeRecs && recommendations.length > 0) {
        lines.push('## Self-Correction Recommendations');
        lines.push('');
        for (let i = 0; i < recommendations.length; i++) {
          lines.push((i + 1) + '. ' + recommendations[i]);
        }
        lines.push('');
      }

      // Recent trajectory summary
      lines.push('## Recent Trajectory (last 10 points)');
      lines.push('');
      lines.push('| # | Tool | Type | Success | Context |');
      lines.push('|---|------|------|---------|---------|');
      const last10 = points.slice(-10);
      for (let i = 0; i < last10.length; i++) {
        const p = last10[i];
        lines.push('| ' + (i + 1) + ' | ' + p.tool_name + ' | ' + p.action_type + ' | ' + (p.success ? 'OK' : 'FAIL') + ' | ' + (p.context || '').substring(0, 40) + ' |');
      }

      lines.push('');
      lines.push('---');
      lines.push('*Agent Trajectory Analyze v1.0.0*');

      const report = lines.join('\n');

      return { signal, confidence, patterns, recommendations, error_rate: errorRate, report };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }

  _loadTrajectory(windowSize) {
    // Try disk first
    try {
      const files = fs.readdirSync(TRAJECTORY_DIR).filter(f => f.endsWith('.jsonl')).sort().reverse();
      if (files.length > 0) {
        const latestFile = path.join(TRAJECTORY_DIR, files[0]);
        const content = fs.readFileSync(latestFile, 'utf8');
        const lines = content.trim().split('\n').filter(l => l.trim());
        const points = [];
        for (const line of lines.slice(-windowSize)) {
          try { points.push(JSON.parse(line)); } catch(e) {}
        }
        if (points.length > 0) return points;
      }
    } catch(e) {}

    // Fallback to memory
    return globalThis.__trajectory_points || [];
  }

  _detectLoop(tools) {
    if (tools.length < 4) return 0;
    // Check for A-B-A-B pattern
    let repeats = 0;
    for (let i = 2; i < tools.length; i++) {
      if (tools[i] === tools[i - 2]) repeats++;
    }
    return repeats / (tools.length - 2);
  }

  _detectPingPong(tools) {
    if (tools.length < 4) return false;
    const last4 = tools.slice(-4);
    // Pattern: A-B-A-B
    return last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1];
  }

  _patternDescription(pattern) {
    const descriptions = {
      'loop_detected': 'Repeated tool call pattern detected. Agent is cycling through the same tools without progress.',
      'high_error_rate': 'Error rate exceeds 30% in the analysis window.',
      'stuck': 'Agent has made 5+ consecutive failed calls to the same tool.',
      'degradation': 'Error rate is significantly higher in the second half of the analysis window.',
      'ping_pong': 'Agent is alternating between two tools without making progress.',
      'insufficient_data': 'Not enough trajectory points to perform meaningful analysis.'
    };
    return descriptions[pattern] || 'Unknown pattern.';
  }
}

export default new TrajectoryAnalyze();
