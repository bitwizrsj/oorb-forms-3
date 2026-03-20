import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Type, CheckSquare, Circle, Calendar, Mail, Phone, FileText, Upload, Star,
  Plus, Trash2, Settings, Eye, Save, Share2, ArrowLeft, Send, Sparkles,
  Palette, Code, Zap, BarChart3, GitBranch, Menu, X, AlertCircle, HelpCircle,
  Cloud, CloudOff, GripVertical, Check, Folder, FolderOpen,
} from 'lucide-react';
import { formAPI, folderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AIFormBuilder from './AIFormBuilder';
import TemplateLibrary from './TemplateLibrary';
import EmbedCodeGenerator from './EmbedCodeGenerator';
import IntegrationsPanel from './IntegrationsPanel';
import ConditionalLogic from './ConditionalLogic';
import AdvancedValidation from './AdvancedValidation';
import FormAnalytics from './FormAnalytics';
import QuestionAnswerField from './QuestionAnswerField';
import FormEditorAIAssistant from './FormEditorAIAssistant';

/* ── Save-As Modal ─────────────────────────────────── */
const SaveAsModal: React.FC<{
  folders: { _id: string; name: string; color: string }[];
  currentFolderId?: string;
  onSave: (folderId: string | null) => void;
  onClose: () => void;
}> = ({ folders, currentFolderId, onSave, onClose }) => {
  const [selected, setSelected] = useState<string | null>(currentFolderId ?? null);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">Save Form To…</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
          <button onClick={() => setSelected(null)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors ${selected === null ? 'bg-indigo-50' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <FileText size={15} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800">My Files (root)</p>
              <p className="text-[11px] text-slate-400">No folder — top level</p>
            </div>
            {selected === null && <Check size={15} className="text-indigo-600 flex-shrink-0" />}
          </button>
          {folders.map(f => (
            <button key={f._id} onClick={() => setSelected(f._id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors ${selected === f._id ? 'bg-indigo-50' : ''}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: f.color + '22' }}>
                <Folder size={15} style={{ color: f.color }} />
              </div>
              <p className="text-[13px] font-semibold text-slate-800 flex-1 min-w-0 truncate">{f.name}</p>
              {selected === f._id && <Check size={15} className="text-indigo-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { onSave(selected); onClose(); }}
            className="px-4 py-2 text-[13px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
            Save Here
          </button>
        </div>
      </div>
    </div>
  );
};

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'rating' | 'question';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
  questionType?: 'single-choice' | 'multiple-choice';
  questionText?: string;
  questionOptions?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  googleDriveFolderId?: string;
}

interface Form {
  _id?: string;
  title: string;
  description: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'closed';
  shareUrl?: string;
  conditionalRules?: any[];
  settings?: {
    allowMultipleResponses?: boolean;
    requireLogin?: boolean;
    showProgressBar?: boolean;
    customTheme?: {
      primaryColor: string;
      backgroundColor: string;
    };
  };
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

interface EnhancedFormBuilderProps {
  formId?: string;
  onBack: () => void;
}

const EnhancedFormBuilder: React.FC<EnhancedFormBuilderProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form>({
    title: 'Untitled Form',
    description: 'Form description',
    fields: [],
    status: 'draft',
    conditionalRules: [],
    theme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter'
    }
  });

  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'logic' | 'design' | 'settings'>('fields');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileFieldEditorOpen, setMobileFieldEditorOpen] = useState(false);
  const [savedCloud, setSavedCloud] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [folders, setFolders] = useState<{ _id: string; name: string; color: string }[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [formSettings, setFormSettings] = useState({
    allowMultipleResponses: true,
    requireLogin: true,
    showProgressBar: true,
    customTheme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF'
    }
  });

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'textarea', label: 'Long Answer', icon: FileText },
    { type: 'select', label: 'Dropdown', icon: CheckSquare },
    { type: 'radio', label: 'Multiple Choice', icon: Circle },
    { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'file', label: 'File Upload', icon: Upload },
    { type: 'rating', label: 'Rating', icon: Star },
    { type: 'question', label: 'Question/Answer', icon: HelpCircle }
  ];

  // Load form + folders
  useEffect(() => {
    if (formId) loadForm();
    folderAPI.getFolders().then(r => setFolders(r.data || [])).catch(() => { });
  }, [formId]);

  // Ctrl+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveForm(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [form]);

  // Close menus on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Update form settings when form changes
  useEffect(() => {
    if (form.settings) {
      setFormSettings({
        allowMultipleResponses: form.settings.allowMultipleResponses !== undefined
          ? form.settings.allowMultipleResponses
          : true,
        requireLogin: form.settings.requireLogin !== undefined
          ? form.settings.requireLogin
          : true,
        showProgressBar: form.settings.showProgressBar !== undefined
          ? form.settings.showProgressBar
          : true,
        customTheme: form.settings.customTheme || {
          primaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF'
        }
      });
    }
  }, [form]);

  const loadForm = async () => {
    try {
      const response = await formAPI.getForm(formId!);
      setForm(response.data);
    } catch (error) {
      toast.error('Failed to load form');
      console.error('Error loading form:', error);
    }
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `${fieldTypes.find(ft => ft.type === type)?.label} Field`,
      placeholder: type === 'textarea' ? 'Enter your answer here...' : 'Enter your answer',
      required: false,
      options: ['radio', 'checkbox', 'select'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      validation: {}
    };

    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField.id);
    setMobileFieldEditorOpen(true);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    setSelectedField(null);
    setMobileFieldEditorOpen(false);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(form.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setForm(prev => ({ ...prev, fields: items }));
  };

  const saveForm = async (targetFolderId?: string | null) => {
    if (!form.title.trim()) {
      toast.error('Please enter a form title');
      return;
    }
    setSaving(true);
    try {
      const formDataToSave = {
        ...form,
        settings: formSettings,
        ...(targetFolderId !== undefined ? { folderId: targetFolderId ?? undefined } : {}),
      };
      if (form._id) {
        await formAPI.updateForm(form._id, formDataToSave);
      } else {
        const response = await formAPI.createForm(formDataToSave);
        setForm(response.data);
      }
      setSavedCloud(true);
      toast.success('Saved!');
    } catch (error) {
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    if (!form._id) {
      toast.error('Please save the form first');
      return;
    }

    if (form.fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setPublishing(true);
    try {
      const response = await formAPI.publishForm(form._id);
      setForm(response.data);
      toast.success('Form published successfully!');
    } catch (error) {
      toast.error('Failed to publish form');
      console.error('Error publishing form:', error);
    } finally {
      setPublishing(false);
    }
  };

  const copyShareLink = () => {
    if (form.shareUrl) {
      const shareLink = `${window.location.origin}/form/${form.shareUrl}`;
      navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    }
  };

  const handleAIFormGenerated = (generatedForm: any) => {
    setForm(prev => ({
      ...prev,
      ...generatedForm,
      fields: generatedForm.fields.map((field: any, index: number) => ({
        ...field,
        id: `field_${Date.now()}_${index}`
      }))
    }));
    setShowAIBuilder(false);
    toast.success('AI form generated successfully!');
  };

  const handleTemplateSelected = (template: any) => {
    setForm(prev => ({
      ...prev,
      ...template
    }));
    setShowTemplates(false);
  };

  const renderFieldPreview = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className={baseClasses}
            disabled={!previewMode}
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={4}
            className={baseClasses}
            disabled={!previewMode}
          />
        );

      case 'select':
        return (
          <select className={baseClasses} disabled={!previewMode}>
            <option value="">Choose an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input type="radio" name={field.id} value={option} disabled={!previewMode} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input type="checkbox" value={option} disabled={!previewMode} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            className={baseClasses}
            disabled={!previewMode}
          />
        );

      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Click to upload or drag and drop</p>
          </div>
        );

      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-gray-300 hover:text-yellow-400 cursor-pointer" />
            ))}
          </div>
        );

      case 'question':
        return (
          <QuestionAnswerField
            field={field}
            onFieldUpdate={() => { }}
            isPreview={true}
          />
        );

      default:
        return null;
    }
  };

  const renderFieldEditor = () => {
    const field = form.fields.find(f => f.id === selectedField);
    if (!field) return null;

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border-l border-gray-200 p-6 w-80 shadow-2xl fixed right-0 top-0 h-full z-50 md:relative md:z-0 flex-shrink-0 overflow-y-auto ${mobileFieldEditorOpen ? 'block' : 'hidden md:block'
          }`}>
        <div className="flex justify-between items-center mb-4 md:hidden">
          <h3 className="text-lg font-semibold">Field Settings</h3>
          <button
            onClick={() => setMobileFieldEditorOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {['text', 'email', 'phone', 'textarea'].includes(field.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {field.type === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Drive Folder ID (Optional)
              </label>
              <input
                type="text"
                value={field.googleDriveFolderId || ''}
                onChange={(e) => updateField(field.id, { googleDriveFolderId: e.target.value })}
                placeholder="e.g. 1B2c3D4e5F6g..."
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for default. (Requires Google Drive Integration)
              </p>
            </div>
          )}

          {['radio', 'checkbox', 'select'].includes(field.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[index] = e.target.value;
                        updateField(field.id, { options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== index);
                        updateField(field.id, { options: newOptions });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                    updateField(field.id, { options: newOptions });
                  }}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-sm text-gray-600 hover:bg-gray-50"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="required"
              checked={field.required}
              onChange={(e) => updateField(field.id, { required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="required" className="text-sm font-medium text-gray-700">
              Required field
            </label>
          </div>

          <AdvancedValidation
            field={field}
            onValidationChange={(validation) => updateField(field.id, { validation })}
          />

          {field.type === 'question' && (
            <QuestionAnswerField
              field={field}
              onFieldUpdate={(updates) => updateField(field.id, updates)}
            />
          )}

          <button
            onClick={() => deleteField(field.id)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors shadow-lg"
          >
            Delete Field
          </button>
        </div>
      </div>
    );
  };

  const renderDesignTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Customization</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={form.theme?.primaryColor || '#3B82F6'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, primaryColor: e.target.value }
                }))}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={form.theme?.primaryColor || '#3B82F6'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, primaryColor: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={form.theme?.backgroundColor || '#FFFFFF'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, backgroundColor: e.target.value }
                }))}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={form.theme?.backgroundColor || '#FFFFFF'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, backgroundColor: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={form.theme?.fontFamily || 'Inter'}
            onChange={(e) => setForm(prev => ({
              ...prev,
              theme: { ...prev.theme!, fontFamily: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Form Preview</h1>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-sm hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
              <p className="text-gray-600">{form.description}</p>
            </div>

            <form className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFieldPreview(field)}
                </div>
              ))}

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-sm hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const currentFolder = folders.find(f => f._id === (form as any).folderId);

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: '#F8FAFC' }}>

      {/* ══ GOOGLE DOCS-STYLE HEADER ══ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

        {/* Row 1: Icon + Title + cloud + actions */}
        <div className="flex items-center gap-3 px-4 pt-2.5 pb-1.5">
          {/* Form icon */}
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
            <FileText size={17} className="text-white" />
          </div>

          {/* Title area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <input type="text" value={form.title}
                onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setSavedCloud(false); }}
                className="text-[15px] font-bold text-slate-900 bg-transparent border-none outline-none focus:bg-slate-100 rounded-md px-1.5 py-0.5 transition-colors min-w-0 max-w-xs sm:max-w-sm" />
              {/* Cloud indicator */}
              <div className="flex items-center gap-1 text-[11px]">
                {saving ? (
                  <span className="text-slate-400 flex items-center gap-1"><div className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />Saving…</span>
                ) : savedCloud ? (
                  <span className="text-emerald-500 flex items-center gap-1"><Cloud size={12} />Saved</span>
                ) : (
                  <span className="text-slate-300 flex items-center gap-1"><CloudOff size={12} />Unsaved</span>
                )}
              </div>
              {/* Folder badge */}
              {currentFolder && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]" style={{ background: currentFolder.color + '22', color: currentFolder.color }}>
                  <Folder size={10} /><span className="font-semibold">{currentFolder.name}</span>
                </div>
              )}
              {/* Status */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${form.status === 'published' ? 'bg-emerald-50 text-emerald-700' : form.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}>{form.status}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setPreviewMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Eye size={13} /><span className="hidden sm:inline">Preview</span>
            </button>
            <button onClick={() => saveForm()} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
              <Save size={13} /><span className="hidden sm:inline">Save</span>
            </button>
            <button onClick={publishForm} disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 active:scale-[0.97] transition-all">
              <Send size={13} /><span className="hidden sm:inline">{publishing ? 'Publishing…' : form.status === 'published' ? 'Published ✓' : 'Publish'}</span>
            </button>
            {form.status === 'published' && form.shareUrl && (
              <button onClick={copyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-violet-600 border border-violet-200 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                <Share2 size={13} /><span className="hidden sm:inline">Share</span>
              </button>
            )}
            {/* Mobile sidebar toggle */}
            <button onClick={() => setMobileSidebarOpen(p => !p)}
              className="md:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600">
              {mobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Row 2: Menu bar (File / Insert / View) + Tabs */}
        <div ref={menuRef} className="flex items-center gap-0.5 px-4 border-b border-slate-100">
          {/* File menu */}
          <div className="relative">
            <button onClick={() => setOpenMenu(p => p === 'file' ? null : 'file')}
              className={`flex items-center px-3 py-2 text-[13px] rounded-lg transition-colors ${openMenu === 'file' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}>File</button>
            {openMenu === 'file' && (
              <div className="absolute left-0 top-full mt-0.5 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                {[
                  { icon: Save, label: 'Save', shortcut: '⌘S', action: () => { saveForm(); setOpenMenu(null); } },
                  { icon: FolderOpen, label: 'Save As…', shortcut: '', action: () => { setShowSaveAs(true); setOpenMenu(null); } },
                  null,
                  { icon: Eye, label: 'Preview', shortcut: '', action: () => { setPreviewMode(true); setOpenMenu(null); } },
                  { icon: BarChart3, label: 'Analytics', shortcut: '', action: () => { setShowAnalytics(true); setOpenMenu(null); } },
                  { icon: Code, label: 'Embed Code', shortcut: '', action: () => { setShowEmbedCode(true); setOpenMenu(null); } },
                  null,
                  { icon: ArrowLeft, label: 'Back to Dashboard', shortcut: '', action: () => { onBack(); setOpenMenu(null); } },
                ].map((item, i) => item === null ? (
                  <div key={i} className="h-px bg-slate-100 my-1" />
                ) : (
                  <button key={i} onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
                    <item.icon size={13} className="text-slate-400" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && <span className="text-[11px] text-slate-300">{item.shortcut}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Insert menu */}
          <div className="relative">
            <button onClick={() => setOpenMenu(p => p === 'insert' ? null : 'insert')}
              className={`flex items-center px-3 py-2 text-[13px] rounded-lg transition-colors ${openMenu === 'insert' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}>Insert</button>
            {openMenu === 'insert' && (
              <div className="absolute left-0 top-full mt-0.5 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                {fieldTypes.map(ft => {
                  const Icon = ft.icon;
                  return (
                    <button key={ft.type} onClick={() => { addField(ft.type as FormField['type']); setOpenMenu(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
                      <Icon size={13} className="text-slate-400" /><span>{ft.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View menu */}
          <div className="relative">
            <button onClick={() => setOpenMenu(p => p === 'view' ? null : 'view')}
              className={`flex items-center px-3 py-2 text-[13px] rounded-lg transition-colors ${openMenu === 'view' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}>View</button>
            {openMenu === 'view' && (
              <div className="absolute left-0 top-full mt-0.5 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                <button onClick={() => { setPreviewMode(true); setOpenMenu(null); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50"><Eye size={13} className="text-slate-400" /><span>Preview Form</span></button>
                {form.status === 'published' && form.shareUrl && (
                  <button onClick={() => { window.open(`/form/${form.shareUrl}`, '_blank'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50"><Share2 size={13} className="text-slate-400" /><span>Open Live Form</span></button>
                )}
                <button onClick={() => { setShowIntegrations(true); setOpenMenu(null); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50"><Zap size={13} className="text-slate-400" /><span>Integrations</span></button>
              </div>
            )}
          </div>

          {/* Divider then tabs */}
          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Tabs inline */}
          {[
            { id: 'fields', label: 'Fields', icon: Type },
            { id: 'logic', label: 'Logic', icon: GitBranch },
            { id: 'design', label: 'Design', icon: Palette },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}>
                <Icon size={13} /><span>{tab.label}</span>
              </button>
            );
          })}

          {/* Back link */}
          <button onClick={onBack} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={12} /> Dashboard
          </button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`${mobileSidebarOpen ? 'fixed inset-0 z-30' : 'hidden'
          } md:relative md:flex w-56 bg-white border-r border-slate-200 flex-col overflow-y-auto flex-shrink-0`}>
          {/* Mobile close */}
          <div className="flex justify-end p-3 md:hidden">
            <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
          </div>

          {/* Quick Start */}
          <div className="px-4 pt-4 pb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Start</p>
            <div className="space-y-1">
              <button onClick={() => { setShowAIBuilder(true); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors group text-left">
                <Sparkles size={14} className="text-indigo-500 flex-shrink-0" />
                <span className="text-[13px] text-slate-600 group-hover:text-slate-900">AI Form Builder</span>
              </button>
              <button onClick={() => { setShowTemplates(true); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group text-left">
                <FileText size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-[13px] text-slate-600 group-hover:text-slate-900">Use Template</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-4" />

          {/* Field sections */}
          <div className="px-4 pt-4 pb-5 flex-1">
            {([
              { group: 'Basic', types: ['text', 'email', 'phone', 'textarea'] },
              { group: 'Choice', types: ['select', 'radio', 'checkbox'] },
              { group: 'Other', types: ['date', 'file', 'rating', 'question'] },
            ] as const).map(({ group, types }) => (
              <div key={group} className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{group}</p>
                <div className="space-y-0.5">
                  {fieldTypes.filter(f => (types as readonly string[]).includes(f.type)).map(ft => {
                    const Icon = ft.icon;
                    return (
                      <button key={ft.type} onClick={() => { addField(ft.type as FormField['type']); setMobileSidebarOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 rounded-xl transition-colors group">
                        <Icon size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                        <span className="text-[13px] text-slate-600 group-hover:text-slate-900">{ft.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN CANVAS ── */}
        <main className="flex-1 overflow-y-auto" onClick={() => setSelectedField(null)}>
          <div className="p-4 md:p-6 pb-32">
            {activeTab === 'fields' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-slate-200 overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <div className="p-6 md:p-8">
                    <div className="mb-6 md:mb-8">
                      <input type="text" value={form.title} onClick={e => e.stopPropagation()}
                        onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setSavedCloud(false); }}
                        className="text-2xl font-black text-slate-900 bg-transparent border-none outline-none focus:bg-slate-50 rounded-lg px-2 py-1 w-full"
                        placeholder="Form Title" />
                      <textarea value={form.description} onClick={e => e.stopPropagation()}
                        onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setSavedCloud(false); }}
                        className="text-[14px] text-slate-400 bg-transparent border-none outline-none focus:bg-slate-50 rounded-lg px-2 py-1 w-full resize-none mt-1"
                        placeholder="Add a description…" rows={2} />
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="form-fields">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {form.fields.map((field, index) => (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}
                                    className={`group relative rounded-2xl border-2 transition-all duration-150 ${selectedField === field.id ? 'border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.10)]' : 'border-slate-200 hover:border-slate-300'
                                      } ${snapshot.isDragging ? 'shadow-xl rotate-[0.5deg]' : ''} bg-white`}
                                    onClick={e => { e.stopPropagation(); setSelectedField(field.id); setMobileFieldEditorOpen(true); }}>
                                    {/* Drag handle */}
                                    <div {...provided.dragHandleProps}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                      <GripVertical size={14} className="text-slate-300" />
                                    </div>
                                    {/* Delete */}
                                    <button onClick={e => { e.stopPropagation(); deleteField(field.id); }}
                                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500">
                                      <Trash2 size={13} />
                                    </button>
                                    <div className="px-10 py-5">
                                      <label className="block text-[13px] font-semibold text-slate-700 mb-3">
                                        {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                                      </label>
                                      {renderFieldPreview(field)}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}

                            {form.fields.length === 0 && (
                              <div className="text-center py-14">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                  <FileText className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-[14px] font-semibold text-slate-500 mb-1">No fields yet</p>
                                <p className="text-[12px] text-slate-400">Add fields from the sidebar or Insert menu</p>
                                <button onClick={() => setMobileSidebarOpen(true)}
                                  className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 md:hidden">Open Field Library</button>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    {form.fields.length > 0 && (
                      <button onClick={e => { e.stopPropagation(); addField('text'); }}
                        className="mt-5 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[13px] text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
                        <Plus size={14} /> Add a field
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logic' && (
              <div className="max-w-4xl mx-auto">
                <ConditionalLogic
                  fields={form.fields}
                  rules={form.conditionalRules || []}
                  onRulesChange={(rules) => setForm(prev => ({ ...prev, conditionalRules: rules }))}
                />
              </div>
            )}

            {activeTab === 'design' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8">
                  {renderDesignTab()}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-4">Form Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowMultiple"
                        checked={formSettings.allowMultipleResponses}
                        onChange={(e) => setFormSettings(prev => ({
                          ...prev,
                          allowMultipleResponses: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="allowMultiple" className="text-sm font-medium text-gray-700">
                        Allow multiple responses from same user
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requireLogin"
                        checked={formSettings.requireLogin}
                        onChange={(e) => setFormSettings(prev => ({
                          ...prev,
                          requireLogin: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="requireLogin" className="text-sm font-medium text-gray-700">
                        Require login to submit
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showProgress"
                        checked={formSettings.showProgressBar}
                        onChange={(e) => setFormSettings(prev => ({
                          ...prev,
                          showProgressBar: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="showProgress" className="text-sm font-medium text-gray-700">
                        Show progress bar
                      </label>
                    </div>

                    {formSettings.requireLogin && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
                        <div className="flex items-center space-x-2 text-blue-800">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Login Required</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Users must be signed in to submit responses to this form.
                        </p>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Notification Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="emailNotifications"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                            Email notifications for new responses
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="responseLimit"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="responseLimit" className="text-sm font-medium text-gray-700">
                            Limit number of responses
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Form Behavior</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="shuffleQuestions"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="shuffleQuestions" className="text-sm font-medium text-gray-700">
                            Randomize question order
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="confirmationPage"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="confirmationPage" className="text-sm font-medium text-gray-700">
                            Show confirmation page after submission
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Field Editor side panel */}
        {activeTab === 'fields' && renderFieldEditor()}
      </div>

      {/* Save As Modal */}
      {showSaveAs && (
        <SaveAsModal
          folders={folders}
          currentFolderId={(form as any).folderId}
          onSave={(fid) => saveForm(fid)}
          onClose={() => setShowSaveAs(false)}
        />
      )}

      {/* Modals */}
      {showAIBuilder && (
        <AIFormBuilder
          onFormGenerated={handleAIFormGenerated}
          onClose={() => setShowAIBuilder(false)}
        />
      )}

      {showTemplates && (
        <TemplateLibrary
          onSelectTemplate={handleTemplateSelected}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showEmbedCode && form.shareUrl && (
        <EmbedCodeGenerator
          form={form}
          onClose={() => setShowEmbedCode(false)}
        />
      )}

      {showIntegrations && form._id && (
        <IntegrationsPanel
          formId={form._id}
          onClose={() => setShowIntegrations(false)}
        />
      )}

      {showAnalytics && form._id && (
        <FormAnalytics
          formId={form._id}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around items-center shadow-lg z-20">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-3 text-gray-600 hover:text-blue-600 flex flex-col items-center"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs mt-1">Add Field</span>
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          className="p-3 text-gray-600 hover:text-blue-600 flex flex-col items-center"
        >
          <Eye className="w-5 h-5" />
          <span className="text-xs mt-1">Preview</span>
        </button>
        <button
          onClick={() => saveForm()}
          disabled={saving}
          className="p-3 text-blue-600 hover:text-blue-700 flex flex-col items-center disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span className="text-xs mt-1">Save</span>
        </button>
        {selectedField && (
          <button
            onClick={() => setMobileFieldEditorOpen(true)}
            className="p-3 text-purple-600 hover:text-purple-700 flex flex-col items-center"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        )}
      </div>
      {/* Form Editor AI Assistant */}
      <FormEditorAIAssistant currentForm={form} onUpdateForm={setForm} />
    </div>
  );
};

export default EnhancedFormBuilder;