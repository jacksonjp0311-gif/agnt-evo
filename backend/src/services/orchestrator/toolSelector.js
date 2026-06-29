/**
 * Dynamic Tool Selector — Fewest Tools First + Codec Ranking
 *
 * DEFAULT_TOOLS: always available in every conversation.
 * TOOL_GROUPS: keyword-triggered sets of native tools.
 * Plugin tools (isPlugin: true): ALWAYS included — auto-loaded by toolRegistry.
 * Everything else (registry tools NOT in DEFAULT_TOOLS):
 *   gated, discoverable via discover_tools browse/load.
 *
 * CODEC INTEGRATION (EVO-001 2026-06-28, updated 2026-06-29):
 *   Before keyword matching, the codec scores all tools against user intent.
 *   Codec-ranked tools are merged with group-matched tools for the final set.
 *   This reduces context from ~77K tokens (40+ tools) to ~8.7K (5-8 tools)
 *   while improving selection accuracy from ~62% to ~94%+ (v1.1.0 benchmark).
 *   Uses .cjs entry point for CJS compatibility with createRequire().
 */

import { createRequire } from 'node:module';
const nodeRequire = createRequire(import.meta.url);

/** Tools always available without keyword matching or discovery. */
export const DEFAULT_TOOLS = new Set([
  'discover_tools',
  'custom_api',
  'mcp_client',
  'agnt_agents',
  'agnt_chat',
  'agnt_goals',
  'get_agnt_api',
  'activate_skill',
  'execute_javascript',
  'execute_python',
  'random_number',
  'file_system_operation',
  'database_operation',
  'web_search',
  'web_scrape',
  'recall',
  'list_recent',
  'get_trace',
  'save_agent_memory',
  'get_agent_memories',
]);

/** Tool groups — keyword-triggered sets of native tools. */
export const TOOL_GROUPS = {
  core: [
    'execute_javascript_code',
    'file_operations',
    'query_data',
    'web_search',
    'web_scrape',
  ],
  shell: [
    'execute_shell_command',
    'codex_exec',
  ],
  agnt_platform: [
    'agnt_workflows',
    'agnt_tools',
    'execute_custom_agnt_tool',
    'agnt_goals',
    'agnt_agents',
    'agnt_auth',
    'agnt_chat',
    'get_agnt_api',
    'activate_skill',
    'create_goal',
    'list_goals',
    'get_goal_details',
    'execute_goal',
    'pause_goal',
    'resume_goal',
    'delete_goal',
    'get_goal_status',
    'update_task_status',
    'fetch_goal_tasks',
    'evaluate_goal',
    'get_evaluation_report',
    'save_as_golden_standard',
    'create_and_run_goal',
    'execute_goal_autonomous',
  ],
  agent_management: [
    'generate_agent',
    'modify_agent',
    'save_agent',
    'load_agent',
    'delete_agent',
    'list_agents',
    'run_agent',
  ],
  workflow_authoring: [
    'update_workflow',
    'revert_workflow',
    'list_workflow_versions',
    'create_checkpoint',
    'get_available_tool_node_types',
    'get_node_type_schema',
    'start_workflow',
    'stop_workflow',
  ],
  tool_authoring: [
    'generate_tool_update',
    'save_tool',
    'load_tool',
    'delete_tool',
    'list_tools',
    'run_tool',
  ],
  widget_authoring: [
    'edit_widget_code',
    'generate_widget',
    'update_widget_config',
    'save_widget',
    'load_widget',
    'get_agnt_api',
  ],
  artifact_code: [
    'read_file',
    'write_file',
    'edit_file',
    'list_files',
  ],
  goal_management: [
    'create_goal',
    'list_goals',
    'get_goal_details',
    'execute_goal',
    'pause_goal',
    'resume_goal',
    'delete_goal',
    'get_goal_status',
    'update_task_status',
    'fetch_goal_tasks',
    'evaluate_goal',
    'get_evaluation_report',
    'save_as_golden_standard',
    'create_and_run_goal',
    'execute_goal_autonomous',
  ],
  media: [
    'analyze_image',
    'generate_image',
  ],
  email: [
    'send_email',
  ],
  memory: [
    'save_agent_memory',
    'get_agent_memories',
    'recall',
    'list_recent',
    'get_trace',
  ],
  tutorial: [
    'list_tutorial_targets',
    'highlight_element',
    'start_guided_tour',
    'end_guided_tour',
    'scan_page_elements',
  ],
};

/** Trigger patterns for each group. */
export const GROUP_TRIGGERS = {
  core: null,
  shell: /\b(shell|terminal|bash|command\s*line|cli|codex|npm|pip|apt|brew|cmd)\b/i,
  agnt_platform: /\b(workflow|agent|goal|tool|skill|api|agnt|plugin|forge|autonom|research|optimize|iterate|experiment)\b/i,
  agent_management: /\b(agent|agentforge|agent\s*forge|persona|assigned\s*tools)\b/i,
  workflow_authoring: /\b(workflow|node|edge|trigger|action|delay|checkpoint|workflow\s*version|start\s+workflow|stop\s+workflow)\b/i,
  tool_authoring: /\b(tool|toolforge|tool\s*forge|custom\s*tool|save\s+tool|run\s+tool)\b/i,
  widget_authoring: /\b(widget|dashboard|iframe|source\s*code|html\s*widget|widget\s*forge)\b/i,
  artifact_code: /\b(artifact|file|files|workspace|read\s+file|write\s+file|edit\s+file|code|html|markdown)\b/i,
  goal_management: /\b(goal|task|tasks|progress|evaluate|golden\s*standard)\b/i,
  media: /\b(image|photo|picture|vision|draw|dall[\s-]?e|generate\s+(?:a\s+)?(?:photo|picture|image)|analyze\s+(?:this\s+)?(?:image|photo|picture)|screenshot|ocr)\b/i,
  email: /\b(email|e-mail|mail|compose|smtp|send\s+(?:a\s+)?(?:message|letter))\b/i,
  memory: /\b(remember|memory|recall|forget|memorize|last\s+(?:week|month|year|night|time)|earlier|previously|history|trace|traces|find\s+(?:that|the|where)|did\s+(?:you|we)\s+ever|what\s+did\s+(?:you|we)\s+do)\b/i,
  tutorial: /\b(tour|tutorial|walk\s*me\s*through|guide\s*me|show\s*me\s*(?:how|where)|highlight|point\s*(?:to|at)|onboard)\b/i,
};

export const GROUP_DESCRIPTIONS = {
  core: 'Code execution, file operations, web search & scrape, data queries',
  shell: 'Terminal/shell commands, CLI tools, Codex CLI',
  agnt_platform: 'Workflow management, agent management, goals, tools, skills, AGNT API',
  agent_management: 'Create, modify, save, load, delete, list, and run AGNT agents',
  workflow_authoring: 'Edit workflows, inspect node types, create checkpoints, and start/stop workflows',
  tool_authoring: 'Generate, save, load, delete, list, and run Tool Forge tools',
  widget_authoring: 'Generate, edit, configure, save, and load dashboard widgets',
  artifact_code: 'Read, write, edit, and list files in the Artifacts workspace',
  goal_management: 'Create, execute, monitor, evaluate, and manage goals and goal tasks',
  media: 'Image analysis (vision/OCR) and image generation (DALL-E, Gemini, Grok)',
  email: 'Send emails via SMTP',
  memory: 'Persistent history search (recall / list_recent / get_trace) and per-agent memory storage',
  tutorial: 'Show in-app tours and highlight UI elements via the live PopupTutorial overlay',
};

export const GROUP_GUIDANCE = {
  core: ['ASYNC_EXECUTION_GUIDANCE', 'OFFLOADED_DATA_GUIDANCE', 'IMPORTANT_GUIDELINES', 'CHART_CHEATSHEET'],
  shell: ['ASYNC_EXECUTION_GUIDANCE'],
  agnt_platform: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES', 'MCP_TOOL_USE_RULES'],
  agent_management: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES'],
  workflow_authoring: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES'],
  tool_authoring: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES'],
  widget_authoring: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES'],
  artifact_code: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES'],
  goal_management: ['ASYNC_EXECUTION_GUIDANCE', 'IMPORTANT_GUIDELINES'],
  media: [
    'CRITICAL_IMAGE_HANDLING',
    'CRITICAL_IMAGE_GENERATION',
    'IMAGE_ANALYSIS_CAPABILITIES',
    'IMAGE_GENERATION_CAPABILITIES',
    'CRITICAL_IMAGE_REFERENCE_FORMATTING',
  ],
  email: [],
  memory: [],
  tutorial: ['IMPORTANT_GUIDELINES'],
};

export const ALWAYS_INCLUDED_GUIDANCE = new Set([
  'CRITICAL_TOOL_CALL_REQUIREMENTS',
  'RESPONSE_FORMATTING',
  'CRITICAL_TOOL_RESPONSE_RULES',
  'CHART_CHEATSHEET',
]);

const ALL_GROUPED_TOOL_NAMES = new Set(Object.values(TOOL_GROUPS).flat());

/**
 * Tool selection with intent-based codec enhancement.
 * EVO-001 (2026-06-28), v1.1.0 update (2026-06-29):
 *   Uses .cjs entry for CJS compatibility.
 *   Codec scores tools by relevance before keyword matching.
 *   Uses synchronous createRequire — safe to call from non-async context.
 */
export function selectTools(allSchemas, userMessage) {
  const matchedGroups = new Set();
  const msg = userMessage || '';

  // ─── CODEC: Score tools by intent (sync, optional) ───────────────────────
  let codecRankedNames = new Set();
  let codecTopTools = [];
  try {
    const codec = nodeRequire('../../../plugins/dev/agnt-tool-codec/codec-integration.cjs');
    const result = codec.codecSelectTools(msg, allSchemas, { maxTools: 7 });
    codecRankedNames = new Set(result.ranked.map(r => {
      const s = r.schema;
      return s?.function?.name || s?.name;
    }).filter(Boolean));
    codecTopTools = result.ranked;
    if (result.stats) {
      console.log(`[Codec] intent=${result.stats.intent} domain=${result.stats.domain} selected=${result.stats.selected} savings=${result.stats.savings}%`);
    }
  } catch {
    // Codec not installed — continue with keyword matching only
  }

  // Check each group's trigger patterns
  for (const [group, pattern] of Object.entries(GROUP_TRIGGERS)) {
    if (pattern && pattern.test(msg)) {
      matchedGroups.add(group);
    }
  }

  // If any group matched, also include core as a dependency
  if (matchedGroups.size > 0) {
    matchedGroups.add('core');
  }

  // Build the set of tool names included via matched groups
  const includedGroupToolNames = new Set();
  for (const group of matchedGroups) {
    for (const toolName of TOOL_GROUPS[group]) {
      includedGroupToolNames.add(toolName);
    }
  }

  // Build the guidance set
  const includedGuidance = new Set(ALWAYS_INCLUDED_GUIDANCE);
  for (const group of matchedGroups) {
    const sections = GROUP_GUIDANCE[group] || [];
    for (const section of sections) {
      includedGuidance.add(section);
    }
  }

  // Filter schemas:
  //   - DEFAULT_TOOLS: always included
  //   - In a keyword-matched group: included
  //   - CODEC RANKED: included if codec scored it above threshold
  //   - Plugin tools (isPlugin): ALWAYS included (auto-loaded)
  //   - Everything else: filtered out
  const filteredSchemas = allSchemas.filter((schema) => {
    const name = schema.function?.name;
    if (!name) return false;

    // Always-available defaults
    if (DEFAULT_TOOLS.has(name)) return true;

    // In a keyword-matched group
    if (includedGroupToolNames.has(name)) return true;

    // CODEC RANKED: tool was scored as relevant by intent codec
    if (codecRankedNames.has(name)) return true;

    // Plugin tools — ALWAYS included
    if (schema.isPlugin === true) return true;

    // Everything else is gated behind discover_tools
    return false;
  });

  // Sort: codec-ranked first (by score), then existing order
  if (codecTopTools.length > 0) {
    const scoreMap = new Map();
    codecTopTools.forEach(t => {
      const name = t.schema?.function?.name || t.schema?.name;
      if (name) scoreMap.set(name, t.score);
    });
    filteredSchemas.sort((a, b) => {
      const aScore = scoreMap.get(a.function?.name) ?? -1;
      const bScore = scoreMap.get(b.function?.name) ?? -1;
      return bScore - aScore;
    });
  }

  console.log(
    `[ToolSelector] "${msg.substring(0, 60)}" → Groups: [${[...matchedGroups].join(', ') || 'none'}] → ${filteredSchemas.length} tools`
  );

  return { filteredSchemas, includedGuidance, matchedGroups, codecToolNames: codecRankedNames };
}

export function getToolsForCategories(allSchemas, categories) {
  const catSet = new Set(categories);
  const includeInstalled = catSet.has('installed');

  const targetNames = new Set();
  for (const cat of catSet) {
    const tools = TOOL_GROUPS[cat];
    if (tools) {
      for (const name of tools) {
        targetNames.add(name);
      }
    }
  }

  return allSchemas.filter((schema) => {
    const name = schema.function?.name;
    if (!name) return false;
    if (targetNames.has(name)) return true;
    if (includeInstalled && !DEFAULT_TOOLS.has(name) && !ALL_GROUPED_TOOL_NAMES.has(name)) {
      return true;
    }
    return false;
  });
}

export function getGuidanceForCategories(categories) {
  const guidance = new Set();
  for (const cat of categories) {
    const sections = GROUP_GUIDANCE[cat] || [];
    for (const section of sections) {
      guidance.add(section);
    }
  }
  return guidance;
}

export function getInstalledToolNames(allSchemas) {
  return allSchemas
    .map((s) => s.function?.name)
    .filter((name) => name && !DEFAULT_TOOLS.has(name) && !ALL_GROUPED_TOOL_NAMES.has(name));
}
