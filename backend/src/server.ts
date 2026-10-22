import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`[MiniLedger] API listening on http://localhost:${env.PORT}`);
  console.log(
    '[MiniLedger] Mock OTPs are printed in this terminal; no SMS is sent.',
  );
});

let isShuttingDown = false;

/**
 * Stop accepting new connections, let in-flight requests finish, then close
 * Prisma's connection pool. The forced timeout prevents a hung request from
 * keeping the process alive forever.
 */
function shutdown(signal: string): void {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`\n[MiniLedger] ${signal} received. Shutting down...`);

  const forceExit = setTimeout(() => {
    console.error('[MiniLedger] Graceful shutdown timed out. Exiting.');
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close((error) => {
    clearTimeout(forceExit);

    void prisma
      .$disconnect()
      .catch((disconnectError: unknown) => {
        console.error(
          '[MiniLedger] Failed to disconnect Prisma:',
          disconnectError,
        );
      })
      .finally(() => {
        process.exit(error ? 1 : 0);
      });
  });
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
