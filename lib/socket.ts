import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId?: string): Socket => {
  if (!socket) {
    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://flash-flow-socket-server-03sr.onrender.com'
      : 'http://localhost:3001';

    console.log(' Connecting to socket:', socketUrl);
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(' Socket connected:', socket?.id);
      if (userId) {
        socket?.emit('user-authenticated', userId);
      }
    });

    socket.on('connect_error', (error) => {
      console.error(' Socket error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(' Socket disconnected:', reason);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

export const sendMessage = (message: string, userId?: string, token?: string | null): boolean => {
  if (socket?.connected) {
    console.log(' Sending message via socket');
    socket.emit('send-message', { message, userId, token });
    return true;
  }
  console.log(' Socket not connected');
  return false;
};