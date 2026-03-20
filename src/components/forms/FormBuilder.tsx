import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Type, CheckSquare, Circle, Calendar, Mail, Phone, FileText, Upload, Star,
  Plus, Trash2, Eye, Save, Share2, ArrowLeft, Send, BarChart3,
  ChevronDown, Folder, FolderOpen, X, Check, GripVertical, AlignLeft,
  Cloud, CloudOff, Sparkles, BookOpen,
} from 'lucide-react';
import { formAPI, folderAPI } from '../../services/api';
import toast from 'react-hot-toast';

/* ── Types ─────────────────────────────────────────── */
interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'rating';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}
interface Form {
  _id?: string;
  title: string;
  description: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'closed';
  shareUrl?: string;
  folderId?: string;
}
interface FolderItem { _id: string; name: string; color: string; }
interface FormBuilderProps {
  formId?: string;
  onBack: () => void;
  onViewResponses?: (formId: string) => void;
}

/* ── Field catalogue ───────────────────────────────── */
const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: Type, group: 'Basic' },
  { type: 'email', label: 'Email', icon: Mail, group: 'Basic' },
  { type: 'phone', label: 'Phone', icon: Phone, group: 'Basic' },
  { type: 'textarea', label: 'Long Answer', icon: AlignLeft, group: 'Basic' },
  { type: 'select', label: 'Dropdown', icon: ChevronDown, group: 'Choice' },
  { type: 'radio', label: 'Multiple Choice', icon: Circle, group: 'Choice' },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, group: 'Choice' },
  { type: 'date', label: 'Date', icon: Calendar, group: 'Other' },
  { type: 'file', label: 'File Upload', icon: Upload, group: 'Other' },
  { type: 'rating', label: 'Rating', icon: Star, group: 'Other' },
] as const;

/* ── Save-As Modal ─────────────────────────────────── */
const SaveAsModal: React.FC<{
  folders: FolderItem[];
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
          {/* Root option */}
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

/* ══════════════════════════════════════════════════╗
   MAIN COMPONENT
╚══════════════════════════════════════════════════ */
const FormBuilder: React.FC<FormBuilderProps> = ({ formId, onBack, onViewResponses }) => {
  const [form, setForm] = useState<Form>({ title: 'Untitled Form', description: '', fields: [], status: 'draft' });
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedCloud, setSavedCloud] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields');
  const menuRef = useRef<HTMLDivElement>(null);

  /* ── Load ───────────────────────────────────────── */
  useEffect(() => { if (formId) loadForm(); loadFolders(); }, [formId]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Ctrl+S shortcut */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveForm(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [form]);

  const loadForm = async () => {
    try { const r = await formAPI.getForm(formId!); setForm(r.data); setSavedCloud(true); }
    catch { toast.error('Failed to load form'); }
  };
  const loadFolders = async () => {
    try { const r = await folderAPI.getFolders(); setFolders(r.data || []); }
    catch { /* silent */ }
  };

  /* ── Field ops ──────────────────────────────────── */
  const addField = (type: FormField['type']) => {
    const ft = FIELD_TYPES.find(f => f.type === type);
    const newField: FormField = {
      id: `field_${Date.now()}`, type, label: `${ft?.label}`,
      placeholder: ['text', 'email', 'phone', 'textarea'].includes(type) ? 'Your answer…' : undefined,
      required: false,
      options: ['radio', 'checkbox', 'select'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    };
    setForm(p => ({ ...p, fields: [...p.fields, newField] }));
    setSelectedField(newField.id);
    setSavedCloud(false);
  };
  const updateField = (id: string, updates: Partial<FormField>) => {
    setForm(p => ({ ...p, fields: p.fields.map(f => f.id === id ? { ...f, ...updates } : f) }));
    setSavedCloud(false);
  };
  const deleteField = (id: string) => { setForm(p => ({ ...p, fields: p.fields.filter(f => f.id !== id) })); setSelectedField(null); setSavedCloud(false); };
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(form.fields);
    const [r] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, r);
    setForm(p => ({ ...p, fields: items }));
    setSavedCloud(false);
  };

  /* ── Save ───────────────────────────────────────── */
  const saveForm = async (targetFolderId?: string | null) => {
    if (!form.title.trim()) { toast.error('Please enter a form title'); return; }
    setSaving(true);
    try {
      const payload = targetFolderId !== undefined ? { ...form, folderId: targetFolderId ?? undefined } : form;
      if (form._id) {
        const r = await formAPI.updateForm(form._id, payload);
        setForm(r.data);
      } else {
        const r = await formAPI.createForm(payload);
        setForm(r.data);
      }
      setSavedCloud(true);
      toast.success('Saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const publishForm = async () => {
    if (!form._id) { toast.error('Save the form first'); return; }
    if (form.fields.length === 0) { toast.error('Add at least one field'); return; }
    setPublishing(true);
    try { const r = await formAPI.publishForm(form._id); setForm(r.data); toast.success('Published!'); }
    catch { toast.error('Failed to publish'); }
    finally { setPublishing(false); }
  };

  const copyShareLink = () => {
    if (form.shareUrl) { navigator.clipboard.writeText(`${window.location.origin}/form/${form.shareUrl}`); toast.success('Link copied!'); }
  };

  /* ── Groups for sidebar ─────────────────────────── */
  const groups = ['Basic', 'Choice', 'Other'] as const;

  /* ── Field preview renderer ─────────────────────── */
  const renderFieldPreview = (field: FormField) => {
    const base = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 transition-all";
    switch (field.type) {
      case 'text': case 'email': case 'phone':
        return <input type={field.type} placeholder={field.placeholder} className={base} disabled={!previewMode} />;
      case 'textarea':
        return <textarea placeholder={field.placeholder} rows={3} className={base + ' resize-none'} disabled={!previewMode} />;
      case 'select':
        return <select className={base} disabled={!previewMode}><option value="">Choose…</option>{field.options?.map((o, i) => <option key={i}>{o}</option>)}</select>;
      case 'radio':
        return <div className="space-y-2">{field.options?.map((o, i) => <label key={i} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"><input type="radio" name={field.id} disabled={!previewMode} className="accent-indigo-600" />{o}</label>)}</div>;
      case 'checkbox':
        return <div className="space-y-2">{field.options?.map((o, i) => <label key={i} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"><input type="checkbox" disabled={!previewMode} className="accent-indigo-600 rounded" />{o}</label>)}</div>;
      case 'date':
        return <input type="date" className={base} disabled={!previewMode} />;
      case 'file':
        return <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50"><Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" /><p className="text-[12px] text-slate-400">Click to upload or drag & drop</p></div>;
      case 'rating':
        return <div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-6 h-6 text-slate-200 hover:text-amber-400 cursor-pointer transition-colors" />)}</div>;
      default: return null;
    }
  };

  /* ── PREVIEW MODE ───────────────────────────────── */
  if (previewMode) {
    return (
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        {/* Preview bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Preview</span>
          <button onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all">
            <ArrowLeft size={14} /> Back to Editor
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-slate-200 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="p-8">
              <h1 className="text-2xl font-black text-slate-900 mb-1">{form.title}</h1>
              {form.description && <p className="text-sm text-slate-400 mb-6">{form.description}</p>}
              <form className="space-y-6">
                {form.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                      {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    {renderFieldPreview(field)}
                  </div>
                ))}
                <button type="button" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 text-sm">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── EDITOR ─────────────────────────────────────── */
  const currentFolder = folders.find(f => f._id === form.folderId);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC', fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* ══════════════ GOOGLE DOCS-STYLE HEADER ══════════════ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

        {/* ── Row 1: Icon + Title + cloud indicator + right buttons ── */}
        <div className="flex items-center gap-3 px-4 pt-2.5 pb-1.5">
          {/* File icon */}
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
            <FileText size={17} className="text-white" />
          </div>

          {/* Title + folder path */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={form.title}
                onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setSavedCloud(false); }}
                className="text-[15px] font-bold text-slate-900 bg-transparent border-none outline-none focus:bg-slate-100 rounded-md px-1.5 py-0.5 transition-colors min-w-0 max-w-xs sm:max-w-sm"
                placeholder="Untitled Form"
              />
              {/* Cloud save indicator */}
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
                  <Folder size={10} />
                  <span className="font-semibold">{currentFolder.name}</span>
                </div>
              )}
              {/* Status */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${form.status === 'published' ? 'bg-emerald-50 text-emerald-700' : form.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}>{form.status}</span>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setPreviewMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Eye size={13} /><span className="hidden sm:inline">Preview</span>
            </button>
            <button onClick={() => saveForm()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
              <Save size={13} /><span className="hidden sm:inline">Save</span>
            </button>
            <button onClick={publishForm}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 transition-all active:scale-[0.97]">
              <Send size={13} /><span className="hidden sm:inline">{publishing ? 'Publishing…' : form.status === 'published' ? 'Published ✓' : 'Publish'}</span>
            </button>
            {form.status === 'published' && form.shareUrl && (
              <button onClick={copyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-violet-600 border border-violet-200 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                <Share2 size={13} /><span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Row 2: Google Docs-style menu bar ── */}
        <div ref={menuRef} className="flex items-center gap-0.5 px-4 pb-1.5">

          {/* File menu */}
          <div className="relative">
            <button onClick={() => setOpenMenu(p => p === 'file' ? null : 'file')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-lg transition-colors ${openMenu === 'file' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              File
            </button>
            {openMenu === 'file' && (
              <div className="absolute left-0 top-full mt-0.5 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                <MenuItem icon={Save} label="Save" shortcut="⌘S" onClick={() => { saveForm(); setOpenMenu(null); }} />
                <MenuItem icon={FolderOpen} label="Save As…" shortcut="" onClick={() => { setShowSaveAs(true); setOpenMenu(null); }} />
                <div className="h-px bg-slate-100 my-1" />
                <MenuItem icon={Eye} label="Preview" onClick={() => { setPreviewMode(true); setOpenMenu(null); }} />
                {onViewResponses && form._id && (
                  <MenuItem icon={BarChart3} label="View Responses" onClick={() => { onViewResponses(form._id!); setOpenMenu(null); }} />
                )}
                <div className="h-px bg-slate-100 my-1" />
                <MenuItem icon={ArrowLeft} label="Back to Dashboard" onClick={() => { onBack(); setOpenMenu(null); }} />
              </div>
            )}
          </div>

          {/* Insert menu */}
          <div className="relative">
            <button onClick={() => setOpenMenu(p => p === 'insert' ? null : 'insert')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-lg transition-colors ${openMenu === 'insert' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              Insert
            </button>
            {openMenu === 'insert' && (
              <div className="absolute left-0 top-full mt-0.5 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                {FIELD_TYPES.map(ft => (
                  <MenuItem key={ft.type} icon={ft.icon as any} label={ft.label} onClick={() => { addField(ft.type); setOpenMenu(null); }} />
                ))}
              </div>
            )}
          </div>

          {/* View menu */}
          <div className="relative">
            <button onClick={() => setOpenMenu(p => p === 'view' ? null : 'view')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-lg transition-colors ${openMenu === 'view' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              View
            </button>
            {openMenu === 'view' && (
              <div className="absolute left-0 top-full mt-0.5 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                <MenuItem icon={Eye} label="Preview Form" onClick={() => { setPreviewMode(true); setOpenMenu(null); }} />
                {form.status === 'published' && form.shareUrl && (
                  <MenuItem icon={Share2} label="Open Live Form" onClick={() => { window.open(`/form/${form.shareUrl}`, '_blank'); setOpenMenu(null); }} />
                )}
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="ml-auto">
            <button onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={12} /> Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT SIDEBAR ─────────────────────────── */}
        <aside className="w-56 bg-white border-r border-slate-200 flex flex-col overflow-y-auto flex-shrink-0 hidden md:flex">

          {/* Quick Start */}
          <div className="px-4 pt-5 pb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Start</p>
            <div className="space-y-1">
              <SidebarQSBtn icon={Sparkles} label="AI Form Builder" color="#6366f1" />
              <SidebarQSBtn icon={BookOpen} label="Use Template" color="#3b82f6" />
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-4" />

          {/* Field groups */}
          <div className="px-4 pt-4 pb-5 flex-1">
            {groups.map(group => (
              <div key={group} className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{group}</p>
                <div className="space-y-0.5">
                  {FIELD_TYPES.filter(f => f.group === group).map(ft => {
                    const Icon = ft.icon as React.FC<any>;
                    return (
                      <button key={ft.type} onClick={() => addField(ft.type as FormField['type'])}
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

        {/* ── CANVAS ───────────────────────────────── */}
        <main className="flex-1 overflow-y-auto" onClick={() => setSelectedField(null)}>
          <div className="max-w-2xl mx-auto px-4 py-8">

            {/* Form card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-slate-200 overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              <div className="p-8">
                {/* Title area */}
                <div className="mb-8">
                  <input type="text" value={form.title} onClick={e => e.stopPropagation()}
                    onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setSavedCloud(false); }}
                    className="text-2xl font-black text-slate-900 bg-transparent border-none outline-none focus:bg-slate-50 rounded-lg px-2 py-1 w-full transition-colors"
                    placeholder="Form Title" />
                  <textarea value={form.description} onClick={e => e.stopPropagation()}
                    onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setSavedCloud(false); }}
                    className="text-[14px] text-slate-400 bg-transparent border-none outline-none focus:bg-slate-50 rounded-lg px-2 py-1 w-full resize-none mt-1 transition-colors"
                    placeholder="Add a description…" rows={2} />
                </div>

                {/* Fields */}
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
                                onClick={e => { e.stopPropagation(); setSelectedField(field.id); }}>

                                {/* Drag handle */}
                                <div {...provided.dragHandleProps}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                  <GripVertical size={14} className="text-slate-300" />
                                </div>

                                {/* Delete */}
                                <button onClick={e => { e.stopPropagation(); deleteField(field.id); }}
                                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500">
                                  <Trash2 size={13} />
                                </button>

                                <div className="px-10 py-5">
                                  {/* Inline label edit */}
                                  {selectedField === field.id ? (
                                    <input type="text" value={field.label}
                                      onChange={e => updateField(field.id, { label: e.target.value })}
                                      className="text-[13px] font-semibold text-slate-700 bg-transparent border-none outline-none border-b border-dashed border-slate-300 w-full mb-3 px-0 pb-1"
                                      onClick={e => e.stopPropagation()} />
                                  ) : (
                                    <p className="text-[13px] font-semibold text-slate-700 mb-3">
                                      {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                                    </p>
                                  )}
                                  {renderFieldPreview(field)}

                                  {/* Field settings panel (inline, only when selected) */}
                                  {selectedField === field.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3" onClick={e => e.stopPropagation()}>
                                      {['text', 'email', 'phone', 'textarea'].includes(field.type) && (
                                        <div>
                                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Placeholder</label>
                                          <input type="text" value={field.placeholder || ''}
                                            onChange={e => updateField(field.id, { placeholder: e.target.value })}
                                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
                                        </div>
                                      )}
                                      {['radio', 'checkbox', 'select'].includes(field.type) && (
                                        <div>
                                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">Options</label>
                                          <div className="space-y-2">
                                            {field.options?.map((opt, i) => (
                                              <div key={i} className="flex items-center gap-2">
                                                <input type="text" value={opt}
                                                  onChange={e => { const o = [...(field.options || [])]; o[i] = e.target.value; updateField(field.id, { options: o }); }}
                                                  className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
                                                <button onClick={() => { const o = field.options?.filter((_, j) => j !== i); updateField(field.id, { options: o }); }}
                                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"><X size={12} /></button>
                                              </div>
                                            ))}
                                            <button onClick={() => { const o = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]; updateField(field.id, { options: o }); }}
                                              className="flex items-center gap-1.5 text-[12px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                                              <Plus size={12} /> Add option
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })}
                                          className="w-4 h-4 rounded accent-indigo-600" />
                                        <span className="text-[13px] text-slate-600 font-medium">Required field</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Empty state */}
                        {form.fields.length === 0 && (
                          <div className="text-center py-16">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                              <FileText className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-[14px] font-semibold text-slate-500 mb-1">No fields yet</p>
                            <p className="text-[12px] text-slate-400">Add fields from the sidebar or Insert menu</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Add field button */}
                {form.fields.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); addField('text'); }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[13px] text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
                    <Plus size={14} /> Add a field
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ══ SAVE-AS MODAL ══ */}
      {showSaveAs && (
        <SaveAsModal
          folders={folders}
          currentFolderId={form.folderId}
          onSave={(fid) => saveForm(fid)}
          onClose={() => setShowSaveAs(false)}
        />
      )}
    </div>
  );
};

/* ── Tiny helpers ──────────────────────────────────── */
const MenuItem: React.FC<{ icon: React.FC<any>; label: string; shortcut?: string; onClick: () => void }> = ({ icon: Icon, label, shortcut, onClick }) => (
  <button onClick={onClick}
    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
    <Icon size={13} className="text-slate-400 flex-shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && <span className="text-[11px] text-slate-300">{shortcut}</span>}
  </button>
);

const SidebarQSBtn: React.FC<{ icon: React.FC<any>; label: string; color: string }> = ({ icon: Icon, label, color }) => (
  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group text-left">
    <Icon size={14} style={{ color }} className="flex-shrink-0" />
    <span className="text-[13px] text-slate-500 group-hover:text-slate-800">{label}</span>
  </button>
);

export default FormBuilder;