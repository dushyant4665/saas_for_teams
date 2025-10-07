import { useState, useEffect, useRef } from 'react';
import { Send, Users, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = ({ workspace, socket, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate a data URL SVG avatar with the user's first word as fallback
  const getFirstWordAvatar = (name) => {
    const safeName = (name || 'User').trim();
    const firstWord = (safeName.split(/\s+/)[0] || 'User').toUpperCase();
    const text = firstWord.slice(0, 6); // keep short to fit 48x48
    const bg = '#e5e7eb'; // gray-200
    const fg = '#374151'; // gray-700
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>
  <rect width='100%' height='100%' rx='24' ry='24' fill='${bg}'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, Arial' font-size='14' font-weight='600' fill='${fg}'>${text}</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const getAvatarSrc = (displayName, photoURL) => {
    return photoURL || getFirstWordAvatar(displayName);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load cached messages for this workspace on mount
  useEffect(() => {
    if (!workspace?.slug) return;
    try {
      const cacheKey = `chat:${workspace.slug}`;
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setMessages(cached);
        }
      }
    } catch {}
  }, [workspace?.slug]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) {
      console.log('❌ No socket available for chat');
      return;
    }
    
    console.log('🔌 Setting up chat socket listeners');

    const handleRecentMessages = (data) => {
      console.log('Received chat history:', data.messages?.length || 0, 'messages');
      const list = data.messages || [];
      setMessages(list);
      try {
        const cacheKey = `chat:${workspace.slug}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {}
    };

    const handleNewMessage = (data) => {
      console.log('📨 RECEIVED NEW MESSAGE:');
      console.log('   Message:', data);
      console.log('   Current user ID:', user?.id);
      console.log('   Sender ID:', data.sender?.id);
      console.log('   Is from current user:', data.sender?.id === user?.id);
      console.log('   Adding message to chat...');
      
      // Add message to chat immediately (real-time like WhatsApp)
      setMessages(prev => {
        const newMessages = [...prev, data];
        // Persist per-workspace so tab switches don't lose messages
        try {
          const cacheKey = `chat:${workspace.slug}`;
          sessionStorage.setItem(cacheKey, JSON.stringify(newMessages));
        } catch {}
        console.log('   Total messages now:', newMessages.length);
        console.log('   Message added successfully!');
        return newMessages;
      });
      
      // Scroll to bottom after adding message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    const handleUserJoined = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.user.id]));
      // Toast notification is handled by useSocket hook
    };

    const handleUserLeft = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user.id);
        return newSet;
      });
      // Toast notification is handled by useSocket hook
    };

    const handleUserTyping = (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    console.log('📡 Registering socket event listeners...');
    
    socket.on('recent-messages', handleRecentMessages);
    socket.on('new-message', handleNewMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user-typing', handleUserTyping);
    
    // Handle message sent confirmation
    socket.on('message-sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
    });
    
    console.log('✅ All socket listeners registered');

    return () => {
      socket.off('recent-messages', handleRecentMessages);
      socket.off('new-message', handleNewMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user-typing', handleUserTyping);
      socket.off('message-sent');
    };
  }, [socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    console.log('📤 SENDING MESSAGE:');
    console.log('   Content:', newMessage.trim());
    console.log('   Workspace:', workspace.slug);
    console.log('   User ID:', user?.id);
    
    socket.emit('chat-message', {
      content: newMessage.trim(),
      workspaceSlug: workspace.slug
    });
    
    console.log('📤 SOCKET EMIT COMPLETE');
    console.log('   Workspace Slug:', workspace.slug);

    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      socket.emit('typing-stop', { workspaceSlug: workspace.slug });
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', { workspaceSlug: workspace.slug });
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      socket.emit('typing-stop', { workspaceSlug: workspace.slug });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        socket.emit('typing-stop', { workspaceSlug: workspace.slug });
        setIsTyping(false);
      }
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-500 mr-2" />
          <span className="font-medium text-gray-900">Team Chat</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Circle className="h-3 w-3 text-green-500 mr-1" />
          <span>{onlineUsers.size + 1} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.sender.id === user?.id ? 'order-2' : 'order-1'}`}>
                {message.sender.id !== user?.id && (
                  <div className="flex items-center mb-1">
                    <img
                      src={getAvatarSrc(message.sender.displayName, message.sender.photoURL)}
                      alt={message.sender.displayName}
                      className="h-6 w-6 rounded-full mr-2"
                      onError={(e) => {
                        // Force fallback if remote image fails
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFirstWordAvatar(message.sender.displayName);
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender.displayName}
                    </span>
                  </div>
                )}
                
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.sender.id === user?.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender.id === user?.id
                        ? 'text-primary-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex space-x-1 mr-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.size === 1 
                ? 'Someone is typing...' 
                : `${typingUsers.size} people are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 input-field"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
