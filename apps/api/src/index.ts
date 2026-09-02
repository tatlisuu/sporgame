import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { initMatchmakingGateway } from './features/matchmaking/matchmaking.gateway';

async function bootstrap(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  initMatchmakingGateway(server);

  const port = Number(env.PORT) || 3000;
  const host = '0.0.0.0';

  server.listen(port, host, () => {
    console.log(`🚀 API & WebSocket running on http://${host}:${port} [${env.NODE_ENV}]`);
  });

  try {
    await connectDatabase();
  } catch (dbError) {
    console.error('❌ Failed to connect to MongoDB on startup:', dbError);
  }

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
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
