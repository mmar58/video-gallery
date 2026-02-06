import { io } from "socket.io-client";

// Extract base URL from api.js convention or env
// Ideally we should export API_BASE from api.js
export const SOCKET_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:88'
    : 'http://192.168.0.2:88';

export const socket = io(SOCKET_URL, {
    autoConnect: false
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
