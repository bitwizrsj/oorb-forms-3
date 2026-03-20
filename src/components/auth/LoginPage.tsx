import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Eye, EyeOff, Sparkles, BarChart3,
  Share2, Layers, CheckCircle, ArrowRight, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/* ── keep scrollbar hidden ── */
const scrollbarCSS = `
  .oorb-hide-scroll::-webkit-scrollbar { display: none; }
  .oorb-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

/* ── Feature bullets ── */
const FEATURES = [
  {
    icon: Sparkles,
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.15)',
    title: 'AI-Powered Builder',
    desc: 'Describe it — AI builds the form in seconds.',
  },
  {
    icon: Layers,
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.15)',
    title: 'Ready-made Templates',
    desc: 'Pick a template and launch immediately.',
  },
  {
    icon: BarChart3,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.15)',
    title: 'Real-Time Analytics',
    desc: 'Watch responses come in live.',
  },
  {
    icon: Share2,
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.15)',
    title: 'One-Click Sharing',
    desc: 'Your shareable link is ready instantly.',
  },
];

/* ── Mock form card (mimics AIChatInterface card style) ── */
const MockCard = () => (
  <div className="rounded-2xl p-5 mb-8"
    style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      backdropFilter: 'blur(12px)',
    }}>
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg"
        style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
        <FileText size={14} className="text-white" />
      </div>
      <span className="font-bold text-sm text-white">Customer Feedback Form</span>
      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase"
        style={{ background: 'rgba(16,185,129,0.20)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.30)' }}>
        Live
      </span>
    </div>
    <div className="flex gap-6">
      {[['47', 'Responses'], ['3.2k', 'Views'], ['92%', 'Complete']].map(([v, l]) => (
        <div key={l}>
          <div className="text-xl font-black text-white leading-none">{v}</div>
          <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{l}</div>
        </div>
      ))}
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  /* inject scrollbar css once */
  useEffect(() => {
    const id = 'oorb-login-scroll-css';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = scrollbarCSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlError = params.get('error');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        window.location.assign(returnUrl);
      } else {
        window.location.assign('/ai-chat');
      }
    } else if (urlError) {
      console.error('Login error from URL:', urlError);
    }

    if (user && !urlToken) {
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        navigate(returnUrl, { replace: true });
      } else {
        navigate('/ai-chat', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
          navigate(returnUrl, { replace: true });
        } else {
          navigate('/ai-chat', { replace: true });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d14' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── LEFT PANEL — Same theme as AIChatInterface ── */}
      <div
        className="hidden lg:flex flex-col justify-between oorb-hide-scroll overflow-y-auto"
        style={{
          flex: '0 0 50%',
          background: 'linear-gradient(160deg, #0d0d14 0%, #111123 60%, #0f1629 100%)',
          padding: '48px 52px',
          position: 'relative',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Background glows — same feel as AIChatInterface */}
        <div style={{ position: 'absolute', top: -100, right: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo — matches AIChatInterface sidebar header */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">OORB Forms</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <MockCard />

          {/* AI badge — matches suggestion chip style from chat */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)' }}>
            <Zap size={10} style={{ color: '#818cf8' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#818cf8' }}>
              AI-first form builder
            </span>
          </div>

          <h1 className="font-black leading-tight mb-4"
            style={{ fontSize: 34, color: '#f1f5f9', letterSpacing: '-1px' }}>
            Build forms that<br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #818cf8, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              actually get filled.
            </span>
          </h1>

          <p className="mb-8 leading-relaxed" style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', maxWidth: 380 }}>
            Create, publish, and analyze forms in minutes. AI does the heavy lifting — you get the results.
          </p>

          {/* Feature grid — glassmorphism cards matching chat's bg-white/[0.08] style */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: f.bg }}>
                  <f.icon size={14} style={{ color: f.color }} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white mb-0.5">{f.title}</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof footer */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex">
            {['#6366f1', '#3b82f6', '#10b981', '#f59e0b'].map((c, i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: '2px solid #0d0d14', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Trusted by 2,000+ teams</div>
            <div className="flex items-center gap-1 mt-0.5">
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#fbbf24', fontSize: 11 }}>★</span>)}
              <span className="text-[10px] ml-1" style={{ color: 'rgba(255,255,255,0.40)' }}>4.9/5 rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clean white login form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-bold text-base text-slate-900">OORB Forms</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-black text-slate-900 tracking-tight mb-1.5">Welcome back</h2>
            <p className="text-sm text-slate-400">
              New here?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 no-underline">
                Create an account →
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input id="remember-me" type="checkbox" className="w-4 h-4 rounded accent-indigo-600" />
              <label htmlFor="remember-me" className="text-sm text-slate-500">Remember me for 30 days</label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in…
                </>
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>

            <div className="relative mt-2 mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = 'http://localhost:5000/api/auth/google/login';
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </form>

          {/* Trust badges */}
          <div className="flex flex-col gap-2 mt-7">
            {['Free forever — no credit card required', 'Your data is encrypted end-to-end'].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;