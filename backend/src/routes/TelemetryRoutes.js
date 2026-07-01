import express from 'express';
import BrowserPilotTelemetryService from '../services/telemetry/BrowserPilotTelemetryService.js';

const router = express.Router();

router.post(['/browserpilot', '/execution'], (req, res) => {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const event = BrowserPilotTelemetryService.record(payload);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/browserpilot/recent', (req, res) => {
  const limit = req.query.limit || 100;
  res.json({ success: true, events: BrowserPilotTelemetryService.recent(limit) });
});

router.get('/browserpilot/summary', (req, res) => {
  const limit = req.query.limit || 200;
  res.json({ success: true, summary: BrowserPilotTelemetryService.summary(limit) });
});

router.get('/browserpilot/graph', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  res.json({ success: true, graph: BrowserPilotTelemetryService.graphSnapshot() });
});

router.post('/browserpilot/analyze', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  const limit = req.body?.limit || req.query.limit || 200;
  const analysis = BrowserPilotTelemetryService.analyze(limit);
  res.json({ success: true, analysis, graph: BrowserPilotTelemetryService.graphSnapshot() });
});

router.post('/browserpilot/diagnostics', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  const limit = req.body?.limit || req.query.limit || 300;
  const report = BrowserPilotTelemetryService.diagnostics(limit);
  res.json({ success: true, report, graph: BrowserPilotTelemetryService.graphSnapshot() });
});

router.get('/browserpilot/selector-policy', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  const policy = BrowserPilotTelemetryService.selectorPolicy(req.query.limit || 200);
  res.json({ success: true, policy });
});

router.get('/browserpilot/evolution-context', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  res.json({ success: true, context: BrowserPilotTelemetryService.evolutionContext() });
});

router.get('/browserpilot/golden-traces', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  res.json({ success: true, traces: BrowserPilotTelemetryService.goldenTraces(req.query.limit || 20) });
});

router.post('/browserpilot/golden-traces', async (req, res) => {
  await BrowserPilotTelemetryService.ensureGraphLoaded();
  const trace = BrowserPilotTelemetryService.saveGoldenTrace(req.body || {});
  BrowserPilotTelemetryService.record({
    eventType: 'golden_trace_saved',
    adapter: 'agnt-edge',
    data: {
      goal: trace.goal,
      successCriteria: trace.successCriteria,
      traceId: trace.id,
    },
  });
  res.json({ success: true, trace, graph: BrowserPilotTelemetryService.graphSnapshot() });
});

router.delete('/browserpilot', (req, res) => {
  const cleared = BrowserPilotTelemetryService.clear();
  res.json({ success: true, cleared });
});

router.delete('/browserpilot/graph', async (req, res) => {
  await BrowserPilotTelemetryService.clearGraph();
  res.json({ success: true, cleared: true });
});

export default router;
