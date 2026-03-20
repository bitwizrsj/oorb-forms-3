import React, { createContext, useContext, useState } from 'react';
import { DashboardContextType, FolderItem } from './types';

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrafts, setShowDrafts] = useState(true);
  const [showPublished, setShowPublished] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [openFolderModal, setOpenFolderModal] = useState<FolderItem | null>(null);

  return (
    <DashboardContext.Provider value={{
      searchTerm, setSearchTerm,
      showDrafts, setShowDrafts,
      showPublished, setShowPublished,
      viewMode, setViewMode,
      activeDropdown, setActiveDropdown,
      selectedFolder, setSelectedFolder,
      showFolderModal, setShowFolderModal,
      openFolderModal, setOpenFolderModal
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};