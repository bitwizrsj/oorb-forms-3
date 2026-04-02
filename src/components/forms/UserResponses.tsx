import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, ChevronRight, Search, Inbox } from 'lucide-react';
import { responseAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface UserResponse {
  _id: string;
  formId: string;
  formTitle: string;
  responses: any[];
  submittedAt: string;
  completionTime?: number;
}

const UserResponses: React.FC = () => {
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const r = await responseAPI.getMyResponses();
      // Ensure we always have an array
      setResponses(Array.isArray(r.data) ? r.data : []);
    } catch (error) {
      console.error('UserResponses: Error loading responses:', error);
      toast.error('Failed to load your responses');
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = (responses || []).filter(r => 
    (r?.formTitle || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Responses</h1>
          <p className="text-slate-500 text-sm mt-1">Forms you've submitted to in the past</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search responses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-full md:w-64 transition-all"
          />
        </div>
      </div>

      {filteredResponses.length > 0 ? (
        <div className="grid gap-4">
          {filteredResponses.map((response) => (
            <div 
              key={response._id}
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{response.formTitle}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {(() => {
                        try {
                          const d = new Date(response.submittedAt);
                          return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          });
                        } catch { return 'Invalid Date'; }
                      })()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {(() => {
                        try {
                          const d = new Date(response.submittedAt);
                          return isNaN(d.getTime()) ? '' : d.toLocaleTimeString(undefined, { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                        } catch { return ''; }
                      })()}
                    </span>
                    {response.completionTime && (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                        {Math.floor(response.completionTime / 60)}m {response.completionTime % 60}s
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] py-16 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No responses found</h3>
          <p className="text-slate-400 text-sm max-w-xs mt-1">
            {searchTerm ? "Try searching for something else." : "You haven't submitted any forms yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserResponses;
