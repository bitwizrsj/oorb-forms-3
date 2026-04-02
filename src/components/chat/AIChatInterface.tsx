import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send, Bot, User, Sparkles, Loader2, Wand2,
    X, Search, FileText, Clock, LogOut, Plus,
    ChevronRight, ChevronLeft, Settings, Home, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: 'bot' | 'user';
    content: string;
    timestamp: Date;
    pendingFormData?: any;
}

interface Suggestion {
    icon: string;
    label: string;
    prompt: string;
}

interface RecentForm {
    _id: string;
    title: string;
    updatedAt: string;
    status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SUGGESTIONS: Suggestion[] = [
    { icon: '📋', label: 'Job Application', prompt: 'Create a job application form with resume upload, skills, and experience fields' },
    { icon: '⭐', label: 'Feedback Survey', prompt: 'Build a customer feedback survey with star rating and multiple choice questions' },
    { icon: '📬', label: 'Contact Form', prompt: 'Design a contact form for lead generation with company details' },
    { icon: '🎟️', label: 'Event Registration', prompt: 'Make an event registration form with dietary preferences and t-shirt size' },
];

const scrollbarCSS = `
  .oorb-hide-scroll::-webkit-scrollbar { display: none; }
  .oorb-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ─── AI Logic ─────────────────────────────────────────────────────────────────

async function generateFormWithAI(history: { role: string, content: string }[]) {
    const systemPrompt = `You are an intelligent, conversational form builder assistant. Your goal is to help users design the perfect form.

Instead of generating a form immediately, you MUST follow this workflow:
1. UNDERSTAND CONTEXT: Ask clarifying questions about the form's purpose, target audience, and specific data needed.
2. PROPOSE STRUCTURE: Suggest a list of questions and their types (e.g., MCQ, rating scale, short/long answer, file upload) using plain text/markdown. 
3. REVISE: If the user wants to add/remove/change questions, update your proposal and ask for confirmation again.
4. FINALIZE (JSON OUTPUT): ONLY when the user explicitly confirms they are ready to create the form, output a valid JSON block containing the form structure. 
   - The JSON MUST be enclosed in \`\`\`json ... \`\`\` code blocks.
   - Do NOT output JSON before the user explicitly confirms.

The final JSON structure must look like this:
\`\`\`json
{
  "title": "Form Title",
  "description": "Form description",
  "fields": [
    {
      "type": "text|email|phone|textarea|select|radio|checkbox|date|file|rating",
      "label": "Field Label",
      "placeholder": "Placeholder text (optional)",
      "required": true,
      "options": ["option1", "option2"]
    }
  ]
}
\`\`\`

Available field types: text, email, phone, textarea, select, radio, checkbox, date, file, rating.
If the user's initial prompt is perfectly detailed, you can skip to PROPOSE STRUCTURE. Otherwise, ask first.`;

    const mappedHistory = history.map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content
    }));

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...mappedHistory,
            ],
            temperature: 0.7,
            max_tokens: 3000,
        }),
    });

    if (!response.ok) throw new Error(`API request failed: ${response.statusText || 'Bad Request'}`);

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    if (!aiResponse) throw new Error('No response from AI');

    const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    let formData = null;
    let textContent = aiResponse;

    if (codeBlockMatch) {
        try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (parsed.title && parsed.fields && Array.isArray(parsed.fields)) {
                const fieldsWithIds = parsed.fields.map((field: any, index: number) => ({
                    ...field,
                    id: field.id || `field_${Date.now()}_${index}`,
                }));
                formData = { ...parsed, fields: fieldsWithIds, status: 'draft' };
                textContent = aiResponse.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
                if (!textContent) textContent = "I've finalized your form structure! Click the button below to generate it.";
            }
        } catch (e) {
            console.log("Failed to parse JSON code block", e);
        }
    } else {
        if (aiResponse.trim().startsWith('{') && aiResponse.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(aiResponse.trim());
                if (parsed.title && parsed.fields && Array.isArray(parsed.fields)) {
                    const fieldsWithIds = parsed.fields.map((field: any, index: number) => ({
                        ...field,
                        id: field.id || `field_${Date.now()}_${index}`,
                    }));
                    formData = { ...parsed, fields: fieldsWithIds, status: 'draft' };
                    textContent = "I've finalized your form structure! Click the button below to generate it.";
                }
            } catch (e) { }
        }
    }

    return { content: textContent, formData };
}

// ─── TypingIndicator ──────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1.5 px-1">
        {[0, 1, 2].map((i) => (
            <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
            />
        ))}
    </div>
);

// ─── MessageBubble ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: Message; onCreateForm?: (formData: any) => void; isCreating?: boolean }> = ({ message, onCreateForm, isCreating }) => {
    const isBot = message.role === 'bot';
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
        >
            {isBot && (
                <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                </div>
            )}
            <div className={`flex flex-col gap-2 max-w-[75%]`}>
                {message.content && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isBot
                        ? 'bg-white/[0.08] border border-white/[0.11] text-gray-100 rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-900/40'
                        }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className={`text-[10px] mt-1.5 ${isBot ? 'text-gray-500' : 'text-indigo-300/70'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                )}

                {message.pendingFormData && onCreateForm && (
                    <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                        <div className="flex items-center gap-2 text-indigo-200">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="font-semibold text-sm">Form Draft Ready</span>
                        </div>
                        <div className="text-xs text-indigo-200/70">
                            <strong>{message.pendingFormData.title}</strong> — {message.pendingFormData.fields.length} questions
                        </div>
                        <button
                            onClick={() => onCreateForm(message.pendingFormData)}
                            disabled={isCreating}
                            className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm py-2 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create Form
                        </button>
                    </div>
                )}
            </div>
            {!isBot && (
                <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-indigo-400" />
                </div>
            )}
        </motion.div>
    );
};

// ─── DarkSidebar ──────────────────────────────────────────────────────────────

interface DarkSidebarProps {
    onCreateForm: () => void;
    onEditForm: (id: string) => void;
    isMinimized: boolean;
    onToggle: () => void;
}

const DarkSidebar: React.FC<DarkSidebarProps> = ({ onCreateForm, onEditForm, isMinimized, onToggle }) => {
    const { user, logout, getInitials } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [recentForms, setRecentForms] = useState<RecentForm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadRecentForms(); }, []);

    const loadRecentForms = async () => {
        try {
            const response = await formAPI.getRecentForms(20);
            setRecentForms(response.data);
        } catch (error) {
            console.error('Error loading recent forms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { logout(); window.location.href = '/login'; };

    const getTimeCategory = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (date.toDateString() === now.toDateString()) return 'today';
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return 'yesterday';
        if (diffDays <= 7) return 'last7days';
        if (diffDays <= 30) return 'lastMonth';
        return 'older';
    };

    const groupLabels: Record<string, string> = {
        today: 'Today', yesterday: 'Yesterday',
        last7days: 'Last 7 days', lastMonth: 'Last month', older: 'Older',
    };

    const filteredForms = recentForms.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped: Record<string, RecentForm[]> = {
        today: [], yesterday: [], last7days: [], lastMonth: [], older: [],
    };
    filteredForms.forEach(f => grouped[getTimeCategory(f.updatedAt)].push(f));

    const sidebarBase = "shrink-0 h-screen flex flex-col border-r border-white/[0.08] bg-[#0b0b17]/90 backdrop-blur-xl";

    // ── Minimized ──
    if (isMinimized) {
        return (
            <div className={sidebarBase} style={{ width: 64 }}>
                <div className="p-3 border-b border-white/[0.08] flex justify-center">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="p-3 border-b border-white/[0.08]">
                    <button onClick={onToggle} title="Expand"
                        className="w-full flex justify-center p-2 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2">
                    <button onClick={onCreateForm} title="New Form"
                        className="w-full flex justify-center p-2.5 rounded-lg hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-3 border-t border-white/[0.08] flex flex-col items-center gap-2">
                    {user?.avatar
                        ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/40" />
                        : <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-200 text-xs font-semibold">{getInitials?.()}</div>
                    }
                    <button onClick={handleLogout} title="Log out"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    // ── Full ──
    return (
        <div className={sidebarBase} style={{ width: 256 }}>
            {/* Logo */}
            <div className="px-4 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-wide text-white">OORB Forms</span>
                </div>
                <button onClick={onToggle} title="Collapse"
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* New Form */}
            <div className="px-3 pt-3 pb-2">
                <button onClick={onCreateForm}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-600/25 border border-indigo-500/35 hover:bg-indigo-600/40 hover:border-indigo-500/50 text-indigo-200 hover:text-white transition-all text-sm font-semibold">
                    <Plus className="w-4 h-4" />
                    New Form
                </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search forms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white/[0.06] border border-white/[0.09] rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.09] transition-all"
                    />
                </div>
            </div>

            {/* Recent Forms */}
            <div className="flex-1 overflow-y-auto oorb-hide-scroll px-3 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Recent</span>
                    <Clock className="w-3 h-3 text-gray-600" />
                </div>

                {loading ? (
                    <div className="space-y-2.5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse h-7 bg-white/[0.05] rounded-lg" />
                        ))}
                    </div>
                ) : filteredForms.length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([key, forms]) => {
                            if (!forms.length) return null;
                            return (
                                <div key={key}>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">
                                        {groupLabels[key]}
                                    </p>
                                    <div className="space-y-0.5">
                                        {forms.map((form) => (
                                            <button
                                                key={form._id}
                                                onClick={() => onEditForm(form._id)}
                                                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.07] text-left group transition-colors"
                                            >
                                                <span className="text-xs text-gray-300 group-hover:text-white truncate transition-colors">
                                                    {form.title}
                                                </span>
                                                <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">{searchTerm ? 'No forms found' : 'No recent forms'}</p>
                    </div>
                )}
            </div>

            {/* User */}
            <div className="px-3 py-3 border-t border-white/[0.08]">
                <div className="flex items-center gap-2.5 mb-3">
                    {user?.avatar
                        ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/40" />
                        : <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-200 text-xs font-semibold">{getInitials?.()}</div>
                    }
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.07] transition-colors">
                        <Settings className="w-3 h-3" />
                        Settings
                    </button>
                    <button onClick={handleLogout}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-3 h-3" />
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── AIChatInterface (main) ───────────────────────────────────────────────────

const AIChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            content: "Hi! I'm your AI Form Assistant. Describe any form you need — I'll build it for you instantly.",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [sidebarMinimized, setSidebarMinimized] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const id = 'oorb-scrollbar-css';
        if (!document.getElementById(id)) {
            const el = document.createElement('style');
            el.id = id;
            el.textContent = scrollbarCSS;
            document.head.appendChild(el);
        }
    }, []);

    useEffect(() => {
        const onResize = () => {
            // Close mobile sidebar when leaving mobile breakpoint
            if (window.innerWidth >= 768) setMobileSidebarOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const addMessage = (role: 'bot' | 'user', content: string) => {
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString() + Math.random(), role, content, timestamp: new Date() },
        ]);
    };

    // ── Navigate to form editor.
    // From the logs: the app successfully loads /oorb-forms/edit/:id (API call fires, returns 200),
    // but the page renders white — meaning the FormEditor component itself crashes on mount,
    // likely because it's missing some prop or context it expects from the dashboard parent.
    //
    // FIX: We navigate to /oorb-forms first (which boots the full dashboard context),
    // then immediately replace the history entry with the edit route so the editor
    // mounts inside a live dashboard context rather than cold-starting standalone.
    const navigateToForm = (formId: string) => {
        // Navigate to the main app path and pass the form ID in the router state.
        // EnhancedOorbFormsApp.tsx picks this up and opens the builder view.
        navigate('/oorb-forms', { state: { openFormId: formId } });
    };

    const [isCreatingForm, setIsCreatingForm] = useState(false);

    const handleCreateForm = async (formData: any) => {
        setIsCreatingForm(true);
        try {
            const response = await formAPI.createForm(formData);
            const createdFormId = response?.data?._id || response?.data?.id || null;
            toast.success('Form created successfully!');
            setTimeout(() => {
                if (createdFormId) {
                    navigateToForm(createdFormId);
                } else {
                    navigate('/oorb-forms');
                }
            }, 800);
        } catch (error) {
            toast.error('Failed to create the form.');
            console.error(error);
        } finally {
            setIsCreatingForm(false);
        }
    };

    const handleSend = async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || isTyping) return;

        setShowSuggestions(false);
        setInput('');
        if (inputRef.current) inputRef.current.style.height = '48px';

        const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText, timestamp: new Date() };
        setMessages((prev) => [...prev, newUserMessage]);
        setIsTyping(true);

        try {
            const historyForApi = [...messages, newUserMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const { content, formData } = await generateFormWithAI(historyForApi);

            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString() + Math.random(), role: 'bot', content, timestamp: new Date(), pendingFormData: formData }
            ]);

        } catch (error) {
            console.error(error);
            addMessage('bot', "Something went wrong while generating your form. Try rephrasing your request or check your connection.");
            toast.error('Failed to contact AI.');
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            className="h-screen flex text-white overflow-hidden"
            style={{
                background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #1e1b4b 0%, #0f0f1a 55%, #09090f 100%)',
                fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}
        >
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '45%', height: '45%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            </div>

            {/* Sidebar (desktop) */}
            <div className="relative z-20 shrink-0 hidden md:block">
                <DarkSidebar
                    onCreateForm={() => navigate('/oorb-forms')}
                    onEditForm={(id) => navigateToForm(id)}
                    isMinimized={sidebarMinimized}
                    onToggle={() => setSidebarMinimized((v) => !v)}
                />
            </div>

            {/* Sidebar (mobile drawer) */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl">
                        <DarkSidebar
                            onCreateForm={() => { setMobileSidebarOpen(false); navigate('/oorb-forms'); }}
                            onEditForm={(id) => { setMobileSidebarOpen(false); navigateToForm(id); }}
                            isMinimized={false}
                            onToggle={() => { }}
                        />
                    </div>
                </div>
            )}

            {/* Chat panel */}
            <div className="relative z-10 flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.06] backdrop-blur-xl bg-black/20 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-white/[0.07] text-gray-300 hover:text-white transition-colors"
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/40">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-sm text-white tracking-wide">AI Form Builder</span>
                    </div>
                    <button
                        onClick={() => navigate('/oorb-forms')}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.07] border border-transparent hover:border-white/[0.09]"
                    >
                        <Home className="w-3 h-3" />
                        Dashboard
                        <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                </header>

                {/* Messages */}
                <main className="flex-1 overflow-y-auto oorb-hide-scroll px-4 py-6">
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto">

                        {messages.length === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="text-center pt-8 pb-4"
                            >
                                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                                    <Wand2 className="w-7 h-7 text-indigo-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">AI Form Builder</h1>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                    Describe any form in plain language — I'll generate it and open it in the editor.
                                </p>
                            </motion.div>
                        )}

                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} onCreateForm={handleCreateForm} isCreating={isCreatingForm} />
                        ))}

                        {isTyping && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                                <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="bg-white/[0.07] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center">
                                    <TypingIndicator />
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {showSuggestions && !isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                    className="flex flex-wrap gap-2 mt-2 justify-center"
                                >
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s.label}
                                            onClick={() => handleSend(s.prompt)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-300 bg-white/[0.05] border border-white/[0.09] rounded-xl hover:bg-white/[0.09] hover:border-indigo-500/40 hover:text-white transition-all"
                                        >
                                            <span>{s.icon}</span>
                                            {s.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Input */}
                <footer className="px-4 pb-5 pt-3 border-t border-white/[0.06] backdrop-blur-xl bg-black/10 shrink-0">
                    <div className="max-w-2xl mx-auto flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your form… e.g. a registration form for a yoga event"
                                disabled={isTyping}
                                className="w-full resize-none bg-white/[0.06] border border-white/[0.09] rounded-2xl px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.09] transition-all disabled:opacity-50 leading-relaxed"
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                            {input && (
                                <button
                                    onClick={() => { setInput(''); if (inputRef.current) inputRef.current.style.height = '48px'; }}
                                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="shrink-0 w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/25 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-indigo-900/30 active:scale-95"
                        >
                            {isTyping
                                ? <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                                : <Send className="w-4 h-4 text-white" />
                            }
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-600 mt-2.5 tracking-widest uppercase max-w-2xl mx-auto">
                        Powered by OORB AI · Enter to send · Shift+Enter for new line
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default AIChatInterface;