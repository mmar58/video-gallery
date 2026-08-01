import { io, Socket } from "socket.io-client";
import { env } from '$env/dynamic/public';

// Use dynamic env variable PUBLIC_SOCKET_URL if provided, 
// otherwise fallback to the hardcoded defaults.
export const SOCKET_URL: string = env.PUBLIC_SOCKET_URL || (
    (typeof window !== 'undefined' && window.location.hostname === 'localhost')
        ? 'http://localhost:5000'
        : 'http://192.168.0.165:5000'
);

export const socket: Socket = io(SOCKET_URL, {
    autoConnect: false
});

export const connectSocket = (): void => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = (): void => {
    if (socket.connected) {
        socket.disconnect();
    }
};
