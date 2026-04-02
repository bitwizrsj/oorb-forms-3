import React, { useState } from 'react';
import { Sparkles, Wand2, Send, Loader2, X, Bot, ArrowRight, Zap, Stars } from 'lucide-react';
import toast from 'react-hot-toast';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface AIFormBuilderProps {
  onFormGenerated: (form: any) => void;
  onClose: () => void;
}

const AIFormBuilder: React.FC<AIFormBuilderProps> = ({ onFormGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateForm = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the form you want to create');
      return;
    }

    setGenerating(true);

    try {
      const generatedForm = await generateFormWithAI(prompt);
      onFormGenerated(generatedForm);
      toast.success('AI magic complete!');
    } catch (error) {
      console.error('AI form generation error:', error);
      toast.error('Failed to generate form. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateFormWithAI = async (prompt: string) => {
    const systemPrompt = `You are a form builder AI. Generate a JSON form structure based on the user's description. 

  Return ONLY a valid JSON object with this structure:
  {
    "title": "Form Title",
    "description": "Form description",
    "fields": [
      {
        "type": "text|email|phone|textarea|select|radio|checkbox|date|file|rating",
        "label": "Field Label",
        "placeholder": "Placeholder text (optional)",
        "required": true|false,
        "options": ["option1", "option2"] // only for select, radio, checkbox
      }
    ]
  }

  Available field types: text, email, phone, textarea, select, radio, checkbox, date, file, rating
  Make the form practical and user-friendly based on the description.`;

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
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText || 'Bad Request'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const formData = JSON.parse(jsonString);

      if (!formData.title || !formData.fields || !Array.isArray(formData.fields)) {
        throw new Error('Invalid form structure from AI');
      }

      const fieldsWithIds = formData.fields.map((field: any, index: number) => ({
        ...field,
        id: field.id || `field_${Date.now()}_${index}`
      }));

      return {
        ...formData,
        fields: fieldsWithIds,
        status: 'draft'
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }
  };

  const suggestions = [
    { title: "Job Board", desc: "Recruitment form with resume upload", icon: Zap },
    { title: "Survey", desc: "Customer feedback with star ratings", icon: Stars },
    { title: "Event", desc: "Registration with dietary preferences", icon: Wand2 },
    { title: "Contact", desc: "Premium lead generation interface", icon: Bot }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-300">
        
        {/* Header - AI Magic Theme */}
        <div className="p-8 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[20px] flex items-center justify-center border border-white/30 shadow-xl">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">AI Form Builder</h2>
                <p className="text-white/80 text-[13px] font-medium">Harness AI to build high-converting forms in seconds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 text-white rounded-full transition-all group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 flex-1 overflow-y-auto space-y-8 bg-white" style={{ scrollbarWidth: 'none' }}>
          
          {/* Main Input Area */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Stars size={14} className="text-indigo-500" />
              Describe Your Vision
            </label>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a high-fidelity job application form with name, email, resume upload, and experience ratings..."
                className="w-full px-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-[15px] font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 min-h-[160px] resize-none pb-16"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                 <span className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-1">
                    <Zap size={10} /> Powered by Groq
                 </span>
                 <button
                    onClick={generateForm}
                    disabled={generating || !prompt.trim()}
                    className={`h-12 px-6 bg-indigo-600 text-white rounded-2xl text-[14px] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:translate-y-0`}
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
              </div>
            </div>
          </div>

          {/* Suggestions Grid */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Samples</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                    <button
                        key={index}
                        onClick={() => setPrompt(`Create a ${suggestion.title.toLowerCase()} form: ${suggestion.desc}`)}
                        className="flex items-center gap-4 p-4 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all group group-hover:-translate-y-0.5"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-black text-slate-900 leading-tight mb-0.5">{suggestion.title}</p>
                            <p className="text-[12px] text-slate-400 font-medium truncate">{suggestion.desc}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </button>
                );
              })}
            </div>
          </div>

          {/* Generating Overlay State (Visual Only if generating is true) */}
          {generating && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-200 animate-bounce">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-violet-500 rounded-full animate-ping" />
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-amber-400 rounded-full animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Architecting Your Form…</h3>
                <p className="text-slate-400 font-medium max-w-xs mb-8">Our AI is analyzing your description and mapping the fields for a perfect user experience.</p>
                <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-1/3 rounded-full animate-[loading_2s_infinite_ease-in-out]" />
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes loading {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(300%); }
                    }
                `}} />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
              ))}
              <span className="pl-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Join 10k+ Creators</span>
           </div>
           <button 
                onClick={onClose}
                className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
           >
             Cancel Process
           </button>
        </div>
      </div>
    </div>
  );
};

export default AIFormBuilder;