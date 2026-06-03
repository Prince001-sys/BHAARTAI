type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogPayload {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: {
    message: string
    stack?: string
    name: string
  }
}

class Logger {
  private format(payload: LogPayload): string {
    // In a real production environment, this might stream directly to Datadog/CloudWatch/Firebase
    return JSON.stringify(payload)
  }

  private buildPayload(level: LogLevel, message: string, errorOrContext?: any, context?: Record<string, any>): LogPayload {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString()
    }

    if (errorOrContext instanceof Error) {
      payload.error = {
        message: errorOrContext.message,
        stack: errorOrContext.stack,
        name: errorOrContext.name
      }
      if (context) payload.context = context
    } else if (errorOrContext !== undefined) {
      payload.context = errorOrContext
    }

    return payload
  }

  info(message: string, context?: Record<string, any>) {
    const payload = this.buildPayload('info', message, context)
    console.log(this.format(payload))
  }

  warn(message: string, context?: Record<string, any>) {
    const payload = this.buildPayload('warn', message, context)
    console.warn(this.format(payload))
  }

  error(message: string, error?: unknown, context?: Record<string, any>) {
    const payload = this.buildPayload('error', message, error, context)
    console.error(this.format(payload))
    // Here you would integrate Firebase Crashlytics or Sentry capturing
    // e.g. Sentry.captureException(error)
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      const payload = this.buildPayload('debug', message, context)
      console.debug(this.format(payload))
    }
  }
}

export const logger = new Logger()
