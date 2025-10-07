import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', token);

          // Use real Firebase UID and profile
          const realUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            photoURL: firebaseUser.photoURL,
            subscription: { status: 'free' },
            workspaces: []
          };

          setUser(realUser);
          console.log('User authenticated:', realUser);
        } catch (error) {
          console.error('Auth verification failed:', error);
          // Fallback minimal profile
          const fallbackUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            photoURL: firebaseUser.photoURL,
            subscription: { status: 'free' },
            workspaces: []
          };
          setUser(fallbackUser);
        }
      } else {
        localStorage.removeItem('firebaseToken');
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
