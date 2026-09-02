import { io, Socket } from 'socket.io-client';
import { API_HOST } from '../api/client';

let matchmakingSocket: Socket | null = null;

export function connectMatchmakingSocket(accessToken: string): Socket {
  if (matchmakingSocket?.connected) {
    return matchmakingSocket;
  }

  if (matchmakingSocket) {
    matchmakingSocket.disconnect();
  }

  matchmakingSocket = io(`${API_HOST}/matchmaking`, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return matchmakingSocket;
}

export function getMatchmakingSocket(): Socket | null {
  return matchmakingSocket;
}

export function disconnectMatchmakingSocket(): void {
  if (matchmakingSocket) {
    matchmakingSocket.disconnect();
    matchmakingSocket = null;
  }
}
