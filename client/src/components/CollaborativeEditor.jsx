import { useState, useEffect, useRef } from 'react';
import { FileText, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CollaborativeEditor = ({ workspace, socket, user }) => {
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(1);
  const [lastEditedBy, setLastEditedBy] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeUsers, setActiveUsers] = useState(new Set());
  
  const textareaRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleEditorContent = (data) => {
      setContent(data.content || '');
      setVersion(data.version || 1);
      setLastEditedBy(data.lastEditedBy);
      setLastEditedAt(data.lastEditedAt);
    };

    const handleEditorUpdated = (data) => {
      // Always accept server as source of truth to keep all clients in sync
      setContent(data.content || '');
      setVersion(data.version || 1);
      setLastEditedBy(data.lastEditedBy);
      setLastEditedAt(data.lastEditedAt);
    };

    const handleEditorConflict = (data) => {
      toast.error('Content conflict detected. Your changes may be lost.');
      setContent(data.currentContent);
      setVersion(data.currentVersion);
    };

    const handleUserJoined = (data) => {
      setActiveUsers(prev => new Set([...prev, data.user.id]));
    };

    const handleUserLeft = (data) => {
      setActiveUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user.id);
        return newSet;
      });
    };

    socket.on('editor-content', handleEditorContent);
    socket.on('editor-updated', handleEditorUpdated);
    socket.on('editor-conflict', handleEditorConflict);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('editor-content', handleEditorContent);
      socket.off('editor-updated', handleEditorUpdated);
      socket.off('editor-conflict', handleEditorConflict);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, isEditing]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsEditing(true);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the update to avoid too many socket emissions
    debounceTimeoutRef.current = setTimeout(() => {
      if (socket && newContent !== content) {
        socket.emit('editor-update', {
          content: newContent,
          workspaceSlug: workspace.slug,
          version: version
        });
      }
    }, 500);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    // Small delay to allow for final updates
    setTimeout(() => {
      setIsEditing(false);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  const getLastEditorName = () => {
    if (!lastEditedBy || lastEditedBy === user?.id) return 'You';
    
    // Find the user in workspace members
    const editor = workspace.members.find(member => 
      member.user._id === lastEditedBy || member.user.id === lastEditedBy
    );
    
    return editor ? editor.user.displayName : 'Someone';
  };

  return (
    <div className="flex flex-col h-[60vh] md:h-[600px]">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <span className="font-medium text-gray-900">Collaborative Editor</span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {activeUsers.size > 0 && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{activeUsers.size + 1} editing</span>
            </div>
          )}
          
          {lastEditedAt && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Last edited by {getLastEditorName()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-4">
        <div className="relative h-full">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Start typing to collaborate in real-time..."
            className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm leading-relaxed"
            style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
            {content.length} characters
          </div>
        </div>
      </div>

      {/* Editor Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Real-time collaboration</span>
            <span className="ml-2">
              Changes are automatically saved and synced with your team
            </span>
          </div>
          
          {isEditing && (
            <div className="flex items-center text-primary-600">
              <div className="w-2 h-2 bg-primary-600 rounded-full mr-2 animate-pulse"></div>
              <span>You are editing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
