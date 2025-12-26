
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { translations } from './translations';
import { Language, Article, Event, GalleryItem, ActivityLog } from './types';

// --- INDEXEDDB STORAGE UTILITIES ---
const DB_NAME = 'AvtoNostalgijaDB';
const STORE_NAME = 'content';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const persistData = async (key: string, data: any) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, key);
    return new Promise((resolve) => (tx.oncomplete = () => resolve(true)));
  } catch (e) {
    console.error("Failed to save to IDB", e);
  }
};

const fetchPersistedData = async (key: string) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
  } catch (e) {
    console.error("Failed to load from IDB", e);
    return null;
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
} | null>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- INITIAL DATA ---
const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'vstop-v-svet-youngtimerjev',
    title: { si: 'Vstop v svet Youngtimerjev', en: 'Entering the World of Youngtimers' },
    excerpt: { si: 'Kaj definira avtomobil iz 80-ih in 90-ih kot klasiko?', en: 'What defines an 80s or 90s car as a classic?' },
    content: { 
      si: 'V Sloveniji se meja za Youngtimerje vztrajno pomika v devetdeseta leta. Modeli kot so BMW E30, VW Golf II in Mazda MX-5 so postali ikone.\n\nYoungtimerji nam ponujajo analogni občutek vožnje, ki ga v modernih digitaliziranih vozilih ne najdemo več.', 
      en: 'In Slovenia, the threshold for Youngtimers is steadily moving into the nineties. Models like the BMW E30, VW Golf II, and Mazda MX-5 have become icons.' 
    },
    image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1200',
    author: 'Admin',
    date: '2024-03-20',
    category: 'Vodnik',
    tags: ['E30', '90s']
  }
];

const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    slug: 'retro-srecanje-ljubljana',
    title: { si: 'Retro Srečanje Ljubljana 2024', en: 'Retro Meet Ljubljana 2024' },
    description: { 
      si: 'Največje srečanje ljubiteljev 80ih in 90ih v osrednji Sloveniji. Pričakujemo več kot 200 vozil iz celotne regije.', 
      en: 'The biggest meeting of 80s and 90s fans in central Slovenia.' 
    },
    date: '2024-05-15',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=1200',
    location: 'Ljubljana, Kongresni trg',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2768.456!2d14.505!'
  }
];

const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: '1',
    eventId: '1',
    title: { si: 'Zbor Ljubljana', en: 'Ljubljana Meet' },
    images: [
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=1200'
    ]
  }
];

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
    { label: t.nav.contact, id: 'contact' }
  ];

  return (
    <nav className="fixed w-full z-50 glass border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div onClick={() => handleNavClick('hero')} className="flex items-center space-x-2 cursor-pointer relative z-50">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg">AN</div>
            <span className="retro-font text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400">
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

          <button className="lg:hidden text-slate-100 p-2 cursor-pointer relative z-50" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden glass border-t border-purple-500/20 absolute top-20 w-full max-h-[calc(100vh-5rem)] overflow-y-auto z-40">
          <div className="px-4 py-8 space-y-6 flex flex-col items-center text-lg uppercase tracking-widest font-bold">
             {menuItems.map(item => (
               <button key={item.id} onClick={() => handleNavClick(item.id)} className="cursor-pointer">{item.label}</button>
             ))}
             <div className="flex space-x-6 pt-6">
                <button onClick={() => { setLang('si'); setIsOpen(false); }} className={`px-4 py-1 rounded-full cursor-pointer ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
                <button onClick={() => { setLang('en'); setIsOpen(false); }} className={`px-4 py-1 rounded-full cursor-pointer ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
             </div>
             <button onClick={handleAdminAction} className={`cursor-pointer ${isAdmin ? 'text-teal-400' : 'text-slate-400'} flex items-center gap-2 uppercase text-base tracking-widest`}>
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
  <section id={id} className={`py-20 px-4 transition-all relative ${gradient}`}>
    <div className="max-w-7xl mx-auto relative z-10">
      <h2 className="retro-font text-3xl md:text-5xl text-center mb-16 tracking-tighter uppercase font-black">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-white to-teal-400">{title}</span>
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
        <img src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover brightness-[0.3]" alt="Hero Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full flex flex-col items-center justify-center h-full">
        <h1 className="retro-font text-5xl md:text-8xl font-black mb-6 tracking-tighter neon-text-pink leading-none uppercase text-center w-full">
          {t.hero.title}
        </h1>
        <p className="text-lg md:text-2xl text-teal-400 font-light mb-12 tracking-[0.3em] uppercase italic opacity-90 text-center w-full">
          {t.hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full">
          <button 
            onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })} 
            className="px-10 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl retro-font text-lg transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest cursor-pointer relative z-20"
          >
            {t.sections.events}
          </button>
          <button 
            onClick={() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })} 
            className="px-10 py-4 border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 rounded-xl retro-font text-lg transition-all transform hover:scale-105 uppercase tracking-widest cursor-pointer relative z-20"
          >
            {t.sections.news}
          </button>
        </div>
      </div>
    </section>
  );
};

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }: { images: string[], currentIndex: number, onClose: () => void, onPrev: () => void, onNext: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
    <button className="absolute top-6 right-6 text-white p-3 bg-white/10 hover:bg-pink-500 rounded-full z-[110] transition-colors cursor-pointer" onClick={onClose}><X size={32} /></button>
    
    {images.length > 1 && (
      <>
        <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white p-4 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ArrowLeft size={48} /></button>
        <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white p-4 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }}><ArrowRight size={48} /></button>
      </>
    )}
    
    <div className="relative w-[95vw] h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <img src={images[currentIndex]} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5" alt="Enlarged view" />
      <div className="absolute bottom-[-40px] text-teal-400 text-sm font-black tracking-[0.5em] uppercase">{currentIndex + 1} / {images.length}</div>
    </div>
  </div>
);

const LoginPageOverlay = ({ onClose }: { onClose: () => void }) => {
  const { setIsAdmin, setShowAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'ADMIN8090' && password === 't2Qy!BD$Q$ (eFV8R') { 
      setIsAdmin(true); 
      localStorage.setItem('an_admin', 'true');
      onClose();
      setShowAdmin(true);
    } 
    else { alert('Napačno uporabniško ime ali geslo!'); }
  };

  return (
    <div className="fixed inset-0 z-[70] glass flex items-center justify-center p-4">
      <div className="bg-slate-900 p-10 rounded-3xl w-full max-w-sm border border-pink-500/30 shadow-2xl relative">
        <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white" onClick={onClose}><X size={24} /></button>
        <h2 className="retro-font text-2xl text-pink-500 mb-8 text-center uppercase tracking-tighter font-black">Vstop za ekipo</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-2 ml-2">Uporabniško Ime</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-6 py-3 focus:border-pink-500 outline-none transition-all text-center tracking-widest text-sm" 
              placeholder="Username" 
              required
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-2 ml-2">Geslo</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-6 py-3 focus:border-pink-500 outline-none transition-all text-center tracking-widest text-sm" 
              placeholder="••••" 
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-700 rounded-lg font-bold uppercase retro-font tracking-widest text-base shadow-xl hover:scale-[1.02] transition-transform cursor-pointer">
            Avtentikacija
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminCMSOverlay = ({ onClose }: { onClose: () => void }) => {
  const { lang, setIsAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog } = useApp();
  const [showForm, setShowForm] = useState<'article' | 'event' | 'gallery' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
    image: '', 
    location: '', date: new Date().toISOString().split('T')[0], galleryImages: [] as string[], author: 'Admin', category: 'Blog'
  });

  const handleEdit = (type: 'article' | 'event' | 'gallery', item: any) => {
    setEditingId(item.id);
    setShowForm(type);
    if (type === 'gallery') {
      setFormData({
        ...formData,
        titleSi: item.title.si, titleEn: item.title.en,
        galleryImages: item.images || []
      });
    } else {
      setFormData({
        titleSi: item.title.si, titleEn: item.title.en,
        excerptSi: item.excerpt?.si || item.description?.si || '',
        excerptEn: item.excerpt?.en || item.description?.en || '',
        contentSi: item.content?.si || '',
        contentEn: item.content?.en || '',
        image: item.image,
        location: item.location || '',
        date: item.date || new Date().toISOString().split('T')[0],
        galleryImages: [],
        author: item.author || 'Admin',
        category: item.category || 'Blog'
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        if (showForm === 'gallery') {
          const files = Array.from(e.target.files);
          if (formData.galleryImages.length + files.length > 25) {
            alert("Največje število slik v galeriji je 25!");
            setUploading(false);
            return;
          }
          const newImages = await Promise.all(files.map(file => compressImage(file)));
          setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...newImages] }));
        } else {
          const compressed = await compressImage(e.target.files[0]);
          setFormData(prev => ({ ...prev, image: compressed }));
        }
      } catch (err) {
        console.error(err);
        alert("Napaka pri nalaganju slike.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || Date.now().toString();
    const slug = (formData.titleEn || formData.titleSi).toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (showForm === 'article') {
      const artData: Article = {
        id, slug, title: { si: formData.titleSi, en: formData.titleEn },
        excerpt: { si: formData.excerptSi, en: formData.excerptEn },
        content: { si: formData.contentSi, en: formData.contentEn },
        image: formData.image, author: formData.author, date: formData.date, category: formData.category, tags: []
      };
      setArticles(prev => editingId ? prev.map(a => a.id === id ? artData : a) : [artData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'article', id);
    } else if (showForm === 'event') {
      const evData: Event = {
        id, slug, title: { si: formData.titleSi, en: formData.titleEn },
        description: { si: formData.excerptSi, en: formData.excerptEn },
        date: formData.date, author: formData.author, image: formData.image, location: formData.location,
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2768.456!2d14.505!'
      };
      setEvents(prev => editingId ? prev.map(e => e.id === id ? evData : e) : [evData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'event', id);
    } else if (showForm === 'gallery') {
      const galData: GalleryItem = {
        id, eventId: 'custom', title: { si: formData.titleSi, en: formData.titleEn },
        images: formData.galleryImages
      };
      setGallery(prev => editingId ? prev.map(g => g.id === id ? galData : g) : [galData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'gallery', id);
    }
    
    setShowForm(null);
    setEditingId(null);
    setFormData({
      titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
      image: '', 
      location: '', date: new Date().toISOString().split('T')[0], galleryImages: [], author: 'Admin', category: 'Blog'
    });
  };

  return (
    <div className="fixed inset-0 z-[70] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-8 lg:p-12 border border-purple-500/30 shadow-2xl relative">
        <button className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors cursor-pointer" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-4">
          <div>
            <h1 className="retro-font text-3xl text-teal-400 tracking-tighter uppercase font-black">Nadzorna Plošča</h1>
            <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">CMS Upravljanje Vsebin</p>
          </div>
          <button 
            onClick={() => { setIsAdmin(false); localStorage.removeItem('an_admin'); onClose(); }} 
            className="flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-xl hover:bg-pink-500 transition-all font-bold uppercase tracking-widest shadow-lg cursor-pointer"
          >
            <LogOut size={18} /> Odjava
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[80] bg-slate-950/98 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl w-full max-w-4xl border border-pink-500/50 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="retro-font text-2xl text-pink-500 mb-8 uppercase text-center tracking-tighter font-black">
                {editingId ? 'Uredi' : 'Ustvari'}: {showForm === 'article' ? 'Članek' : showForm === 'event' ? 'Dogodek' : 'Galerijo'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-4">
                  <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:border-teal-400 outline-none text-sm" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                  <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:border-teal-400 outline-none text-sm" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                  {(showForm === 'article' || showForm === 'event') && (
                    <>
                      <textarea required placeholder="Povzetek (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-20 focus:border-teal-400 outline-none text-sm" value={formData.excerptSi} onChange={e => setFormData({...formData, excerptSi: e.target.value})} />
                      <textarea required placeholder="Summary (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-20 focus:border-teal-400 outline-none text-sm" value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} />
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  {showForm === 'gallery' ? (
                    <div className="space-y-4">
                       <label className={`block p-8 border-2 border-dashed rounded-xl transition-colors text-center cursor-pointer group ${uploading ? 'border-pink-500' : 'border-slate-700 hover:border-teal-400'}`}>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                          {uploading ? <Loader2 className="mx-auto mb-4 text-pink-500 animate-spin" size={32} /> : <Upload className="mx-auto mb-4 text-slate-500 group-hover:text-teal-400" size={32} />}
                          <p className="text-xs uppercase tracking-widest text-slate-400">{uploading ? "Obdelujem slike..." : `Dodaj slike z računalnika (${formData.galleryImages.length}/25)`}</p>
                       </label>
                       <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/50 rounded-xl scrollbar-thin scrollbar-thumb-slate-800">
                          {formData.galleryImages.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded overflow-hidden relative group border border-slate-800">
                               <img src={img} className="w-full h-full object-cover" alt="Preview" />
                               <button type="button" onClick={() => setFormData(prev => ({...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <>
                      <textarea required placeholder="Vsebina (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-32 focus:border-teal-400 outline-none leading-relaxed text-sm" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} />
                      <textarea required placeholder="Content (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-32 focus:border-teal-400 outline-none leading-relaxed text-sm" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} />
                    </>
                  )}
                  {showForm !== 'gallery' && (
                    <div className="space-y-2">
                       <label className={`block p-4 border-2 border-dashed rounded-xl transition-colors text-center cursor-pointer group ${uploading ? 'border-pink-500' : 'border-slate-700 hover:border-teal-400'}`}>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                          <div className="flex items-center justify-center gap-3">
                            {uploading ? <Loader2 size={20} className="text-pink-500 animate-spin" /> : <Upload className="text-slate-500 group-hover:text-teal-400" size={20} />}
                            <p className="text-xs uppercase tracking-widest text-slate-400">{uploading ? "Obdelujem..." : "Naloži naslovno sliko"}</p>
                          </div>
                       </label>
                       <input placeholder="Ali vnesi URL slike" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:border-teal-400 outline-none text-sm" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                       {formData.image && (
                         <div className="h-24 w-full rounded-xl border border-slate-800 overflow-hidden bg-black flex items-center justify-center relative">
                            <img src={formData.image} alt="Preview" className="h-full object-contain" />
                            <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full"><X size={14} /></button>
                         </div>
                       )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:border-teal-400 outline-none text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    {showForm === 'event' && <input placeholder="Lokacija" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 focus:border-teal-400 outline-none text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <button type="submit" disabled={uploading} className="flex-1 py-4 bg-pink-500 rounded-xl font-black retro-font hover:bg-pink-600 flex items-center justify-center gap-4 text-lg shadow-xl uppercase tracking-widest cursor-pointer disabled:opacity-50">
                  <Save size={20} /> Shrani
                </button>
                <button type="button" onClick={() => { setShowForm(null); setEditingId(null); }} className="flex-1 py-4 bg-slate-800 rounded-xl font-black retro-font hover:bg-slate-700 text-lg uppercase tracking-widest cursor-pointer">
                  Prekliči
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 space-y-16">
            <AdminList 
              title="Članki" 
              icon={<ImageIcon className="text-pink-500" />} 
              items={articles} 
              onAdd={() => setShowForm('article')} 
              onEdit={(item: any) => handleEdit('article', item)} 
              onDelete={(id: string) => { 
                setArticles(prev => prev.filter(x => x.id !== id)); 
                addLog('delete', 'article', id); 
              }} 
              lang={lang} 
            />
            <AdminList 
              title="Dogodki" 
              icon={<Calendar className="text-teal-400" />} 
              items={events} 
              onAdd={() => setShowForm('event')} 
              onEdit={(item: any) => handleEdit('event', item)} 
              onDelete={(id: string) => { 
                setEvents(prev => prev.filter(x => x.id !== id)); 
                addLog('delete', 'event', id); 
              }} 
              lang={lang} 
            />
            <AdminList 
              title="Galerije" 
              icon={<ExternalLink className="text-purple-400" />} 
              items={gallery} 
              onAdd={() => setShowForm('gallery')} 
              onEdit={(item: any) => handleEdit('gallery', item)} 
              onDelete={(id: string) => { 
                setGallery(prev => prev.filter(x => x.id !== id)); 
                addLog('delete', 'gallery', id); 
              }} 
              lang={lang} 
            />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl h-fit">
              <h2 className="font-black text-sm mb-4 text-pink-500 tracking-widest flex items-center gap-3 uppercase">Dnevnik Aktivnosti</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                {logs.length === 0 ? <p className="text-slate-600 italic text-xs font-light">Brez zapisov.</p> : logs.map(log => (
                  <div key={log.id} className="text-[10px] border-l-2 border-slate-800 pl-3 py-2 bg-slate-900/50 rounded-r-lg">
                    <div className="text-slate-500 font-mono text-[8px] mb-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="text-slate-200">
                      <span className={`font-black uppercase ${log.action === 'create' ? 'text-teal-400' : 'text-pink-500'}`}>{log.action}</span> {log.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminList = ({ title, icon, items, onAdd, onEdit, onDelete, lang }: any) => (
  <div className="bg-slate-950/30 p-8 rounded-2xl border border-slate-800 shadow-xl">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">{icon} {title}</h2>
      <button onClick={onAdd} className="bg-pink-500 p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"><Plus size={18} /></button>
    </div>
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-pink-500/50 transition-all group">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={item.image || item.images?.[0]} className="w-10 h-10 rounded-lg object-cover shadow-lg shrink-0" alt="Thumb" onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=100')} />
            <span className="font-bold text-xs truncate tracking-tighter uppercase">{item.title[lang]}</span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(item); }} 
              className="p-2 text-teal-400 hover:bg-teal-400/10 rounded-full cursor-pointer relative z-10"
            >
              <Edit3 size={16} />
            </button>
            <button 
              type="button" 
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm('Ali ste prepričani, da želite izbrisati to vsebino?')) { 
                  onDelete(item.id); 
                } 
              }} 
              className="p-2 text-pink-500 hover:bg-pink-500/10 rounded-full cursor-pointer relative z-10"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MainContent = () => {
  const { lang, events, articles, gallery } = useApp();
  const [activeGallery, setActiveGallery] = useState<GalleryItem | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const t = translations[lang];

  return (
    <>
      {activeArticle && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-5xl rounded-3xl overflow-hidden border border-pink-500/30 relative flex flex-col shadow-2xl">
            <button className="absolute top-6 right-6 p-3 bg-slate-800/80 rounded-full hover:bg-pink-500 transition-colors cursor-pointer z-[70]" onClick={() => setActiveArticle(null)}><X size={24} /></button>
            <div className="overflow-y-auto max-h-[90vh]">
              <div className="w-full h-[500px] overflow-hidden bg-slate-950 flex items-center justify-center">
                <img src={activeArticle.image} className="w-full h-full object-contain md:object-cover" alt={activeArticle.title[lang]} />
              </div>
              <div className="p-8 md:p-16">
                <span className="bg-pink-500/20 text-pink-500 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block">{activeArticle.category}</span>
                <h2 className="retro-font text-3xl md:text-5xl text-teal-400 mb-8 uppercase tracking-tighter leading-tight">{activeArticle.title[lang]}</h2>
                <div className="flex flex-wrap gap-8 text-xs font-bold uppercase tracking-widest text-slate-500 mb-10 border-y border-slate-800 py-6">
                  <span>{t.common.author}: <strong className="text-slate-200">{activeArticle.author}</strong></span>
                  <span>{t.common.date}: <strong className="text-slate-200">{activeArticle.date}</strong></span>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-xl whitespace-pre-wrap font-light opacity-90">{activeArticle.content[lang]}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeEvent && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-6xl rounded-3xl overflow-hidden border border-teal-500/30 relative flex flex-col shadow-2xl">
            <button className="absolute top-6 right-6 p-3 bg-slate-800/80 rounded-full hover:bg-teal-400 hover:text-slate-900 transition-colors cursor-pointer z-[70]" onClick={() => setActiveEvent(null)}><X size={24} /></button>
            <div className="overflow-y-auto max-h-[90vh] grid grid-cols-1 lg:grid-cols-2">
              <div className="h-full min-h-[500px] bg-slate-950 flex items-center justify-center">
                <img src={activeEvent.image} className="w-full h-full object-contain md:object-cover" alt={activeEvent.title[lang]} />
              </div>
              <div className="p-8 md:p-16 space-y-10 flex flex-col">
                <h2 className="retro-font text-3xl md:text-5xl text-pink-500 uppercase tracking-tighter leading-tight">{activeEvent.title[lang]}</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-6"><Calendar className="text-teal-400" size={32} /><div className="text-xl font-bold tracking-widest uppercase">{activeEvent.date}</div></div>
                  <div className="flex items-center gap-6"><MapPin className="text-pink-500" size={32} /><div className="text-xl font-bold tracking-widest uppercase">{activeEvent.location}</div></div>
                </div>
                <p className="text-slate-300 leading-relaxed font-light text-xl italic border-l-4 border-teal-400 pl-6">{activeEvent.description[lang]}</p>
                <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 h-64 overflow-hidden mt-auto shadow-inner">
                   <iframe src={activeEvent.mapUrl} title="Map" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" className="grayscale invert opacity-50 hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeGallery && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-8 lg:p-16 border border-pink-500/30 relative">
            <button className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors cursor-pointer" onClick={() => setActiveGallery(null)}><X size={24} /></button>
            <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
              <h2 className="retro-font text-3xl text-teal-400 uppercase tracking-tighter">{activeGallery.title[lang]}</h2>
              <span className="text-pink-500 font-bold tracking-[0.3em] text-xs uppercase">{activeGallery.images.length} Fotografij</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeGallery.images.map((img, idx) => (
                <div key={idx} className="relative group cursor-zoom-in overflow-hidden rounded-2xl aspect-square shadow-xl border border-white/5" onClick={() => setLightboxIndex(idx)}>
                  <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Gallery item" />
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          onPrev={() => setLightboxIndex(prev => prev! > 0 ? prev! - 1 : activeGallery.images.length - 1)}
          onNext={() => setLightboxIndex(prev => prev! < activeGallery.images.length - 1 ? prev! + 1 : 0)}
        />
      )}

      <Hero />
      <Section id="about" title={t.sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-2xl text-slate-300 leading-relaxed font-light">Avtonostalgija 80&90 ni zgolj klub, je skupnost ljubiteljev analogne dobe.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-8 glass rounded-2xl border border-pink-500/20 text-center"><div className="text-5xl font-black text-pink-500 mb-2">500+</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Članov</div></div>
              <div className="p-8 glass rounded-2xl border border-teal-500/20 text-center"><div className="text-5xl font-black text-teal-400 mb-2">20+</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Dogodkov</div></div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800" className="relative z-10 rounded-2xl border border-white/10 shadow-2xl" alt="Passion Story" />
          </div>
        </div>
      </Section>

      <Section id="events" title={t.sections.events} gradient="bg-gradient-to-b from-indigo-900 to-purple-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {events.map((event) => (
            <div key={event.id} onClick={() => setActiveEvent(event)} className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-pink-500 transition-all shadow-2xl cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden bg-slate-950 flex items-center justify-center">
                <img src={event.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={event.title[lang]} onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=600')} />
              </div>
              <div className="p-8">
                <div className="flex items-center text-xs text-slate-400 mb-4 font-black uppercase tracking-[0.2em]"><Calendar size={16} className="mr-3 text-pink-500" /> {event.date}</div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-pink-500 transition-colors uppercase tracking-tight leading-tight">{event.title[lang]}</h3>
                <p className="text-sm text-slate-400 flex items-center font-bold tracking-widest uppercase"><MapPin size={18} className="text-teal-400 mr-3" /> {event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-purple-900 to-teal-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {articles.map((article) => (
            <div key={article.id} onClick={() => setActiveArticle(article)} className="flex flex-col sm:flex-row gap-8 items-center glass p-8 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
              <div className="w-full sm:w-56 h-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 flex items-center justify-center">
                <img src={article.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={article.title[lang]} onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=400')} />
              </div>
              <div className="flex-1 space-y-4">
                <span className="bg-pink-500/20 text-pink-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{article.category}</span>
                <h3 className="text-2xl font-black group-hover:text-teal-400 transition-colors uppercase line-clamp-2 leading-tight">{article.title[lang]}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed font-light opacity-80">{article.excerpt[lang]}</p>
                <div className="text-pink-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 group-hover:translate-x-2 transition-transform">{t.common.readMore} <ChevronRight size={16} /></div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-teal-900 to-slate-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {gallery.map((item) => (
            <div key={item.id} className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-2xl aspect-[4/3] border border-slate-800 hover:border-teal-400 transition-all" onClick={() => setActiveGallery(item)}>
              <img src={item.images[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title[lang]} onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=600')} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-10">
                <h3 className="retro-font text-2xl text-white mb-3 group-hover:text-pink-500 transition-colors uppercase tracking-tight">{item.title[lang]}</h3>
                <div className="text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3"><ImageIcon size={18} /> {item.images.length} fotografij</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" title={t.nav.contact} gradient="bg-gradient-to-t from-black to-slate-950">
        <div className="max-w-2xl mx-auto glass p-12 rounded-3xl border border-pink-500/20 text-center space-y-12">
          <p className="text-2xl text-slate-300 font-light italic">"Klasika, ki jo pišete vi."</p>
          <div className="space-y-6">
             <div className="p-8 bg-slate-800/40 rounded-2xl hover:bg-pink-500 transition-all cursor-pointer group"><p className="text-slate-400 group-hover:text-white font-black text-xl tracking-widest uppercase">info@avtonostalgija.si</p></div>
             <div className="p-8 bg-slate-800/40 rounded-2xl hover:bg-teal-400 transition-all cursor-pointer group"><p className="text-slate-400 group-hover:text-slate-950 font-black text-2xl tracking-widest">+386 41 000 000</p></div>
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
  
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadContent = async () => {
      const savedArticles = await fetchPersistedData('an_articles');
      if (savedArticles) setArticles(savedArticles as Article[]);

      const savedEvents = await fetchPersistedData('an_events');
      if (savedEvents) setEvents(savedEvents as Event[]);

      const savedGallery = await fetchPersistedData('an_gallery');
      if (savedGallery) setGallery(savedGallery as GalleryItem[]);

      const savedLogs = await fetchPersistedData('an_logs');
      if (savedLogs) setLogs(savedLogs as ActivityLog[]);
      
      const authed = localStorage.getItem('an_admin');
      if (authed === 'true') setIsAdmin(true);

      // SIGNAL: Signal that the load is finished so the auto-save doesn't overwrite deletions on startup
      setHasLoaded(true);
    };
    loadContent();
  }, []);

  // Persist to IndexedDB whenever state changes, but ONLY after initial load
  useEffect(() => {
    if (!hasLoaded) return;

    const saveToStorage = async () => {
      setIsSaving(true);
      await persistData('an_articles', articles);
      await persistData('an_events', events);
      await persistData('an_gallery', gallery);
      await persistData('an_logs', logs);
      setIsSaving(false);
    };
    saveToStorage();
  }, [articles, events, gallery, logs, hasLoaded]);

  const addLog = (action: ActivityLog['action'], type: ActivityLog['type'], targetId: string) => {
    const newLog: ActivityLog = { id: Date.now().toString(), action, type, targetId, timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <AppContext.Provider value={{ 
      lang, setLang, isAdmin, setIsAdmin, showLogin, setShowLogin, showAdmin, setShowAdmin,
      articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog,
      isSaving, setIsSaving
    }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500 font-sans tracking-tight">
        <Navbar />
        {isSaving && <div className="fixed bottom-4 right-4 z-[99] glass px-4 py-2 rounded-full border border-teal-500/50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-400">
           <Loader2 size={12} className="animate-spin" /> Shranjujem v bazo...
        </div>}
        <main>
          <MainContent />
          {showLogin && <LoginPageOverlay onClose={() => setShowLogin(false)} />}
          {showAdmin && isAdmin && <AdminCMSOverlay onClose={() => setShowAdmin(false)} />}
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
};

const Footer = () => {
  const { lang } = useApp();
  const t = translations[lang];

  return (
    <footer className="bg-slate-950 border-t border-purple-500/20 py-24 px-4 text-center">
      <div className="max-w-7xl mx-auto space-y-12">
        <h3 className="retro-font text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 uppercase tracking-tighter">Avtonostalgija 80&90</h3>
        <p className="text-slate-400 text-xl italic opacity-80 font-light">Skupaj ohranjamo zapuščino zlate dobe avtomobilizma.</p>
        <div className="pt-16 text-[10px] font-black uppercase tracking-[1em] text-slate-800">
          &copy; 2024 Avtonostalgija 80&90. Vse pravice pridržane.
        </div>
      </div>
    </footer>
  );
};

export default App;
