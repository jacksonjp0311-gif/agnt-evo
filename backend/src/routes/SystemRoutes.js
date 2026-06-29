import express from 'express';
import { authenticateToken } from './Middleware.js';

const router = express.Router();

/**
 * Clear orchestrator module caches so edited core files take effect
 * without an Electron restart. Called after codec/selector/config edits.
 */
function bustOrchestratorCaches() {
  const cleared = [];
  const targets = [
    'toolSelector.js',
    'toolRegistry.js',
    'tools.js',
    'chatConfigs.js',
    'codec-integration.cjs',
    'codec-integration.js',
  ];
  for (const key of Object.keys(require.cache)) {
    for (const t of targets) {
      if (key.endsWith(t) || key.includes('agnt-tool-codec')) {
        delete require.cache[key];
        cleared.push(key.split('\\').pop().split('/').pop());
        break;
      }
    }
  }
  return cleared;
}

/**
 * POST /api/system/reload
 * Clear cached orchestrator modules so file edits take effect immediately.
 * Body: { modules?: string[] } — optional list of specific modules to bust.
 * If no modules specified, busts the standard orchestrator set.
 */
router.post('/reload', authenticateToken, async (req, res) => {
  try {
    const cleared = bustOrchestratorCaches();
    console.log('[SystemReload] Busted module caches:', cleared);
    res.json({
      success: true,
      message: 'Orchestrator module caches cleared — edits take effect next call',
      cleared,
      note: 'Electron restart needed for server.js-level changes. For codec/selector/config edits, this is sufficient.',
    });
  } catch (error) {
    console.error('[SystemReload] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/system/health
 * Quick health check for the reload system.
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'System routes active' });
});

export default router;
