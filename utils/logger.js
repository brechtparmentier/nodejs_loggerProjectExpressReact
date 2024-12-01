import winston from "winston";

// Functie om logger te creëren
function createLogger({ logDir = './logs', errorFilename = 'error.log', combinedFilename = 'combined.log' } = {}) {
  const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  });

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }), // Om stack traces te loggen
      logFormat
    ),
    transports: [
      new winston.transports.File({
        filename: `${logDir}/${errorFilename}`,
        level: "error",
      }),
      new winston.transports.File({
        filename: `${logDir}/${combinedFilename}`,
      }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return logger;
}

export default createLogger;
