import React from 'react';
import { BarChart3, Copy, Edit, ExternalLink, FileText, Folder, FolderOpen, MoreVertical, Trash2 } from 'lucide-react';
import { FormItem, FolderItem } from './types';
import { useDashboard } from './DashboardContext';

interface ListViewProps {
  filteredFolders: FolderItem[];
  filteredStandaloneForms: FormItem[];
  onEditForm: (id: string) => void;
  onViewResponses: (id: string) => void;
  onDeleteForm: (id: string) => void;
  onCopyShareLink: (shareUrl: string) => void;
  onDeleteFolder: (id: string) => void;

  setOpenFolderModal: (folder: FolderItem | null) => void;
  setSelectedFolder: (folder: FolderItem | null) => void;
  setShowFolderModal: (show: boolean) => void;
}

const ListView: React.FC<ListViewProps> = ({
  filteredFolders,
  filteredStandaloneForms,
  onEditForm,
  onViewResponses,
  onDeleteForm,
  onCopyShareLink,
  onDeleteFolder,
  setOpenFolderModal,
  setSelectedFolder,
  setShowFolderModal,
}) => {
  const { activeDropdown, setActiveDropdown } = useDashboard();

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
        <div className="flex items-center justify-between"><span>Name</span></div>
        <div>Type</div>
        <div>Status</div>
        <div className="flex items-center justify-between"><span>Modified</span><span>Actions</span></div>
      </div>

      {/* Folder List */}
      <div className="divide-y divide-gray-200">
        {filteredFolders.map((folder: FolderItem) => (
          <div 
            key={folder._id} 
            className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 p-4 hover:bg-gray-50 cursor-pointer relative"
          >
            <div className="flex items-center space-x-3">
              <Folder className="w-5 h-5" style={{ color: folder.color }} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{folder.name}</span>
                <span className="text-xs text-gray-500 sm:hidden">Folder • {folder.formCount} items</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 sm:block hidden">Folder</div>
            <div className="text-sm text-gray-600 sm:block hidden">-</div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{new Date(folder.createdAt).toLocaleDateString()}</div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === folder._id ? null : folder._id);
                  }}
                  className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {activeDropdown === folder._id && (
                  <div className="absolute right-0 top-8 w-48 bg-white rounded-sm shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFolderModal(folder);
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Open Folder</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFolder(folder);
                        setShowFolderModal(true);
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Folder</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder._id);
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Folder</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Forms List */}
        {filteredStandaloneForms.map((form: FormItem) => (
          <div 
            key={form._id} 
            className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 p-4 hover:bg-gray-50 cursor-pointer relative"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FileText className="w-5 h-5 text-blue-600" />
                <div 
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDotColor(form.status)}`}
                  title={`Status: ${form.status}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{form.title}</span>
                <span className="text-xs text-gray-500 sm:hidden">Form • {form.responses || 0} responses</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 sm:block hidden">Form</div>
            <div className="flex items-center">
              <div 
                className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(form.status)}`}
                title={`Status: ${form.status}`}
              />
              <span className="text-sm text-gray-600 capitalize">{form.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{new Date(form.createdAt).toLocaleDateString()}</div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === form._id ? null : form._id);
                  }}
                  className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {activeDropdown === form._id && (
                  <div className="absolute right-0 top-8 w-48 bg-white rounded-sm shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditForm(form._id);
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Form</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewResponses(form._id);
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>View Responses</span>
                    </button>
                    {form.status === 'published' && form.shareUrl && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyShareLink(form.shareUrl!);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy Share Link</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/form/${form.shareUrl}`, '_blank');
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Form</span>
                        </button>
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteForm(form._id);
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Form</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListView;
