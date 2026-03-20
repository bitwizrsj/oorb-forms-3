import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import FormDashboard from './FormDashboard';
import FormBuilder from './FormBuilder';
import ResponseViewer from './ResponseViewer';
import FormCreationModal from './FormCreationModal';
import Sidebar from './Sidebar';
import { formAPI } from '../../services/api';
import toast from 'react-hot-toast';
import EnhancedFormBuilder from './EnhancedFormBuilder';

type View = 'dashboard' | 'builder' | 'responses';

const EnhancedOorbFormsApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [showFormCreationModal, setShowFormCreationModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const location = useLocation();

  // Handle redirection from other pages (like AI Chat) via location state
  useEffect(() => {
    const state = location.state as { openFormId?: string };
    if (state?.openFormId) {
      setCurrentFormId(state.openFormId);
      setCurrentView('builder');
      // Clear the state so it doesn't re-open the editor on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateForm = () => {
    setShowFormCreationModal(true);
  };

  const handleFormCreation = async (data: { title: string; description: string; folderId?: string }) => {
    try {
      const formData = {
        title: data.title,
        description: data.description,
        folderId: data.folderId || null,
        fields: [],
        status: 'draft'
      };

      const response = await formAPI.createForm(formData);
      setCurrentFormId(response.data._id);
      setCurrentView('builder');
      setShowFormCreationModal(false); // Close modal after successful creation
      toast.success('Form created successfully!');
    } catch (error) {
      toast.error('Failed to create form');
      console.error('Error creating form:', error);
    }
  };

  const handleEditForm = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('builder');
  };

  const handleViewResponses = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('responses');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentFormId(null);
  };

  const handleSidebarToggle = (minimized: boolean) => {
    setSidebarMinimized(minimized);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
  };

  const getSidebarWidth = () => {
    if (isMobile) return 0;
    return sidebarMinimized ? 64 : 256; // 16 for minimized, 64 for full (in pixels)
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Hidden on mobile when in dashboard view */}
            {!isMobile && (
              <div className="fixed left-0 top-0 h-full z-10">
                <Sidebar
                  onCreateForm={handleCreateForm}
                  onEditForm={handleEditForm}
                  currentView={currentView}
                  onNavigate={handleNavigate}
                  onToggle={handleSidebarToggle}
                />
              </div>
            )}

            {/* Main Content with dynamic margin based on sidebar state */}
            <div
              className="flex-1 transition-all duration-300"
              style={{
                marginLeft: !isMobile ? `${getSidebarWidth()}px` : '0px'
              }}
            >
              <FormDashboard
                onCreateForm={handleCreateForm}
                onEditForm={handleEditForm}
                onViewResponses={handleViewResponses}
              />
            </div>
          </div>
        );

      case 'builder':
        return (
          <EnhancedFormBuilder
            formId={currentFormId || undefined}
            onBack={handleBackToDashboard}
          />
        );

      case 'responses':
        return currentFormId ? (
          <ResponseViewer
            formId={currentFormId}
            onBack={handleBackToDashboard}
          />
        ) : null;

      default:
        return (
          <div className="flex min-h-screen bg-gray-50">
            {!isMobile && (
              <div className="fixed left-0 top-0 h-full z-10">
                <Sidebar
                  onCreateForm={handleCreateForm}
                  onEditForm={handleEditForm}
                  currentView={currentView}
                  onNavigate={handleNavigate}
                  onToggle={handleSidebarToggle}
                />
              </div>
            )}

            <div
              className="flex-1 transition-all duration-300"
              style={{
                marginLeft: !isMobile ? `${getSidebarWidth()}px` : '0px'
              }}
            >
              <FormDashboard
                onCreateForm={handleCreateForm}
                onEditForm={handleEditForm}
                onViewResponses={handleViewResponses}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderCurrentView()}

      {/* Form Creation Modal */}
      <FormCreationModal
        isOpen={showFormCreationModal}
        onClose={() => setShowFormCreationModal(false)}
        onSubmit={handleFormCreation}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

export default EnhancedOorbFormsApp;