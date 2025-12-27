import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight, Upload, Loader2, ChevronDown, MessageSquare, Phone, Mail, Settings } from 'lucide-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { translations } from './translations';
import { Language, Article, Event, GalleryItem, ActivityLog, SiteSettings } from './types';

// --- SHARED BACKEND CONFIGURATION ---
const SUPABASE_URL = 'https://ilatpfgfihqugvxjkfot.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYXRwZmdmaWhxdWd2eGprZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTkyNzcsImV4cCI6MjA4MjM5NTI3N30.iaQuPce2CUaGFh1jzg7_HbQhtgo4-MNs4_fpdpJnuTQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STORAGE UTILITIES ---
const persistData = async (key: string, data: any) => {
  try {
    // Attempt to save to shared backend
    // NOTE: Removed explicit onConflict specification to rely on the Primary Key.
    // IMPORTANT: Ensure you have run 'ALTER TABLE an_content ADD PRIMARY KEY (key);' in Supabase SQL Editor.
    const { error } = await supabase
      .from('an_content')
      .upsert({ key, data });
    
    if (error) {
      console.error(`Supabase Error [${key}]:`, error.message);
      if (error.message.includes('on conflict')) {
        console.warn("💡 TIP: The table 'an_content' might be missing a Primary Key. Run this in Supabase SQL Editor: ALTER TABLE an_content ADD PRIMARY KEY (key);");
      }
      throw error;
    }
    
    // Also save locally as a backup/cache
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.warn(`Fallback to local storage for ${key}: ${e.message}`);
    localStorage.setItem(key, JSON.stringify(data));
  }
};

const fetchPersistedData = async (key: string) => {
  try {
    // Try shared backend first
    const { data, error } = await supabase
      .from('an_content')
      .select('data')
      .eq('key', key)
      .maybeSingle();
    
    if (data) return data.data;
    if (error) throw error;
    
    // Fallback to local
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  } catch (e: any) {
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  }
};

// --- IMAGE COMPRESSION HELPER ---
const compressImage = (file: File, maxWidth = 1600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Context for global state management
const AppContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  isAdmin: boolean;
  setIsAdmin: (b: boolean) => void;
  showLogin: boolean;
  setShowLogin: (b: boolean) => void;
  showAdmin: boolean;
  setShowAdmin: (b: boolean) => void;
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  logs: ActivityLog[];
  addLog: (action: 'create' | 'update' | 'delete', type: ActivityLog['type'], targetId: string) => void;
  isSaving: boolean;
  setIsSaving: (b: boolean) => void;
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
} | null>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- INITIAL DATA ---
const INITIAL_ARTICLES: Article[] = [];
const INITIAL_EVENTS: Event[] = [];
const INITIAL_GALLERY: GalleryItem[] = [];

const INITIAL_SETTINGS: SiteSettings = {
  heroImage: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1920',
  aboutImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200',
  memberCount: '35.000+',
  eventCount: '30+'
};

// --- COMPONENTS ---

const Navbar = () => {
  const { lang, setLang, isAdmin, setShowLogin, setShowAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];

  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleAdminAction = () => {
    if (isAdmin) {
      setShowAdmin(true);
    } else {
      setShowLogin(true);
    }
    setIsOpen(false);
  };

  const menuItems = [
    { label: t.nav.home, id: 'hero' },
    { label: t.nav.intro, id: 'about' },
    { label: t.sections.news, id: 'news' },
    { label: t.sections.events, id: 'events' },
    { label: t.sections.gallery, id: 'gallery' },
    { label: t.sections.youngtimerTitle, id: 'youngtimer' },
    { label: t.nav.contact, id: 'contact' }
  ];

  return (
    <nav className="fixed w-full z-50 glass border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div onClick={() => handleNavClick('hero')} className="flex items-center space-x-2 cursor-pointer relative z-50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-sm sm:text-base">AN</div>
            <span className="retro-font text-base sm:text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 truncate">
              80 & 90
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-4 text-xs xl:text-sm font-medium">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="hover:text-pink-500 transition-colors uppercase tracking-widest px-2 cursor-pointer">{item.label}</button>
            ))}
            <div className="flex items-center space-x-2 border-l border-slate-700 pl-4 ml-2">
              <button onClick={() => setLang('si')} className={`px-2 py-1 rounded-full text-[10px] cursor-pointer ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-full text-[10px] cursor-pointer ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
            </div>
            <button onClick={handleAdminAction} className="p-2 text-slate-400 hover:text-pink-500 cursor-pointer flex items-center gap-1">
              <User size={20} className={isAdmin ? "text-teal-400" : ""} />
              <span className="text-[10px] uppercase font-bold tracking-widest hidden xl:inline">{isAdmin ? "CMS" : "Admin"}</span>
            </button>
          </div>

          <button className="lg:hidden text-slate-100 p-2 cursor-pointer relative z-50" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden glass border-t border-purple-500/20 absolute top-20 w-full h-[calc(100vh-5rem)] overflow-y-auto z-40">
          <div className="px-4 py-8 space-y-6 flex flex-col items-center text-center text-lg uppercase tracking-widest font-bold">
             {menuItems.map(item => (
               <button key={item.id} onClick={() => handleNavClick(item.id)} className="w-full py-2 cursor-pointer">{item.label}</button>
             ))}
             <div className="flex space-x-6 pt-6">
                <button onClick={() => { setLang('si'); setIsOpen(false); }} className={`px-4 py-1 rounded-full cursor-pointer ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
                <button onClick={() => { setLang('en'); setIsOpen(false); }} className={`px-4 py-1 rounded-full cursor-pointer ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
             </div>
             <button onClick={handleAdminAction} className={`w-full py-4 mt-4 border border-white/10 rounded-xl cursor-pointer ${isAdmin ? 'text-teal-400' : 'text-slate-400'} flex items-center justify-center gap-2 uppercase text-base tracking-widest`}>
              <User size={20} />
              {isAdmin ? "Admin Panel" : t.common.login}
             </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Section = ({ id, title, children, gradient }: { id: string, title: string, children?: React.ReactNode, gradient: string }) => (
  <section id={id} className={`py-12 sm:py-20 px-4 transition-all relative ${gradient}`}>
    <div className="max-w-7xl mx-auto relative z-10">
      <h2 className="retro-font text-2xl sm:text-4xl md:text-5xl text-center mb-10 sm:mb-16 tracking-tighter uppercase font-black px-2">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-white to-teal-400 leading-tight">
          {title}
        </span>
      </h2>
      {children}
    </div>
  </section>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-teal-500/20 rounded-2xl overflow-hidden glass transition-all duration-300 hover:border-teal-400/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-6 text-left flex justify-between items-center group gap-4"
      >
        <span className="text-base sm:text-xl font-bold tracking-tight text-slate-100 group-hover:text-teal-400 transition-colors uppercase">
          {question}
        </span>
        <ChevronDown 
          className={`text-pink-500 shrink-0 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} 
          size={24} 
        />
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-5 sm:p-6 pt-0 text-slate-400 leading-relaxed font-light text-sm sm:text-base border-t border-white/5 bg-slate-950/30">
          {answer}
        </div>
      </div>
    </div>
  );
};

const YoungtimerSection = () => {
  const { lang } = useApp();
  const t = translations[lang];

  return (
    <Section id="youngtimer" title={t.sections.youngtimerTitle} gradient="bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950">
      <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6 sm:mb-10 justify-center sm:justify-start">
            <MessageSquare className="text-pink-500 shrink-0" size={28} />
            <h3 className="retro-font text-xl sm:text-2xl text-teal-400 uppercase tracking-widest">{t.faq.title}</h3>
          </div>
          
          <div className="space-y-4">
            <FAQItem question={t.faq.q1} answer={t.faq.a1} />
            <FAQItem question={t.faq.q2} answer={t.faq.a2} />
            <FAQItem question={t.faq.q3} answer={t.faq.a3} />
            <FAQItem question={t.faq.q4} answer={t.faq.a4} />
            <FAQItem question={t.faq.q5} answer={t.faq.a5} />
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8 pt-6 sm:pt-10">
          <h3 className="retro-font text-xl sm:text-2xl text-pink-500 uppercase tracking-widest text-center">{t.faq.manifestoTitle}</h3>
          <div className="glass p-6 sm:p-12 rounded-3xl sm:rounded-[2rem] border border-white/10 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 blur-[60px] group-hover:bg-pink-500/10 transition-colors duration-1000" />
            <div className="relative z-10 space-y-8 sm:space-y-12">
              <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed text-left sm:text-justify break-words px-2 sm:px-0 space-y-8">
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-teal-400 uppercase tracking-tighter mb-4">Kaj je youngtimer?</h4>
                  <p className="mb-4">
                    To je vozilo, ki se je praviloma izdelovalo v obdobju 80-ih in 90-ih let, je ohranjeno, originalno, tehnično zanimivo in, kot radi rečemo, ima dušo. Z youngtimerjem ima lastnik neko dolgoročno vizijo – ohranjati ga za prihodnje rodove.
                  </p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-teal-400 uppercase tracking-tighter mb-4">Oldtimer ali Youngtimer?</h4>
                  <p>
                    Lep primer je honda NSX, ki je že praznovala 30. obletnico predstavitve in ima lahko vse pogoje za pridobitev uradnega starodobniškega statusa. Ampak tak avto bo na srečanjih starodobnikov večno nezaželen. Youngtimer je primeren izraz.
                  </p>
                </div>
                <div className="border-l-4 border-pink-500 pl-6 py-4 bg-pink-500/5 italic text-slate-200 text-lg sm:text-xl font-medium">
                  Ljubitelji youngtimerjev gojimo tehnično kulturo določenega obdobja.
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-teal-400 uppercase tracking-tighter mb-4">Zakaj so 80-ta in 90-ta najboljša leta avtomobilizma?</h4>
                  <p>
                    Evolucija avtomobila v 80-ih in 90-ih letih je bila res fascinantna, saj so najpomembnejše pridobitve postale avtomobilski standard ravno v tem obdobju.
                  </p>
                </div>
                <div className="flex justify-end pt-12">
                  <div className="text-right">
                    <p className="text-pink-500 font-black uppercase tracking-widest text-lg sm:text-xl">Ekipa Avtonostalgije 80&90</p>
                    <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-pink-500 ml-auto mt-2 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

const Hero = () => {
  const { lang, settings } = useApp();
  const t = translations[lang];
  const title = t.hero.title;
  const parts = title.split(' ');
  const yearPart = parts.pop();
  const namePart = parts.join(' ');

  return (
    <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={settings.heroImage} className="w-full h-full object-cover brightness-[0.3]" alt="Hero Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full flex flex-col items-center justify-center h-full">
        <h1 className="retro-font font-black mb-4 sm:mb-6 tracking-tighter uppercase text-center w-full flex flex-col items-center">
          <span className="text-[6.2vw] xs:text-[7.5vw] sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl whitespace-nowrap block neon-text-pink leading-none pb-2 sm:pb-4">
            {namePart}
          </span>
          <span className="text-[12vw] xs:text-[11vw] sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl block neon-text-teal text-teal-400 leading-none">
            {yearPart}
          </span>
        </h1>
        <p className="text-sm sm:text-lg md:text-2xl text-teal-400 font-light mb-8 sm:mb-12 tracking-[0.2em] sm:tracking-[0.3em] uppercase italic opacity-90 text-center w-full max-w-3xl mx-auto">
          {t.hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-none mx-auto">
          <button onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl retro-font text-xs sm:text-lg transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest cursor-pointer relative z-20">
            {t.sections.events}
          </button>
          <button onClick={() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 rounded-xl retro-font text-xs sm:text-lg transition-all transform hover:scale-105 uppercase tracking-widest cursor-pointer relative z-20">
            {t.sections.news}
          </button>
        </div>
      </div>
    </section>
  );
};

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }: { images: string[], currentIndex: number, onClose: () => void, onPrev: () => void, onNext: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
    <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white p-2 sm:p-3 bg-white/10 hover:bg-pink-500 rounded-full z-[110] transition-colors cursor-pointer" onClick={onClose} aria-label="Close lightbox"><X size={28} /></button>
    {images.length > 1 && (
      <>
        <button className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white p-2 sm:p-4 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ArrowLeft size={32} /></button>
        <button className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white p-2 sm:p-4 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }}><ArrowRight size={32} /></button>
      </>
    )}
    <div className="relative w-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
      <img src={images[currentIndex]} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5" alt="Enlarged" />
      <div className="absolute bottom-[-40px] text-teal-400 text-xs sm:text-sm font-black tracking-[0.5em] uppercase">{currentIndex + 1} / {images.length}</div>
    </div>
  </div>
);

const LoginPageOverlay = ({ onClose }: { onClose: () => void }) => {
  const { setIsAdmin, setShowAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'ADMIN8090' && password === 't2Qy!BD$Q$(eFV8R') { 
      setIsAdmin(true); 
      localStorage.setItem('an_admin', 'true');
      onClose();
      setShowAdmin(true);
    } 
    else { alert('Napačno uporabniško ime ali geslo!'); }
  };

  return (
    <div className="fixed inset-0 z-[70] glass flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl w-full max-w-sm border border-pink-500/30 shadow-2xl relative">
        <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white" onClick={onClose}><X size={24} /></button>
        <h2 className="retro-font text-xl sm:text-2xl text-pink-500 mb-8 text-center uppercase tracking-tighter font-black">Vstop za ekipo</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 sm:px-6 py-3 focus:border-pink-500 outline-none text-center tracking-widest text-sm" placeholder="Username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 sm:px-6 py-3 focus:border-pink-500 outline-none text-center tracking-widest text-sm" placeholder="••••" required />
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-700 rounded-lg font-bold uppercase retro-font tracking-widest text-sm sm:text-base shadow-xl hover:scale-[1.02] transition-transform cursor-pointer">Avtentikacija</button>
        </form>
      </div>
    </div>
  );
};

const AdminList = ({ title, icon, items, onAdd, onEdit, onDelete, lang }: any) => (
  <div className="bg-slate-950/40 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg sm:text-xl font-black flex items-center gap-3 uppercase tracking-tighter">{icon} {title}</h2>
      <button onClick={onAdd} className="bg-pink-500 p-2 rounded-full hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-pink-500/20"><Plus size={16} /></button>
    </div>
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group gap-4">
          <div className="flex items-center gap-4 overflow-hidden w-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg shrink-0 border border-slate-800 bg-black">
              <img src={item.image || item.images?.[0]} className="w-full h-full object-cover" alt="Thumb" onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=100')} />
            </div>
            <span className="font-bold text-xs sm:text-sm truncate tracking-tight uppercase text-slate-200">{item.title[lang]}</span>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button type="button" onClick={() => onEdit(item)} className="flex-1 sm:flex-none p-2 text-teal-400 hover:bg-teal-400/10 rounded-xl transition-all cursor-pointer border border-teal-400/20 flex items-center justify-center"><Edit3 size={16} /></button>
            <button type="button" onClick={() => onDelete(item.id)} className="flex-1 sm:flex-none p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer border border-red-500/20 flex items-center justify-center"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-center py-6 sm:py-8 text-slate-600 text-[10px] uppercase tracking-widest italic border-2 border-dashed border-slate-900 rounded-2xl">Seznam je prazen</div>}
    </div>
  </div>
);

const AdminCMSOverlay = ({ onClose }: { onClose: () => void }) => {
  const { lang, setIsAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog, settings, setSettings } = useApp();
  const [showForm, setShowForm] = useState<'article' | 'event' | 'gallery' | 'settings' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
    image: '', location: '', date: new Date().toISOString().split('T')[0], galleryImages: [] as string[], author: 'Admin', category: 'Blog'
  });

  const [settingsData, setSettingsData] = useState<SiteSettings>(settings);

  const handleEdit = (type: 'article' | 'event' | 'gallery', item: any) => {
    setEditingId(item.id);
    setShowForm(type);
    if (type === 'gallery') {
      setFormData({ ...formData, titleSi: item.title.si, titleEn: item.title.en, galleryImages: item.images || [] });
    } else {
      setFormData({
        titleSi: item.title.si, titleEn: item.title.en,
        excerptSi: item.excerpt?.si || item.description?.si || '',
        excerptEn: item.excerpt?.en || item.description?.en || '',
        contentSi: item.content?.si || '',
        contentEn: item.content?.en || '',
        image: item.image, location: item.location || '', date: item.date || new Date().toISOString().split('T')[0],
        galleryImages: [], author: item.author || 'Admin', category: item.category || 'Blog'
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        if (showForm === 'gallery') {
          const files = Array.from(e.target.files) as File[];
          const newImages = await Promise.all(files.map(file => compressImage(file)));
          setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...newImages] }));
        } else if (showForm === 'settings') {
           const compressed = await compressImage(e.target.files[0] as File);
           const field = (e.target.name as keyof SiteSettings);
           setSettingsData(prev => ({ ...prev, [field]: compressed }));
        } else {
          const compressed = await compressImage(e.target.files[0] as File);
          setFormData(prev => ({ ...prev, image: compressed }));
        }
      } catch (err) { alert("Napaka pri nalaganju slike."); } finally { setUploading(false); }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showForm === 'settings') { setSettings(settingsData); addLog('update', 'settings', 'site-settings'); setShowForm(null); return; }

    const id = editingId || Date.now().toString();
    const slug = (formData.titleEn || formData.titleSi).toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (showForm === 'article') {
      const artData: Article = { id, slug, title: { si: formData.titleSi, en: formData.titleEn }, excerpt: { si: formData.excerptSi, en: formData.excerptEn }, content: { si: formData.contentSi, en: formData.contentEn }, image: formData.image, author: formData.author, date: formData.date, category: formData.category, tags: [] };
      setArticles(prev => editingId ? prev.map(a => a.id === id ? artData : a) : [artData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'article', id);
    } else if (showForm === 'event') {
      const evData: Event = { id, slug, title: { si: formData.titleSi, en: formData.titleEn }, description: { si: formData.excerptSi, en: formData.excerptEn }, date: formData.date, author: formData.author, image: formData.image, location: formData.location };
      setEvents(prev => editingId ? prev.map(e => e.id === id ? evData : e) : [evData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'event', id);
    } else if (showForm === 'gallery') {
      const galData: GalleryItem = { id, eventId: 'custom', title: { si: formData.titleSi, en: formData.titleEn }, images: formData.galleryImages };
      setGallery(prev => editingId ? prev.map(g => g.id === id ? galData : g) : [galData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'gallery', id);
    }
    setShowForm(null); setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[70] glass flex items-start justify-center p-4 lg:p-12 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-6 sm:p-12 border border-purple-500/30 shadow-2xl relative my-8">
        <button className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors cursor-pointer" onClick={onClose}><X size={20} /></button>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 sm:mb-16 gap-6">
          <div className="text-center sm:text-left"><h1 className="retro-font text-2xl sm:text-3xl text-teal-400 tracking-tighter uppercase font-black">Nadzorna Plošča</h1></div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowForm('settings')} className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all font-bold uppercase tracking-widest text-xs text-indigo-400"><Settings size={16} /> Nastavitve</button>
             <button onClick={() => { setIsAdmin(false); localStorage.removeItem('an_admin'); onClose(); }} className="flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-xl hover:bg-pink-500 transition-all font-bold uppercase tracking-widest text-xs"><LogOut size={16} /> Odjava</button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[80] bg-slate-950/98 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-slate-900 p-6 sm:p-8 rounded-2xl w-full max-w-4xl border border-pink-500/50 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="retro-font text-xl sm:text-2xl text-pink-500 mb-6 sm:mb-8 uppercase text-center font-black">{editingId ? 'Uredi' : 'Ustvari'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                <div className="space-y-4">
                  <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                  <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                  {(showForm === 'article' || showForm === 'event') && (
                    <><textarea required placeholder="Povzetek (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-20 outline-none text-sm" value={formData.excerptSi} onChange={e => setFormData({...formData, excerptSi: e.target.value})} /><textarea required placeholder="Summary (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-20 outline-none text-sm" value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} /></>
                  )}
                </div>
                <div className="space-y-4">
                  {showForm === 'gallery' ? (
                    <div className="space-y-4"><label className="block p-6 sm:p-8 border-2 border-dashed border-slate-700 rounded-xl transition-colors text-center cursor-pointer group hover:border-teal-400"><input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} /><p className="text-[10px] uppercase tracking-widest text-slate-400">Dodaj slike</p></label><div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/50 rounded-xl">{formData.galleryImages.map((img, idx) => (<div key={idx} className="aspect-square rounded overflow-hidden relative group border border-slate-800"><img src={img} className="w-full h-full object-cover" alt="Preview" /><button type="button" onClick={() => setFormData(prev => ({...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"><Trash2 size={10} /></button></div>))}</div></div>
                  ) : (
                    <><textarea required placeholder="Vsebina (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-24 sm:h-32 outline-none text-sm" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} /><textarea required placeholder="Content (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-24 sm:h-32 outline-none text-sm" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} /></>
                  )}
                  {showForm !== 'gallery' && (
                    <div className="space-y-2"><label className="block p-3 border-2 border-dashed border-slate-700 rounded-xl text-center cursor-pointer hover:border-teal-400 transition-colors"><input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /><p className="text-[10px] uppercase tracking-widest text-slate-400">Naloži naslovno sliko</p></label><input placeholder="Ali URL slike" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} /></div>
                  )}
                  <div className="grid grid-cols-2 gap-4"><input type="date" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />{showForm === 'event' && <input placeholder="Lokacija" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />}</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6"><button type="submit" disabled={uploading} className="flex-1 py-4 bg-pink-500 rounded-xl font-black shadow-xl uppercase tracking-widest text-sm cursor-pointer disabled:opacity-50 hover:bg-pink-600 transition-colors">Shrani</button><button type="button" onClick={() => { setShowForm(null); setEditingId(null); }} className="flex-1 py-4 bg-slate-800 rounded-xl font-black uppercase tracking-widest text-sm cursor-pointer hover:bg-slate-700">Prekliči</button></div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-3 space-y-12 sm:space-y-16">
            <AdminList title="Članki" icon={<ImageIcon className="text-pink-500" />} items={articles} onAdd={() => setShowForm('article')} onEdit={(item: any) => handleEdit('article', item)} onDelete={(id: string) => { setArticles(prev => prev.filter(x => x.id !== id)); addLog('delete', 'article', id); }} lang={lang} />
            <AdminList title="Dogodki" icon={<Calendar className="text-teal-400" />} items={events} onAdd={() => setShowForm('event')} onEdit={(item: any) => handleEdit('event', item)} onDelete={(id: string) => { setEvents(prev => prev.filter(x => x.id !== id)); addLog('delete', 'event', id); }} lang={lang} />
            <AdminList title="Galerije" icon={<ExternalLink className="text-purple-400" />} items={gallery} onAdd={() => setShowForm('gallery')} onEdit={(item: any) => handleEdit('gallery', item)} onDelete={(id: string) => { setGallery(prev => prev.filter(x => x.id !== id)); addLog('delete', 'gallery', id); }} lang={lang} />
          </div>
          <div className="lg:col-span-1"><div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl"><h2 className="font-black text-[10px] mb-4 text-pink-500 tracking-widest uppercase">Dnevnik Aktivnosti</h2><div className="space-y-3 max-h-[500px] overflow-y-auto">{logs.length === 0 ? <p className="text-slate-600 italic text-[9px] uppercase">Brez zapisov.</p> : logs.map(log => (<div key={log.id} className="text-[9px] border-l-2 border-slate-800 pl-3 py-2 bg-slate-900/50 rounded-r-lg"><div className="text-slate-500 font-mono text-[7px] mb-1">{new Date(log.timestamp).toLocaleTimeString()}</div><div className="text-slate-200"><span className={`font-black uppercase ${log.action === 'create' ? 'text-teal-400' : 'text-pink-500'}`}>{log.action}</span> {log.type}</div></div>))}</div></div></div>
        </div>
      </div>
    </div>
  );
};

const MainContent = () => {
  const { lang, events, articles, gallery, settings } = useApp();
  const [activeGallery, setActiveGallery] = useState<GalleryItem | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const t = translations[lang];

  return (
    <>
      {activeArticle && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-5xl rounded-3xl overflow-hidden border border-pink-500/30 relative flex flex-col shadow-2xl max-h-[90vh]">
            <button className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full hover:bg-pink-500 transition-colors cursor-pointer z-[70]" onClick={() => setActiveArticle(null)}><X size={20} /></button>
            <div className="overflow-y-auto"><div className="w-full h-48 sm:h-[400px] md:h-[500px] overflow-hidden"><img src={activeArticle.image} className="w-full h-full object-cover" alt={activeArticle.title[lang]} /></div><div className="p-6 sm:p-10"><span className="bg-pink-500/20 text-pink-500 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">{activeArticle.category}</span><h2 className="retro-font text-xl sm:text-3xl text-teal-400 mb-6 uppercase">{activeArticle.title[lang]}</h2><div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">{activeArticle.content[lang]}</div></div></div>
          </div>
        </div>
      )}
      {activeEvent && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-6xl rounded-3xl overflow-hidden border border-teal-500/30 relative flex flex-col shadow-2xl max-h-[90vh]">
            <button className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full hover:bg-teal-400 transition-colors cursor-pointer z-[70]" onClick={() => setActiveEvent(null)}><X size={20} /></button>
            <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-2"><div className="h-48 sm:h-72 lg:h-full"><img src={activeEvent.image} className="w-full h-full object-cover" alt={activeEvent.title[lang]} /></div><div className="p-6 sm:p-10"><div className="flex flex-wrap items-center gap-6 mb-6"><div className="flex items-center text-slate-400 text-xs font-black uppercase"><Calendar size={16} className="mr-2 text-pink-500" /> {activeEvent.date}</div><div className="flex items-center text-slate-400 text-xs font-black uppercase"><MapPin size={16} className="mr-2 text-teal-400" /> {activeEvent.location}</div></div><h2 className="retro-font text-xl sm:text-3xl text-teal-400 mb-6 uppercase">{activeEvent.title[lang]}</h2><div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">{activeEvent.description[lang]}</div></div></div>
          </div>
        </div>
      )}
      {activeGallery && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-6 sm:p-10 border border-pink-500/30 relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors cursor-pointer" onClick={() => setActiveGallery(null)}><X size={20} /></button>
            <h2 className="retro-font text-xl sm:text-3xl text-teal-400 mb-6 uppercase border-b border-slate-800 pb-4">{activeGallery.title[lang]}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{activeGallery.images.map((img, idx) => (<div key={idx} className="relative group cursor-zoom-in overflow-hidden rounded-xl aspect-square" onClick={() => setLightboxIndex(idx)}><img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} /></div>))}</div>
          </div>
        </div>
      )}
      {activeGallery && lightboxIndex !== null && (
        <Lightbox images={activeGallery.images} currentIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} onPrev={() => setLightboxIndex(prev => prev! > 0 ? prev! - 1 : activeGallery.images.length - 1)} onNext={() => setLightboxIndex(prev => prev! < activeGallery.images.length - 1 ? prev! + 1 : 0)} />
      )}

      <Hero />
      <Section id="about" title={t.sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8 text-center sm:text-left">
            <p className="text-lg sm:text-2xl text-slate-300 leading-relaxed font-light">Avtonostalgija 80&90 ni zgolj klub, je skupnost ljubiteljev analogne dobe.</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4"><div className="p-4 sm:p-8 glass rounded-2xl border border-pink-500/20 text-center"><div className="text-3xl sm:text-5xl font-black text-pink-500 mb-1 sm:mb-2">{settings.memberCount}</div><div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold">Članov</div><a href="https://www.facebook.com/share/g/19R6ZkvvVd/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="block mt-2 text-[10px] text-pink-500 hover:text-white font-black uppercase tracking-widest transition-colors">Obišči Facebook</a></div><div className="p-4 sm:p-8 glass rounded-2xl border border-teal-500/20 text-center"><div className="text-3xl sm:text-5xl font-black text-teal-400 mb-1 sm:mb-2">{settings.eventCount}</div><div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold">Dogodkov</div></div></div>
          </div>
          <div className="relative group px-4 sm:px-0"><div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-pink-500 to-teal-400 rounded-2xl blur opacity-20 transition duration-1000"></div><img src={settings.aboutImage} className="relative z-10 rounded-2xl border border-white/10 shadow-2xl w-full" alt="Passion" /></div>
        </div>
      </Section>

      <Section id="events" title={t.sections.events} gradient="bg-gradient-to-b from-indigo-900 to-purple-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">{events.map((event) => (<div key={event.id} onClick={() => setActiveEvent(event)} className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-pink-500 transition-all shadow-2xl cursor-pointer"><div className="aspect-[16/10] overflow-hidden"><img src={event.image} className="w-full h-full object-cover" alt={event.title[lang]} /></div><div className="p-6 sm:p-8"><div className="flex items-center text-[10px] text-slate-400 mb-3 font-black uppercase"><Calendar size={14} className="mr-2 text-pink-500" /> {event.date}</div><h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 group-hover:text-pink-500 transition-colors uppercase leading-tight line-clamp-2">{event.title[lang]}</h3><p className="text-[10px] sm:text-sm text-slate-400 flex items-center font-bold uppercase"><MapPin size={16} className="text-teal-400 mr-2" /> {event.location}</p></div></div>))}</div>
      </Section>

      <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-purple-900 to-teal-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">{articles.map((article) => (<div key={article.id} onClick={() => setActiveArticle(article)} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center glass p-6 sm:p-8 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer"><div className="w-full sm:w-44 lg:w-56 h-44 lg:h-56 shrink-0 overflow-hidden rounded-2xl border border-white/10"><img src={article.image} className="w-full h-full object-cover" alt={article.title[lang]} /></div><div className="flex-1 space-y-3"><span className="bg-pink-500/20 text-pink-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">{article.category}</span><h3 className="text-xl sm:text-2xl font-black group-hover:text-teal-400 transition-colors uppercase line-clamp-2 leading-tight">{article.title[lang]}</h3><p className="text-slate-400 text-xs sm:text-sm line-clamp-2 opacity-80">{article.excerpt[lang]}</p><div className="text-pink-500 text-[10px] font-black uppercase flex items-center gap-2 group-hover:translate-x-2 transition-transform pt-1">{t.common.readMore} <ChevronRight size={14} /></div></div></div>))}</div>
      </Section>

      <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-teal-900 to-slate-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10">{gallery.map((item) => (<div key={item.id} className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-2xl aspect-[4/3] border border-slate-800 hover:border-teal-400 transition-all" onClick={() => setActiveGallery(item)}><img src={item.images[0]} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" alt={item.title[lang]} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-6 sm:p-10"><h3 className="retro-font text-lg sm:text-2xl text-white mb-2 uppercase">{item.title[lang]}</h3><div className="text-teal-400 text-[9px] font-black uppercase flex items-center gap-2"><ImageIcon size={16} /> {item.images.length} fotografij</div></div></div>))}</div>
      </Section>

      <YoungtimerSection />

      <Section id="contact" title={t.nav.contact} gradient="bg-gradient-to-t from-black to-slate-950">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12"><p className="text-lg sm:text-2xl text-slate-300 font-light italic text-center">"Klasika, ki jo pišete vi."</p><div className="space-y-6 sm:space-y-8 px-4"><a href="mailto:avtonostalgija8090@gmail.com" className="flex items-center justify-center gap-4 glass p-6 sm:p-12 rounded-3xl border border-pink-500/20 text-center hover:bg-pink-500/10 transition-all group overflow-hidden relative"><Mail className="text-pink-500 shrink-0" size={28} /><p className="text-slate-200 group-hover:text-pink-500 font-black text-sm sm:text-xl md:text-3xl tracking-widest uppercase transition-colors break-all leading-tight">avtonostalgija8090@gmail.com</p></a><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">{[{ roleKey: 'president', name: 'Janez Tomc', tel: '+386 51 319 618' }, { roleKey: 'vicePresident', name: 'Darko Šturm', tel: '+386 31 790 605' }, { roleKey: 'secretary', name: 'Damir Sterle', tel: '+386 31 759 331' }].map((contact, idx) => (<a key={idx} href={`tel:${contact.tel.replace(/\s/g, '')}`} className="glass p-6 sm:p-8 rounded-2xl border border-teal-500/20 hover:border-teal-400 transition-all flex flex-col items-center text-center space-y-2"><div className="w-10 h-10 bg-teal-500/10 rounded-full flex items-center justify-center mb-1"><Phone className="text-teal-400" size={18} /></div><p className="text-pink-500 text-[9px] font-black uppercase tracking-widest">{t.contactRoles[contact.roleKey as keyof typeof t.contactRoles]}</p><p className="text-white text-base sm:text-lg font-bold uppercase">{contact.name}</p><p className="text-teal-400 font-mono text-xs">{contact.tel}</p></a>))}</div></div></div>
      </Section>
    </>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>('si');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    const loadContent = async () => {
      const savedArticles = await fetchPersistedData('an_articles'); if (savedArticles) setArticles(savedArticles);
      const savedEvents = await fetchPersistedData('an_events'); if (savedEvents) setEvents(savedEvents);
      const savedGallery = await fetchPersistedData('an_gallery'); if (savedGallery) setGallery(savedGallery);
      const savedLogs = await fetchPersistedData('an_logs'); if (savedLogs) setLogs(savedLogs);
      const savedSettings = await fetchPersistedData('an_settings'); if (savedSettings) setSettings(savedSettings);
      if (localStorage.getItem('an_admin') === 'true') setIsAdmin(true);
      setHasLoaded(true);
    };
    loadContent();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const saveToStorage = async () => {
      setIsSaving(true);
      await Promise.all([persistData('an_articles', articles), persistData('an_events', events), persistData('an_gallery', gallery), persistData('an_logs', logs), persistData('an_settings', settings)]);
      setIsSaving(false);
    };
    saveToStorage();
  }, [articles, events, gallery, logs, settings, hasLoaded]);

  const addLog = (action: ActivityLog['action'], type: ActivityLog['type'], targetId: string) => { setLogs(prev => [{ id: Date.now().toString(), action, type, targetId, timestamp: new Date().toISOString() }, ...prev]); };

  return (
    <AppContext.Provider value={{ lang, setLang, isAdmin, setIsAdmin, showLogin, setShowLogin, showAdmin, setShowAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog, isSaving, setIsSaving, settings, setSettings }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500 font-sans tracking-tight overflow-x-hidden">
        <Navbar />
        {isSaving && <div className="fixed bottom-4 right-4 z-[99] glass px-4 py-2 rounded-full border border-teal-500/50 flex items-center gap-2 text-[9px] font-black uppercase text-teal-400 shadow-2xl"><Loader2 size={10} className="animate-spin" /> Sinhronizacija z oblakom...</div>}
        <main className="w-full"><MainContent />{showLogin && <LoginPageOverlay onClose={() => setShowLogin(false)} />}{showAdmin && isAdmin && <AdminCMSOverlay onClose={() => setShowAdmin(false)} />}</main>
        <footer className="bg-gradient-to-b from-slate-950 to-indigo-950 border-t border-purple-500/20 py-16 text-center"><div className="max-w-7xl mx-auto space-y-8"><h3 className="retro-font text-2xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 uppercase">Avtonostalgija 80&90</h3><div className="text-[10px] font-black uppercase tracking-[1em] text-slate-700 opacity-50">&copy; 2024 Vse pravice pridržane.</div></div></footer>
      </div>
    </AppContext.Provider>
  );
};

export default App;