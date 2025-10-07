import { useState } from 'react';
import { X, Users, Mail, Hash } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const JoinWorkspaceModal = ({ isOpen, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'email'
  const [loading, setLoading] = useState(false);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/workspace/demo-join', {
        inviteCode: inviteCode.trim().toUpperCase()
      });
      
      toast.success(response.data.message);
      onSuccess(response.data.workspace);
      handleClose();
    } catch (error) {
      console.error('Join workspace error:', error);
      toast.error(error.response?.data?.error || 'Failed to join workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteByEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !workspaceSlug.trim()) {
      toast.error('Please enter email and workspace slug');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/api/workspace/${workspaceSlug}/invite`, {
        email: email.trim()
      });
      
      toast.success(response.data.message);
      console.log('Invite data:', response.data.invite);
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setEmail('');
    setWorkspaceSlug('');
    setActiveTab('code');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-md mx-0 sm:mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="ml-3 text-lg font-semibold text-gray-900">
              Join Workspace
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Hash className="h-4 w-4 mr-2" />
              Join by Code
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Invite by Email
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Join by Code */}
          {activeTab === 'code' && (
            <form onSubmit={handleJoinByCode}>
              <div className="mb-4">
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="input-field text-center text-lg font-mono tracking-wider"
                  placeholder="ABC12345"
                  maxLength={8}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 8-character code shared by the workspace owner
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                  disabled={loading || !inviteCode.trim()}
                >
                  {loading ? (
                    <div className="loading-dots">Joining</div>
                  ) : (
                    <>
                      <Hash className="h-4 w-4 mr-2" />
                      Join Workspace
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Invite by Email */}
          {activeTab === 'email' && (
            <form onSubmit={handleInviteByEmail}>
              <div className="mb-4">
                <label htmlFor="workspaceSlug" className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  id="workspaceSlug"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="input-field"
                  placeholder="my-workspace"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="friend@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Send an invitation link to this email address
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                  disabled={loading || !email.trim() || !workspaceSlug.trim()}
                >
                  {loading ? (
                    <div className="loading-dots">Sending</div>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinWorkspaceModal;
