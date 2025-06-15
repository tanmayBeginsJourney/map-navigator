// Frontend Logger Utility
// Follows structured logging patterns from packages/api/LOGGING.md

interface LogLevel {
  FATAL: 60;
  ERROR: 50;
  WARN: 40;
  INFO: 30;
  DEBUG: 20;
  TRACE: 10;
}

const LOG_LEVELS: LogLevel = {
  FATAL: 60,
  ERROR: 50,
  WARN: 40,
  INFO: 30,
  DEBUG: 20,
  TRACE: 10,
};

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: number;
  time: number;
  service: string;
  version: string;
  environment: string;
  msg: string;
  [key: string]: unknown;
}

class FrontendLogger {
  private readonly service = 'campus-navigation-web';
  private readonly version = '1.0.0';
  private readonly environment = import.meta.env.MODE || 'development';
  private readonly logLevel = this.getLogLevel();

  private getLogLevel(): number {
    const level = import.meta.env.VITE_LOG_LEVEL || 'info';
    switch (level.toLowerCase()) {
      case 'fatal': return LOG_LEVELS.FATAL;
      case 'error': return LOG_LEVELS.ERROR;
      case 'warn': return LOG_LEVELS.WARN;
      case 'info': return LOG_LEVELS.INFO;
      case 'debug': return LOG_LEVELS.DEBUG;
      case 'trace': return LOG_LEVELS.TRACE;
      default: return LOG_LEVELS.INFO;
    }
  }

  private shouldLog(level: number): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: number, msg: string, context?: LogContext): LogEntry {
    return {
      level,
      time: Date.now(),
      service: this.service,
      version: this.version,
      environment: this.environment,
      msg,
      ...context,
    };
  }

  private output(entry: LogEntry): void {
    if (this.environment === 'development') {
      // Pretty output for development
      const emoji = this.getLevelEmoji(entry.level);
      const timestamp = new Date(entry.time).toLocaleTimeString();
      const context: Record<string, unknown> = {};
      Object.keys(entry)
        .filter(key => !['level', 'time', 'service', 'version', 'environment', 'msg'].includes(key))
        .forEach(key => {
          context[key] = entry[key];
        });
      
      const hasContext = Object.keys(context).length > 0;
      console.log(
        `${emoji} [${timestamp}] ${entry.msg}`,
        hasContext ? context : ''
      );
    } else {
      // Structured JSON for production
      console.log(JSON.stringify(entry));
    }
  }

  private getLevelEmoji(level: number): string {
    if (level >= LOG_LEVELS.FATAL) return '💀';
    if (level >= LOG_LEVELS.ERROR) return '❌';
    if (level >= LOG_LEVELS.WARN) return '⚠️';
    if (level >= LOG_LEVELS.INFO) return 'ℹ️';
    if (level >= LOG_LEVELS.DEBUG) return '🐛';
    return '📝';
  }

  fatal(context: LogContext, msg: string): void;
  fatal(msg: string): void;
  fatal(contextOrMsg: LogContext | string, msg?: string): void {
    if (!this.shouldLog(LOG_LEVELS.FATAL)) return;
    
    if (typeof contextOrMsg === 'string') {
      this.output(this.createLogEntry(LOG_LEVELS.FATAL, contextOrMsg));
    } else {
      this.output(this.createLogEntry(LOG_LEVELS.FATAL, msg!, contextOrMsg));
    }
  }

  error(context: LogContext, msg: string): void;
  error(msg: string): void;
  error(contextOrMsg: LogContext | string, msg?: string): void {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
    
    if (typeof contextOrMsg === 'string') {
      this.output(this.createLogEntry(LOG_LEVELS.ERROR, contextOrMsg));
    } else {
      this.output(this.createLogEntry(LOG_LEVELS.ERROR, msg!, contextOrMsg));
    }
  }

  warn(context: LogContext, msg: string): void;
  warn(msg: string): void;
  warn(contextOrMsg: LogContext | string, msg?: string): void {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    
    if (typeof contextOrMsg === 'string') {
      this.output(this.createLogEntry(LOG_LEVELS.WARN, contextOrMsg));
    } else {
      this.output(this.createLogEntry(LOG_LEVELS.WARN, msg!, contextOrMsg));
    }
  }

  info(context: LogContext, msg: string): void;
  info(msg: string): void;
  info(contextOrMsg: LogContext | string, msg?: string): void {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    
    if (typeof contextOrMsg === 'string') {
      this.output(this.createLogEntry(LOG_LEVELS.INFO, contextOrMsg));
    } else {
      this.output(this.createLogEntry(LOG_LEVELS.INFO, msg!, contextOrMsg));
    }
  }

  debug(context: LogContext, msg: string): void;
  debug(msg: string): void;
  debug(contextOrMsg: LogContext | string, msg?: string): void {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    
    if (typeof contextOrMsg === 'string') {
      this.output(this.createLogEntry(LOG_LEVELS.DEBUG, contextOrMsg));
    } else {
      this.output(this.createLogEntry(LOG_LEVELS.DEBUG, msg!, contextOrMsg));
    }
  }

  trace(context: LogContext, msg: string): void;
  trace(msg: string): void;
  trace(contextOrMsg: LogContext | string, msg?: string): void {
    if (!this.shouldLog(LOG_LEVELS.TRACE)) return;
    
    if (typeof contextOrMsg === 'string') {
      this.output(this.createLogEntry(LOG_LEVELS.TRACE, contextOrMsg));
    } else {
      this.output(this.createLogEntry(LOG_LEVELS.TRACE, msg!, contextOrMsg));
    }
  }
}

// Export singleton instance
const logger = new FrontendLogger();
export default logger;

// Export types for use in stores
export type { LogContext }; 