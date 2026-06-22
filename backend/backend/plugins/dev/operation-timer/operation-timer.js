class OperationTimerWidget {
  constructor() {
    this.name = 'operation-timer-widget';
  }

  async execute(params, inputData, workflowEngine) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const widgetPath = path.join(__dirname, 'widget.html');
      
      let html = '';
      try {
        html = fs.readFileSync(widgetPath, 'utf-8');
      } catch (e) {
        html = '<div style="padding:16px;color:#e0e0e0;">Operation Timer Widget</div>';
      }

      return {
        success: true,
        html: html,
        widgetId: 'operation-timer-panel',
        message: 'Operation Timer widget ready'
      };
    } catch (error) {
      console.error('[OperationTimerWidget] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new OperationTimerWidget();
