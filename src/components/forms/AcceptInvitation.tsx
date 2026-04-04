import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { collabAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      handleAccept();
    }
  }, [token]);

  const handleAccept = async () => {
    try {
      setStatus('loading');
      const response = await collabAPI.acceptInvitation(token!);
      setStatus('success');
      toast.success('Invitation accepted successfully!');
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate('/oorb-forms');
      }, 2000);
    } catch (error: any) {
      console.error('Accept Invitation Error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Invalid or expired invitation token.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-10 text-center border border-slate-100">
        {status === 'loading' && (
          <div className="animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Verifying Invitation</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Please wait while we secure your access to the collaborative form...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in zoom-in fade-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Access Granted!</h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Success! You are now a collaborator. Redirecting you to your dashboard...
            </p>
            <button
              onClick={() => navigate('/oorb-forms')}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-200"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-100">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Invitation Error</h2>
            <p className="text-rose-600/70 font-medium leading-relaxed mb-8">
              {errorMessage}
            </p>
            <div className="space-y-3">
               <button
                onClick={() => navigate('/oorb-forms')}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Back to Safety
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
