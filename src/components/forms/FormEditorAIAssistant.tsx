import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles, Send, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface Message {
    id: string;
    role: 'bot' | 'user';
    content: string;
}

interface FormEditorAIAssistantProps {
    currentForm: any;
    onUpdateForm: (updatedForm: any) => void;
}

const FormEditorAIAssistant: React.FC<FormEditorAIAssistantProps> = ({ currentForm, onUpdateForm }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'bot', content: 'Hi! I can help you edit this form. Just tell me what you want to change (e.g., "Change the first question to checkboxes").' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;

        setInput('');
        if (inputRef.current) inputRef.current.style.height = 'auto';

        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, newUserMsg]);
        setIsTyping(true);

        const systemPrompt = `You are an AI assistant integrated into a form builder. Your job is to modify the existing form based on user instructions.
        
Current Form State:
\`\`\`json
${JSON.stringify(currentForm, null, 2)}
\`\`\`

Instructions:
- Analyze the user's request and update the form JSON accordingly.
- Keep all existing properties, IDs, and structure intact unless instructed to delete or modify them.
- If you need to generate a completely new field, ensure it matches this structure:
{
  "id": "field_...",
  "type": "text|email|phone|textarea|select|radio|checkbox|date|file|rating|question",
  "label": "Field Label",
  "placeholder": "...",
  "required": false,
  "options": []
}
- Always return the ENTIRE updated form object wrapped in \`\`\`json ... \`\`\` blocks. No partial updates.
- Keep your conversational response brief, e.g., "I've updated the field to a checkbox."`;

        try {
            const history = [...messages, newUserMsg].map(m => ({
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
                        ...history,
                    ],
                    temperature: 0.3,
                    max_tokens: 4000,
                }),
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content;

            if (!aiResponse) throw new Error('Empty response');

            const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
            let textContent = aiResponse;

            if (codeBlockMatch) {
                try {
                    const parsed = JSON.parse(codeBlockMatch[1]);
                    // Auto-apply to form
                    if (parsed.title !== undefined && parsed.fields !== undefined) {
                        // Keep functions intact if onUpdateForm replaces entire object
                        onUpdateForm((prev: any) => ({ ...prev, ...parsed }));
                        textContent = aiResponse.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
                        if (!textContent) textContent = "I've updated the form for you!";
                    }
                } catch (e) {
                    console.error("Failed to parse AI JSON response", e);
                }
            } else if (aiResponse.trim().startsWith('{') && aiResponse.trim().endsWith('}')) {
                try {
                    const parsed = JSON.parse(aiResponse.trim());
                    if (parsed.title !== undefined && parsed.fields !== undefined) {
                        onUpdateForm((prev: any) => ({ ...prev, ...parsed }));
                        textContent = "I've applied your requested changes.";
                    }
                } catch (e) { }
            }

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: textContent }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: "Sorry, I couldn't update the form right now. Try again!" }]);
            toast.error('AI assistant failed to connect.');
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[min(24rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col"
                        style={{ height: '500px', maxHeight: '70vh' }}
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-200" />
                                <span className="font-semibold text-sm">AI Editor Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-2 ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                    {msg.role === 'bot' && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                        </div>
                                    )}
                                    <div className={`px-3 py-2 rounded-xl text-sm ${msg.role === 'bot'
                                        ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                                        : 'bg-indigo-600 text-white rounded-tr-sm'
                                        }`}>
                                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-2 justify-start">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                    </div>
                                    <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl rounded-tl-sm flex items-center">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
                            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={isTyping}
                                    placeholder="Tell me what to change..."
                                    className="flex-1 bg-transparent resize-none text-sm outline-none max-h-24 text-slate-700 placeholder-slate-400"
                                    rows={1}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center flex-shrink-0"
                >
                    <Sparkles className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default FormEditorAIAssistant;
