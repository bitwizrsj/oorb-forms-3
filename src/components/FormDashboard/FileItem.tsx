import React from 'react';
import { BarChart3, Copy, Edit, ExternalLink, FileText, Folder, FolderOpen, MoreVertical, Trash2 } from 'lucide-react';
import { FormItem, FolderItem } from './types';
import { useDashboard } from './DashboardContext';

interface FileItemProps {
  item: FormItem | FolderItem;
  type: 'form' | 'folder';
  onEdit?: (id: string) => void;
  onViewResponses?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopyShareLink?: (shareUrl: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ 
  item, 
  type, 
  onEdit, 
  onViewResponses, 
  onDelete,
  onCopyShareLink
}) => {
  const { 
    activeDropdown, 
    setActiveDropdown,
    setOpenFolderModal,
    setSelectedFolder,
    setShowFolderModal
  } = useDashboard();

  const isFolder = type === 'folder';
  const formItem = item as FormItem;
  const folderItem = item as FolderItem;

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === item._id ? null : item._id);
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (isFolder) {
      setOpenFolderModal(folderItem);
    } else if (onEdit) {
      onEdit(formItem._id);
    }
  };

  return (
    <div
      className={`group relative bg-white border border-transparent hover:border-blue-300 hover:bg-blue-50 rounded-sm p-3 cursor-pointer transition-all duration-200`}
      onClick={handleItemClick}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center relative">
          {isFolder ? (
            <div 
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: folderItem.color + '20' }}
            >
              <Folder 
                className="w-6 h-6 sm:w-10 sm:h-10" 
                style={{ color: folderItem.color }}
              />
            </div>
          ) : (
            <>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-sm flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div 
                className={`absolute -top-1 -left-8 w-3 h-3 rounded-full border-2 border-white ${getStatusDotColor(formItem.status)}`}
                title={`Status: ${formItem.status}`}
              />
            </>
          )}
        </div>

        <div className="w-full">
          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
            {isFolder ? folderItem.name : formItem.title}
          </p>
          {isFolder ? (
            <p className="text-xs text-gray-500">
              {folderItem.formCount} items
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              {formItem.responses || 0} responses
            </p>
          )}
        </div>
      </div>

      <div className="absolute top-1 right-1">
        <button
          onClick={toggleDropdown}
          className="p-1 bg-white rounded border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <MoreVertical className="w-3 h-3 text-gray-600" />
        </button>
        {activeDropdown === item._id && (
          <div className="absolute right-0 top-8 w-48 bg-white rounded-sm shadow-lg border border-gray-200 py-2 z-50">
            {isFolder ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFolderModal(folderItem);
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
                    setSelectedFolder(folderItem);
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
                    onDelete?.(folderItem._id);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Folder</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(formItem._id);
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
                    onViewResponses?.(formItem._id);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Responses</span>
                </button>
                {formItem.status === 'published' && formItem.shareUrl && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyShareLink?.(formItem.shareUrl!);
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
                        window.open(`/form/${formItem.shareUrl}`, '_blank');
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
                    onDelete?.(formItem._id);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Form</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileItem;
