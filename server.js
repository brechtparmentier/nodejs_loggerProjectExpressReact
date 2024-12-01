import express from 'express';
import http from 'http';
import { WebSocketServer } from "ws";

import path from 'path';
import { Tail } from 'tail';
import readLastLines from 'read-last-lines';
import createLogger from './utils/logger.js';

const logger = createLogger({
  logDir: './logs',
  errorFilename: 'error.log',
  combinedFilename: 'combined.log',
});

const app = express();
const server = http.createServer(app);

const logPaths = {
  'gkok-express-combined': '/srv/schoolDBHoofdMap/gkok-express/logbook/combined.log',
  'gkok-express-debug': '/srv/schoolDBHoofdMap/gkok-express/logbook/debug.log',
  'gkok-express-error': '/srv/schoolDBHoofdMap/gkok-express/logbook/error.log',
  'logexpress-pm2': '/home/brecht/.pm2/logs/server-out.log',
  'nodeJS_MS365CalendarToGoogleSheet': '/srv/gkok/nodeJS_MS365CalendarToGoolgeSheet/server/combined.log',
};

app.get('/api/logs', (req, res) => {
  logger.info('API /api/logs aangeroepen');
  const availableLogs = Object.keys(logPaths).map(key => ({
    name: key,
    description: `Beschrijving voor ${key}`,
  }));
  res.json(availableLogs);
});

const wss = new WebSocketServer({ server });


wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');

  ws.on('message', async (message) => {
    let logFile;
    try {
      const { logName, numLines } = JSON.parse(message);
      const parsedNumLines = parseInt(numLines, 10);

      logFile = logPaths[logName];

      if (!logFile) {
        throw new Error('Invalid log file key');
      }

      if (isNaN(parsedNumLines) || parsedNumLines < 1) {
        throw new Error('Invalid number of lines requested');
      }

      logger.info(`Log file ${logName} aangevraagd met ${numLines} regels`);
      const lastLines = await readLastLines.read(logFile, parsedNumLines);
      ws.send(JSON.stringify({ logKey: logName, lines: lastLines }));
    } catch (error) {
      logger.error(error.message);
      ws.send(JSON.stringify({ error: error.message }));
    }

    const tail = new Tail(logFile);
    tail.on("line", (data) => {
      ws.send(JSON.stringify({ logKey: logName, line: data }));
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
      tail.unwatch();
    });
  });
});

app.use(express.static(path.join(process.cwd(), './logviewer-app/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), './logviewer-app/build', 'index.html'));
});

server.listen(3004, () => {
  logger.info('Server listening on port 3004');
});
