import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { initMatchmakingGateway } from './features/matchmaking/matchmaking.gateway';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  initMatchmakingGateway(server);

  server.listen(Number(env.PORT), () => {
    console.log(`🚀 API & WebSocket running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('💤 Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
