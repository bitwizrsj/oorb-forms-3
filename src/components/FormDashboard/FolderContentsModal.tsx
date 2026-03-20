import React, { useEffect, useState } from 'react';
import { ArrowLeft, X, FolderOpen, Folder } from 'lucide-react';
import axios from 'axios';
import { useDashboard } from './DashboardContext';
import FileItem from './FileItem';
import { FormItem, FolderItem } from './types'; // adjust path if needed

interface FolderContentsModalProps {
  onEditForm: (id: string) => void;
  onViewResponses: (id: string) => void;
  onDeleteForm: (id: string) => void;
  onCopyShareLink: (url: string) => void;
}

const ITEMS_PER_PAGE = 12;

const FolderContentsModal: React.FC<FolderContentsModalProps> = ({
  onEditForm,
  onViewResponses,
  onDeleteForm,
  onCopyShareLink
}) => {
  const { openFolderModal, setOpenFolderModal } = useDashboard();

  const [formsInFolder, setFormsInFolder] = useState<FormItem[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!openFolderModal) return;

    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      setFormsInFolder([]);
      setFilteredForms([]);
      setCurrentPage(1);
      setSearchTerm('');
      try {
        const res = await axios.get<{ forms: FormItem[] }>(`/api/forms/folder/${openFolderModal._id}`);
        setFormsInFolder(res.data.forms);
        setFilteredForms(res.data.forms);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [openFolderModal]);

  // Filter forms by searchTerm
  useEffect(() => {
    const filtered = formsInFolder.filter(form =>
      form.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredForms(filtered);
    setCurrentPage(1); // Reset page on new search
  }, [searchTerm, formsInFolder]);

  if (!openFolderModal) return null;

  // Pagination logic
  const totalPages = Math.ceil(filteredForms.length / ITEMS_PER_PAGE);
  const paginatedForms = filteredForms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setOpenFolderModal(null)}
              className="p-2 hover:bg-gray-200 rounded-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: openFolderModal.color + '20' }}
            >
              <FolderOpen className="w-5 h-5" style={{ color: openFolderModal.color }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{openFolderModal.name}</h2>
              <p className="text-sm text-gray-600">{formsInFolder.length} items</p>
            </div>
          </div>
          <button
            onClick={() => setOpenFolderModal(null)}
            className="p-2 hover:bg-gray-200 rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[calc(90vh-160px)]">
          {loading ? (
            <div className="text-center py-16 text-gray-600">Loading forms...</div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : filteredForms.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {paginatedForms.map((form) => (
                  <FileItem
                    key={`form-${form._id}`}
                    item={form}
                    type="form"
                    onEdit={onEditForm}
                    onViewResponses={onViewResponses}
                    onDelete={onDeleteForm}
                    onCopyShareLink={onCopyShareLink}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded ${
                          page === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Folder className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
              <p className="text-gray-600">Add forms to organize them</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderContentsModal;
