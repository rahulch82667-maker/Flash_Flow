import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

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
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('ping', (data) => {
      console.log('Received ping, sending pong');
      socket?.emit('pong', { timestamp: Date.now() });
    });

    socket.on('connect', () => {
      console.log(' Socket connected:', socket?.id);
      if (userId) {
        socket?.emit('user-authenticated', userId);
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    });

    socket.on('connect_error', (error) => {
      console.error(' Socket error:', error.message);
       if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...');
          socket?.connect();
          reconnectTimer = null;
        }, 3000);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(' Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log(' Server disconnected, reconnecting...');
        setTimeout(() => {
          socket?.connect();
        }, 1000);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

        setInterval(() => {
      if (socket?.connected) {
        console.log('Connection healthy');
      } else {
        console.log('Connection lost, checking...');
      }
    }, 30000);
  }

  return socket;
};



export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
   if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
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