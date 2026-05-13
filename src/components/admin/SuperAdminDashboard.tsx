import React, { useEffect, useState } from 'react';
import { 
  BarChart2, Users, FileText, Activity, 
  TrendingUp, Globe, Loader2, Key
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const SuperAdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      setData(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setData({ accessDenied: true });
      } else {
        toast.error('Failed to load global analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeGrantAdmin = async () => {
    try {
      await api.post('/admin/make-me-admin');
      toast.success('Admin privileges granted! Reloading...');
      window.location.reload();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to grant admin');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading platform data...</p>
      </div>
    );
  }

  // Fallback for Users without 'admin' role
  if (data?.accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <Key className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Platform Owner Only</h2>
        <p className="text-slate-500 leading-relaxed mb-6">
          This dashboard is highly restricted. It appears your account (<strong>{user?.email}</strong>) does not have the `admin` role.
        </p>
        <button
           onClick={executeGrantAdmin}
           className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition"
        >
           Grant Myself Admin Rights
        </button>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-amber-500" />
          Super Admin Console
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Overall health and traffic for the entire platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Platform Users</p>
              <h3 className="text-3xl font-bold text-slate-900">{data.totalUsers.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Forms Created</p>
              <h3 className="text-3xl font-bold text-slate-900">{data.totalForms.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Global Form Views</p>
              <h3 className="text-3xl font-bold text-slate-900">{data.totalViews.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Global Submissions</p>
              <h3 className="text-3xl font-bold text-slate-900">{data.totalResponses.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Platform Traffic */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            System Traffic (Form Views)
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" name="Views" dataKey="views" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            Global Reach
          </h2>
          {data.countryData && data.countryData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center -mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.countryData.slice(0, 7)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.countryData.slice(0, 7).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} views`, "Amount"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4">
                {data.countryData.slice(0, 7).map((entry: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="font-medium text-slate-700">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No geographical data yet
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};
