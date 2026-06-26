class Tool {
  constructor(){ this.name='lssao-tool-id-map'; }
  async execute(params, inputData, workflowEngine){
    try {

const raw = String(params.tool || '').trim();
if(!raw) throw new Error('tool is required');
const underscore = raw.includes('-') ? raw.replace(/-/g,'_') : raw;
const kebab = raw.includes('_') ? raw.replace(/_/g,'-') : raw;
return {
  success:true,
  result: {
    input: raw,
    underscoreId: underscore,
    kebabEndpointName: kebab,
    agentToolCallId: underscore,
    httpExecuteEndpoint: '/api/tools/' + kebab + '/execute'
  }
};

    } catch (error) {
      console.error('['+this.name+'] Error:', error);
      return { success:false, error: String(error?.message||error) };
    }
  }
}

export default new Tool();
