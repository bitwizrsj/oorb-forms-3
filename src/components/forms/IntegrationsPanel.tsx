import React, { useState } from 'react';
import {
  Zap,
  Settings,
  Plus,
  Check,
  ExternalLink,
  Webhook,
  Mail,
  FileSpreadsheet,
  MessageSquare,
  Database,
  Bell,
  HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { integrationsAPI } from '../../services/api';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  connected: boolean;
  config?: any;
}

interface IntegrationsPanelProps {
  formId: string;
  onClose: () => void;
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ formId, onClose }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  const integrations: Integration[] = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Automatically upload student files (like Aadhar Cards) to your Google Drive folders',
      icon: HardDrive,
      category: 'Productivity',
      connected: false
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Automatically send form responses to a Google Sheets spreadsheet',
      icon: FileSpreadsheet,
      category: 'Spreadsheets',
      connected: false
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notified in Slack when someone submits your form',
      icon: MessageSquare,
      category: 'Communication',
      connected: true,
      config: { channel: '#general' }
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Send form data to any URL endpoint',
      icon: Webhook,
      category: 'Developer',
      connected: false
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Add form respondents to your Mailchimp audience',
      icon: Mail,
      category: 'Email Marketing',
      connected: false
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Create new pages in Notion for each form submission',
      icon: Database,
      category: 'Productivity',
      connected: false
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Send notifications to Discord when forms are submitted',
      icon: Bell,
      category: 'Communication',
      connected: false
    }
  ];

  const categories = ['All', 'Spreadsheets', 'Communication', 'Developer', 'Email Marketing', 'Productivity'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIntegrations = integrations.filter(integration =>
    selectedCategory === 'All' || integration.category === selectedCategory
  );

  const connectedIntegrations = integrations.filter(integration => integration.connected);

  const connectIntegration = async (integration: Integration) => {
    if (integration.id === 'google-drive') {
      try {
        const res = await integrationsAPI.getGoogleAuthUrl();
        if (res.data.url) {
          window.location.href = res.data.url;
        }
      } catch (error) {
        toast.error('Failed to initiate Google Drive connection');
      }
      return;
    }

    // Simulate connection process for others
    toast.success(`${integration.name} connected successfully!`);
    integration.connected = true;
    setSelectedIntegration(null);
  };

  const disconnectIntegration = (integration: Integration) => {
    // Simulate disconnection
    toast.success(`${integration.name} disconnected`);
    integration.connected = false;
  };

  const renderIntegrationCard = (integration: Integration) => {
    const Icon = integration.icon;

    return (
      <div key={integration.id} className="border border-gray-200 rounded-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{integration.name}</h3>
              <span className="text-xs text-gray-500">{integration.category}</span>
            </div>
          </div>
          {integration.connected && (
            <div className="flex items-center space-x-1 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-xs">Connected</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

        <div className="flex space-x-2">
          {integration.connected ? (
            <>
              <button
                onClick={() => setSelectedIntegration(integration)}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Configure
              </button>
              <button
                onClick={() => disconnectIntegration(integration)}
                className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors text-sm"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectedIntegration(integration)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderConfigModal = () => {
    if (!selectedIntegration) return null;

    const Icon = selectedIntegration.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-sm shadow-xl max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedIntegration.name}</h3>
                <p className="text-gray-600">Configure integration settings</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {selectedIntegration.id === 'webhook' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-website.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Form data will be sent as POST request to this URL
                </p>
              </div>
            )}

            {selectedIntegration.id === 'google-sheets' && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Google account to automatically send form responses to a spreadsheet.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  Connect Google Account
                </button>
              </div>
            )}

            {selectedIntegration.id === 'slack' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slack Channel
                </label>
                <input
                  type="text"
                  defaultValue="#general"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Channel where notifications will be sent
                </p>
              </div>
            )}

            {selectedIntegration.id === 'mailchimp' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your Mailchimp audience ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in your Mailchimp audience settings
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button
              onClick={() => setSelectedIntegration(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => connectIntegration(selectedIntegration)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {selectedIntegration.connected ? 'Save Changes' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-sm flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
                  <p className="text-gray-600">Connect your form to external services</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-sm">
              <button
                onClick={() => setActiveTab('available')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'available'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Available ({integrations.length})
              </button>
              <button
                onClick={() => setActiveTab('connected')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'connected'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Connected ({connectedIntegrations.length})
              </button>
            </div>

            {activeTab === 'available' && (
              <>
                {/* Category Filter */}
                <div className="flex space-x-2 mb-6 overflow-x-auto">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-md whitespace-nowrap text-sm transition-colors ${selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Integrations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredIntegrations.map(renderIntegrationCard)}
                </div>
              </>
            )}

            {activeTab === 'connected' && (
              <div className="space-y-4">
                {connectedIntegrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations connected</h3>
                    <p className="text-gray-600 mb-4">Connect your first integration to automate your workflow</p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Browse Integrations
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connectedIntegrations.map(renderIntegrationCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {renderConfigModal()}
    </>
  );
};

export default IntegrationsPanel;