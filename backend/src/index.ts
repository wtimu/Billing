import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { createPaymentWorker, createSmsWorker } from './queues/index.js';
import { prisma } from './lib/prisma.js';
import { processPaymentJob } from './workers/paymentConfirmation.js';
import { processSmsJob } from './workers/smsDispatch.js';
import { RadiusServer } from './radius/server.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

server.on('close', async () => {
  await prisma.$disconnect();
});

createPaymentWorker(processPaymentJob);

createSmsWorker(processSmsJob);

// Start RADIUS server
const radiusServer = new RadiusServer();
radiusServer.start();

server.on('close', () => {
  radiusServer.stop();
});
