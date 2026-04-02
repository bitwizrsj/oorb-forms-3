import React, { useState, useEffect } from 'react';
import {
  Zap, Settings, Plus, Check, ExternalLink, Webhook, Mail,
  FileSpreadsheet, MessageSquare, Database, Bell, HardDrive,
  X, ToggleLeft, ToggleRight, Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { integrationsAPI } from '../../services/api';

interface IntegrationsPanelProps {
  formId: string;
  formTitle?: string;
  formSettings?: {
    googleSheets?: { spreadsheetId?: string; sheetName?: string; enabled?: boolean };
    emailNotifications?: boolean;
    notificationEmail?: string;
  };
  onClose: () => void;
  onSettingsChange?: (settings: any) => void;
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  formId,
  formTitle,
  formSettings,
  onClose,
  onSettingsChange
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);
  const [checkingDrive, setCheckingDrive] = useState(true);

  // Google Sheets state
  const [sheetsEnabled, setSheetsEnabled] = useState(formSettings?.googleSheets?.enabled ?? false);
  const [spreadsheetId, setSpreadsheetId] = useState(formSettings?.googleSheets?.spreadsheetId ?? '');
  const [sheetName, setSheetName] = useState(formSettings?.googleSheets?.sheetName ?? 'Responses');
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

  // Email notification state
  const [emailEnabled, setEmailEnabled] = useState(formSettings?.emailNotifications ?? true);
  const [notificationEmail, setNotificationEmail] = useState(formSettings?.notificationEmail ?? '');
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    checkDriveStatus();
    // Build spreadsheet URL if ID exists
    if (formSettings?.googleSheets?.spreadsheetId) {
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${formSettings.googleSheets.spreadsheetId}`);
    }
  }, []);

  const checkDriveStatus = async () => {
    try {
      setCheckingDrive(true);
      const res = await integrationsAPI.getGoogleStatus();
      setDriveConnected(res.data.isConnected);
    } catch {
      setDriveConnected(false);
    } finally {
      setCheckingDrive(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const res = await integrationsAPI.getGoogleAuthUrl();
      if (res.data.url) window.location.href = res.data.url;
    } catch {
      toast.error('Failed to start Google connection');
    }
  };

  const handleToggleSheets = async (enabled: boolean) => {
    setSheetsEnabled(enabled);
    if (!enabled && spreadsheetId) {
      // Disable in DB
      try {
        await integrationsAPI.linkGoogleSheets({ formId, spreadsheetId, sheetName, enabled: false });
        onSettingsChange?.({ googleSheets: { spreadsheetId, sheetName, enabled: false } });
        toast.success('Google Sheets sync disabled');
      } catch {
        toast.error('Failed to update Sheets settings');
        setSheetsEnabled(true);
      }
    }
  };

  const handleCreateSheet = async () => {
    setSheetsLoading(true);
    try {
      const res = await integrationsAPI.createGoogleSheet({ formId, title: `${formTitle || 'Form'} – Responses` });
      setSpreadsheetId(res.data.spreadsheetId);
      setSheetName(res.data.sheetName);
      setSpreadsheetUrl(res.data.spreadsheetUrl);
      setSheetsEnabled(true);
      onSettingsChange?.({ googleSheets: { spreadsheetId: res.data.spreadsheetId, sheetName: res.data.sheetName, enabled: true } });
      toast.success('Google Sheet created and linked!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create sheet');
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleLinkExistingSheet = async () => {
    if (!spreadsheetId.trim()) {
      toast.error('Please enter a Spreadsheet ID or URL');
      return;
    }
    setSheetsLoading(true);
    try {
      // Support full URL input — extract ID
      const idMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const finalId = idMatch ? idMatch[1] : spreadsheetId.trim();

      await integrationsAPI.linkGoogleSheets({ formId, spreadsheetId: finalId, sheetName, enabled: true });
      setSpreadsheetId(finalId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${finalId}`);
      setSheetsEnabled(true);
      onSettingsChange?.({ googleSheets: { spreadsheetId: finalId, sheetName, enabled: true } });
      toast.success('Google Sheets linked!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to link sheet');
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleSaveEmail = () => {
    setEmailSaving(true);
    setTimeout(() => {
      onSettingsChange?.({ emailNotifications: emailEnabled, notificationEmail });
      toast.success('Email notification settings saved');
      setEmailSaving(false);
    }, 300);
  };

  const integrations = [
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Auto-save every response as a new row in a Google Spreadsheet',
      icon: FileSpreadsheet,
      color: '#34A853',
      bgColor: '#E8F5E9',
      category: 'Spreadsheets',
      active: sheetsEnabled && !!spreadsheetId,
    },
    {
      id: 'email',
      name: 'Email Notifications',
      description: 'Receive an email whenever someone submits your form',
      icon: Mail,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      category: 'Notifications',
      active: emailEnabled,
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Upload file attachments to Google Drive automatically',
      icon: HardDrive,
      color: '#4285F4',
      bgColor: '#E8F0FE',
      category: 'Storage',
      active: driveConnected,
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Send form data to any URL when a response is submitted',
      icon: Webhook,
      color: '#6B7280',
      bgColor: '#F3F4F6',
      category: 'Developer',
      active: false,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notified in Slack when someone submits your form',
      icon: MessageSquare,
      color: '#4A154B',
      bgColor: '#F5F0F6',
      category: 'Communication',
      active: false,
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Create a new Notion page for each form submission',
      icon: Database,
      color: '#000000',
      bgColor: '#F7F7F7',
      category: 'Productivity',
      active: false,
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Send submission notifications to a Discord channel',
      icon: Bell,
      color: '#5865F2',
      bgColor: '#EEF0FF',
      category: 'Communication',
      active: false,
    },
  ];

  const renderSheetsConfig = () => (
    <div className="p-6 space-y-5">
      {/* Drive connection check */}
      {checkingDrive ? (
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Checking Google connection…</span>
        </div>
      ) : !driveConnected ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Google account not connected</p>
              <p className="text-xs text-amber-700 mt-1">You need to connect your Google account to use Sheets integration.</p>
              <button
                onClick={connectGoogle}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Connect Google Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Connected badge + toggle */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-800">Google account connected</span>
            </div>
            <button
              onClick={() => handleToggleSheets(!sheetsEnabled)}
              className="flex items-center gap-1.5 text-sm font-medium text-green-700"
            >
              {sheetsEnabled
                ? <ToggleRight className="w-8 h-8 text-green-600" />
                : <ToggleLeft className="w-8 h-8 text-slate-400" />
              }
            </button>
          </div>

          {/* If linked */}
          {spreadsheetId && spreadsheetUrl && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Linked Spreadsheet</p>
                <p className="text-sm font-mono text-slate-700 mt-0.5 truncate max-w-[260px]">{spreadsheetId}</p>
              </div>
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Sheet name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sheet / Tab Name</label>
            <input
              type="text"
              value={sheetName}
              onChange={e => setSheetName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Responses"
            />
          </div>

          {/* Create new or link existing */}
          <div className="space-y-3">
            <button
              onClick={handleCreateSheet}
              disabled={sheetsLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
            >
              {sheetsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create New Google Sheet
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />
              <span>or link existing</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={spreadsheetId}
                onChange={e => setSpreadsheetId(e.target.value)}
                placeholder="Paste Spreadsheet ID or URL"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleLinkExistingSheet}
                disabled={sheetsLoading}
                className="px-3 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Link
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderEmailConfig = () => (
    <div className="p-6 space-y-5">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <div>
          <p className="text-sm font-bold text-indigo-900">Email Notifications</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            {emailEnabled ? 'Enabled — you\'ll receive an email per submission' : 'Disabled'}
          </p>
        </div>
        <button onClick={() => setEmailEnabled(!emailEnabled)}>
          {emailEnabled
            ? <ToggleRight className="w-9 h-9 text-indigo-600" />
            : <ToggleLeft className="w-9 h-9 text-slate-400" />
          }
        </button>
      </div>

      {emailEnabled && (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Notification Email
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={e => setNotificationEmail(e.target.value)}
              placeholder="Leave empty to use your account email"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              If blank, notifications go to the email you signed up with.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">You'll receive a formatted HTML email with all field responses every time someone submits the form.</p>
          </div>
        </>
      )}

      <button
        onClick={handleSaveEmail}
        disabled={emailSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Save Email Settings
      </button>
    </div>
  );

  const renderDriveConfig = () => (
    <div className="p-6 space-y-5">
      {checkingDrive ? (
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Checking connection…</span>
        </div>
      ) : driveConnected ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <p className="text-sm font-bold text-green-800">Google Drive connected</p>
          </div>
          <p className="text-xs text-green-700">File upload fields will automatically save files to your Google Drive.</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-600 mb-4">Connect your Google account to upload form files directly to Google Drive.</p>
          <button
            onClick={connectGoogle}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4285F4] text-white font-bold text-sm rounded-xl hover:bg-[#3367D6] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Connect Google Account
          </button>
        </div>
      )}
    </div>
  );

  const renderComingSoonConfig = (name: string) => (
    <div className="p-6">
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">{name} integration coming soon</p>
        <p className="text-xs text-slate-400 mt-1">We're working on it! Check back soon.</p>
      </div>
    </div>
  );

  const renderConfig = (id: string, name: string) => {
    switch (id) {
      case 'google-sheets': return renderSheetsConfig();
      case 'email': return renderEmailConfig();
      case 'google-drive': return renderDriveConfig();
      default: return renderComingSoonConfig(name);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Integrations</h2>
                <p className="text-sm text-slate-500">Connect your form to external services</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Sidebar: integration list */}
            <div className="w-64 flex-shrink-0 border-r border-slate-100 overflow-y-auto py-3">
              {integrations.map(integration => {
                const Icon = integration.icon;
                const isSel = activeSection === integration.id;
                return (
                  <button
                    key={integration.id}
                    onClick={() => setActiveSection(isSel ? null : integration.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSel ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: integration.bgColor }}>
                      <Icon className="w-4 h-4" style={{ color: integration.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSel ? 'text-indigo-700' : 'text-slate-800'}`}>{integration.name}</p>
                      <p className="text-xs text-slate-400 truncate">{integration.category}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {integration.active && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSel ? 'rotate-90 text-indigo-400' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Config panel */}
            <div className="flex-1 overflow-y-auto">
              {activeSection ? (
                <>
                  {(() => {
                    const intg = integrations.find(i => i.id === activeSection);
                    if (!intg) return null;
                    const Icon = intg.icon;
                    return (
                      <>
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: intg.bgColor }}>
                            <Icon className="w-4 h-4" style={{ color: intg.color }} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{intg.name}</h3>
                            <p className="text-xs text-slate-500">{intg.description}</p>
                          </div>
                        </div>
                        {renderConfig(intg.id, intg.name)}
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-slate-700 font-semibold text-base mb-1">Select an integration</p>
                  <p className="text-slate-400 text-sm">Choose an integration from the left to configure it</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntegrationsPanel;