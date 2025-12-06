import React, { useState, useEffect } from 'react';
import { Printer, Copy, BookOpen, Layers, Monitor, ChevronRight, LogIn, Clock } from 'lucide-react';

interface LandingPageProps {
  onNavigateLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateLogin }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800 bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-600/20">
                 <Printer className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-slate-900 block leading-none">Siddhivinayak Digital</span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-1">
                  <Clock size={10} /> {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <button
              onClick={onNavigateLogin}
              className="group inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-md hover:shadow-xl hover:shadow-primary-600/20"
            >
              <LogIn className="w-4 h-4 mr-2 group-hover:animate-pulse" />
              Staff Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative overflow-hidden pt-20 pb-32">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-40">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
            
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold mb-8 animate-fade-in">
                ✨ Premium Digital Printing Services
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-slate-900 leading-tight">
              Bring Your Ideas <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 animate-hue-rotate">To Life Digitally</span>
            </h1>
            
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed">
              We provide professional printing, xerox, binding, and design services with speed and precision.
            </p>
            
            <div className="mt-16 max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white ring-1 ring-slate-100 transform transition hover:scale-[1.01] duration-500">
                <div className="px-6 py-12 sm:p-12">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-3 mb-10">
                    Our Services
                  </h3>
                  
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 text-left">
                    <ServiceItem 
                      icon={<Printer className="w-6 h-6 text-primary-600" />}
                      title="Digital Printing"
                      desc="High-quality colour & BW printing for A4, A3, posters & brochures."
                      color="bg-primary-50"
                    />
                     <ServiceItem 
                      icon={<Copy className="w-6 h-6 text-emerald-600" />}
                      title="Xerox & Duplication"
                      desc="Fast photocopying and quick bulk duplication for documents."
                      color="bg-emerald-50"
                    />
                     <ServiceItem 
                      icon={<BookOpen className="w-6 h-6 text-amber-600" />}
                      title="Binding & Lamination"
                      desc="Spiral, comb, thermal binding and precision trimming."
                      color="bg-amber-50"
                    />
                     <ServiceItem 
                      icon={<Monitor className="w-6 h-6 text-rose-600" />}
                      title="Graphic Design"
                      desc="Creative designs for visiting cards, menus, and invitations."
                      color="bg-rose-50"
                    />
                     <ServiceItem 
                      icon={<Layers className="w-6 h-6 text-cyan-600" />}
                      title="Digitization"
                      desc="High resolution scanning services up to A3 size."
                      color="bg-cyan-50"
                    />
                     <div className="flex flex-col justify-center items-center p-6 bg-slate-900 rounded-2xl text-white text-center">
                        <h4 className="font-bold text-lg mb-2">Need a Quote?</h4>
                        <p className="text-slate-400 text-sm mb-4">Contact us for bulk orders</p>
                        <span className="font-mono bg-slate-800 px-3 py-1 rounded-lg text-sm">+91 123-456-7890</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Placeholders for client logos or trust badges */}
               <div className="h-8 font-bold text-slate-300 text-xl">Trusted by 500+ Local Businesses</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-4 opacity-50">
              <Printer className="h-5 w-5 text-slate-900" />
              <span className="font-bold text-lg tracking-tight text-slate-900">Siddhivinayak Digital</span>
            </div>
          <p className="text-center text-slate-400 text-sm">
            &copy; 2025 Siddhivinayak Digital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const ServiceItem: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string }> = ({ icon, title, desc, color }) => (
  <div className="group flex flex-col items-start p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
    <div className={`p-3.5 ${color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <h4 className="text-lg font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;