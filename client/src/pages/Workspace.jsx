import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Users, Settings, BarChart3, Cog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat';
import CollaborativeEditor from '../components/CollaborativeEditor';
import Analytics from '../components/Analytics';
import WorkspaceSettings from '../components/WorkspaceSettings';
import Loading from '../components/Loading';
import api from '../config/api';
import toast from 'react-hot-toast';

const Workspace = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [activeTab, setActiveTab] = useState('chat');
  const [workspace, setWorkspace] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  // Debug: Log the slug from URL params
  console.log('URL slug from useParams:', slug);
  console.log('Current URL:', window.location.href);

  // Use the slug from URL params
  const cleanSlug = slug;
  console.log('Workspace slug from URL:', slug);
  console.log('Current URL:', window.location.href);

  // Fetch workspace data
  const { data: workspaceData, isLoading } = useQuery(
    ['workspace', cleanSlug],
    () => {
      console.log('Fetching workspace with clean slug:', cleanSlug);
      return api.get(`/api/workspace/demo/${cleanSlug}`).then(res => res.data);
    },
    {
      enabled: !!cleanSlug,
      onSuccess: (data) => {
        console.log('Workspace data received:', data.workspace);
        setWorkspace(data.workspace);
        
        // Check if settings should be shown (from URL parameter)
        if (searchParams.get('showSettings') === 'true') {
          console.log('Auto-opening settings modal');
          setShowSettings(true);
          // Remove the parameter from URL
          navigate(`/workspace/${slug}`, { replace: true });
        }
      },
      onError: (error) => {
        console.error('Failed to fetch workspace:', error);
        console.error('Error details:', error.response?.data);
        toast.error('Failed to load workspace');
        // Don't navigate to dashboard, let user stay on page
      }
    }
  );

  // Join workspace room when socket is ready
  useEffect(() => {
    if (socket && workspace) {
      console.log('🔗 JOINING WORKSPACE ROOM:');
      console.log('   URL Slug:', cleanSlug);
      console.log('   Workspace Slug:', workspace.slug);
      console.log('   Using workspace slug for socket room');
      socket.emit('join-room', { workspaceSlug: workspace.slug });
    }
  }, [socket, workspace]);

  // Handle active users updates
  useEffect(() => {
    if (socket) {
      const handleActiveUsersUpdate = (data) => {
        console.log('Active users update:', data);
        setActiveUsersCount(data.count);
      };

      socket.on('active-users-update', handleActiveUsersUpdate);

      return () => {
        socket.off('active-users-update', handleActiveUsersUpdate);
      };
    }
  }, [socket]);

  if (isLoading) {
    return <Loading message="Loading workspace..." />;
  }

  if (!workspace && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading workspace...</h2>
          <p className="text-gray-600 mb-4">Please wait while we load your workspace.</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: Users },
    { id: 'editor', label: 'Editor', icon: Settings },
    ...(user?.subscription?.status === 'pro' ? [{ id: 'analytics', label: 'Analytics', icon: BarChart3 }] : [])
  ];

  // Don't render until workspace is loaded
  if (!workspace) {
    return <Loading message="Loading workspace..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Workspace Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
              {workspace.description && (
                <p className="text-gray-600 mt-1">{workspace.description}</p>
              )}
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                <span>{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</span>
                <span className="mx-2">•</span>
                <span className="text-green-600 font-medium">
                  {activeUsersCount} online
                </span>
                <span className="mx-2">•</span>
                <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Only show settings button for workspace owner */}
              {workspace.owner && (workspace.owner._id === (user?.id || user?.firebaseUid)) && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Cog className="h-4 w-4 mr-2" />
                  Settings
                </button>
              )}
              {user?.subscription?.status === 'free' && (
                <button
                  onClick={() => navigate('/dashboard?upgrade=true')}
                  className="btn-primary text-sm"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6 overflow-x-auto">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[60vh] md:min-h-[600px]">
          {activeTab === 'chat' && (
            <Chat 
              workspace={workspace} 
              socket={socket} 
              user={user}
            />
          )}
          
          {activeTab === 'editor' && (
            <CollaborativeEditor 
              workspace={workspace} 
              socket={socket} 
              user={user}
            />
          )}
          
          {activeTab === 'analytics' && user?.subscription?.status === 'pro' && (
            <Analytics 
              workspace={workspace} 
              user={user}
            />
          )}
        </div>
      </div>

      {/* Settings Modal - auto-open after creation via showSettings param */}
      {showSettings && (
        <WorkspaceSettings
          workspace={workspace}
          onClose={() => {
            console.log('Closing settings modal');
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
};

export default Workspace;