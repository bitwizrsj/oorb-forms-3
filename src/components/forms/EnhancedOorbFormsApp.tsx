import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, BarChart3, Settings, Menu, X, Plus } from 'lucide-react';
import FormDashboard from './FormDashboard';
import ResponseViewer from './ResponseViewer';
import FormCreationModal from './FormCreationModal';
import Sidebar from './Sidebar';
import UserResponses from './UserResponses';
import UserSettings from '../auth/UserSettings';
import { formAPI } from '../../services/api';
import toast from 'react-hot-toast';
import EnhancedFormBuilder from './EnhancedFormBuilder';

type View = 'dashboard' | 'builder' | 'responses' | 'settings' | 'my-responses';

const EnhancedOorbFormsApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [showFormCreationModal, setShowFormCreationModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { openFormId?: string };
    if (state?.openFormId) {
      setCurrentFormId(state.openFormId);
      setCurrentView('builder');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateForm = () => setShowFormCreationModal(true);

  const handleFormCreation = async (data: { title: string; description: string; folderId?: string }) => {
    try {
      const response = await formAPI.createForm({
        title: data.title,
        description: data.description,
        folderId: data.folderId || null,
        fields: [],
        status: 'draft'
      });
      setCurrentFormId(response.data._id);
      setCurrentView('builder');
      setShowFormCreationModal(false);
      setMobileSidebarOpen(false);
      toast.success('Form created successfully!');
    } catch {
      toast.error('Failed to create form');
    }
  };

  const handleEditForm = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('builder');
    setMobileSidebarOpen(false);
  };

  const handleViewResponses = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('responses');
    setMobileSidebarOpen(false);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentFormId(null);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
    setMobileSidebarOpen(false);
  };

  const getSidebarWidth = () => sidebarMinimized ? 70 : 240;

  // ── Builder and Responses don't need sidebar ────────────────
  if (currentView === 'builder') {
    return (
      <>
        <EnhancedFormBuilder
          formId={currentFormId || undefined}
          onBack={handleBackToDashboard}
        />
        <FormCreationModal
          isOpen={showFormCreationModal}
          onClose={() => setShowFormCreationModal(false)}
          onSubmit={handleFormCreation}
        />
      </>
    );
  }

  // Analytics view (specific to a form)
  if (currentView === 'responses') {
    return currentFormId ? (
      <>
        <ResponseViewer formId={currentFormId} onBack={handleBackToDashboard} />
        <FormCreationModal
          isOpen={showFormCreationModal}
          onClose={() => setShowFormCreationModal(false)}
          onSubmit={handleFormCreation}
        />
      </>
    ) : null;
  }

  // ── Dashboard layout (with sidebar) ─────────────────────────
  return (
    <>
      <div className="flex min-h-screen bg-gray-50 relative">

        {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
        {!isMobile && (
          <div className="fixed left-0 top-0 h-full z-20">
            <Sidebar
              onCreateForm={handleCreateForm}
              onEditForm={handleEditForm}
              currentView={currentView}
              onNavigate={handleNavigate}
              onToggle={setSidebarMinimized}
            />
          </div>
        )}

        {/* ── MOBILE SIDEBAR OVERLAY ───────────────────────────── */}
        {isMobile && mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-10 h-full" style={{ width: 240 }}>
              <Sidebar
                onCreateForm={handleCreateForm}
                onEditForm={handleEditForm}
                currentView={currentView}
                onNavigate={handleNavigate}
                onToggle={() => {}}
                disableMinimize
              />
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <div
          className="flex-1 transition-all duration-300 min-w-0"
          style={{ marginLeft: !isMobile ? `${getSidebarWidth()}px` : '0px' }}
        >
          {/* Mobile top bar */}
          {isMobile && (
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center gap-3 px-4 py-3 shadow-sm">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-900 text-[15px]">
                {currentView === 'dashboard' ? 'Dashboard' : 
                 currentView === 'my-responses' ? 'Your Responses' : 'Settings'}
              </span>
              <button
                onClick={handleCreateForm}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          )}

          {currentView === 'dashboard' ? (
            <FormDashboard
              onCreateForm={handleCreateForm}
              onEditForm={handleEditForm}
              onViewResponses={handleViewResponses}
            />
          ) : currentView === 'my-responses' ? (
            <UserResponses />
          ) : (
            <UserSettings />
          )}
        </div>

        {/* ── MOBILE BOTTOM NAV ────────────────────────────────── */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1 safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            {[
              { view: 'dashboard', icon: LayoutDashboard, label: 'Home' },
              { view: 'my-responses', icon: BarChart3, label: 'History' },
              { view: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ view, icon: Icon, label }) => {
              const active = currentView === view;
              return (
                <button
                  key={view}
                  onClick={() => handleNavigate(view)}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
                    active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : ''}`} />
                  <span className={`text-[10px] font-semibold ${active ? 'text-indigo-600' : ''}`}>{label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5" />}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <FormCreationModal
        isOpen={showFormCreationModal}
        onClose={() => setShowFormCreationModal(false)}
        onSubmit={handleFormCreation}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#4ade80', secondary: '#fff' } },
          error: { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
};

export default EnhancedOorbFormsApp;