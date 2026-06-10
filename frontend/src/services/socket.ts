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
    });
  }
  return socket;
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
