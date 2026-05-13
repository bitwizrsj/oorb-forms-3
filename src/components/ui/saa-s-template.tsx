import React, { useEffect, useId, useState } from "react";
import { ArrowRight, Menu, X, Zap, Shield, Cpu, Github, Twitter, Linkedin } from "lucide-react";
import dashboardImg from "@/components/landing/image.png";
import dashboardFull from "@/asset/dashboard.png";
import { Link } from "react-router-dom";
import { Sparkles } from "@/components/ui/sparkles";

// Inline Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-white text-black hover:bg-gray-100",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "hover:bg-gray-800/50 text-white",
      gradient:
        "bg-gradient-to-b from-white via-white/95 to-white/60 text-black hover:scale-105 active:scale-95",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-10 px-5 text-sm",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Navigation Component
const Navigation = React.memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: "About Us", href: "#about" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Documentation", href: "/documentation", isRoute: true },
  ];

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-white">Oorb Forms</Link>

          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link key={link.name} to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                  {link.name}
                </Link>
              ) : (
                <a key={link.name} href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                  {link.name}
                </a>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button type="button" variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button type="button" variant="default" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-white/60 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white/60 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              )
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button type="button" variant="ghost" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button type="button" variant="default" size="sm" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = "Navigation";

// Hero Component
const Hero = React.memo(() => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start px-6 py-20 md:py-24 bg-black"
      style={{
        animation: "fadeIn 0.6s ease-out",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Poppins', sans-serif;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur-sm max-w-full">
        <span className="text-xs text-center whitespace-nowrap" style={{ color: "#9ca3af" }}>
          New version of Oorb Forms is out!
        </span>
        <a
          href="#new-version"
          className="flex items-center gap-1 text-xs hover:text-white transition-all active:scale-95 whitespace-nowrap"
          style={{ color: "#9ca3af" }}
          aria-label="Read more about the new version"
        >
          Read more
          <ArrowRight size={12} />
        </a>
      </aside>

      <h1
        className="text-4xl md:text-5xl lg:text-6xl font-medium text-center max-w-3xl px-6 leading-tight mb-6"
        style={{
          background:
            "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255, 255, 255, 0.6))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.05em",
        }}
      >
        Create forms at <br />the speed of thought
      </h1>

      <p
        className="text-sm md:text-base text-center max-w-2xl px-6 mb-10"
        style={{ color: "#9ca3af" }}
      >
        The next-gen AI form builder for modern teams. <br />
        Describe your vision and watch it manifest.
      </p>

      <div className="flex items-center gap-4 relative z-10 mb-16">
        <Link to="/register">
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className="rounded-lg flex items-center justify-center px-10"
            aria-label="Get started with Oorb Forms"
          >
            Get started
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-5xl relative pb-20">
        <div
          className="absolute left-1/2 w-[90%] pointer-events-none z-0"
          style={{
            top: "-23%",
            transform: "translateX(-50%)",
          }}
          aria-hidden="true"
        >
          <img
            src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"
            alt=""
            className="w-full h-auto opacity-30 blur-3xl"
            loading="eager"
          />
        </div>

        <div className="relative z-10">
          <img
            src={dashboardImg}
            alt="Dashboard preview"
            className="w-full h-auto rounded-lg shadow-2xl border border-gray-800"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

// Advanced Trusted By Component (Sparkles)
const TrustedBy = React.memo(() => {
  const companies = [
    "Hypernex Technologies",
    "Xyphramin Technologies",
    "Zanvionics",
    "Medent Technologies",
  ];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <span className="text-white/60">Trusted by experts.</span>
            <br />
            <span>Used by the leaders.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center opacity-60">
          {companies.map((company, index) => (
            <div
              key={index}
              className="text-sm md:text-lg font-bold text-white tracking-tighter hover:opacity-100 transition-opacity cursor-default text-center"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

TrustedBy.displayName = "TrustedBy";

// Features Component
const Features = React.memo(() => {
  return (
    <section id="about" className="py-24 px-6 bg-black relative overflow-hidden border-t border-gray-800/50 mt-20">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Text */}
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Built for modern teams
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed font-normal mb-8 max-w-xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Oorb Forms is an advanced, AI-driven data collection platform meticulously engineered to
              empower modern teams with unprecedented speed and precision. By leveraging cutting-edge
              natural language processing, our system allows you to transform complex ideas into fully
              functional, high-performance forms in a matter of seconds. Beyond simple data entry, Oorb
              provides a sophisticated suite of tools for intelligent branching logic, real-time
              collaboration, and seamless enterprise integrations.
            </p>
          </div>

          {/* Right Column: Image */}
          <div className="relative group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/15 transition-colors" />

            <img
              src={dashboardFull}
              alt="Dashboard Analytics"
              className="relative z-10 w-full h-auto rounded-2xl border border-gray-800 shadow-2xl hover:border-gray-700 transition-all duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
});

Features.displayName = "Features";

// Features Grid Component
const FeaturesGrid = React.memo(() => {
  const allFeatures = [
    { title: "AI Form Builder", icon: <Zap className="w-5 h-5 text-indigo-400" /> },
    { title: "Drag & Drop Editor", icon: <Menu className="w-5 h-5 text-indigo-400" /> },
    { title: "Analytics Dashboard", icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
    { title: "Workflow Automation", icon: <ArrowRight className="w-5 h-5 text-indigo-400" /> },
    { title: "File Uploads", icon: <Shield className="w-5 h-5 text-indigo-400" /> },
    { title: "Team Collaboration", icon: <Zap className="w-5 h-5 text-indigo-400" /> },
    { title: "Custom Branding", icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
    { title: "Real-time Responses", icon: <ArrowRight className="w-5 h-5 text-indigo-400" /> },
    { title: "Spam Protection", icon: <Shield className="w-5 h-5 text-indigo-400" /> },
    { title: "Conditional Logic", icon: <Zap className="w-5 h-5 text-indigo-400" /> },
    { title: "Webhooks/API", icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
    { title: "Backend-Free Hosting", icon: <Shield className="w-5 h-5 text-indigo-400" /> }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-black border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Everything you need to grow
          </h2>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
            A powerful suite of tools designed to help you build, manage, and scale your data collection with ease.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-gray-800/50">
          {allFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`p-10 border-r border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors group cursor-default text-center
                ${(index + 1) % 2 === 0 ? "sm:border-r-0 lg:border-r" : ""}
                ${(index + 1) % 4 === 0 ? "lg:border-r-0" : ""}
              `}
            >
              <div className="mb-6 p-2 rounded-lg bg-indigo-500/10 w-fit mx-auto group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-sm md:text-md font-semibold text-white tracking-tighter group-hover:text-indigo-300 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesGrid.displayName = "FeaturesGrid";

// Problem -> Solution Component
const ProblemSolution = React.memo(() => {
  return (
    <section id="solution" className="py-24 px-6 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Problem Side */}
          <div className="p-8 md:p-12 rounded-3xl border border-gray-800 bg-gray-900/20 opacity-80">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-400 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              The Problem
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4 items-start text-gray-500">
                <span className="mt-1 text-red-500/50">✕</span>
                <p style={{ fontFamily: "'Poppins', sans-serif" }}>Legacy form builders are slow and require tedious manual configuration.</p>
              </li>
              <li className="flex gap-4 items-start text-gray-500">
                <span className="mt-1 text-red-500/50">✕</span>
                <p style={{ fontFamily: "'Poppins', sans-serif" }}>Complex branching logic becomes a nightmare to manage and test.</p>
              </li>
              <li className="flex gap-4 items-start text-gray-500">
                <span className="mt-1 text-red-500/50">✕</span>
                <p style={{ fontFamily: "'Poppins', sans-serif" }}>Static, boring designs lead to high drop-off rates and poor user engagement.</p>
              </li>
            </ul>
          </div>

          {/* Solution Side */}
          <div className="p-8 md:p-12 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110" />

            <h3 className="text-xl md:text-2xl font-semibold text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              The Solution
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4 items-start text-white">
                <Zap className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                <p style={{ fontFamily: "'Poppins', sans-serif" }}>AI-powered creation: Describe your vision and see it live in seconds.</p>
              </li>
              <li className="flex gap-4 items-start text-white">
                <Cpu className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                <p style={{ fontFamily: "'Poppins', sans-serif" }}>Intelligent logic: Natural language rules that work exactly as you expect.</p>
              </li>
              <li className="flex gap-4 items-start text-white">
                <Shield className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                <p style={{ fontFamily: "'Poppins', sans-serif" }}>Premium UX: Modern, conversational interfaces that users actually enjoy.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
});

ProblemSolution.displayName = "ProblemSolution";

// Pricing Component
const Pricing = React.memo(() => {
  const tiers = [
    {
      name: "Starter",
      price: "0",
      description: "Perfect for individuals and small projects.",
      features: ["3 Active Forms", "100 Responses / mo", "Basic AI Generation", "Community Support"],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "29",
      description: "Ideal for growing teams and professionals.",
      features: ["Unlimited Forms", "5,000 Responses / mo", "Advanced AI Logic", "Custom Branding", "Priority Support"],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "99",
      description: "Advanced features for large scale operations.",
      features: ["Unlimited Everything", "SSO & Security", "Dedicated Manager", "Custom Integration", "99.9% SLA"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Simple, transparent pricing
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Choose the plan that's right for you and start building better forms today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div 
              key={index}
              className={`p-8 rounded-3xl border transition-all duration-300 flex flex-col ${
                tier.popular 
                ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 scale-105 z-10" 
                : "border-gray-800 bg-gray-900/20 hover:border-gray-700"
              }`}
            >
              {tier.popular && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-6">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {tier.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {tier.description}
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-white">${tier.price}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex gap-3 items-center text-sm text-gray-300">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span style={{ fontFamily: "'Poppins', sans-serif" }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={tier.popular ? "default" : "secondary"} 
                className="w-full py-6 rounded-xl font-semibold"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

Pricing.displayName = "Pricing";

// Footer Component
const Footer = React.memo(() => {
  return (
    <footer className="bg-black border-t border-gray-800/50 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-6">Oorb Forms</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              The next-generation AI form builder for modern teams. Build, automate, and scale with ease.
            </p>
            <div className="flex gap-4 text-gray-500">
              <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              <Github className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link to="/ai-chat" className="hover:text-white transition-colors">AI Creator</Link></li>
              <li><Link to="/oorb-forms" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
            © 2026 Oorb Forms. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

// Main Component
export default function SaasTemplate() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navigation />
      <Hero />
      <TrustedBy />
      <Features />
      <FeaturesGrid />
      <Pricing />
      <Footer />
    </main>
  );
}