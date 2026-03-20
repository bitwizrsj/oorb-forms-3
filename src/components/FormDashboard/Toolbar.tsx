import React from 'react';
import { FolderPlus, Plus, Grid3x3, List } from 'lucide-react';
import { useDashboard } from './DashboardContext';

const Toolbar: React.FC<{ onCreateForm: () => void }> = ({ onCreateForm }) => {
  const {
    showDrafts,
    setShowDrafts,
    showPublished,
    setShowPublished,
    viewMode,
    setViewMode,
    setShowFolderModal
  } = useDashboard();

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Folder</span>
            <span className="sm:hidden">Folder</span>
          </button>
          
          <button
            onClick={onCreateForm}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Form</span>
            <span className="sm:hidden">Form</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-3 bg-white border border-gray-300 rounded-sm px-3 py-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={(e) => setShowDrafts(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Drafts</span>
            </label>
            
            <div className="w-px h-4 bg-gray-300"></div>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPublished}
                onChange={(e) => setShowPublished(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
          </div>

          <div className="flex items-center border border-gray-300 rounded-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;