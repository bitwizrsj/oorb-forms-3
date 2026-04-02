import React, { useState, useEffect } from 'react';
import { X, Folder, FileText, Plus } from 'lucide-react';
import { folderAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface FolderOption {
  _id: string;
  name: string;
  color: string;
}

interface FormCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; folderId?: string }) => void;
}

const FormCreationModal: React.FC<FormCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOption, setSelectedOption] = useState<'standalone' | 'folder' | 'new-folder'>('standalone');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      const response = await folderAPI.getFolders();
      setFolders(response.data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a form title');
      return;
    }

    setLoading(true);

    try {
      let folderId: string | undefined;

      if (selectedOption === 'new-folder' && newFolderName.trim()) {
        const folderResponse = await folderAPI.createFolder({
          name: newFolderName.trim(),
          description: '',
          color: '#3B82F6'
        });
        folderId = folderResponse.data._id;
      } else if (selectedOption === 'folder' && selectedFolderId) {
        folderId = selectedFolderId;
      }

      onSubmit({
        title: title.trim(),
        description: description.trim(),
        folderId
      });

      setTitle('');
      setDescription('');
      setSelectedOption('standalone');
      setSelectedFolderId('');
      setNewFolderName('');
    } catch (error: any) {
      console.error('Error in form creation:', error);
      toast.error(error.response?.data?.error || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-7 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Create New Form</h2>
              <p className="text-[12px] text-slate-400 font-medium">Build your next masterpiece from scratch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-7">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={12} className="text-indigo-500" />
              General Details
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the name of your form?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-300"
              required
              autoFocus
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Folder size={12} className="text-indigo-500" />
              Organization
            </label>
            <div className="space-y-3">
              {[
                { 
                  id: 'standalone', 
                  icon: FileText, 
                  label: 'Standalone Form', 
                  desc: 'Individual form without folder',
                  color: 'indigo'
                },
                { 
                  id: 'folder', 
                  icon: Folder, 
                  label: 'Existing Folder', 
                  desc: 'Add to one of your collections',
                  color: 'emerald',
                  showIf: folders.length > 0
                },
                { 
                  id: 'new-folder', 
                  icon: Plus, 
                  label: 'Create New Folder', 
                  desc: 'New home for this form',
                  color: 'purple'
                }
              ].map((opt) => {
                if (opt.showIf === false) return null;
                const active = selectedOption === opt.id;
                const Icon = opt.icon;
                
                return (
                  <div key={opt.id} className="space-y-3">
                    <label 
                      className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer ${
                        active 
                          ? `border-indigo-600 bg-indigo-50/30` 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="organization"
                        value={opt.id}
                        checked={active}
                        onChange={(e) => setSelectedOption(e.target.value as any)}
                        className="hidden"
                      />
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-bold ${active ? 'text-slate-900' : 'text-slate-700'}`}>{opt.label}</p>
                        <p className="text-[12px] text-slate-400 font-medium truncate">{opt.desc}</p>
                      </div>
                      {active && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </label>

                    {active && opt.id === 'folder' && (
                      <div className="pl-4 pr-1">
                        <select
                          value={selectedFolderId}
                          onChange={(e) => setSelectedFolderId(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-indigo-200 bg-white rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          required={active}
                        >
                          <option value="">Choose a folder...</option>
                          {folders.map((folder) => (
                            <option key={folder._id} value={folder._id}>
                              📁 {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {active && opt.id === 'new-folder' && (
                      <div className="pl-4 pr-1">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Folder name (e.g. Project Apollo)"
                          className="w-full px-4 py-2 border-2 border-indigo-200 bg-white rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          required={active}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 text-[14px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
              disabled={loading}
            >
              Go Back
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-[2] py-3.5 bg-indigo-600 text-white text-[14px] font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Finalizing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Launch Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormCreationModal;