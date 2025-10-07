import { useState } from 'react';
import { Copy, Mail, Users, Settings, Eye, EyeOff, X } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const WorkspaceSettings = ({ workspace, onClose }) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSendingInvite(true);
    try {
      const response = await api.post(`/api/workspace/${workspace.slug}/invite`, {
        email: inviteEmail.trim()
      });
      
      toast.success(response.data.message);
      setInviteEmail('');
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  if (!workspace) {
    console.log('WorkspaceSettings: No workspace data');
    return null;
  }

  console.log('WorkspaceSettings: Workspace data:', workspace);
  console.log('WorkspaceSettings: Modal should be visible:', !!workspace);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="ml-3 text-lg font-semibold text-gray-900">
              Workspace Settings
            </h2>
          </div>
          <button
            onClick={() => {
              console.log('X button clicked');
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Workspace Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Workspace Details</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600">Name</label>
                <p className="text-sm text-gray-900">{workspace.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Slug</label>
                <p className="text-sm text-gray-900 font-mono">{workspace.slug}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Members</label>
                <p className="text-sm text-gray-900">{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Invite Code */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Invite Code</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm tracking-wider">
                           {showInviteCode ? (workspace.inviteCode || 'ABC12345') : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowInviteCode(!showInviteCode)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showInviteCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                       onClick={() => copyToClipboard(workspace.inviteCode || 'ABC12345')}
                className="btn-secondary flex items-center px-2 py-2 text-sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this code with team members
            </p>
          </div>

          {/* Invite by Email */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Invite by Email</h3>
            <form onSubmit={handleSendInvite}>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 input-field text-sm"
                  placeholder="Enter email address"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary flex items-center px-3 py-2 text-sm"
                  disabled={sendingInvite || !inviteEmail.trim()}
                >
                  {sendingInvite ? (
                    <div className="loading-dots">Sending</div>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-1">
              Send invitation link to join workspace
            </p>
          </div>

          {/* Workspace Link */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Workspace Link</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2">
                <span className="text-xs text-gray-900 font-mono break-all">
                  {window.location.origin}/workspace/{workspace.slug}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/workspace/${workspace.slug}`)}
                className="btn-secondary flex items-center px-2 py-2 text-sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={() => {
              console.log('Close button clicked');
              onClose();
            }}
            className="w-full btn-secondary text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
