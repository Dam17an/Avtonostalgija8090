import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight, Upload, Loader2, ChevronDown, MessageSquare, Phone, Mail, Settings } from 'lucide-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { translations } from './translations';
import { Language, Article, Event, GalleryItem, ActivityLog, SiteSettings } from './types';

// --- SHARED BACKEND CONFIGURATION ---
const SUPABASE_URL = 'https://ilatpfgfihqugvxjkfot.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYXRwZmdmaWhxdWd2eGprZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTkyNzcsImV4cCI6MjA4MjM5NTI3N30.iaQuPce2CUaGFh1jzg7_HbQhtgo4-MNs4_fpdpJnuTQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 💡 IMPORTANT FOR DEVELOPER:
 * If you see "row-level security policy" errors, your Supabase policy is likely 
 * missing the 'UPDATE' permission. Since 'upsert' combines INSERT and UPDATE, 
 * you need BOTH.
 * 
 * RUN THIS SQL IN SUPABASE:
 * 
 * DROP POLICY IF EXISTS "Public Access" ON an_content;
 * CREATE POLICY "Public Access" ON an_content FOR ALL TO anon USING (true) WITH CHECK (true);
 */

// --- STORAGE UTILITIES ---
const persistData = async (key: string, data: any) => {
  try {
    const { error } = await supabase
      .from('an_content')
      .upsert({ key, data });
    
    if (error) {
      if (error.message.includes('row-level security')) {
        console.error(`🛑 RLS ERROR [${key}]: Your Supabase policy is blocking this operation.`);
        console.info(
          "%cSolution: Run this SQL in your Supabase SQL Editor:\n\nCREATE POLICY \"Public Access\" ON an_content FOR ALL TO anon USING (true) WITH CHECK (true);", 
          "color: #fb7185; font-weight: bold; font-size: 14px; background: #1e1b4b; padding: 10px; border-radius: 5px;"
        );
      } else {
        console.error(`❌ Supabase Error [${key}]:`, error.message);
      }
      throw error;
    }
    
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    // Fail silently in UI but keep data in localStorage for reliability
    localStorage.setItem(key, JSON.stringify(data));
  }
};

const fetchPersistedData = async (key: string) => {
  try {
    const { data, error } = await supabase
      .from('an_content')
      .select('data')
      .eq('key', key)
      .single();
    
    if (data) return data.data;
    if (error && error.code !== 'PGRST116') throw error;
    
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  } catch (e: any) {
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  }
};

// --- IMAGE COMPRESSION HELPER ---
const compressImage = (file: File, maxWidth = 1200): Promise<string> => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// --- CONTEXT ---
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

// --- INITIAL SETTINGS ---
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
    if (isAdmin) setShowAdmin(true);
    else setShowLogin(true);
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
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-5 sm:p-6 text-left flex justify-between items-center group gap-4">
        <span className="text-base sm:text-xl font-bold tracking-tight text-slate-100 group-hover:text-teal-400 transition-colors uppercase">
          {question}
        </span>
        <ChevronDown className={`text-pink-500 shrink-0 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} size={24} />
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
                  <p className="mb-4">To je vozilo, ki se je praviloma izdelovalo v obdobju 80-ih in 90-ih let, je ohranjeno, originalno, tehnično zanimivo in, kot radi rečemo, ima dušo. Z youngtimerjem ima lastnik neko dolgoročno vizijo – ohranjati ga za prihodnje rodove.</p>
                  <p>Prehod iz 80-ih v 90-ta je bil tudi čas, ko je večina Slovencev menjala fičke, katrce, jugote, stoenke in lade za “kapitalistične” avtomobile. Avto je bil takrat res statusni simbol v pravem pomenu besede.</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-6 py-4 bg-pink-500/5 italic text-slate-200 text-lg sm:text-xl font-medium">
                  Ljubitelji youngtimerjev gojimo tehnično kulturo določenega obdobja.
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-teal-400 uppercase tracking-tighter mb-4">Zakaj 80-ta in 90-ta?</h4>
                  <p>Evolucija avtomobila v tem obdobju je bila fascinantna. To je bil čas, ko so ure, servo volani, ABS in airbagi postali standard, a je poudarek še vedno ostal na užitku v vožnji brez pretirane elektronike.</p>
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
    <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white p-2 sm:p-3 bg-white/10 hover:bg-pink-500 rounded-full z-[110] transition-colors cursor-pointer" onClick={onClose}><X size={28} /></button>
    {images.length > 1 && (
      <>
        <button className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white p-2 sm:p-4 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ArrowLeft size={32} /></button>
        <button className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white p-2 sm:p-4 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }}><ArrowRight size={32} /></button>
      </>
    )}
    <div className="relative w-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
      <img src={images[currentIndex]} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5" alt="Enlarged" />
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
    } else {
      alert('Napačno uporabniško ime ali geslo!');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] glass flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl w-full max-w-sm border border-pink-500/30 shadow-2xl relative">
        <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white" onClick={onClose}><X size={24} /></button>
        <h2 className="retro-font text-xl sm:text-2xl text-pink-500 mb-8 text-center uppercase tracking-tighter font-black">Vstop za ekipo</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-6 py-3 focus:border-pink-500 outline-none text-center" placeholder="Username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-6 py-3 focus:border-pink-500 outline-none text-center" placeholder="••••" required />
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-700 rounded-lg font-bold uppercase retro-font tracking-widest shadow-xl">Vstop</button>
        </form>
      </div>
    </div>
  );
};

const AdminList = ({ title, icon, items, onAdd, onEdit, onDelete, lang }: any) => (
  <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-black uppercase flex items-center gap-3">{icon} {title}</h2>
      <button onClick={onAdd} className="bg-pink-500 p-2 rounded-full hover:bg-pink-600 transition-colors"><Plus size={16} /></button>
    </div>
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800">
          <span className="text-xs font-bold uppercase truncate max-w-[150px]">{item.title[lang]}</span>
          <div className="flex gap-2">
            <button onClick={() => onEdit(item)} className="p-2 text-teal-400 hover:bg-teal-400/10 rounded"><Edit3 size={14} /></button>
            <button onClick={() => onDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
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
    image: '', location: '', date: new Date().toISOString().split('T')[0], galleryImages: [] as string[]
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        if (showForm === 'gallery') {
          const files = Array.from(e.target.files);
          const newImages = await Promise.all(files.map(file => compressImage(file)));
          setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...newImages] }));
        } else {
          const compressed = await compressImage(e.target.files[0]);
          setFormData(prev => ({ ...prev, image: compressed }));
        }
      } catch (err) { alert("Napaka pri nalaganju."); } finally { setUploading(false); }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || Date.now().toString();
    if (showForm === 'article') {
      const item = { id, title: { si: formData.titleSi, en: formData.titleEn }, excerpt: { si: formData.excerptSi, en: formData.excerptEn }, content: { si: formData.contentSi, en: formData.contentEn }, image: formData.image, date: formData.date, category: 'Blog' };
      setArticles(prev => editingId ? prev.map(a => a.id === id ? item as any : a) : [item as any, ...prev]);
      addLog(editingId ? 'update' : 'create', 'article', id);
    } else if (showForm === 'event') {
      const item = { id, title: { si: formData.titleSi, en: formData.titleEn }, description: { si: formData.contentSi, en: formData.contentEn }, date: formData.date, image: formData.image, location: formData.location };
      setEvents(prev => editingId ? prev.map(ev => ev.id === id ? item as any : ev) : [item as any, ...prev]);
      addLog(editingId ? 'update' : 'create', 'event', id);
    } else if (showForm === 'gallery') {
      const item = { id, title: { si: formData.titleSi, en: formData.titleEn }, images: formData.galleryImages };
      setGallery(prev => editingId ? prev.map(g => g.id === id ? item as any : g) : [item as any, ...prev]);
      addLog(editingId ? 'update' : 'create', 'gallery', id);
    }
    setShowForm(null); setEditingId(null);
  };

  const resetForm = () => {
    setFormData({titleSi:'', titleEn:'', excerptSi:'', excerptEn:'', contentSi:'', contentEn:'', image:'', location:'', date:new Date().toISOString().split('T')[0], galleryImages:[]});
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[70] glass flex items-start justify-center p-4 lg:p-12 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-6 sm:p-12 border border-purple-500/30 shadow-2xl relative my-8">
        <button className="absolute top-4 right-4 p-3 bg-slate-800 rounded-full hover:bg-pink-500" onClick={onClose}><X size={20} /></button>
        <div className="flex justify-between items-center mb-10">
          <h1 className="retro-font text-2xl text-teal-400 uppercase font-black">Admin CMS</h1>
          <button onClick={() => { setIsAdmin(false); localStorage.removeItem('an_admin'); onClose(); }} className="bg-slate-800 px-6 py-2 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-red-500 transition-colors">Odjava</button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[80] bg-slate-950/98 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl w-full max-w-4xl border border-pink-500/50 max-h-[90vh] overflow-y-auto">
              <h2 className="retro-font text-xl text-pink-500 mb-8 uppercase text-center font-black">{editingId ? 'Uredi Vsebino' : 'Ustvari Novo'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-sm focus:border-teal-400 outline-none" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                  <textarea required placeholder="Vsebina (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-48 text-sm focus:border-teal-400 outline-none" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-sm focus:border-pink-500 outline-none" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                  <textarea required placeholder="Content (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-48 text-sm focus:border-pink-500 outline-none" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} />
                </div>
                
                {showForm === 'event' && (
                   <div className="col-span-full grid grid-cols-2 gap-4">
                     <input required placeholder="Lokacija" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-sm focus:border-teal-400 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                     <input type="date" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-sm focus:border-pink-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                   </div>
                )}

                {showForm !== 'gallery' && (
                  <div className="col-span-full">
                    <label className="block p-8 border-2 border-dashed border-slate-700 rounded-xl text-center cursor-pointer hover:border-pink-500 transition-colors">
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                      {formData.image ? (
                        <div className="relative group">
                           <img src={formData.image} className="h-32 mx-auto rounded-lg mb-2" alt="Preview" />
                           <span className="text-[10px] uppercase font-bold text-teal-400">Zamenjaj sliko</span>
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{uploading ? "Obdelujem..." : "Naloži glavno sliko"}</span>
                      )}
                    </label>
                  </div>
                )}

                {showForm === 'gallery' && (
                  <div className="col-span-full space-y-4">
                    <label className="block p-4 border-2 border-dashed border-slate-700 rounded-xl text-center cursor-pointer hover:border-teal-400">
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Dodaj več slik v galerijo</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                       {formData.galleryImages.map((img, i) => (
                         <div key={i} className="relative group aspect-square">
                           <img src={img} className="w-full h-full object-cover rounded-lg" alt="Gallery item" />
                           <button type="button" onClick={() => setFormData({...formData, galleryImages: formData.galleryImages.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex rounded-lg"><Trash2 size={16}/></button>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button type="submit" className="flex-1 py-4 bg-pink-500 hover:bg-pink-600 rounded-xl font-black uppercase tracking-widest transition-all">Shrani Spremembe</button>
                <button type="button" onClick={() => { setShowForm(null); resetForm(); }} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-black uppercase tracking-widest transition-all">Prekliči</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <AdminList title="Članki" icon={<ImageIcon className="text-pink-500" />} items={articles} onAdd={() => { resetForm(); setShowForm('article'); }} onEdit={(it: any) => { setEditingId(it.id); setFormData({...formData, titleSi: it.title.si, titleEn: it.title.en, contentSi: it.content.si, contentEn: it.content.en, image: it.image}); setShowForm('article'); }} onDelete={(id: string) => setArticles(prev => prev.filter(a => a.id !== id))} lang={lang} />
          <AdminList title="Dogodki" icon={<Calendar className="text-teal-400" />} items={events} onAdd={() => { resetForm(); setShowForm('event'); }} onEdit={(it: any) => { setEditingId(it.id); setFormData({...formData, titleSi: it.title.si, titleEn: it.title.en, contentSi: it.description.si, contentEn: it.description.en, image: it.image, date: it.date, location: it.location}); setShowForm('event'); }} onDelete={(id: string) => setEvents(prev => prev.filter(e => e.id !== id))} lang={lang} />
          <AdminList title="Galerija" icon={<ExternalLink className="text-purple-400" />} items={gallery} onAdd={() => { resetForm(); setShowForm('gallery'); }} onEdit={(it: any) => { setEditingId(it.id); setFormData({...formData, titleSi: it.title.si, titleEn: it.title.en, galleryImages: it.images}); setShowForm('gallery'); }} onDelete={(id: string) => setGallery(prev => prev.filter(g => g.id !== id))} lang={lang} />
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
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden border border-pink-500/30 shadow-2xl my-8">
            <div className="p-8">
              <button className="float-right p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => setActiveArticle(null)}><X size={24} /></button>
              <h2 className="retro-font text-2xl text-teal-400 mb-6 uppercase">{activeArticle.title[lang]}</h2>
              {activeArticle.image && <img src={activeArticle.image} className="w-full h-72 object-cover rounded-xl mb-6 shadow-xl border border-white/5" alt="article" />}
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">{activeArticle.content[lang]}</div>
            </div>
          </div>
        </div>
      )}

      {activeEvent && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden border border-teal-500/30 shadow-2xl my-8">
            <div className="p-8">
              <button className="float-right p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => setActiveEvent(null)}><X size={24} /></button>
              <div className="flex items-center gap-4 text-xs text-pink-500 mb-4 font-bold uppercase tracking-widest"><Calendar size={14} /> {activeEvent.date}</div>
              <h2 className="retro-font text-2xl text-teal-400 mb-6 uppercase">{activeEvent.title[lang]}</h2>
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-6 bg-teal-400/10 w-fit px-3 py-1 rounded-full"><MapPin size={14}/> {activeEvent.location}</div>
              {activeEvent.image && <img src={activeEvent.image} className="w-full h-64 object-cover rounded-xl mb-6 border border-white/5" alt="event" />}
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">{activeEvent.description[lang]}</div>
            </div>
          </div>
        </div>
      )}

      {activeGallery && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-6xl rounded-3xl p-8 border border-pink-500/30 my-8">
            <button className="float-right p-2 hover:bg-white/10 rounded-full" onClick={() => setActiveGallery(null)}><X size={24} /></button>
            <h2 className="retro-font text-2xl text-teal-400 mb-8 uppercase tracking-tighter">{activeGallery.title[lang]}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {activeGallery.images.map((img, idx) => (
                <div key={idx} className="cursor-pointer overflow-hidden rounded-xl aspect-square border border-white/5 hover:border-pink-500 transition-all transform hover:scale-[1.02]" onClick={() => setLightboxIndex(idx)}>
                  <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeGallery && lightboxIndex !== null && (
        <Lightbox 
          images={activeGallery.images} 
          currentIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
          onPrev={() => setLightboxIndex(p => p! > 0 ? p! - 1 : activeGallery.images.length - 1)} 
          onNext={() => setLightboxIndex(p => p! < activeGallery.images.length - 1 ? p! + 1 : 0)} 
        />
      )}

      <Hero />
      <Section id="about" title={t.sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-xl text-slate-300 leading-relaxed font-light">Avtonostalgija 80&90 ni zgolj klub, je skupnost ljubiteljev analogne dobe, kjer cenimo vonj po bencinu in pristne občutke na volanu.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 glass rounded-2xl border border-pink-500/20 text-center shadow-lg">
                <div className="text-4xl font-black text-pink-500 mb-2">{settings.memberCount}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ljubiteljev</div>
              </div>
              <div className="p-6 glass rounded-2xl border border-teal-500/20 text-center shadow-lg">
                <div className="text-4xl font-black text-teal-400 mb-2">{settings.eventCount}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Srečanj</div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <img src={settings.aboutImage} className="rounded-2xl border border-white/10 shadow-2xl w-full brightness-90 group-hover:brightness-100 transition-all duration-700" alt="About" />
            <div className="absolute inset-0 rounded-2xl border border-teal-400/20 pointer-events-none group-hover:border-pink-500/40 transition-all duration-700" />
          </div>
        </div>
      </Section>

      <Section id="events" title={t.sections.events} gradient="bg-gradient-to-b from-indigo-900 to-purple-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.length > 0 ? events.map((event) => (
            <div key={event.id} onClick={() => setActiveEvent(event)} className="group bg-slate-900/80 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500 transition-all cursor-pointer shadow-xl">
              <div className="aspect-video overflow-hidden">
                <img src={event.image || settings.heroImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={event.title[lang]} />
              </div>
              <div className="p-6">
                <div className="text-[10px] text-pink-500 mb-3 font-black uppercase tracking-widest">{event.date}</div>
                <h3 className="text-lg font-bold mb-4 uppercase text-slate-100 group-hover:text-teal-400 transition-colors">{event.title[lang]}</h3>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> {event.location}</div>
              </div>
            </div>
          )) : <p className="col-span-full text-center text-slate-500 uppercase tracking-widest text-xs py-12">Trenutno ni načrtovanih dogodkov.</p>}
        </div>
      </Section>

      <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-purple-900 to-teal-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.length > 0 ? articles.map((article) => (
            <div key={article.id} onClick={() => setActiveArticle(article)} className="glass p-6 rounded-3xl border border-white/5 flex gap-6 items-center group cursor-pointer hover:bg-white/10 transition-all">
              <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 overflow-hidden rounded-xl border border-white/10">
                <img src={article.image || settings.aboutImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={article.title[lang]} />
              </div>
              <div className="space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">{article.category}</span>
                <h3 className="text-lg sm:text-xl font-black uppercase line-clamp-2 leading-tight">{article.title[lang]}</h3>
                <div className="text-pink-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">{t.common.readMore} <ChevronRight size={14}/></div>
              </div>
            </div>
          )) : <p className="col-span-full text-center text-slate-500 uppercase tracking-widest text-xs py-12">Novice prihajajo kmalu.</p>}
        </div>
      </Section>

      <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-teal-900 to-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {gallery.length > 0 ? gallery.map((item) => (
            <div key={item.id} className="relative group cursor-pointer overflow-hidden rounded-3xl aspect-[4/3] border border-slate-800 hover:border-teal-400 transition-all" onClick={() => setActiveGallery(item)}>
              <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 brightness-75 group-hover:brightness-100" alt={item.title[lang]} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-8">
                <h3 className="retro-font text-lg text-white mb-2 uppercase tracking-tighter">{item.title[lang]}</h3>
                <div className="text-teal-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> {item.images.length} Fotografij</div>
              </div>
            </div>
          )) : <p className="col-span-full text-center text-slate-500 uppercase tracking-widest text-xs py-12">Galerija je prazna.</p>}
        </div>
      </Section>

      <YoungtimerSection />

      <Section id="contact" title={t.nav.contact} gradient="bg-gradient-to-t from-black to-slate-950">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <p className="text-2xl text-slate-300 font-light italic opacity-80">"Klasika, ki jo pišete vi."</p>
          <div className="space-y-8">
            <a href="mailto:avtonostalgija8090@gmail.com" className="flex flex-col sm:flex-row items-center justify-center gap-4 glass p-8 rounded-3xl border border-pink-500/20 hover:bg-pink-500/10 transition-all shadow-2xl">
              <Mail className="text-pink-500" size={24} />
              <span className="text-slate-200 font-black text-sm sm:text-xl uppercase tracking-widest break-all">avtonostalgija8090@gmail.com</span>
            </a>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { role: 'president', name: 'Janez Tomc', tel: '+386 51 319 618' },
                { role: 'vicePresident', name: 'Darko Šturm', tel: '+386 31 790 605' },
                { role: 'secretary', name: 'Damir Sterle', tel: '+386 31 759 331' },
              ].map((c, i) => (
                <a key={i} href={`tel:${c.tel.replace(/\s/g, '')}`} className="glass p-6 rounded-2xl border border-teal-500/20 hover:border-teal-400 transition-all block text-center">
                  <p className="text-pink-500 text-[9px] font-black uppercase tracking-widest mb-2">{t.contactRoles[c.role as keyof typeof t.contactRoles]}</p>
                  <p className="text-white font-bold uppercase mb-2 text-sm">{c.name}</p>
                  <p className="text-teal-400 font-mono text-xs">{c.tel}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
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
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    const load = async () => {
      const a = await fetchPersistedData('an_articles'); if (a) setArticles(a);
      const e = await fetchPersistedData('an_events'); if (e) setEvents(e);
      const g = await fetchPersistedData('an_gallery'); if (g) setGallery(g);
      const l = await fetchPersistedData('an_logs'); if (l) setLogs(l);
      const s = await fetchPersistedData('an_settings'); if (s) setSettings(s);
      if (localStorage.getItem('an_admin') === 'true') setIsAdmin(true);
      setHasLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const save = async () => {
      setIsSaving(true);
      try {
        await persistData('an_articles', articles);
        await persistData('an_events', events);
        await persistData('an_gallery', gallery);
        await persistData('an_logs', logs);
        await persistData('an_settings', settings);
      } finally {
        setIsSaving(false);
      }
    };
    save();
  }, [articles, events, gallery, logs, settings, hasLoaded]);

  const addLog = (action: ActivityLog['action'], type: ActivityLog['type'], targetId: string) => {
    setLogs(prev => [{ id: Date.now().toString(), action, type, targetId, timestamp: new Date().toISOString() }, ...prev]);
  };

  return (
    <AppContext.Provider value={{ lang, setLang, isAdmin, setIsAdmin, showLogin, setShowLogin, showAdmin, setShowAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog, isSaving, setIsSaving, settings, setSettings }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500 font-sans tracking-tight overflow-x-hidden">
        <Navbar />
        {isSaving && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-4 z-[99] glass px-4 py-2 rounded-full border border-teal-500/50 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-teal-400 shadow-2xl"><Loader2 size={10} className="animate-spin" /> Shranjujem v oblak...</div>}
        <main className="w-full"><MainContent /></main>
        {showLogin && <LoginPageOverlay onClose={() => setShowLogin(false)} />}
        {showAdmin && isAdmin && <AdminCMSOverlay onClose={() => setShowAdmin(false)} />}
        <footer className="py-12 text-center border-t border-white/5 opacity-50 text-[10px] uppercase font-bold tracking-[1em]">&copy; 2024 AVTONOSTALGIJA 80&90</footer>
      </div>
    </AppContext.Provider>
  );
};

export default App;