/**
 * NeuralForge Telemetry Bridge
 * 
 * Lightweight service that receives workflow execution events from AGNT's
 * WorkflowEngine and forwards them to NeuralForge's RealtimeEvolutionEngine.
 * 
 * SAFETY:
 * - All operations are best-effort and non-blocking
 * - Errors are caught and logged but never thrown
 * - Uses subprocess to call Python NeuralForge bridge
 * - Event log is append-only JSONL
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve NeuralForge repo path
const NEURALFORGE_ROOT = process.env.NEURALFORGE_ROOT ||
  path.resolve(__dirname, '../../../neuralforge');

const EVENT_LOG_PATH = process.env.NEURALFORGE_EVENT_LOG ||
  path.join(NEURALFORGE_ROOT, 'cold_storage', 'neuralforge', 'execution_events.jsonl');

// Ensure cold storage directory exists
const logDir = path.dirname(EVENT_LOG_PATH);
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {
    // Non-critical: log directory creation failed
  }
}

// Track if NeuralForge is available
let _nfAvailable = null;

/**
 * Check if NeuralForge Python library is available
 */
function isNeuralForgeAvailable() {
  if (_nfAvailable !== null) return _nfAvailable;

  try {
    const nfPath = path.join(NEURALFORGE_ROOT, 'neuralforge');
    _nfAvailable = fs.existsSync(nfPath) && fs.existsSync(path.join(nfPath, 'agnt_bridge.py'));
  } catch (e) {
    _nfAvailable = false;
  }
  return _nfAvailable;
}

/**
 * Record an execution event via Python NeuralForge bridge
 * Falls back to direct JSONL append if Python is unavailable
 */
async function recordViaPython(eventData) {
  return new Promise((resolve, reject) => {
    const pythonCode = `
import sys, json, os
sys.path.insert(0, r"${NEURALFORGE_ROOT}")
os.chdir(r"${NEURALFORGE_ROOT}")
try:
    from neuralforge.agnt_bridge import record_execution
    event = json.loads(sys.argv[1])
    result = record_execution(event)
    print("NF_RESULT:" + json.dumps(result))
except Exception as e:
    print("NF_ERROR:" + str(e))
    sys.exit(1)
`;

    const proc = spawn('python', ['-c', pythonCode, JSON.stringify(eventData)], {
      cwd: NEURALFORGE_ROOT,
      env: { ...process.env, PYTHONPATH: NEURALFORGE_ROOT },
      timeout: 10000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Python bridge failed: ' + stderr));
      } else {
        resolve(stdout.trim());
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Fallback: directly append to JSONL event log
 */
function recordFallback(eventData) {
  try {
    fs.appendFileSync(EVENT_LOG_PATH, JSON.stringify(eventData) + '\n');
    return true;
  } catch (e) {
    console.warn('[NeuralForgeTelemetry] Fallback write failed:', e.message);
    return false;
  }
}

/**
 * Public API: Record a workflow execution event.
 * Called by ProcessWorker when 'workflowCompleted' fires.
 * 
 * @param {Object} eventData - From WorkflowEngine's workflowCompleted emit
 */
async function record(eventData) {
  try {
    // Normalize to NeuralForge event schema
    const normalizedEvent = {
      workflow_id: eventData.workflowId || eventData.workflow_id || 'unknown',
      workflow_name: eventData.workflowName || eventData.workflow_name || 'unknown',
      execution_id: eventData.executionId || eventData.execution_id || '',
      status: eventData.status || 'completed',
      success: eventData.status === 'completed',
      duration_ms: eventData.creditsUsed ? eventData.creditsUsed * 1000 : 0,
      step_count: 0, // Will be enriched by the plugin's ingest action
      retry_count: 0,
      error_type: eventData.error ? 'error' : 'none',
      error: eventData.error || '',
      recovery_action: '',
      recovery_success: false,
      params: {},
      prompt: '',
      response: '',
      timestamp: eventData.timestamp || new Date().toISOString(),
      _data_source: 'real_executions',
      _recorded_at: new Date().toISOString(),
    };

    if (isNeuralForgeAvailable()) {
      try {
        await recordViaPython(normalizedEvent);
      } catch (pythonError) {
        // Python failed — use fallback
        recordFallback(normalizedEvent);
      }
    } else {
      // NeuralForge not available — use fallback
      recordFallback(normalizedEvent);
    }
  } catch (error) {
    // Never throw — telemetry must never break workflow execution
    console.warn('[NeuralForgeTelemetry] Record failed:', error.message);
  }
}

/**
 * Get telemetry status
 */
function getStatus() {
  return {
    neuralforge_available: isNeuralForgeAvailable(),
    neuralforge_root: NEURALFORGE_ROOT,
    event_log_path: EVENT_LOG_PATH,
    event_log_exists: fs.existsSync(EVENT_LOG_PATH),
    event_log_size: fs.existsSync(EVENT_LOG_PATH) ? fs.statSync(EVENT_LOG_PATH).size : 0,
    event_log_events: fs.existsSync(EVENT_LOG_PATH)
      ? fs.readFileSync(EVENT_LOG_PATH, 'utf-8').split('\n').filter(l => l.trim()).length
      : 0,
  };
}

export const NeuralForgeTelemetry = {
  record,
  getStatus,
  recordFallback,
};

export default NeuralForgeTelemetry;
