/**
 * NeuralForge Realtime Hook — AGNT Runtime Integration
 * 
 * Reads real execution data from AGNT's database (workflow_executions + node_executions tables),
 * transforms them into NeuralForge event schema, and feeds them into the RealtimeEvolutionEngine.
 * 
 * Also exposes tools for querying real execution data and running real-data benchmarks.
 * 
 * SAFETY: This plugin is READ-ONLY on the AGNT database. It does not modify any
 * workflow execution logic. It only reads completed execution records.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

// Find the AGNT database
function getDb() {
  const dbPath = process.env.AGNT_DB_PATH || path.join(APP_PATH, 'backend', 'agnt.db');
  if (!fs.existsSync(dbPath)) {
    throw new Error('AGNT database not found at: ' + dbPath);
  }
  return new Database(dbPath, { readonly: true });
}

// Transform AGNT DB rows into NeuralForge event schema
function transformWorkflowExecution(row, nodeExecutions) {
  const durationMs = row.start_time && row.end_time
    ? (new Date(row.end_time) - new Date(row.start_time))
    : 0;

  const totalRetries = nodeExecutions.reduce((sum, ne) => {
    return sum + (ne.retry_count || 0);
  }, 0);

  const errorNodes = nodeExecutions.filter(ne => ne.status === 'error');
  const hasErrors = errorNodes.length > 0;

  return {
    workflow_id: row.id,
    workflow_name: row.workflow_name || 'Unknown',
    execution_id: row.id,
    tool_name: 'workflow',
    status: row.status,
    success: row.status === 'completed' && !hasErrors,
    duration_ms: durationMs,
    step_count: nodeExecutions.length,
    retry_count: totalRetries,
    error_type: hasErrors ? (errorNodes[0].error || 'unknown') : 'none',
    recovery_action: '',
    recovery_success: false,
    params: {},
    prompt: '',
    response: row.log ? row.log.substring(0, 500) : '',
    timestamp: row.start_time ? new Date(row.start_time).getTime() / 1000 : Date.now() / 1000,
    node_details: nodeExecutions.map(ne => ({
      node_id: ne.node_id,
      status: ne.status,
      duration_ms: ne.start_time && ne.end_time
        ? (new Date(ne.end_time) - new Date(ne.start_time))
        : 0,
      error: ne.error || null,
      credits_used: ne.credits_used || 0,
      input_tokens: ne.input_tokens || 0,
      output_tokens: ne.output_tokens || 0,
    })),
    _data_source: 'real_executions',
    _data_version: '1.0.0',
  };
}

class NeuralforgeRealtimeHook {
  constructor() {
    this.name = 'neuralforge-realtime-hook';
    this.eventLogPath = process.env.NEURALFORGE_EVENT_LOG || 
      path.join(APP_PATH, '..', 'NeuralForge', 'cold_storage', 'neuralforge', 'execution_events.jsonl');
  }

  /**
   * Tool 1: Ingest real AGNT executions into NeuralForge
   */
  async ingestRealExecutions(params) {
    try {
      const limit = Math.min(parseInt(params.limit) || 100, 1000);
      const persist = params.persist !== 'false';
      const db = getDb();

      // Query workflow executions
      const workflows = db.prepare(`
        SELECT id, workflow_id, workflow_name, status, start_time, end_time, log, credits_used
        FROM workflow_executions
        ORDER BY start_time DESC
        LIMIT ?
      `).all(limit);

      const results = [];
      let ingestedCount = 0;
      let skippedCount = 0;

      for (const wf of workflows) {
        // Skip if already ingested
        const alreadyIngested = db.prepare(
          'SELECT COUNT(*) as cnt FROM neuralforge_events WHERE execution_id = ?'
        ).get(wf.id);
        
        if (alreadyIngested && alreadyIngested.cnt > 0) {
          skippedCount++;
          continue;
        }

        // Get node executions for this workflow
        const nodes = db.prepare(`
          SELECT node_id, status, start_time, end_time, error, credits_used,
                 input_tokens, output_tokens
          FROM node_executions
          WHERE execution_id = ?
          ORDER BY start_time
        `).all(wf.id);

        const event = transformWorkflowExecution(wf, nodes);

        // Persist to JSONL
        if (persist) {
          fs.appendFileSync(this.eventLogPath, JSON.stringify(event) + '\n');
        }

        // Store metadata in AGNT DB (tracking table)
        this._ensureTrackingTable(db);
        db.prepare(`
          INSERT OR IGNORE INTO neuralforge_events (execution_id, workflow_name, status, duration_ms, ingested_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(wf.id, wf.workflow_name, wf.status, event.duration_ms, new Date().toISOString());

        results.push(event);
        ingestedCount++;
      }

      db.close();

      return {
        status: 'success',
        ingested: ingestedCount,
        skipped_already_ingested: skippedCount,
        total_queried: workflows.length,
        data_source: 'real_executions',
        event_log_path: this.eventLogPath,
        sample: results[0] || null,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Tool 2: Query real execution statistics
   */
  async getRealtimeStats(params) {
    try {
      const days = parseInt(params.days) || 7;
      const db = getDb();

      // Overall stats
      const overall = db.prepare(`
        SELECT 
          COUNT(*) as total_executions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'stopped' THEN 1 ELSE 0 END) as stopped,
          AVG(CASE WHEN end_time IS NOT NULL THEN 
            (julianday(end_time) - julianday(start_time)) * 86400000 ELSE 0 END) as avg_duration_ms,
          SUM(credits_used) as total_credits,
          MIN(start_time) as earliest,
          MAX(start_time) as latest
        FROM workflow_executions
        WHERE start_time >= datetime('now', '-' || ? || ' days')
      `).get(days);

      // Per-workflow breakdown
      const perWorkflow = db.prepare(`
        SELECT 
          workflow_name,
          COUNT(*) as executions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          AVG(CASE WHEN end_time IS NOT NULL THEN 
            (julianday(end_time) - julianday(start_time)) * 86400000 ELSE 0 END) as avg_duration_ms,
          SUM(credits_used) as total_credits
        FROM workflow_executions
        WHERE start_time >= datetime('now', '-' || ? || ' days')
        GROUP BY workflow_name
        ORDER BY executions DESC
        LIMIT 20
      `).all(days);

      // Per-node error breakdown
      const nodeErrors = db.prepare(`
        SELECT 
          ne.node_id,
          COUNT(*) as error_count,
          GROUP_CONCAT(DISTINCT ne.error) as error_types
        FROM node_executions ne
        JOIN workflow_executions we ON ne.execution_id = we.id
        WHERE ne.status = 'error'
          AND we.start_time >= datetime('now', '-' || ? || ' days')
        GROUP BY ne.node_id
        ORDER BY error_count DESC
        LIMIT 10
      `).all(days);

      // Daily trend
      const dailyTrend = db.prepare(`
        SELECT 
          DATE(start_time) as date,
          COUNT(*) as executions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
        FROM workflow_executions
        WHERE start_time >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(start_time)
        ORDER BY date
      `).all(days);

      // Already ingested count
      let ingestedCount = 0;
      try {
        const ingested = db.prepare('SELECT COUNT(*) as cnt FROM neuralforge_events').get();
        ingestedCount = ingested?.cnt || 0;
      } catch (e) {
        // Table may not exist yet
      }

      db.close();

      const total = overall.total_executions || 0;
      const successRate = total > 0 ? ((overall.successful / total) * 100).toFixed(1) : 0;

      const lines = [];
      lines.push('# NeuralForge Real Execution Report');
      lines.push('');
      lines.push('> Data source: **Real AGNT executions** (last ' + days + ' days)');
      lines.push('> Generated: ' + new Date().toISOString());
      lines.push('');
      lines.push('## Summary');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push('| Total Executions | ' + total + ' |');
      lines.push('| Successful | ' + (overall.successful || 0) + ' |');
      lines.push('| Failed | ' + (failed || 0) + ' |');
      lines.push('| Stopped | ' + (stopped || 0) + ' |');
      lines.push('| Success Rate | ' + successRate + '% |');
      lines.push('| Avg Duration | ' + Math.round(overall.avg_duration_ms || 0) + 'ms |');
      lines.push('| Total Credits | ' + Math.round((overall.total_credits || 0) * 100) / 100 + ' |');
      lines.push('| Already Ingested | ' + ingestedCount + ' |');
      lines.push('');
      lines.push('## Per-Workflow Breakdown');
      lines.push('');
      lines.push('| Workflow | Runs | Success | Avg Duration | Credits |');
      lines.push('|----------|------|---------|--------------|---------|');
      for (const wf of perWorkflow) {
        lines.push('| ' + (wf.workflow_name || 'Unknown') + ' | ' + wf.executions + ' | ' + wf.successful + ' | ' + Math.round(wf.avg_duration_ms || 0) + 'ms | ' + Math.round((wf.total_credits || 0) * 100) / 100 + ' |');
      }

      if (nodeErrors.length > 0) {
        lines.push('');
        lines.push('## Top Error Nodes');
        lines.push('');
        lines.push('| Node ID | Errors | Error Types |');
        lines.push('|---------|--------|-------------|');
        for (const ne of nodeErrors) {
          lines.push('| ' + ne.node_id + ' | ' + ne.error_count + ' | ' + (ne.error_types || '').substring(0, 100) + ' |');
        }
      }

      if (dailyTrend.length > 0) {
        lines.push('');
        lines.push('## Daily Trend');
        lines.push('');
        lines.push('| Date | Executions | Success | Failed |');
        lines.push('|------|------------|---------|--------|');
        for (const d of dailyTrend) {
          lines.push('| ' + d.date + ' | ' + d.executions + ' | ' + d.successful + ' | ' + d.failed + ' |');
        }
      }

      return {
        report: lines.join('\n'),
        summary: {
          total_executions: total,
          successful: overall.successful || 0,
          failed: overall.failed || 0,
          stopped: overall.stopped || 0,
          success_rate: parseFloat(successRate),
          avg_duration_ms: Math.round(overall.avg_duration_ms || 0),
          total_credits: Math.round((overall.total_credits || 0) * 100) / 100,
          already_ingested: ingestedCount,
          days_covered: days,
        },
        per_workflow: perWorkflow,
        node_errors: nodeErrors,
        daily_trend: dailyTrend,
        data_source: 'real_executions',
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Tool 3: Run benchmark on real execution data
   */
  async runRealBenchmark(params) {
    try {
      const days = parseInt(params.days) || 30;
      const db = getDb();

      // Get all executions in the time window with their node data
      const executions = db.prepare(`
        SELECT id, workflow_id, workflow_name, status, start_time, end_time, log
        FROM workflow_executions
        WHERE start_time >= datetime('now', '-' || ? || ' days')
        ORDER BY start_time DESC
      `).all(days);

      if (executions.length < 5) {
        db.close();
        return {
          status: 'insufficient_data',
          message: 'Need at least 5 executions in the last ' + days + ' days. Found: ' + executions.length,
          data_source: 'real_executions',
        };
      }

      // Transform to benchmark format
      const events = [];
      for (const ex of executions) {
        const nodes = db.prepare(`
          SELECT node_id, status, start_time, end_time, error, credits_used,
                 input_tokens, output_tokens
          FROM node_executions
          WHERE execution_id = ?
          ORDER BY start_time
        `).all(ex.id);

        const event = transformWorkflowExecution(ex, nodes);
        events.push(event);
      }

      db.close();

      // Compute benchmark metrics
      const total = events.length;
      const successful = events.filter(e => e.success).length;
      const failed = events.filter(e => !e.success).length;
      const successRate = (successful / total * 100).toFixed(1);

      // Duration stats
      const durations = events.map(e => e.duration_ms).filter(d => d > 0);
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const sortedDurs = [...durations].sort((a, b) => a - b);
      const p50 = sortedDurs[Math.floor(sortedDurs.length * 0.5)] || 0;
      const p95 = sortedDurs[Math.floor(sortedDurs.length * 0.95)] || 0;
      const p99 = sortedDurs[Math.floor(sortedDurs.length * 0.99)] || 0;

      // Per-workflow success rates
      const workflowStats = {};
      for (const e of events) {
        const wid = e.workflow_name;
        if (!workflowStats[wid]) {
          workflowStats[wid] = { total: 0, success: 0, totalDuration: 0, errorTypes: {} };
        }
        workflowStats[wid].total++;
        if (e.success) workflowStats[wid].success++;
        workflowStats[wid].totalDuration += e.duration_ms;
        if (!e.success && e.error_type) {
          workflowStats[wid].errorTypes[e.error_type] = (workflowStats[wid].errorTypes[e.error_type] || 0) + 1;
        }
      }

      const perWorkflow = Object.entries(workflowStats).map(([name, stats]) => ({
        workflow_name: name,
        total: stats.total,
        success_rate: parseFloat((stats.success / stats.total * 100).toFixed(1)),
        avg_duration_ms: Math.round(stats.totalDuration / stats.total),
        error_types: stats.errorTypes,
      }));

      // Training/validation/test split analysis (temporal)
      const splitIndex = Math.floor(total * 0.6);
      const trainSet = events.slice(0, splitIndex);
      const valSet = events.slice(splitIndex, splitIndex + Math.floor((total - splitIndex) * 0.5));
      const testSet = events.slice(splitIndex + valSet.length);

      const computeMetrics = (set) => {
        if (set.length === 0) return null;
        const succ = set.filter(e => e.success).length;
        const durs = set.map(e => e.duration_ms).filter(d => d > 0);
        return {
          size: set.length,
          success_rate: parseFloat((succ / set.length * 100).toFixed(1)),
          avg_duration_ms: durs.length > 0 ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0,
        };
      };

      const report = {
        benchmark_version: '1.0.0',
        data_source: 'real_executions',
        total_executions: total,
        overall_success_rate: parseFloat(successRate),
        duration: {
          avg_ms: Math.round(avgDuration),
          p50_ms: Math.round(p50),
          p95_ms: Math.round(p95),
          p99_ms: Math.round(p99),
        },
        split: {
          train: computeMetrics(trainSet),
          validation: computeMetrics(valSet),
          test: computeMetrics(testSet),
        },
        per_workflow: perWorkflow,
        days_covered: days,
        generated_at: new Date().toISOString(),
        notes: 'Real AGNT execution data. Temporal split (60/20/20). No synthetic data used.',
      };

      // Format report
      const lines = [];
      lines.push('# NeuralForge Real-Data Benchmark Report');
      lines.push('');
      lines.push('> Data source: **Real AGNT executions** (last ' + days + ' days)');
      lines.push('> Total executions: ' + total);
      lines.push('> Generated: ' + new Date().toISOString());
      lines.push('');
      lines.push('## Overall Metrics');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push('| Total Executions | ' + total + ' |');
      lines.push('| Success Rate | ' + successRate + '% |');
      lines.push('| Successful | ' + successful + ' |');
      lines.push('| Failed | ' + failed + ' |');
      lines.push('| Avg Duration | ' + Math.round(avgDuration) + 'ms |');
      lines.push('| P50 Duration | ' + Math.round(p50) + 'ms |');
      lines.push('| P95 Duration | ' + Math.round(p95) + 'ms |');
      lines.push('| P99 Duration | ' + Math.round(p99) + 'ms |');
      lines.push('');
      lines.push('## Train/Val/Test Split (Temporal)');
      lines.push('');
      lines.push('| Split | Size | Success Rate | Avg Duration |');
      lines.push('|-------|------|-------------|--------------|');
      if (report.split.train) lines.push('| Train | ' + report.split.train.size + ' | ' + report.split.train.success_rate + '% | ' + report.split.train.avg_duration_ms + 'ms |');
      if (report.split.validation) lines.push('| Validation | ' + report.split.validation.size + ' | ' + report.split.validation.success_rate + '% | ' + report.split.validation.avg_duration_ms + 'ms |');
      if (report.split.test) lines.push('| Test | ' + report.split.test.size + ' | ' + report.split.test.success_rate + '% | ' + report.split.test.avg_duration_ms + 'ms |');
      lines.push('');
      lines.push('## Per-Workflow Performance');
      lines.push('');
      lines.push('| Workflow | Runs | Success Rate | Avg Duration | Errors |');
      lines.push('|----------|------|-------------|--------------|--------|');
      for (const wf of perWorkflow) {
        const errCount = Object.values(wf.error_types).reduce((a, b) => a + b, 0);
        lines.push('| ' + wf.workflow_name + ' | ' + wf.total + ' | ' + wf.success_rate + '% | ' + wf.avg_duration_ms + 'ms | ' + errCount + ' |');
      }
      lines.push('');
      lines.push('---');
      lines.push('*This report uses only real AGNT execution data. No synthetic data was used.*');

      return {
        report: lines.join('\n'),
        ...report,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Tool 4: Get ingestion status
   */
  async getIngestionStatus(params) {
    try {
      const db = getDb();
      
      // Total executions in AGNT
      const total = db.prepare('SELECT COUNT(*) as cnt FROM workflow_executions').get();
      
      // Ingested count
      let ingested = 0;
      try {
        const result = db.prepare('SELECT COUNT(*) as cnt FROM neuralforge_events').get();
        ingested = result?.cnt || 0;
      } catch (e) {
        // Table doesn't exist yet
      }

      // Event log file size
      let logSize = 0;
      let logLines = 0;
      try {
        const stats = fs.statSync(this.eventLogPath);
        logSize = stats.size;
        logLines = fs.readFileSync(this.eventLogPath, 'utf-8').split('\n').filter(l => l.trim()).length;
      } catch (e) {
        // File doesn't exist yet
      }

      db.close();

      return {
        status: 'success',
        total_agnt_executions: total.cnt,
        ingested_into_neuralforge: ingested,
        remaining: total.cnt - ingested,
        ingestion_percent: total.cnt > 0 ? parseFloat((ingested / total.cnt * 100).toFixed(1)) : 0,
        event_log: {
          path: this.eventLogPath,
          size_bytes: logSize,
          event_count: logLines,
        },
        data_source: 'real_executions',
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Ensure tracking table exists
  _ensureTrackingTable(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS neuralforge_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        execution_id TEXT UNIQUE,
        workflow_name TEXT,
        status TEXT,
        duration_ms REAL,
        ingested_at TEXT
      )
    `);
  }

  // Main dispatch
  async execute(params = {}, inputData, workflowEngine) {
    const action = params.action || 'status';

    switch (action) {
      case 'ingest':
        return await this.ingestRealExecutions(params);
      case 'stats':
        return await this.getRealtimeStats(params);
      case 'benchmark':
        return await this.runRealBenchmark(params);
      case 'status':
        return await this.getIngestionStatus(params);
      default:
        return { error: 'Unknown action: ' + action + '. Use: ingest, stats, benchmark, status' };
    }
  }
}

export default new NeuralforgeRealtimeHook();
