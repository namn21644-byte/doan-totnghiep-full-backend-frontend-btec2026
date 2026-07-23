import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { initSocket } from './sockets/index.js';

async function bootstrap() {
  await connectDatabase();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`Server is running on port ${env.port} [${env.nodeEnv}]`);
    logger.info('Socket.IO is ready for realtime alerts');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    httpServer.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => process.exit(0));
  });
}

bootstrap();
