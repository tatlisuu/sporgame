import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import * as matchmakingService from './matchmaking.service';
import type { JwtPayload } from '../../shared/middleware/authenticate.middleware';

interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}

class UserManager {
  private userToSockets: Map<string, Set<string>> = new Map();
  private socketToUser: Map<string, string> = new Map();

  public add(userId: string, socketId: string): void {
    if (!this.userToSockets.has(userId)) {
      this.userToSockets.set(userId, new Set());
    }
    this.userToSockets.get(userId)!.add(socketId);
    this.socketToUser.set(socketId, userId);
  }

  public remove(socketId: string): string | undefined {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return undefined;

    this.socketToUser.delete(socketId);
    const sockets = this.userToSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userToSockets.delete(userId);
      }
    }
    return userId;
  }

  public getSockets(userId: string): Set<string> | undefined {
    return this.userToSockets.get(userId);
  }

  public isOnline(userId: string): boolean {
    return this.userToSockets.has(userId);
  }
}

export const activeUsers = new UserManager();

let matchmakingNsp: Namespace | null = null;

export function broadcastNewActivity(activity: any): void {
  if (matchmakingNsp) {
    matchmakingNsp.emit('new_activity', activity);
  }
}

export function initMatchmakingGateway(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const nsp = io.of('/matchmaking');
  matchmakingNsp = nsp;

  nsp.use((socket, next) => {
    const authHeader = socket.handshake.headers.authorization;
    const token =
      socket.handshake.auth?.token ||
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (!token) {
      return next(new Error('AUTH_REQUIRED'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as AuthenticatedSocket).data.user = { sub: payload.sub, email: payload.email };
      next();
    } catch {
      next(new Error('TOKEN_INVALID'));
    }
  });

  nsp.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.data.user.sub;

    activeUsers.add(userId, socket.id);
    socket.join(`user:${userId}`);

    socket.on('challenge_user', async (data: { challengedId?: string; username?: string; sportType: any }, callback) => {
      try {
        const match = await matchmakingService.createChallenge(userId, {
          challengedId: data.challengedId,
          username:     data.username,
          sportType:    data.sportType,
        });

        nsp.to(`user:${match.challengedId}`).emit('challenge_user', match);

        if (typeof callback === 'function') {
          callback({ success: true, data: match });
        }
      } catch (err: any) {
        const errorResponse = { success: false, error: err.message, code: err.code || 'CHALLENGE_FAILED' };
        socket.emit('matchmaking_error', errorResponse);
        if (typeof callback === 'function') callback(errorResponse);
      }
    });

    socket.on('challenge_accepted', async (data: { matchId: string }, callback) => {
      try {
        const match = await matchmakingService.respondToChallenge(data.matchId, userId, { action: 'ACCEPT' });

        nsp.to(`user:${match.challengerId}`).emit('challenge_accepted', match);
        nsp.to(`user:${match.challengedId}`).emit('challenge_accepted', match);

        if (typeof callback === 'function') {
          callback({ success: true, data: match });
        }
      } catch (err: any) {
        const errorResponse = { success: false, error: err.message, code: err.code || 'ACCEPT_FAILED' };
        socket.emit('matchmaking_error', errorResponse);
        if (typeof callback === 'function') callback(errorResponse);
      }
    });

    socket.on('challenge_rejected', async (data: { matchId: string }, callback) => {
      try {
        const match = await matchmakingService.respondToChallenge(data.matchId, userId, { action: 'REJECT' });

        nsp.to(`user:${match.challengerId}`).emit('challenge_rejected', match);

        if (typeof callback === 'function') {
          callback({ success: true, data: match });
        }
      } catch (err: any) {
        const errorResponse = { success: false, error: err.message, code: err.code || 'REJECT_FAILED' };
        socket.emit('matchmaking_error', errorResponse);
        if (typeof callback === 'function') callback(errorResponse);
      }
    });

    socket.on('match_result', async (data: { matchId: string; winnerId: string }, callback) => {
      try {
        const match = await matchmakingService.reportResult(data.matchId, userId, { winnerId: data.winnerId });

        nsp.to(`user:${match.challengerId}`).emit('match_result', match);
        nsp.to(`user:${match.challengedId}`).emit('match_result', match);

        if (typeof callback === 'function') {
          callback({ success: true, data: match });
        }
      } catch (err: any) {
        const errorResponse = { success: false, error: err.message, code: err.code || 'RESULT_FAILED' };
        socket.emit('matchmaking_error', errorResponse);
        if (typeof callback === 'function') callback(errorResponse);
      }
    });

    socket.on('disconnect', () => {
      activeUsers.remove(socket.id);
    });
  });

  return io;
}
