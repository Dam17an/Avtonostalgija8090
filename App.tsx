import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save } from 'lucide-react';
import { translations } from './translations';
import { Language, Article, Event, GalleryItem, ActivityLog } from './types';

// Context for global state
const AppContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  isAdmin: boolean;
  setIsAdmin: (b: boolean) => void;
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  logs: ActivityLog[];
  addLog: (action: 'create' | 'update' | 'delete', type: ActivityLog['type'], targetId: string) => void;
} | null>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// Initial Data
const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'vstop-v-svet-youngtimerjev',
    title: { si: 'Vstop v svet Youngtimerjev', en: 'Entering the World of Youngtimers' },
    excerpt: { si: 'Kaj definira avtomobil iz 80-ih in 90-ih kot klasiko?', en: 'What defines an 80s or 90s car as a classic?' },
    content: { si: 'Polna vsebina o zgodovini in rasti trga youngtimerjev v Sloveniji...', en: 'Full content about history and growth of youngtimer market in Slovenia...' },
    image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800',
    author: 'Admin',
    date: '2024-03-20',
    category: 'Guide',
    tags: ['E30', '90s', 'Maintenance']
  }
];

const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    slug: 'retro-srecanje-ljubljana',
    title: { si: 'Retro Srečanje Ljubljana 2024', en: 'Retro Meet Ljubljana 2024' },
    description: { si: 'Največje srečanje ljubiteljev 80ih in 90ih v osrednji Sloveniji.', en: 'The biggest meeting of 80s and 90s fans in central Slovenia.' },
    date: '2024-05-15',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800',
    location: 'Ljubljana, Kongresni trg',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2768.456!2d14.505!'
  }
];

const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: '1',
    eventId: '1',
    title: { si: 'Srečanje Maribor 2023', en: 'Maribor Meet 2023' },
    images: [
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600'
    ]
  }
];

// Helper for scroll navigation
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.hash = '/';
    setTimeout(() => {
       document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
};

const Navbar = () => {
  const { lang, setLang, isAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];

  // Fix: Ensure menu items use available translation keys correctly
  const menuItems = [
    { label: t.nav.home, id: 'hero' },
    { label: t.nav.intro, id: 'about' },
    { label: t.nav.youngtimer, id: 'youngtimer' },
    { label: t.nav.bestPractices, id: 'practices' },
    { label: t.sections.news, id: 'news' },
    { label: t.sections.events, id: 'events' },
    { label: t.nav.contact, id: 'contact' }
  ];

  return (
    <nav className="fixed w-full z-50 glass border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" onClick={() => scrollToSection('hero')} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg">AN</div>
            <span className="retro-font text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400">
              80 & 90
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-4 text-xs xl:text-sm font-medium">
            {menuItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => scrollToSection(item.id)} 
                className="hover:text-pink-500 transition-colors uppercase tracking-widest px-2"
              >
                {item.label}
              </button>
            ))}
            
            <div className="flex items-center space-x-2 border-l border-slate-700 pl-4 ml-2">
              <button onClick={() => setLang('si')} className={`px-2 py-1 rounded-full text-[10px] ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-full text-[10px] ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
            </div>

            {isAdmin ? (
              <Link to="/admin" className="p-2 text-teal-400 hover:text-teal-300"><User size={20} /></Link>
            ) : (
              <Link to="/login" className="p-2 text-slate-400 hover:text-pink-500"><User size={20} /></Link>
            )}
          </div>

          <button className="lg:hidden text-slate-100" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden glass border-t border-purple-500/20 absolute top-20 w-full max-h-screen overflow-y-auto">
          <div className="px-4 py-8 space-y-6 flex flex-col items-center text-lg uppercase tracking-widest font-bold">
             {menuItems.map(item => (
               <button key={item.id} onClick={() => { scrollToSection(item.id); setIsOpen(false); }}>{item.label}</button>
             ))}
             <div className="flex space-x-6 pt-6">
                <button onClick={() => setLang('si')} className={`px-4 py-1 rounded-full ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
                <button onClick={() => setLang('en')} className={`px-4 py-1 rounded-full ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
             </div>
             {isAdmin ? (
              <Link to="/admin" className="text-teal-400" onClick={() => setIsOpen(false)}>Admin Panel</Link>
             ) : (
              <Link to="/login" className="text-slate-400" onClick={() => setIsOpen(false)}>{t.common.login}</Link>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

const Lightbox = ({ image, onClose }: { image: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose}>
    <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full" onClick={onClose}><X size={32} /></button>
    <img src={image} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
  </div>
);

// Fix: Updated Section component props to properly handle children in JSX and resolve mismatch errors
const Section = ({ id, title, children, gradient }: { id: string, title: any, children?: React.ReactNode, gradient: string }) => (
  <section id={id} className={`py-32 px-4 transition-all ${gradient}`}>
    <div className="max-w-7xl mx-auto">
      <h2 className="retro-font text-3xl md:text-5xl text-center mb-16 tracking-tighter">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400">{title}</span>
      </h2>
      {children}
    </div>
  </section>
);

const Hero = () => {
  const { lang } = useApp();
  const t = translations[lang];
  return (
    <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1920" 
          alt="Vintage Car" 
          className="w-full h-full object-cover brightness-[0.4]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-5xl">
        <h1 className="retro-font text-6xl md:text-9xl font-black mb-8 tracking-tighter neon-text-pink leading-none">
          {t.hero.title}
        </h1>
        <p className="text-xl md:text-3xl text-teal-400 font-light mb-12 tracking-wide uppercase italic">
          {t.hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button 
            onClick={() => scrollToSection('events')} 
            className="px-12 py-5 bg-pink-500 hover:bg-pink-600 text-white rounded-full retro-font text-lg transition-all transform hover:scale-110 shadow-xl shadow-pink-500/30"
          >
            {t.sections.events}
          </button>
          <button 
            onClick={() => scrollToSection('about')} 
            className="px-12 py-5 border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 rounded-full retro-font text-lg transition-all"
          >
            {t.nav.intro}
          </button>
        </div>
      </div>
    </section>
  );
};

// Admin Dashboard CMS
const AdminCMS = () => {
  const { lang, isAdmin, setIsAdmin, articles, setArticles, events, setEvents, logs, addLog } = useApp();
  const [showForm, setShowForm] = useState<'article' | 'event' | null>(null);
  const t = translations[lang];

  const [formData, setFormData] = useState({
    titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800', 
    location: '', date: new Date().toISOString().split('T')[0]
  });

  if (!isAdmin) return <div className="pt-48 text-center text-2xl h-screen">Access Denied</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const slug = formData.titleEn.toLowerCase().replace(/ /g, '-');

    if (showForm === 'article') {
      const newArt: Article = {
        id: newId,
        slug,
        title: { si: formData.titleSi, en: formData.titleEn },
        excerpt: { si: formData.excerptSi, en: formData.excerptEn },
        content: { si: formData.contentSi, en: formData.contentEn },
        image: formData.image,
        author: 'Admin',
        date: formData.date,
        category: 'Blog',
        tags: []
      };
      setArticles([newArt, ...articles]);
      addLog('create', 'article', newId);
    } else if (showForm === 'event') {
      const newEv: Event = {
        id: newId,
        slug,
        title: { si: formData.titleSi, en: formData.titleEn },
        description: { si: formData.excerptSi, en: formData.excerptEn },
        date: formData.date,
        author: 'Admin',
        image: formData.image,
        location: formData.location,
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2768.456!2d14.505!'
      };
      setEvents([newEv, ...events]);
      addLog('create', 'event', newId);
    }
    setShowForm(null);
    setFormData({
      titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800', 
      location: '', date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h1 className="retro-font text-4xl text-teal-400">{t.admin.dashboard}</h1>
        <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full hover:bg-pink-500 transition-colors">
          <LogOut size={18} /> {t.common.logout}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl w-full max-w-4xl border border-pink-500/50 my-auto">
            <h2 className="retro-font text-2xl text-pink-500 mb-6 uppercase">{t.admin.newPost} ({showForm})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-3 rounded border border-slate-700" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-3 rounded border border-slate-700" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                <textarea required placeholder="Kratek opis (SI)" className="w-full bg-slate-950 p-3 rounded border border-slate-700 h-24" value={formData.excerptSi} onChange={e => setFormData({...formData, excerptSi: e.target.value})} />
                <textarea required placeholder="Short Excerpt (EN)" className="w-full bg-slate-950 p-3 rounded border border-slate-700 h-24" value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} />
              </div>
              <div className="space-y-4">
                <textarea required placeholder="Celotna vsebina (SI)" className="w-full bg-slate-950 p-3 rounded border border-slate-700 h-24" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} />
                <textarea required placeholder="Full Content (EN)" className="w-full bg-slate-950 p-3 rounded border border-slate-700 h-24" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} />
                <input placeholder="Image URL" className="w-full bg-slate-950 p-3 rounded border border-slate-700" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                {showForm === 'event' && <input placeholder="Lokacija" className="w-full bg-slate-950 p-3 rounded border border-slate-700" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />}
                <input type="date" className="w-full bg-slate-950 p-3 rounded border border-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-4 bg-pink-500 rounded-full font-bold retro-font hover:bg-pink-600 flex items-center justify-center gap-2"><Save size={20} /> {t.common.save}</button>
              <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 bg-slate-800 rounded-full font-bold retro-font hover:bg-slate-700">{t.common.cancel}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Articles Section */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3"><ImageIcon className="text-pink-500" /> {t.admin.articles}</h2>
              <button onClick={() => setShowForm('article')} className="bg-pink-500 p-2 rounded-full hover:scale-110 transition-transform"><Plus size={24} /></button>
            </div>
            <div className="space-y-4">
              {articles.map(art => (
                <div key={art.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-pink-500 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={art.image} className="w-12 h-12 rounded object-cover" />
                    <span className="font-medium truncate max-w-xs">{art.title[lang]}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-teal-400 hover:bg-teal-400/10 rounded-full"><Edit3 size={18} /></button>
                    <button onClick={() => { if(confirm('Delete?')){ setArticles(a => a.filter(x => x.id !== art.id)); addLog('delete','article',art.id); } }} className="p-2 text-pink-500 hover:bg-pink-500/10 rounded-full"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events Section */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3"><Calendar className="text-teal-400" /> {t.admin.events}</h2>
              <button onClick={() => setShowForm('event')} className="bg-teal-400 p-2 rounded-full hover:scale-110 transition-transform"><Plus size={24} /></button>
            </div>
            <div className="space-y-4">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-teal-400 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={ev.image} className="w-12 h-12 rounded object-cover" />
                    <span className="font-medium">{ev.title[lang]}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-teal-400 hover:bg-teal-400/10 rounded-full"><Edit3 size={18} /></button>
                    <button onClick={() => { if(confirm('Delete?')){ setEvents(e => e.filter(x => x.id !== ev.id)); addLog('delete','event',ev.id); } }} className="p-2 text-pink-500 hover:bg-pink-500/10 rounded-full"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-purple-500/20 shadow-xl h-fit">
          <h2 className="font-bold text-xl mb-6 text-pink-500 flex items-center gap-2 tracking-widest">{t.admin.logs}</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {logs.length === 0 ? <p className="text-slate-600 italic">{t.admin.noLogs}</p> : logs.map(log => (
              <div key={log.id} className="text-xs border-l-4 border-slate-800 pl-4 py-2 bg-slate-950/50 rounded-r-lg">
                <div className="text-slate-500 mb-1">{new Date(log.timestamp).toLocaleString()}</div>
                <div className="text-slate-300">
                  <span className="font-bold uppercase text-teal-400">{log.action}</span> {log.type}: <span className="text-slate-500">ID {log.targetId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Content components
const MainContent = () => {
  const { lang, events, articles, gallery } = useApp();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const t = translations[lang];

  return (
    <>
      {selectedImage && <Lightbox image={selectedImage} onClose={() => setSelectedImage(null)} />}
      <Hero />
      
      <Section id="about" title={t.sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-950">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <p className="text-xl text-slate-300 leading-relaxed font-light">
              Avtonostalgija 80&90 ni zgolj klub, je časovni stroj. Oživljamo spomine na dobo, ko je bila vožnja analogna, občutki pa pristni.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 glass rounded-2xl border-pink-500/20 text-center">
                <div className="text-4xl font-black text-pink-500 mb-2">500+</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Članov</div>
              </div>
              <div className="p-6 glass rounded-2xl border-teal-500/20 text-center">
                <div className="text-4xl font-black text-teal-400 mb-2">20+</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Dogodkov letno</div>
              </div>
            </div>
            <button className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold retro-font hover:shadow-2xl transition-all shadow-pink-500/20">Preberi celotno zgodbo</button>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-teal-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800" className="relative z-10 rounded-2xl border border-white/10 shadow-2xl" />
          </div>
        </div>
      </Section>

      <Section id="youngtimer" title={t.sections.youngtimerTitle} gradient="bg-gradient-to-b from-indigo-950 to-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Starost", desc: "Vozila stara med 20 in 30 let, ki se počasi poslavljajo od vsakdanje uporabe." },
            { title: "Kondicija", desc: "Poudarek na originalnosti in vrhunski ohranjenosti brez modernih predelav." },
            { title: "Karakter", desc: "Vozila, ki so v svojem času predstavljala tehnološki ali oblikovni vrhunec." }
          ].map((box, i) => (
            <div key={i} className="p-10 bg-slate-900/50 rounded-3xl border border-slate-800 hover:border-teal-400 transition-colors group">
              <h3 className="retro-font text-2xl text-teal-400 mb-4 group-hover:neon-text-teal">{box.title}</h3>
              <p className="text-slate-400 leading-relaxed">{box.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="practices" title={t.sections.practicesTitle} gradient="bg-gradient-to-b from-slate-950 to-purple-950">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex gap-8 items-start">
             <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center shrink-0 retro-font text-2xl">1</div>
             <div>
               <h4 className="text-xl font-bold mb-2">Originalni deli</h4>
               <p className="text-slate-400">Vedno stremite k uporabi OEM delov za ohranjanje vrednosti in zanesljivosti vašega youngtimerja.</p>
             </div>
          </div>
          <div className="flex gap-8 items-start">
             <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center shrink-0 retro-font text-2xl">2</div>
             <div>
               <h4 className="text-xl font-bold mb-2">Pravilno skladiščenje</h4>
               <p className="text-slate-400">Suh, zračen prostor in zaščita pred UV žarki sta ključna za ohranitev laka in notranjosti.</p>
             </div>
          </div>
        </div>
      </Section>

      <Section id="events" title={t.sections.events} gradient="bg-gradient-to-b from-purple-950 to-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {events.map((event) => (
            <Link key={event.id} to={`/event/${event.slug}`} className="group relative block bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 hover:border-pink-500 transition-all shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={event.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="p-8">
                <div className="flex items-center text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
                  <Calendar size={14} className="mr-2 text-pink-500" /> {event.date}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-pink-500 transition-colors">{event.title[lang]}</h3>
                <p className="text-sm text-slate-400 flex items-center"><MapPin size={16} className="text-teal-400 mr-2" /> {event.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-slate-950 to-teal-950">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-col lg:flex-row gap-8 items-center glass p-8 rounded-[2.5rem] border-white/5 group">
              <div className="w-full lg:w-56 h-56 shrink-0 overflow-hidden rounded-3xl">
                <img src={article.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <span className="bg-pink-500/20 text-pink-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{article.category}</span>
                <h3 className="text-2xl font-black mt-4 mb-3 group-hover:text-teal-400 transition-colors tracking-tight">
                  <Link to={`/article/${article.slug}`}>{article.title[lang]}</Link>
                </h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">{article.excerpt[lang]}</p>
                <Link to={`/article/${article.slug}`} className="px-6 py-2 bg-slate-800 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-pink-500 transition-colors inline-flex items-center gap-2">
                  {t.common.readMore} <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-teal-950 to-slate-950">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {gallery[0]?.images.map((img, idx) => (
            <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-xl aspect-square" onClick={() => setSelectedImage(img)}>
              <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-3" />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full"><ExternalLink size={24} className="text-white" /></div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" title={t.nav.contact} gradient="bg-gradient-to-b from-slate-950 to-indigo-950">
        <div className="max-w-xl mx-auto glass p-12 rounded-[3rem] border-pink-500/20 text-center space-y-8">
          <p className="text-2xl text-slate-300 font-light italic">"Klasika, ki jo pišete vi."</p>
          <div className="space-y-4">
             <p className="text-slate-400">info@avtonostalgija.si</p>
             <p className="text-slate-400">+386 41 000 000</p>
             <p className="text-slate-500 text-sm">Ljubljana, Slovenija</p>
          </div>
          <div className="flex justify-center gap-6 pt-4">
             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-colors shadow-lg">f</div>
             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-colors shadow-lg">in</div>
          </div>
        </div>
      </Section>
    </>
  );
};

// Pages
const LoginPage = () => {
  const { setIsAdmin, lang } = useApp();
  const t = translations[lang];
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'admin') {
      setIsAdmin(true);
      navigate('/admin');
    } else {
      alert('Wrong password (hint: admin)');
    }
  };

  return (
    <div className="pt-48 pb-20 flex justify-center h-screen px-4 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950">
      <div className="glass p-12 rounded-[3rem] w-full max-w-md border border-pink-500/30 shadow-2xl h-fit">
        <h2 className="retro-font text-3xl text-pink-500 mb-8 text-center uppercase tracking-tighter">Admin Portal</h2>
        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-4 ml-1">Secure Code</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-full px-6 py-4 focus:border-pink-500 outline-none transition-all text-center tracking-[0.5em] text-xl"
              placeholder="••••"
            />
          </div>
          <button type="submit" className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold uppercase retro-font tracking-widest text-lg shadow-xl shadow-pink-500/20 hover:scale-105 transition-transform">
            {t.common.login}
          </button>
        </form>
      </div>
    </div>
  );
};

const ArticlePage = () => {
  const { slug } = useLocation().pathname.split('/').pop() ? { slug: useLocation().pathname.split('/').pop() } : { slug: '' };
  const { articles, lang } = useApp();
  const article = articles.find(a => a.slug === slug);
  const t = translations[lang];

  useEffect(() => window.scrollTo(0,0), []);

  if (!article) return <div className="pt-48 text-center h-screen text-3xl retro-font">Post not found</div>;

  return (
    <div className="pt-48 pb-32 px-4 max-w-5xl mx-auto">
      <Link to="/" className="text-pink-500 flex items-center gap-2 mb-12 hover:-translate-x-2 transition-transform font-bold uppercase text-xs tracking-widest">
         &larr; {t.common.back}
      </Link>
      <div className="relative mb-16 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
        <img src={article.image} className="w-full aspect-[21/9] object-cover group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        <div className="absolute bottom-10 left-10">
           <span className="bg-pink-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">{article.category}</span>
        </div>
      </div>
      <h1 className="text-5xl md:text-8xl font-black mb-10 retro-font leading-[0.9] tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-white to-teal-400">{article.title[lang]}</h1>
      <div className="flex flex-wrap items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-16 border-y border-slate-800 py-8">
        <span className="flex items-center gap-2"><User size={16} className="text-pink-500" /> {t.common.author}: <strong className="text-slate-200">{article.author}</strong></span>
        <span className="flex items-center gap-2"><Calendar size={16} className="text-teal-400" /> {t.common.date}: <strong className="text-slate-200">{article.date}</strong></span>
      </div>
      <div className="prose prose-invert prose-pink max-w-none text-slate-300 leading-relaxed text-xl space-y-8">
        {article.content[lang]}
      </div>
    </div>
  );
};

const EventPage = () => {
  const { slug } = useLocation().pathname.split('/').pop() ? { slug: useLocation().pathname.split('/').pop() } : { slug: '' };
  const { events, lang } = useApp();
  const event = events.find(e => e.slug === slug);
  const t = translations[lang];

  useEffect(() => window.scrollTo(0,0), []);

  if (!event) return <div className="pt-48 text-center h-screen text-3xl retro-font">Event not found</div>;

  return (
    <div className="pt-48 pb-32 px-4 max-w-7xl mx-auto">
      <Link to="/" className="text-teal-400 flex items-center gap-2 mb-12 hover:-translate-x-2 transition-transform font-bold uppercase text-xs tracking-widest">
         &larr; {t.common.back}
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-7">
          <img src={event.image} className="w-full aspect-video object-cover rounded-[3rem] shadow-2xl border border-white/5" />
          <div className="mt-12 space-y-8">
             <h1 className="text-4xl md:text-7xl font-black retro-font leading-none text-pink-500 tracking-tighter uppercase">{event.title[lang]}</h1>
             <p className="text-xl text-slate-400 leading-relaxed">{event.description[lang]}</p>
          </div>
        </div>
        <div className="lg:col-span-5 space-y-8 sticky top-32">
          <div className="glass p-10 rounded-[2.5rem] border-teal-500/20 shadow-2xl space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-5 text-slate-200 group">
                 <div className="p-4 bg-teal-400/10 rounded-2xl group-hover:bg-teal-400 group-hover:text-slate-950 transition-colors"><Calendar /></div>
                 <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Datum dogodka</div>
                    <div className="text-lg font-bold">{event.date}</div>
                 </div>
              </div>
              <div className="flex items-center gap-5 text-slate-200 group">
                 <div className="p-4 bg-pink-500/10 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-colors"><MapPin /></div>
                 <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Prizorišče</div>
                    <div className="text-lg font-bold">{event.location}</div>
                 </div>
              </div>
            </div>
            
            <div className="bg-slate-950 p-2 rounded-[2rem] border border-slate-800 h-64 overflow-hidden">
               <iframe 
                 src={event.mapUrl} 
                 width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                 className="grayscale invert contrast-125"
               ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>('si');
  const [isAdmin, setIsAdmin] = useState(false);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const addLog = (action: ActivityLog['action'], type: ActivityLog['type'], targetId: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      action, type, targetId,
      timestamp: new Date().toISOString()
    };
    setLogs([newLog, ...logs]);
  };

  return (
    <AppContext.Provider value={{ 
      lang, setLang, isAdmin, setIsAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog 
    }}>
      <HashRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<MainContent />} />
              <Route path="/article/:slug" element={<ArticlePage />} />
              <Route path="/event/:slug" element={<EventPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminCMS />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

const Footer = () => {
  const { lang } = useApp();
  const t = translations[lang];
  return (
    <footer className="bg-slate-950 border-t border-purple-500/20 py-24 px-4 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
        <div className="md:col-span-2">
          <h3 className="retro-font text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 mb-6">Avtonostalgija 80&90</h3>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">Skupaj ohranjamo zapuščino zlate dobe avtomobilizma za prihodnje generacije ljubiteljev.</p>
        </div>
        <div>
          <h4 className="font-black uppercase tracking-[0.2em] text-xs text-slate-500 mb-6">Dokumentacija</h4>
          <div className="flex flex-col space-y-4 text-sm font-bold uppercase">
            <Link to="/privacy" className="hover:text-pink-500 transition-colors">Zasebnost</Link>
            <Link to="/terms" className="hover:text-pink-500 transition-colors">Pogoji uporabe</Link>
          </div>
        </div>
        <div>
          <h4 className="font-black uppercase tracking-[0.2em] text-xs text-slate-500 mb-6">Podpora</h4>
          <div className="flex flex-col space-y-4 text-sm font-bold">
            <p className="text-slate-400">info@avtonostalgija.si</p>
            <p className="text-slate-400">+386 41 000 000</p>
          </div>
        </div>
      </div>
      <div className="mt-24 text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
        &copy; MMXXIV Avtonostalgija 80&90. Digitalno doživetje.
      </div>
    </footer>
  );
};

export default App;