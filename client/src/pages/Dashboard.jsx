import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, MessageSquare, BarChart3, CreditCard, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import JoinWorkspaceModal from '../components/JoinWorkspaceModal';
import UpgradeModal from '../components/UpgradeModal';
import Loading from '../components/Loading';
import api from '../config/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if upgrade was requested
  useEffect(() => {
    if (searchParams.get('upgrade') === 'true') {
      setShowUpgradeModal(true);
    }
  }, [searchParams]);

  // Fetch user's workspaces
  const { data: workspacesData, isLoading: workspacesLoading } = useQuery(
    'workspaces',
    () => api.get('/api/workspace/my').then(res => res.data),
    {
      enabled: !!user,
      onError: (error) => {
        console.error('Failed to fetch workspaces:', error);
        toast.error('Failed to load workspaces');
      }
    }
  );

  // Create workspace mutation
  const createWorkspaceMutation = useMutation(
    (workspaceData) => api.post('/api/workspace/demo-create', workspaceData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('workspaces');
        setShowCreateModal(false);
        toast.success('Workspace created successfully!');
        console.log('Created workspace:', response.data.workspace);
        console.log('Navigating to workspace:', response.data.workspace.slug);
        // Navigate with showSettings parameter
        navigate(`/workspace/${response.data.workspace.slug}?showSettings=true`);
      },
      onError: (error) => {
        console.error('Failed to create workspace:', error);
        toast.error(error.response?.data?.error || 'Failed to create workspace');
      }
    }
  );

  const handleCreateWorkspace = (data) => {
    createWorkspaceMutation.mutate(data);
  };

  const handleJoinWorkspace = (workspace) => {
    queryClient.invalidateQueries('workspaces');
    toast.success('Successfully joined workspace!');
    // Join karne wale ko sidha workspace me add, settings modal nahi
    navigate(`/workspace/${workspace.slug}`);
  };

  const workspaces = workspacesData?.workspaces || [];

  if (workspacesLoading) {
    return <Loading message="Loading your workspaces..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your workspaces and collaborate with your team
          </p>
        </div>

        {/* Subscription Status */}
        {user?.subscription?.status === 'free' && (
          <div className="mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Unlock Pro Features
                  </h3>
                  <p className="text-gray-600">
                    Get access to advanced analytics and unlimited workspaces
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Workspaces</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-secondary flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Join Workspace
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </button>
            </div>
          </div>

          {workspaces.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No workspaces yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first workspace to start collaborating with your team
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  onClick={() => navigate(`/workspace/${workspace.slug}`)}
                  className="workspace-card group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="text-sm text-gray-500">
                      {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {workspace.name}
                  </h3>
                  
                  {workspace.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="mr-4">{workspace.analytics.totalMessages} messages</span>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span>{workspace.analytics.totalTasks} tasks</span>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-400">
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {workspaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workspaces.reduce((sum, ws) => sum + ws.analytics.totalMessages, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workspaces.reduce((sum, ws) => sum + ws.analytics.totalTasks, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkspace}
        loading={createWorkspaceMutation.isLoading}
      />

      <JoinWorkspaceModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinWorkspace}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default Dashboard;

