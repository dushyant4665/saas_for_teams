import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        
        // Use real Firebase ID token if available, fallback to demo
        const token = localStorage.getItem('firebaseToken');
        if (token) {
          console.log('Authenticating socket with Firebase token');
          newSocket.emit('authenticate', { token });
        } else {
          console.log('No Firebase token found, using demo token');
          newSocket.emit('authenticate', { token: 'demo_token_123' });
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data);
      });

      // Handle user join notifications
      newSocket.on('user-joined', (data) => {
        console.log('User joined:', data.user.displayName);
        toast.success(`${data.user.displayName} joined the workspace!`);
      });

      // Handle user leave notifications
      newSocket.on('user-left', (data) => {
        console.log('User left:', data.user.displayName);
        toast.info(`${data.user.displayName} left the workspace`);
      });

      // Handle active users update
      newSocket.on('active-users-update', (data) => {
        console.log('Active users update:', data);
        // This will be handled by components that need it
      });

      newSocket.on('auth_error', (data) => {
        console.error('Socket auth error:', data);
        toast.error('Authentication failed');
      });

      newSocket.on('error', (data) => {
        console.error('Socket error:', data);
        toast.error(data.message || 'Connection error');
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  return { socket, isConnected };
};

