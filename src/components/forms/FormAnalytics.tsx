import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Eye, 
  CheckCircle,
  Calendar,
  Download
} from 'lucide-react';
import { formAPI } from '../../services/api';

interface AnalyticsData {
  totalViews: number;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  recentResponses: number;
  conversionTrend: Array<{ date: string; views: number; responses: number }>;
  fieldAnalytics: Array<{ fieldId: string; fieldLabel: string; completionRate: number; averageTime: number }>;
}

interface FormAnalyticsProps {
  formId: string;
  onClose: () => void;
}

const FormAnalytics: React.FC<FormAnalyticsProps> = ({ formId, onClose }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [formId, timeRange]);

  const loadAnalytics = async () => {
    try {
      const response = await formAPI.getAnalytics(formId);
      
      // Simulate additional analytics data
      const mockData: AnalyticsData = {
        ...response.data,
        conversionTrend: [
          { date: '2024-01-01', views: 45, responses: 12 },
          { date: '2024-01-02', views: 52, responses: 18 },
          { date: '2024-01-03', views: 38, responses: 15 },
          { date: '2024-01-04', views: 61, responses: 22 },
          { date: '2024-01-05', views: 49, responses: 19 },
          { date: '2024-01-06', views: 55, responses: 25 },
          { date: '2024-01-07', views: 43, responses: 16 }
        ],
        fieldAnalytics: [
          { fieldId: '1', fieldLabel: 'Name', completionRate: 98, averageTime: 5 },
          { fieldId: '2', fieldLabel: 'Email', completionRate: 95, averageTime: 8 },
          { fieldId: '3', fieldLabel: 'Message', completionRate: 87, averageTime: 45 },
          { fieldId: '4', fieldLabel: 'Phone', completionRate: 72, averageTime: 12 }
        ]
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const StatCard = ({ icon: Icon, title, value, subtitle, trend }: any) => (
    <div className="bg-white border border-gray-200 rounded-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-sm flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-600">{trend}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-sm shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Form Analytics</h2>
                <p className="text-gray-600">Detailed insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Eye}
              title="Total Views"
              value={analytics.totalViews.toLocaleString()}
              trend="+12% from last period"
            />
            <StatCard
              icon={Users}
              title="Total Responses"
              value={analytics.totalResponses.toLocaleString()}
              trend="+8% from last period"
            />
            <StatCard
              icon={CheckCircle}
              title="Completion Rate"
              value={`${analytics.completionRate.toFixed(1)}%`}
              subtitle="Views to submissions"
            />
            <StatCard
              icon={Clock}
              title="Avg. Completion Time"
              value={`${Math.round(analytics.averageCompletionTime)}s`}
              subtitle="Time to complete form"
            />
          </div>

          {/* Conversion Trend Chart */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Conversion Trend</h3>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            
            <div className="h-64 flex items-end space-x-2">
              {analytics.conversionTrend.map((day, index) => {
                const maxViews = Math.max(...analytics.conversionTrend.map(d => d.views));
                const viewHeight = (day.views / maxViews) * 200;
                const responseHeight = (day.responses / maxViews) * 200;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end space-x-1 mb-2">
                      <div
                        className="bg-blue-200 rounded-t"
                        style={{ height: `${viewHeight}px`, width: '50%' }}
                        title={`${day.views} views`}
                      />
                      <div
                        className="bg-blue-600 rounded-t"
                        style={{ height: `${responseHeight}px`, width: '50%' }}
                        title={`${day.responses} responses`}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span className="text-gray-600">Views</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-600">Responses</span>
              </div>
            </div>
          </div>

          {/* Field Analytics */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Field Performance</h3>
            
            <div className="space-y-4">
              {analytics.fieldAnalytics.map((field, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{field.fieldLabel}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>{field.completionRate}% completion</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{field.averageTime}s avg time</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-32">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${field.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormAnalytics;