import React from 'react';
import { Clock, Eye, Users, Calendar, Palette } from 'lucide-react';

interface FormHeaderProps {
  form: {
    title: string;
    description: string;
    headerImage?: string;
    views?: number;
    responses?: number;
    createdAt?: string;
    estimatedTime?: number;
    status?: string;
  };
  showStats?: boolean;
}

const FormHeader: React.FC<FormHeaderProps> = ({ form, showStats = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-[#F0F4F8] pt-4 sm:pt-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-t-[24px] shadow-sm border-x border-t border-slate-100 overflow-hidden">
          {form.headerImage && (
            <div className="w-full aspect-[4.5/1] max-h-[320px] overflow-hidden relative">
              <img 
                src={form.headerImage} 
                alt="Form Header" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          )}
          <div className="px-4 sm:px-12 pt-6 sm:pt-10 pb-6 sm:pb-8">
            {/* Status & Timing */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
              {form.status && (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.1em] border-2 ${getStatusColor(form.status)} shadow-sm`}>
                    {form.status}
                  </span>
                  {form.estimatedTime && (
                    <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">{form.estimatedTime} min read</span>
                    </div>
                  )}
                </div>
              )}
              
              {showStats && (
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  {form.views !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{form.views.toLocaleString()}</span>
                    </div>
                  )}
                  {form.responses !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{form.responses.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div className="mb-10">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 sm:mb-6 tracking-tight leading-[1.1]">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl font-medium">
                  {form.description}
                </p>
              )}
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-slate-100">
              {form.createdAt && (
                <div className="flex items-center space-x-2.5 text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider">Posted on</span>
                    <span className="text-xs font-bold text-slate-600">{formatDate(form.createdAt)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                 <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                   Accepting Responses
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormHeader;