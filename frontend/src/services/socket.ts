import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const socketUrl = BACKEND_URL ? BACKEND_URL : '/';
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};

export const updateSocketToken = (newToken: string): void => {
  if (socket) {
    socket.auth = { token: newToken };
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
};

export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
