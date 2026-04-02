import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, BarChart3, ExternalLink, FileText, Folder, FolderOpen,
  FolderPlus, Settings, LogOut, MoreVertical, User,
  CheckCircle2, AlertCircle, Edit, Trash2, Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FolderModal from './FolderModal';
import toast from 'react-hot-toast';
import { formAPI, folderAPI } from '../../services/api';
import form3d from '../../asset/form.png';
import ai3d from '../../asset/ai.png';
import temp3d from '../../asset/temp.png';
import AIFormBuilder from './AIFormBuilder';
import TemplateLibrary from './TemplateLibrary';
import FolderContentsModal from './FolderContentsModal';
import MyResponsesModal from './MyResponsesModal';

/* ── Types ─────────────────────────────────────────── */
interface FormItem {
  _id: string;
  title: string;
  description: string;
  responses: number;
  views: number;
  createdAt: string;
  updatedAt?: string;
  status: 'published' | 'draft' | 'closed';
  shareUrl?: string;
  folderId?: string;
}
interface FolderItem {
  _id: string;
  name: string;
  description: string;
  color: string;
  formCount: number;
  createdAt: string;
}
interface FormDashboardProps {
  onCreateForm: () => void;
  onEditForm: (id: string) => void;
  onViewResponses: (id: string) => void;
}

type FilterTab = 'all' | 'published' | 'draft';

/* ── Helpers ───────────────────────────────────────── */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

/* ── Tiny reusable bits ────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-[11px] font-bold text-slate-400 uppercase tracking-widest ${className}`}>{children}</h2>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const pub = status === 'published';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${pub ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {pub ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
      {status}
    </span>
  );
};

/* ── Context menu item ─────────────────────────────── */
const CtxBtn: React.FC<{ icon: React.FC<any>; label: string; onClick: () => void; danger?: boolean }> = ({ icon: Icon, label, onClick, danger }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}>
    <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
    <span>{label}</span>
  </button>
);

/* ══════════════════════════════════════════════════╗
   MAIN COMPONENT
╚══════════════════════════════════════════════════ */
const FormDashboard: React.FC<FormDashboardProps> = ({ onCreateForm, onEditForm, onViewResponses }) => {
  const navigate = useNavigate();
  const { user, logout, getInitials } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [forms, setForms] = useState<FormItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [openFolderModal, setOpenFolderModal] = useState<FolderItem | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draggedForm, setDraggedForm] = useState<FormItem | null>(null);
  const [showMyResponses, setShowMyResponses] = useState(false);

  /* ── Data loading ──────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [formsRes, foldersRes] = await Promise.all([formAPI.getForms(), folderAPI.getFolders()]);
      setForms(formsRes.data || []);
      setFolders(foldersRes.data || []);
    } catch {
      toast.error('Failed to load data');
      setForms([]); setFolders([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const h = () => { setActiveDropdown(null); setShowProfileDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── API helpers ───────────────────────────────── */
  const createFolder = async (data: any) => {
    try { const r = await folderAPI.createFolder(data); setFolders(p => [r.data, ...p]); toast.success('Folder created'); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const updateFolder = async (data: any) => {
    if (!selectedFolder) return;
    try { const r = await folderAPI.updateFolder(selectedFolder._id, data); setFolders(p => p.map(f => f._id === selectedFolder._id ? r.data : f)); toast.success('Updated'); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const deleteFolder = async (id: string) => {
    if (!confirm('Delete this folder?')) return;
    try { await folderAPI.deleteFolder(id); setFolders(p => p.filter(f => f._id !== id)); toast.success('Deleted'); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const deleteForm = async (id: string) => {
    if (!confirm('Delete this form?')) return;
    try { await formAPI.deleteForm(id); setForms(p => p.filter(f => f._id !== id)); toast.success('Deleted'); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const copyShareLink = (url: string) => { navigator.clipboard.writeText(`${window.location.origin}/form/${url}`); toast.success('Copied!'); };
  const createFormFromData = async (fd: any) => {
    try { const r = await formAPI.createForm(fd); setForms(p => [r.data, ...p]); onEditForm(r.data._id); toast.success('Form created!'); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const handleAIFormGenerated = (f: any) => {
    createFormFromData({ ...f, fields: f.fields.map((field: any, i: number) => ({ ...field, id: `field_${Date.now()}_${i}` })) });
    setShowAIBuilder(false);
  };
  const handleTemplateSelected = (t: any) => { createFormFromData(t); setShowTemplates(false); };
  const handleDrop = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (!draggedForm) return;
    try {
      await folderAPI.moveForms(folderId, [draggedForm._id]);
      setForms(p => p.map(f => f._id === draggedForm._id ? { ...f, folderId } : f));
      setFolders(p => p.map(f => f._id === folderId ? { ...f, formCount: f.formCount + 1 } : f));
      toast.success('Moved!');
    } catch { toast.error('Failed'); }
    setDraggedForm(null);
  };
  const toggleDropdown = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setActiveDropdown(p => p === id ? null : id); };

  /* ── Derived ───────────────────────────────────── */
  const standalone = useMemo(() => forms.filter(f => !f.folderId), [forms]);
  const filteredForms = useMemo(() => standalone.filter(f => {
    const q = searchTerm.toLowerCase();
    return (f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) &&
      (filterTab === 'all' || f.status === filterTab);
  }), [standalone, searchTerm, filterTab]);
  const filteredFolders = useMemo(() => folders.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [folders, searchTerm]);
  const getFormsInFolder = useCallback((id: string) => forms.filter(f => f.folderId === id), [forms]);
  const isEmpty = filteredFolders.length === 0 && filteredForms.length === 0;

  /* ── Context menu renderer ─────────────────────── */
  const renderContextMenu = (item: FormItem | FolderItem, type: 'form' | 'folder') => {
    if (activeDropdown !== item._id) return null;
    const isFolder = type === 'folder';
    return (
      <div className="absolute right-0 top-8 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        {isFolder ? <>
          <CtxBtn icon={FolderOpen} label="Open" onClick={() => { setOpenFolderModal(item as FolderItem); setActiveDropdown(null); }} />
          <CtxBtn icon={Edit} label="Edit Folder" onClick={() => { setSelectedFolder(item as FolderItem); setShowFolderModal(true); setActiveDropdown(null); }} />
          <div className="border-t border-slate-100 my-1" />
          <CtxBtn icon={Trash2} label="Delete" danger onClick={() => { deleteFolder(item._id); setActiveDropdown(null); }} />
        </> : <>
          <CtxBtn icon={Edit} label="Edit Form" onClick={() => { onEditForm(item._id); setActiveDropdown(null); }} />
          <CtxBtn icon={BarChart3} label="Responses" onClick={() => { onViewResponses(item._id); setActiveDropdown(null); }} />
          {(item as FormItem).shareUrl && <>
            <CtxBtn icon={Copy} label="Copy Link" onClick={() => { copyShareLink((item as FormItem).shareUrl!); setActiveDropdown(null); }} />
            <CtxBtn icon={ExternalLink} label="Open Form" onClick={() => { window.open(`/form/${(item as FormItem).shareUrl}`, '_blank'); setActiveDropdown(null); }} />
          </>}
          <div className="border-t border-slate-100 my-1" />
          <CtxBtn icon={Trash2} label="Delete" danger onClick={() => { deleteForm(item._id); setActiveDropdown(null); }} />
        </>}
      </div>
    );
  };

  /* ── Loading state ─────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }} onClick={() => setActiveDropdown(null)}>

      {/* ══ HEADER ════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 sm:px-8 py-4 flex items-center gap-3 sm:gap-4">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Welcome back, <span className="text-slate-600 font-semibold">{firstName}</span> 👋
            </p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onCreateForm}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-px active:scale-[0.97] transition-all duration-150">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Form</span>
            </button>
            <div className="relative" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowProfileDropdown(p => !p)}
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-200 hover:ring-indigo-400 transition-all">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">{getInitials()}</div>}
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-[13px] font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <CtxBtn icon={Settings} label="Settings" onClick={() => { }} />
                    <div className="border-t border-slate-100 my-1" />
                    <CtxBtn icon={LogOut} label="Sign Out" danger onClick={logout} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-400" />
          </div>
        </div>
      </header>

      {/* ══ BODY ══════════════════════════════════ */}
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-screen-xl mx-auto space-y-8">

        {/* ── Create New ──────────────────────────── */}
        <section>
          <SectionLabel className="mb-3">Create New</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: <img src={ai3d} alt="" className="w-8 h-8 object-contain" />, title: 'AI Builder', desc: 'Describe it, AI builds it', badge: 'Fastest', onClick: () => setShowAIBuilder(true), accent: 'hover:border-indigo-300' },
              { icon: <img src={temp3d} alt="" className="w-8 h-8 object-contain" />, title: 'Templates', desc: 'Pre-built, ready to go', onClick: () => setShowTemplates(true), accent: 'hover:border-emerald-300' },
              { icon: <img src={form3d} alt="" className="w-8 h-8 object-contain" />, title: 'Blank Form', desc: 'Start from scratch', onClick: onCreateForm, accent: 'hover:border-slate-300' },
            ].map(a => (
              <button key={a.title} onClick={a.onClick}
                className={`group bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-200 ${a.accent}`}>
                <div className="flex-shrink-0">{a.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] sm:text-[15px] font-semibold text-slate-800 truncate">{a.title}</span>
                    {a.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wide hidden sm:inline">{a.badge}</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block truncate">{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Toolbar ─────────────────────────────── */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <SectionLabel className="mb-0">My Files</SectionLabel>
              {/* Filter tabs */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                {(['all', 'published', 'draft'] as FilterTab[]).map(t => (
                  <button key={t} onClick={() => setFilterTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all duration-150 ${filterTab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}>
                    {t === 'draft' ? 'Drafts' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectedFolder(null); setShowFolderModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 shadow-sm transition-colors">
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
              <button onClick={() => setShowMyResponses(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 shadow-sm transition-colors">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Responses</span>
              </button>
            </div>
          </div>

          {/* ── FILE TABLE ──────────────────────────── */}
          {isEmpty ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
                <FileText className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-2">
                {forms.length === 0 ? "You haven't created any forms yet" : 'No items match your filters'}
              </h3>
              <p className="text-[13px] text-slate-400 max-w-xs mb-6">
                {forms.length === 0 ? 'Create your first form — blank, AI-generated, or from a template.' : 'Try a different filter.'}
              </p>
              {forms.length === 0 && (
                <button onClick={onCreateForm}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-700 shadow-sm active:scale-[0.98] transition-all">
                  <Plus className="w-4 h-4" /> Create Your First Form
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
                {['Name', 'File Item', 'Last Modified', 'Status', ''].map((h, i) => (
                  <div key={i} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</div>
                ))}
              </div>

              <div className="divide-y divide-slate-100">

                {/* ── Folders ──────────────────────── */}
                {filteredFolders.map(folder => (
                  <div key={folder._id}
                    className="group flex sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_40px] gap-2 sm:gap-4 px-4 sm:px-6 py-3.5 items-center hover:bg-slate-50/70 cursor-pointer transition-colors"
                    onClick={() => setOpenFolderModal(folder)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, folder._id)}>

                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: folder.color + '22' }}>
                        <Folder className="w-4 h-4" style={{ color: folder.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-slate-900 truncate">{folder.name}</p>
                        {folder.description && <p className="text-[11px] text-slate-400 truncate hidden sm:block">{folder.description}</p>}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="hidden sm:block">
                      <span className="text-[13px] text-slate-500">{folder.formCount} item{folder.formCount !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Last Modified */}
                    <div className="hidden sm:block">
                      <span className="text-[13px] text-slate-400">{formatDate(folder.createdAt)}</span>
                    </div>

                    {/* Status (folders don't have one) */}
                    <div className="hidden sm:block">
                      <span className="text-[13px] text-slate-300">—</span>
                    </div>

                    {/* Menu */}
                    <div className="relative ml-auto sm:ml-0 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={e => toggleDropdown(folder._id, e)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 transition-all">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {renderContextMenu(folder, 'folder')}
                    </div>
                  </div>
                ))}

                {/* ── Forms ────────────────────────── */}
                {filteredForms.map(form => {
                  const pub = form.status === 'published';
                  return (
                    <div key={form._id}
                      draggable
                      onDragStart={e => { setDraggedForm(form); e.dataTransfer.effectAllowed = 'move'; }}
                      className="group flex sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_40px] gap-2 sm:gap-4 px-4 sm:px-6 py-3.5 items-center hover:bg-slate-50/70 cursor-pointer transition-colors"
                      onClick={() => onEditForm(form._id)}>

                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pub ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                          <FileText className={`w-4 h-4 ${pub ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-slate-900 truncate">{form.title}</p>
                          {form.description && <p className="text-[11px] text-slate-400 truncate hidden sm:block">{form.description}</p>}
                        </div>
                      </div>

                      {/* File Item (responses) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewResponses(form._id); }}
                        className="hidden sm:flex items-center gap-1 hover:text-indigo-600 transition-colors group/resp cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-slate-300 group-hover/resp:text-indigo-500" />
                        <span className="text-[13px] text-slate-500 group-hover/resp:text-indigo-600">{form.responses || 0} response{(form.responses || 0) !== 1 ? 's' : ''}</span>
                      </button>

                      {/* Last Modified */}
                      <div className="hidden sm:block">
                        <span className="text-[13px] text-slate-400">{timeAgo(form.updatedAt || form.createdAt)}</span>
                      </div>

                      {/* Status */}
                      <div className="hidden sm:block">
                        <StatusBadge status={form.status} />
                      </div>

                      {/* Mobile: status badge */}
                      <div className="sm:hidden flex-shrink-0">
                        <StatusBadge status={form.status} />
                      </div>

                      {/* Menu */}
                      <div className="relative ml-auto sm:ml-0 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={e => toggleDropdown(form._id, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 transition-all">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {renderContextMenu(form, 'form')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ══ MODALS ════════════════════════════════ */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => { setShowFolderModal(false); setSelectedFolder(null); }}
        onSubmit={selectedFolder ? updateFolder : createFolder}
        title={selectedFolder ? 'Edit Folder' : 'Create New Folder'}
        initialData={selectedFolder ? { name: selectedFolder.name, description: selectedFolder.description, color: selectedFolder.color } : undefined}
      />
      {openFolderModal && (
        <FolderContentsModal
          folder={openFolderModal}
          forms={getFormsInFolder(openFolderModal._id)}
          onClose={() => setOpenFolderModal(null)}
          onCreateForm={onCreateForm}
          onEditForm={onEditForm}
          onViewResponses={onViewResponses}
          onDeleteForm={deleteForm}
          onCopyShareLink={copyShareLink}
        />
      )}
      {showAIBuilder && <AIFormBuilder onFormGenerated={handleAIFormGenerated} onClose={() => setShowAIBuilder(false)} />}
      {showTemplates && <TemplateLibrary onSelectTemplate={handleTemplateSelected} onClose={() => setShowTemplates(false)} />}
      {showMyResponses && <MyResponsesModal onClose={() => setShowMyResponses(false)} />}
    </div>
  );
};

export default FormDashboard;
