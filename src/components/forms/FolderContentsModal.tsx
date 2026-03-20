import React from 'react';
import { ArrowLeft, X, FolderOpen, Plus, FileText, MoreVertical } from 'lucide-react';

interface FolderContentsModalProps {
  folder: any;
  forms: any[];
  onClose: () => void;
  onCreateForm: () => void;
  onEditForm: (id: string) => void;
  onViewResponses: (id: string) => void;
  onDeleteForm: (id: string) => void;
  onCopyShareLink: (shareUrl: string) => void;
}

const FolderContentsModal: React.FC<FolderContentsModalProps> = ({
  folder,
  forms,
  onClose,
  onCreateForm,
  onEditForm,
  onViewResponses,
  onDeleteForm,
  onCopyShareLink
}) => {
  if (!folder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-sm transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div 
                className="w-8 h-8 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: folder.color + '20' }}
              >
                <FolderOpen className="w-5 h-5" style={{ color: folder.color }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{folder.name}</h2>
                <p className="text-sm text-gray-600">{forms.length} items</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onCreateForm}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Form</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {forms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {forms.map((form) => (
                <div
                  key={`form-${form._id}`}
                  className="group relative bg-white border border-transparent hover:border-blue-300 hover:bg-blue-50 rounded-sm p-3 cursor-pointer transition-all duration-200"
                  onClick={() => onEditForm(form._id)}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center relative">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-sm flex items-center justify-center">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                      </div>
                      <div 
                        className={`absolute -top-1 -left-8 w-3 h-3 rounded-full border-2 border-white ${
                          form.status === 'published' ? 'bg-green-500' :
                          form.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        title={`Status: ${form.status}`}
                      />
                    </div>

                    <div className="w-full">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {form.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {form.responses || 0} responses
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-1 right-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle dropdown menu
                      }}
                      className="p-1 bg-white rounded border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
              <p className="text-gray-600 mb-4">Add forms to organize them</p>
              <button
                onClick={onCreateForm}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderContentsModal;