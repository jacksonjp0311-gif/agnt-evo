import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

// In-memory session store — persists for the lifetime of the AGNT backend process
const sessions = new Map();

class TerminalSession {
  constructor() {
    this.name = 'terminal-session';
  }

  /**
   * Create a new terminal session
   */
  #createSession(sessionId, shell, workingDirectory) {
    let shellPath;
    let shellArgs;

    switch (shell) {
      case 'powershell':
        shellPath = 'powershell.exe';
        shellArgs = ['-NoProfile', '-NoLogo', '-Command', '-'];
        break;
      case 'pwsh':
        shellPath = 'pwsh.exe';
        shellArgs = ['-NoProfile', '-NoLogo', '-Command', '-'];
        break;
      case 'wt':
        shellPath = 'wt.exe';
        shellArgs = ['powershell.exe', '-NoProfile', '-NoLogo', '-Command', '-'];
        break;
      case 'cmd':
      default:
        shellPath = 'cmd.exe';
        shellArgs = ['/Q', '/K'];
        break;
    }

    const options = {
      windowsHide: false,
      stdio: ['pipe', 'pipe', 'pipe']
    };

    if (workingDirectory) {
      const resolved = path.resolve(workingDirectory.trim());
      if (existsSync(resolved)) {
        options.cwd = resolved;
      }
    }

    const proc = spawn(shellPath, shellArgs, options);

    const session = {
      id: sessionId,
      process: proc,
      shell: shell,
      output: '',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      pendingData: '',
      lineCallback: null,
      lineBuffer: []
    };

    // Collect stdout
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      session.output += text;
      session.lastActivity = new Date().toISOString();
      session.pendingData += text;

      // Split into lines and buffer them
      const lines = session.pendingData.split(/\r?\n/);
      session.pendingData = lines.pop(); // Keep incomplete line
      for (const line of lines) {
        session.lineBuffer.push(line);
      }

      // If there's a waiting callback, fulfill it
      if (session.lineCallback && session.lineBuffer.length > 0) {
        const callback = session.lineCallback;
        session.lineCallback = null;
        const result = {
          output: session.lineBuffer.join('\n'),
          done: !proc.killed
        };
        session.lineBuffer = [];
        callback.resolve(result);
      }
    });

    // Collect stderr
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      session.output += text;
      session.lastActivity = new Date().toISOString();
      session.lineBuffer.push('[stderr] ' + text.trim());
    });

    // Handle process exit
    proc.on('close', (code) => {
      session.exitCode = code;
      session.endedAt = new Date().toISOString();
      console.log(`[${this.name}] Session '${sessionId}' exited with code ${code}`);

      // Fulfill any waiting callback
      if (session.lineCallback) {
        const callback = session.lineCallback;
        session.lineCallback = null;
        callback.resolve({
          output: session.lineBuffer.join('\n'),
          done: true
        });
      }
    });

    proc.on('error', (err) => {
      console.error(`[${this.name}] Session '${sessionId}' error:`, err);
      session.lineBuffer.push(`[error] ${err.message}`);
    });

    return session;
  }

  /**
   * Wait for output lines from a session
   */
  #waitForOutput(session, timeoutMs) {
    return new Promise((resolve) => {
      // If we already have buffered lines, return immediately
      if (session.lineBuffer.length > 0) {
        const output = session.lineBuffer.join('\n');
        session.lineBuffer = [];
        resolve({ output, done: !session.process.killed });
        return;
      }

      // If process is dead, return whatever we have
      if (session.process.killed) {
        resolve({ output: session.pendingData || '', done: true });
        return;
      }

      // Set timeout
      const timer = setTimeout(() => {
        session.lineCallback = null;
        const output = session.pendingData + session.lineBuffer.join('\n');
        session.lineBuffer = [];
        session.pendingData = '';
        resolve({ output: output || '(no output yet)', done: !session.process.killed });
      }, timeoutMs);

      // Register callback for when data arrives
      session.lineCallback = {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        }
      };
    });
  }

  async execute(params) {
    try {
      const {
        action,
        sessionId,
        shell = 'cmd',
        command,
        workingDirectory,
        timeout = '5000'
      } = params;

      if (!action) {
        return { success: false, error: 'action is required' };
      }

      const timeoutMs = parseInt(timeout) || 5000;

      switch (action) {
        case 'open': {
          if (!sessionId) {
            return { success: false, error: 'sessionId is required to open a new session' };
          }

          if (sessions.has(sessionId)) {
            return { success: false, error: `Session '${sessionId}' already exists. Use 'exec' to send commands, or 'close' first.` };
          }

          const session = this.#createSession(sessionId, shell, workingDirectory);
          sessions.set(sessionId, session);

          // Wait briefly for shell startup output
          await new Promise(r => setTimeout(r, 500));
          const { output } = await this.#waitForOutput(session, 1000);

          console.log(`[${this.name}] Opened session '${sessionId}' (${shell})`);

          return {
            success: true,
            sessionId,
            output: output || '(session started)',
            exitCode: -1
          };
        }

        case 'exec': {
          if (!sessionId) {
            return { success: false, error: 'sessionId is required for exec' };
          }

          const session = sessions.get(sessionId);
          if (!session) {
            return { success: false, error: `Session '${sessionId}' not found. Open one first with action 'open'.` };
          }

          if (!command) {
            return { success: false, error: 'command is required for exec action' };
          }

          if (session.process.killed) {
            return { success: false, error: `Session '${sessionId}' has ended. Open a new one.` };
          }

          // Clear old buffer
          session.lineBuffer = [];
          session.pendingData = '';

          // Send command to stdin
          try {
            session.process.stdin.write(command + '\r\n');
          } catch (err) {
            return { success: false, error: `Failed to write to session: ${err.message}` };
          }

          // Wait for output
          const { output } = await this.#waitForOutput(session, timeoutMs);

          session.lastActivity = new Date().toISOString();

          console.log(`[${this.name}] Executed in '${sessionId}': ${command.substring(0, 80)}...`);

          return {
            success: true,
            sessionId,
            output: output || '(command sent, no output yet — use action=read to check again)',
            exitCode: session.exitCode ?? -1
          };
        }

        case 'read': {
          if (!sessionId) {
            return { success: false, error: 'sessionId is required for read' };
          }

          const session = sessions.get(sessionId);
          if (!session) {
            return { success: false, error: `Session '${sessionId}' not found.` };
          }

          const { output } = await this.#waitForOutput(session, timeoutMs);

          return {
            success: true,
            sessionId,
            output: output || '(no new output)',
            exitCode: session.exitCode ?? -1
          };
        }

        case 'close': {
          if (!sessionId) {
            return { success: false, error: 'sessionId is required for close' };
          }

          const session = sessions.get(sessionId);
          if (!session) {
            return { success: false, error: `Session '${sessionId}' not found.` };
          }

          // Try graceful close first
          try {
            session.process.stdin.write('exit\r\n');
          } catch (e) {}

          // Force kill after brief delay
          setTimeout(() => {
            try {
              if (!session.process.killed) {
                session.process.kill('SIGTERM');
              }
            } catch (e) {}
          }, 1000);

          sessions.delete(sessionId);

          console.log(`[${this.name}] Closed session '${sessionId}'`);

          return { success: true, sessionId, output: `Session '${sessionId}' closed` };
        }

        case 'list': {
          const list = [];
          for (const [id, s] of sessions) {
            list.push({
              sessionId: id,
              shell: s.shell,
              pid: s.process.pid,
              running: !s.process.killed,
              createdAt: s.createdAt,
              lastActivity: s.lastActivity,
              totalOutputLength: s.output.length
            });
          }

          return {
            success: true,
            sessions: list,
            count: list.length
          };
        }

        default:
          return { success: false, error: `Unknown action: ${action}. Valid: open, exec, read, close, list` };
      }
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new TerminalSession();
