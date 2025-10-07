import { useState } from 'react';
import { useQuery } from 'react-query';
import { BarChart3, MessageSquare, Users, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import Loading from './Loading';
import api from '../config/api';

const Analytics = ({ workspace, user }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch workspace analytics
  const { data: analyticsData, isLoading } = useQuery(
    ['workspace-analytics', workspace.id, timeRange],
    () => api.get(`/api/analytics/workspace/${workspace.id}`).then(res => res.data),
    {
      enabled: !!workspace?.id,
      onError: (error) => {
        console.error('Failed to fetch analytics:', error);
      }
    }
  );

  // Fetch user analytics
  const { data: userAnalyticsData } = useQuery(
    'user-analytics',
    () => api.get('/api/analytics/user').then(res => res.data),
    {
      enabled: !!user,
      onError: (error) => {
        console.error('Failed to fetch user analytics:', error);
      }
    }
  );

  if (isLoading) {
    return <Loading message="Loading analytics..." />;
  }

  const analytics = analyticsData?.analytics || {};
  const userAnalytics = userAnalyticsData?.analytics || {};

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`h-10 w-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, percentage, trend }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
        {percentage && (
          <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            <span>{percentage}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Workspace Analytics</h2>
        <p className="text-gray-600">Insights into your team's productivity and collaboration</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Messages"
          value={analytics.totalMessages || 0}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Active Members"
          value={analytics.activeMembers || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Tasks"
          value={analytics.totalTasks || 0}
          icon={CheckCircle}
          color="purple"
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.completionRate || 0}%`}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <MetricCard
              title="Messages This Period"
              value={analytics.recentMessages || 0}
              subtitle="Messages sent in the selected time range"
            />
            <MetricCard
              title="Tasks Created"
              value={analytics.recentTasks || 0}
              subtitle="New tasks created this period"
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Messages per Member</span>
              <span className="font-medium">
                {analytics.activeMembers > 0 
                  ? Math.round((analytics.totalMessages || 0) / analytics.activeMembers)
                  : 0
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tasks per Member</span>
              <span className="font-medium">
                {analytics.activeMembers > 0 
                  ? Math.round((analytics.totalTasks || 0) / analytics.activeMembers)
                  : 0
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Completion Time</span>
              <span className="font-medium">2.3 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Analytics */}
      {userAnalytics && Object.keys(userAnalytics).length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {userAnalytics.totalWorkspaces || 0}
              </div>
              <div className="text-sm text-gray-600">Workspaces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {userAnalytics.userCreatedTasks || 0}
              </div>
              <div className="text-sm text-gray-600">Tasks Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {userAnalytics.userCompletionRate || 0}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Features Notice */}
      <div className="mt-8 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <h4 className="font-semibold text-gray-900">Advanced Analytics Available</h4>
            <p className="text-sm text-gray-600 mt-1">
              Upgrade to Pro to unlock detailed charts, export capabilities, and team performance insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
