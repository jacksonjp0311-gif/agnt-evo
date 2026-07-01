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

router.delete('/browserpilot', (req, res) => {
  const cleared = BrowserPilotTelemetryService.clear();
  res.json({ success: true, cleared });
});

router.delete('/browserpilot/graph', async (req, res) => {
  await BrowserPilotTelemetryService.clearGraph();
  res.json({ success: true, cleared: true });
});

export default router;
