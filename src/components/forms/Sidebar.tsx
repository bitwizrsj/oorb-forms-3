import React, { useState, useEffect } from 'react';
import {
  FileText,
  LogOut,
  Plus,
  ChevronRight,
  Settings,
  ChevronLeft,
  BarChart3,
  Sparkles,
  LayoutDashboard,
  MessagesSquare
} from 'lucide-react';
import { formAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface RecentForm {
  _id: string;
  title: string;
  updatedAt: string;
  status: string;
}

interface SidebarProps {
  onCreateForm: () => void;
  onEditForm: (id: string) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onToggle?: (minimized: boolean) => void;
  disableMinimize?: boolean;
}

const NAV_ITEMS = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'responses', label: 'Responses', icon: BarChart3 },
  { view: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({
  onCreateForm,
  onEditForm,
  currentView,
  onNavigate,
  onToggle,
  disableMinimize = false,
}) => {
  const { user, logout, getInitials } = useAuth();
  const [recentForms, setRecentForms] = useState<RecentForm[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  useEffect(() => { loadRecentForms(); }, []);
  useEffect(() => { if (onToggle) onToggle(isMinimized); }, [isMinimized, onToggle]);

  const effectiveMinimized = disableMinimize ? false : isMinimized;

  const loadRecentForms = async () => {
    try {
      const r = await formAPI.getRecentForms(8);
      setRecentForms(r.data);
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  if (!user) return null;

  return (
    <aside
      className="h-screen flex flex-col transition-all duration-300 select-none"
      style={{
        width: effectiveMinimized ? 70 : 240,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
      }}
    >
      {/* Logo */}
      <div className="h-[60px] flex items-center px-4 border-b border-slate-100 flex-shrink-0">
        {effectiveMinimized ? (
          <div className="flex flex-col items-center w-full gap-1.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            {!disableMinimize && (
              <button onClick={() => setIsMinimized(false)} className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-[15px] tracking-tight text-slate-900">OORB Forms</span>
            </div>
            {!disableMinimize && (
              <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Form CTA */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onCreateForm}
          title={effectiveMinimized ? 'New Form' : undefined}
          className={`w-full flex items-center ${effectiveMinimized ? 'justify-center' : 'gap-2'} py-2 px-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.97] transition-all duration-150`}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!effectiveMinimized && 'New Form'}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-100 mb-1" />

      {/* Primary nav */}
      <nav className="px-2 space-y-0.5 flex-shrink-0">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              title={effectiveMinimized ? label : undefined}
              className={`w-full flex items-center ${effectiveMinimized ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 relative ${active
                  ? 'text-indigo-700'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              style={active ? { background: '#EEF2FF' } : {}}
            >
              {/* 3px left accent border on active */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-indigo-600 rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
              {!effectiveMinimized && label}
            </button>
          );
        })}
      </nav>

      {/* Recent Forms — only when expanded */}
      {!effectiveMinimized && (
        <div className="flex-1 overflow-y-auto px-2 py-3 mt-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setIsRecentExpanded(p => !p)}
            className="flex items-center justify-between w-full px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors rounded-lg"
          >
            Recent
            <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isRecentExpanded ? 'rotate-90' : ''}`} />
          </button>

          {isRecentExpanded && (
            <div className="space-y-0.5">
              {recentForms.length > 0 ? recentForms.map(form => (
                <button
                  key={form._id}
                  onClick={() => onEditForm(form._id)}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 transition-all group"
                >
                  <FileText className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{form.title}</span>
                </button>
              )) : (
                <p className="px-3 text-[11px] text-slate-400 italic py-1">No recent forms</p>
              )}
            </div>
          )}
        </div>
      )}

      {effectiveMinimized && <div className="flex-1" />}

      {/* User */}
      <div className="border-t border-slate-100 px-3 py-3 flex-shrink-0">
        <div className={`flex items-center ${effectiveMinimized ? 'justify-center' : 'gap-2.5'}`}>
          {user.avatar ? (
            <img src={user.avatar} className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm flex-shrink-0 object-cover" alt="" />
          ) : (
            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-[11px] ring-2 ring-white shadow-sm flex-shrink-0">
              {getInitials()}
            </div>
          )}
          {!effectiveMinimized && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;