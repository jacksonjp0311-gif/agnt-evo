import { describe, expect, it } from 'vitest';
import { selectTools } from './toolSelector.js';

describe('toolSelector codec integration', () => {
  it('loads the CJS codec and resolves hyphenated index names to live schema names', () => {
    const schemas = [
      { function: { name: 'execute_javascript_code' } },
      { function: { name: 'file_operations' } },
      { function: { name: 'web_search' } },
      { function: { name: 'agnt_tools' } },
    ];

    const { filteredSchemas, codecToolNames } = selectTools(
      schemas,
      'run javascript code to calculate and transform data'
    );

    const names = filteredSchemas.map((schema) => schema.function?.name);
    expect(codecToolNames.has('execute_javascript_code')).toBe(true);
    expect(names).toContain('execute_javascript_code');
  });
});
