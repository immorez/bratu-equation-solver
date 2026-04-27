import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket?.connected) return socket;
  const token = useAuthStore.getState().token;
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
