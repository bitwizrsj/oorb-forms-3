import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Book, Zap, Shield, Cpu, Code } from "lucide-react";

export default function DocumentationPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: <Book className="w-6 h-6 text-indigo-400" />,
      content: "Learn how to set up your Oorb Forms account and create your first AI-powered form in minutes. Discover our intuitive dashboard and primary navigation tools."
    },
    {
      title: "AI Form Builder",
      icon: <Zap className="w-6 h-6 text-indigo-400" />,
      content: "Harness the power of natural language. Describe your form requirements to our AI, and watch it generate complex multi-step forms with intelligent validation automatically."
    },
    {
      title: "Logic & Branching",
      icon: <Cpu className="w-6 h-6 text-indigo-400" />,
      content: "Create dynamic user journeys with our visual logic engine. Set up conditional branching, skip logic, and custom redirects without writing a single line of code."
    },
    {
      title: "Developer API",
      icon: <Code className="w-6 h-6 text-indigo-400" />,
      content: "Integrate Oorb Forms with your existing stack. Our robust REST API and Webhook system allow you to sync data to your database, CRM, or custom endpoints in real-time."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <div className="text-xl font-semibold">Oorb Docs</div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Documentation</h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
              Everything you need to know about building, scaling, and automating your data collection with Oorb Forms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl border border-gray-800 bg-gray-900/20 hover:border-gray-700 transition-all group"
              >
                <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 w-fit group-hover:scale-110 transition-transform">
                  {section.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {section.content}
                </p>
                <button className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2 group/btn">
                  Read more 
                  <ArrowLeft className="w-3 h-3 rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-20 p-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Need help?</h2>
              <p className="text-gray-400 mb-6 max-w-xl">
                Can't find what you're looking for? Our support team is here to help you with any technical questions or integration issues.
              </p>
              <button className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">© 2026 Oorb Forms. Documentation Version 3.0</p>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
