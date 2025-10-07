const { verifyToken } = require('../middleware/auth');
const { auth } = require('../config/firebase');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');
const EditorContent = require('../models/EditorContent');

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
const typingUsers = new Map(); // workspaceId -> Set of userIds
const workspaceUsers = new Map(); // workspaceId -> Set of userIds
const workspaceMessages = new Map(); // workspaceId -> Array of messages
const workspaceEditor = new Map();   // workspaceSlug -> { content, version, lastEditedBy, lastEditedAt }

const socketHandler = async (io, socket) => {
  console.log('New socket connection:', socket.id);

  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      
      if (!token) {
        socket.emit('auth_error', { message: 'No token provided' });
        return;
      }

      // For demo purposes, create mock user
      let mockUser;
      
      if (token === 'demo_token_123') {
        // Demo user with consistent ID
        mockUser = {
          _id: 'demo_user_123',
          firebaseUid: 'demo_user_123',
          displayName: 'Demo User',
          email: 'demo@example.com',
          photoURL: null,
          lastActive: new Date()
        };
      } else {
        try {
          // Verify Firebase token
          const decodedToken = await auth.verifyIdToken(token);
          
          mockUser = {
            _id: decodedToken.uid,
            firebaseUid: decodedToken.uid,
            displayName: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),
            email: decodedToken.email || null,
            photoURL: decodedToken.picture || null,
            lastActive: new Date()
          };
        } catch (error) {
          console.error('Token verification failed:', error);
          socket.emit('auth_error', { message: 'Invalid token' });
          return;
        }
      }

      // Store user info
      socket.userId = mockUser._id;
      socket.user = mockUser;
      
      // Update active users
      activeUsers.set(mockUser._id, socket.id);
      userSockets.set(socket.id, mockUser._id);

      socket.emit('authenticated', { 
        user: {
          id: mockUser._id,
          displayName: mockUser.displayName,
          photoURL: mockUser.photoURL
        }
      });

      console.log('User authenticated:', mockUser.displayName);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Join workspace room
  socket.on('join-room', async (data) => {
    try {
      const { workspaceSlug } = data;
      
      // Auto-create demo user if not authenticated
      if (!socket.userId) {
        console.log('🔧 AUTO-CREATING DEMO USER FOR JOIN-ROOM');
        socket.userId = 'demo_user_123';
        socket.user = {
          _id: 'demo_user_123',
          displayName: 'Demo User',
          email: 'demo@example.com',
          photoURL: null
        };
        console.log('✅ Created demo user for join-room:', socket.userId);
      }

      // Create mock workspace for demo
      const mockWorkspace = {
        _id: `workspace_${workspaceSlug}`,
        slug: workspaceSlug,
        name: workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1).replace(/-/g, ' '),
        members: [{
          user: socket.userId,
          role: 'admin'
        }]
      };

      console.log(`${socket.user.displayName} joined workspace: ${workspaceSlug}`);

      // Leave previous room if any
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
        socket.leave(`typing-${socket.currentRoom}`);
      }

      // Join new room
      socket.join(workspaceSlug);
      socket.currentRoom = workspaceSlug;
      
      // Track workspace users - allow multiple sockets per user
      if (!workspaceUsers.has(workspaceSlug)) {
        workspaceUsers.set(workspaceSlug, new Set());
      }
      // Add socket ID instead of user ID to track unique connections
      workspaceUsers.get(workspaceSlug).add(socket.id);
      
      console.log(`👥 WORKSPACE USERS TRACKING:`);
      console.log(`   Workspace: ${workspaceSlug}`);
      console.log(`   All users in workspace: ${Array.from(workspaceUsers.get(workspaceSlug))}`);
      console.log(`   Total count: ${workspaceUsers.get(workspaceSlug).size}`);
      
      console.log(`🔗 SOCKET JOINED ROOM: ${workspaceSlug}`);
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   User ID: ${socket.userId}`);
      console.log(`   Current Room: ${socket.currentRoom}`);
      
      // Get active users count
      const activeUsersCount = workspaceUsers.get(workspaceSlug).size;
      
      console.log(`🔗 USER JOINED WORKSPACE:`);
      console.log(`   User: ${socket.user.displayName}`);
      console.log(`   Workspace: ${workspaceSlug}`);
      console.log(`   Active users: ${Array.from(workspaceUsers.get(workspaceSlug))}`);
      console.log(`   Count: ${activeUsersCount}`);
      
      // Notify others in the room about new user
      socket.to(workspaceSlug).emit('user-joined', {
        user: {
          id: socket.user._id,
          displayName: socket.user.displayName,
          photoURL: socket.user.photoURL
        },
        activeUsersCount: activeUsersCount
      });
      
      // Send current active users count to the joining user
      socket.emit('active-users-update', {
        count: activeUsersCount,
        users: Array.from(workspaceUsers.get(workspaceSlug)).map(socketId => {
          const userSocket = io.sockets.sockets.get(socketId);
          return {
            id: userSocket?.userId || socketId,
            displayName: userSocket?.user?.displayName || 'User'
          };
        })
      });

      // Send chat history to the joining user
      const chatHistory = workspaceMessages.get(workspaceSlug) || [];
      socket.emit('recent-messages', {
        messages: chatHistory
      });
      
      console.log(`Sent ${chatHistory.length} messages to ${socket.user.displayName}`);

      // Send current editor content for workspace (or default)
      const existingEditor = workspaceEditor.get(workspaceSlug) || {
        content: '',
        version: 1,
        lastEditedBy: socket.userId,
        lastEditedAt: new Date()
      };
      socket.emit('editor-content', existingEditor);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    try {
      const { content, workspaceSlug } = data;
      
      console.log(`📝 CHAT MESSAGE DEBUG:`);
      console.log(`   Socket User ID: ${socket.userId}`);
      console.log(`   Socket Current Room: ${socket.currentRoom}`);
      console.log(`   Message Workspace Slug: ${workspaceSlug}`);
      console.log(`   Room Match: ${socket.currentRoom === workspaceSlug}`);
      
      if (!socket.userId) {
        console.log('❌ No socket user ID - creating demo user');
        // Create demo user on the fly
        socket.userId = 'demo_user_123';
        socket.user = {
          _id: 'demo_user_123',
          displayName: 'Demo User',
          email: 'demo@example.com',
          photoURL: null
        };
        console.log('✅ Created demo user:', socket.userId);
      }
      
      if (!socket.currentRoom) {
        console.log('❌ No current room set - auto-joining workspace room');
        socket.join(workspaceSlug);
        socket.currentRoom = workspaceSlug;
        
        // Track workspace users
        if (!workspaceUsers.has(workspaceSlug)) {
          workspaceUsers.set(workspaceSlug, new Set());
        }
        workspaceUsers.get(workspaceSlug).add(socket.id);
        
        console.log('✅ Auto-joined room:', workspaceSlug);
      }
      
      if (socket.currentRoom !== workspaceSlug) {
        console.log('❌ Room mismatch - joining correct room');
        // Auto-join the correct room
        socket.join(workspaceSlug);
        socket.currentRoom = workspaceSlug;
        
        // Track workspace users
        if (!workspaceUsers.has(workspaceSlug)) {
          workspaceUsers.set(workspaceSlug, new Set());
        }
        workspaceUsers.get(workspaceSlug).add(socket.id);
        
        console.log(`✅ Auto-joined room: ${workspaceSlug}`);
      }

      if (!content || content.trim().length === 0) {
        return;
      }

      // Create mock message for demo
      const mockMessage = {
        id: `msg_${Date.now()}`,
        content: content.trim(),
        sender: {
          id: socket.userId, // This should match user.id in client
          displayName: socket.user.displayName,
          photoURL: socket.user.photoURL
        },
        type: 'text',
        createdAt: new Date()
      };
      
      console.log('📝 CREATING MESSAGE:');
      console.log('   Sender ID:', socket.userId);
      console.log('   Message:', content.trim());
      console.log('   Workspace:', workspaceSlug);

      // Store message in workspace history
      if (!workspaceMessages.has(workspaceSlug)) {
        workspaceMessages.set(workspaceSlug, []);
      }
      workspaceMessages.get(workspaceSlug).push(mockMessage);
      
      // Keep only last 50 messages to prevent memory issues
      if (workspaceMessages.get(workspaceSlug).length > 50) {
        workspaceMessages.get(workspaceSlug).shift();
      }

      // Get all sockets in the room to verify broadcasting
      const roomSockets = await io.in(workspaceSlug).fetchSockets();
      console.log(`📡 ROOM SOCKETS INFO:`);
      console.log(`   Room: ${workspaceSlug}`);
      console.log(`   Total sockets in room: ${roomSockets.length}`);
      roomSockets.forEach((sock, index) => {
        console.log(`   Socket ${index + 1}: ${sock.id} | User: ${sock.userId}`);
      });

      // Force broadcast to ALL sockets in the room
      const room = io.sockets.adapter.rooms.get(workspaceSlug);
      if (room) {
        console.log(`📡 FORCE BROADCASTING to ${room.size} sockets in room ${workspaceSlug}`);
        room.forEach(socketId => {
          const targetSocket = io.sockets.sockets.get(socketId);
          if (targetSocket) {
            targetSocket.emit('new-message', mockMessage);
            console.log(`   ✅ Sent to socket: ${socketId} (User: ${targetSocket.userId})`);
          }
        });
      } else {
        console.log(`❌ Room ${workspaceSlug} not found, using fallback`);
        io.to(workspaceSlug).emit('new-message', mockMessage);
      }
      
      console.log(`📢 MESSAGE BROADCASTED TO ALL:`);
      console.log(`   From: ${socket.user.displayName}`);
      console.log(`   Content: ${content.trim()}`);
      console.log(`   Workspace: ${workspaceSlug}`);
      console.log(`   Room members: ${Array.from(workspaceUsers.get(workspaceSlug) || [])}`);
      console.log(`   Total messages: ${workspaceMessages.get(workspaceSlug).length}`);
      console.log(`   Active users: ${workspaceUsers.get(workspaceSlug)?.size || 0}`);
      console.log(`   Broadcasted to ${roomSockets.length} sockets`);
      
      // Also send to sender to confirm message was sent
      socket.emit('message-sent', {
        messageId: mockMessage.id,
        timestamp: mockMessage.createdAt
      });

    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle editor updates
  socket.on('editor-update', async (data) => {
    try {
      const { content, workspaceSlug, version } = data;
      
      if (!socket.userId || !socket.currentRoom || socket.currentRoom !== workspaceSlug) {
        socket.emit('error', { message: 'Not in workspace' });
        return;
      }

      // Compute next version based on stored state to keep sequence consistent
      const prev = workspaceEditor.get(workspaceSlug);
      const nextVersion = (prev?.version || version || 1) + 1;
      const editorData = {
        content: content || '',
        version: nextVersion,
        lastEditedBy: socket.userId,
        lastEditedAt: new Date()
      };

      // Store latest editor state
      workspaceEditor.set(workspaceSlug, editorData);

      // Broadcast update to ALL in room (including sender) to keep versions in sync
      io.to(workspaceSlug).emit('editor-updated', editorData);

    } catch (error) {
      console.error('Editor update error:', error);
      socket.emit('error', { message: 'Failed to update editor' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    if (!socket.userId || !socket.currentRoom) return;
    
    const { workspaceSlug } = data;
    if (workspaceSlug !== socket.currentRoom) return;

    if (!typingUsers.has(workspaceSlug)) {
      typingUsers.set(workspaceSlug, new Set());
    }
    
    typingUsers.get(workspaceSlug).add(socket.userId);
    
    socket.to(workspaceSlug).emit('user-typing', {
      userId: socket.userId,
      displayName: socket.user.displayName,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data) => {
    if (!socket.userId || !socket.currentRoom) return;
    
    const { workspaceSlug } = data;
    if (workspaceSlug !== socket.currentRoom) return;

    if (typingUsers.has(workspaceSlug)) {
      typingUsers.get(workspaceSlug).delete(socket.userId);
      
      socket.to(workspaceSlug).emit('user-typing', {
        userId: socket.userId,
        displayName: socket.user.displayName,
        isTyping: false
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    
    if (socket.userId) {
      // Remove from active users
      activeUsers.delete(socket.userId);
      userSockets.delete(socket.id);
      
      // Notify others in the room
      if (socket.currentRoom) {
        // Remove from workspace users
        if (workspaceUsers.has(socket.currentRoom)) {
          // We track socket IDs in workspaceUsers sets; remove by socket.id
          workspaceUsers.get(socket.currentRoom).delete(socket.id);
          const activeUsersCount = workspaceUsers.get(socket.currentRoom).size;
          
          console.log(`User ${socket.user?.displayName} left workspace ${socket.currentRoom}`);
          console.log(`Remaining users in ${socket.currentRoom}:`, Array.from(workspaceUsers.get(socket.currentRoom)));
          console.log(`Active users count for ${socket.currentRoom}: ${activeUsersCount}`);
          
          socket.to(socket.currentRoom).emit('user-left', {
            user: {
              id: socket.userId,
              displayName: socket.user?.displayName
            },
            activeUsersCount: activeUsersCount
          });
          
          // Update active users count for remaining users
          socket.to(socket.currentRoom).emit('active-users-update', {
            count: activeUsersCount,
            users: Array.from(workspaceUsers.get(socket.currentRoom)).map(socketId => {
              const userSocket = io.sockets.sockets.get(socketId);
              return {
                id: userSocket?.userId || socketId,
                displayName: userSocket?.user?.displayName || 'User'
              };
            })
          });
        }
        
        // Remove from typing users
        if (typingUsers.has(socket.currentRoom)) {
          typingUsers.get(socket.currentRoom).delete(socket.userId);
        }
      }
    }
  });
};

module.exports = socketHandler;

