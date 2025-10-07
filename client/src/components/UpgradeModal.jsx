import { useState } from 'react';
import { X, Check, Zap, BarChart3, Users, CreditCard } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const UpgradeModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/stripe/create-checkout');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to start upgrade process');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5 text-primary-600" />,
      title: 'Advanced Analytics',
      description: 'Detailed insights into team productivity and collaboration metrics'
    },
    {
      icon: <Users className="h-5 w-5 text-primary-600" />,
      title: 'Unlimited Workspaces',
      description: 'Create and manage unlimited workspaces for all your teams'
    },
    {
      icon: <Zap className="h-5 w-5 text-primary-600" />,
      title: 'Priority Support',
      description: 'Get faster response times and dedicated support'
    },
    {
      icon: <CreditCard className="h-5 w-5 text-primary-600" />,
      title: 'Flexible Billing',
      description: 'Cancel anytime with no long-term commitments'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="ml-3 text-lg font-semibold text-gray-900">
              Upgrade to Pro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-primary-100 rounded-full mb-4">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Unlock Pro Features
            </h3>
            <p className="text-gray-600">
              Get advanced analytics and unlimited workspaces for just $9.99/month
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Pro Plan</h4>
                <p className="text-sm text-gray-600">Everything you need for productive collaboration</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">$9.99</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-dots">Processing</div>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Now
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;



