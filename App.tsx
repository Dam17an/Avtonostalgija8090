import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight, Upload, Loader2, ChevronDown, MessageSquare, Phone, Mail, Settings, Clock, Cookie } from 'lucide-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { translations } from './translations';
import { Language, Article, Event, GalleryItem, ActivityLog, SiteSettings } from './types';

// --- SHARED BACKEND CONFIGURATION ---
const SUPABASE_URL = 'https://jtkhmwwbwlvqwwxlvdoa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0a2htd3did2x2cXd3eGx2ZG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQyMjYsImV4cCI6MjA4MjQxMDIyNn0.MWiSmvEwjuoafmrwbjEtQFrYW1iqDbSAYmZJjNkG7zE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STORAGE UTILITIES ---
const persistData = async (key: string, data: any) => {
  try {
    const isCollection = ['an_articles', 'an_events', 'an_gallery'].includes(key) && Array.isArray(data);
    if (isCollection) {
      const listKey = `${key}_list`;
      const ids = data.map((item: any) => item.id);
      await supabase.from('an_content').upsert({ key: listKey, data: ids });
      await Promise.all(data.map(item => 
        supabase.from('an_content').upsert({ key: `${key}_item_${item.id}`, data: item })
      ));
    } else {
      await supabase.from('an_content').upsert({ key, data });
    }
  } catch (e: any) {
    console.error(`Supabase Sync Error [${key}]:`, e.message);
  }
};

const fetchPersistedData = async (key: string) => {
  try {
    const isCollection = ['an_articles', 'an_events', 'an_gallery'].includes(key);
    if (isCollection) {
      const { data: listResult } = await supabase.from('an_content').select('data').eq('key', `${key}_list`).maybeSingle();
      const ids = listResult?.data;
      if (ids && Array.isArray(ids)) {
        const itemKeys = ids.map(id => `${key}_item_${id}`);
        const { data: itemsResult } = await supabase.from('an_content').select('data').in('key', itemKeys);
        if (itemsResult) {
          const dataMap = new Map(itemsResult.map(r => [r.data.id, r.data]));
          return ids.map(id => dataMap.get(id)).filter(Boolean);
        }
      }
      return [];
    }
    const { data, error } = await supabase.from('an_content').select('data').eq('key', key).maybeSingle();
    if (data) return data.data;
    if (error) throw error;
    return null;
  } catch (e: any) {
    console.error(`Supabase Fetch Error [${key}]:`, e);
    return null;
  }
};

const compressImageToBlob = (file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> => {
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
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const uploadImage = async (blob: Blob, folder: string) => {
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { data, error } = await supabase.storage.from('media').upload(fileName, blob, {
    contentType: 'image/jpeg',
    upsert: true
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);
  return publicUrl;
};

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
  showMembershipModal: boolean;
  setShowMembershipModal: (b: boolean) => void;
} | null>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const Modal = ({ children, onClose }: { children?: React.ReactNode; onClose: () => void }) => (
  <div 
    className="fixed inset-0 z-[100] glass flex items-start justify-center p-4 overflow-y-auto cursor-pointer"
    onClick={onClose}
  >
    <div 
      className="bg-slate-900 w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl relative my-8 p-6 sm:p-10 animate-in fade-in zoom-in duration-300 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors z-20 shadow-lg text-white" 
        onClick={onClose}
        aria-label="Close modal"
      >
        <X size={24} />
      </button>
      {children}
    </div>
  </div>
);

const DetailView = ({ item, type, onClose }: { item: any; type: 'article' | 'event'; onClose: () => void }) => {
  const { lang } = useApp();
  const title = item.title[lang];
  const content = type === 'article' ? item.content?.[lang] : item.description?.[lang];
  const date = new Date(item.date).toLocaleDateString();

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5">
          <img src={item.image} className="w-full h-full object-cover" alt={title} />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest font-black text-slate-500">
            {type === 'article' && <span className="text-pink-500">{item.category}</span>}
            <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
            {type === 'event' && <span className="flex items-center gap-1 text-teal-400"><MapPin size={12} /> {item.location}</span>}
            {item.author && <span className="flex items-center gap-1"><User size={12} /> {item.author}</span>}
          </div>
          <h2 className="retro-font text-2xl sm:text-4xl text-white font-black uppercase tracking-tighter leading-tight">{title}</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed text-sm sm:text-lg whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const GalleryLightbox = ({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) => {
  const [index, setIndex] = useState(initialIndex);
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setIndex(prev => (prev > 0 ? prev - 1 : images.length - 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setIndex(prev => (prev < images.length - 1 ? prev + 1 : 0)); };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 cursor-default" onClick={onClose}>
      <button className="absolute top-6 right-6 p-4 text-white hover:text-pink-500 transition-colors" onClick={onClose}><X size={32} /></button>
      <button className="absolute left-6 p-4 text-white hover:text-pink-500 transition-colors hidden sm:block" onClick={handlePrev}><ArrowLeft size={48} /></button>
      <button className="absolute right-6 p-4 text-white hover:text-pink-500 transition-colors hidden sm:block" onClick={handleNext}><ArrowRight size={48} /></button>
      <img src={images[index]} className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in fade-in duration-300" alt="Gallery" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 font-bold uppercase tracking-widest text-xs">
        {index + 1} / {images.length}
      </div>
    </div>
  );
};

const SignaturePad = ({ onSave }: { onSave: (data: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    onSave(canvasRef.current!.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    onSave('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Podpis</label>
      <div className="border border-slate-700 bg-black rounded-xl overflow-hidden touch-none relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[150px] cursor-crosshair bg-black"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <button type="button" onClick={clear} className="absolute bottom-2 right-2 p-1 bg-slate-800/80 rounded text-[8px] uppercase font-bold text-slate-400 hover:text-white transition-colors">Počisti</button>
      </div>
    </div>
  );
};

const MembershipModal = ({ onClose }: { onClose: () => void }) => {
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signature) {
      alert("Prosimo, dodajte svoj podpis.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      address: formData.get('address'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      emso: formData.get('emso'),
      birth_place: formData.get('birth_place'),
      vehicle_type: formData.get('vehicle_type'),
      shirt_size: formData.get('shirt_size'),
      date: formData.get('date'),
      signature: signature
    };
    try {
      (window as any).emailjs.init("0XBKLVyfoTbX1tjxl");
      await (window as any).emailjs.send("service_0ag32va", "template_vpe5zil", data);
      alert("Obrazec je bil uspešno poslan! Prejeli boste potrditveno e-pošto.");
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      alert("Prišlo je do napake pri pošiljanju. Prosimo, poskusite znova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] glass flex items-start justify-center p-4 overflow-y-auto cursor-pointer" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-teal-500/30 shadow-2xl relative my-8 overflow-hidden flex flex-col md:flex-row cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-800">
          <button className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors z-10 text-white" onClick={onClose} aria-label="Close modal"><X size={24} /></button>
          <h2 className="retro-font text-xl sm:text-2xl text-teal-400 mb-8 uppercase text-center font-black tracking-tighter">Vloga za včlanitev</h2>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Ime in priimek</label>
                <input required name="name" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="Janez Novak" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Naslov</label>
                <input required name="address" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="Ulica 1, 1000 Ljubljana" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Telefon</label>
                <input required name="phone" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="041 123 456" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">E-pošta</label>
                <input required type="email" name="email" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="janez@novak.si" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">EMŠO</label>
                <input required name="emso" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="0101980500123" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Kraj rojstva</label>
                <input required name="birth_place" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="Ljubljana" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Tip vozila</label>
                <input required name="vehicle_type" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder="Golf MK2" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Velikost majice</label>
                <select required name="shirt_size" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm">
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 text-justify">
              S podpisom izjavljam, da želim postati član-ica kluba AVTONOSTALGIJA 80&90, klub ljubiteljev mladodobnikov in, da sprejemam statut kluba ter sem se pripravljen-a ravnati po njem.
              Klubu dovoljujem zbiranje, obdelavo in uporabo mojih osebnih podatkov za potrebe delovanja kluba, pri čemer je dolžno ravnati v skladu z določili Zakona o varstvu osebnih podatkov. Dovoljujem tudi javno objavljanje slikovnega, video in zvočnega materiala, ki prikazuje dejavnost društva in vsebuje moje posnetke.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <SignaturePad onSave={setSignature} />
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Datum</label>
                <input required type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" />
              </div>
            </div>
            <div className="flex items-start gap-3 px-1">
              <input required type="checkbox" id="agreement" className="mt-1 accent-teal-400" />
              <label htmlFor="agreement" className="text-[10px] text-slate-500 leading-snug">
                Z uporabo tega obrazca se strinjate s shranjevanjem in obdelavo vaših podatkov na tej spletni strani.*
              </label>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-4 bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Pošlji vlogo za včlanitev"}
            </button>
          </form>
        </div>
        <div className="w-full md:w-80 lg:w-96 p-6 sm:p-10 bg-slate-950/50 flex flex-col space-y-6">
          <div className="space-y-4">
            <h3 className="text-teal-400 font-black uppercase tracking-widest text-sm">Navodila za plačilo</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">Članarino 25 EUR lahko nakažete preko spletne banke na TRR ali plačate preko plačilnega naloga na pošti, banki ali hranilnici. Navodila za izpolnjevanje UPN naloga so na voljo spodaj.</p>
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Koda namena</div>
              <div className="text-xs font-mono text-slate-200">OTHR</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Namen</div>
              <div className="text-xs font-mono text-slate-200">Članarina IME_PRIIMEK_ČLANA 2026</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Znesek</div>
              <div className="text-xs font-mono text-slate-200">25,00 EUR</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">BIC banke prejemnika</div>
              <div className="text-xs font-mono text-slate-200">HDELSI22</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">IBAN</div>
              <div className="text-xs font-mono text-slate-200">SI56 6100 0002 3775 920</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Referenca</div>
              <div className="text-xs font-mono text-slate-200">SI00 “yyyymmdd” – primer: SI00 20200325</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Naziv prejemnika</div>
              <div className="text-xs font-mono text-slate-200">KLUB AVTONOSTALGIJA 80&90<br/>Trinkova 58, 1000 Ljubljana</div>
            </div>
          </div>
          <div className="mt-auto pt-6 text-[9px] text-slate-500 italic leading-snug">
            Članarino lahko poravnate preko povezave ali QR kode, ki jo boste prejeli po elektronski pošti po oddaji vloge.
          </div>
        </div>
      </div>
    </div>
  );
};

const INITIAL_SETTINGS: SiteSettings = {
  heroImage: 'https://cdn.discordapp.com/attachments/1180963437984092244/1455924065842892850/Gemini_Generated_Image_2za4n12za4n12za4.png?ex=69572733&is=6955d5b3&hm=034d0794c2573369d0d60e5f3e62391d03e637e100d33386f92d1c994a867734',
  aboutImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200',
  memberCount: '3,500',
  eventCount: '30+'
};

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
    { label: t.faq.title, id: 'youngtimer' },
    { label: t.nav.contact, id: 'contact' }
  ];
  return (
    <nav className="fixed w-full z-50 glass border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div onClick={() => handleNavClick('hero')} className="flex items-center cursor-pointer relative z-50 ml-0 lg:-ml-16">
            <img src="https://avtonostalgija.si/wp-content/uploads/2022/11/youngtimer-avtonostalgija-1.png" alt="Avtonostalgija Logo" className="h-10 sm:h-12 w-auto object-contain" />
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
              {isAdmin ? "Admin Panel" : translations[lang].common.login}
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
        <span className="text-base sm:text-xl font-bold tracking-tight text-slate-100 group-hover:text-teal-400 transition-colors uppercase">{question}</span>
        <ChevronDown className={`text-pink-500 shrink-0 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} size={24} />
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-max opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-5 sm:p-6 pt-0 text-slate-400 leading-relaxed font-light text-sm sm:text-base border-t border-white/5 bg-slate-950/30 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: answer }} />
      </div>
    </div>
  );
};

const YoungtimerSection = ({ transparent }: { transparent?: boolean }) => {
  const { lang, setShowMembershipModal } = useApp();
  const t = translations[lang];
  return (
    <Section id="youngtimer" title={t.faq.title} gradient={transparent ? "bg-transparent" : "bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950"}>
      <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
        <div className="space-y-6">
          <div className="space-y-4">
            <FAQItem question={t.faq.q1} answer={t.faq.a1} />
            <FAQItem question={t.faq.q2} answer={t.faq.a2} />
            <FAQItem question={t.faq.q3} answer={t.faq.a3} />
            <FAQItem question={t.faq.q4} answer={t.faq.a4} />
            <FAQItem question={t.faq.q5} answer={t.faq.a5} />
            <FAQItem question={t.faq.q6} answer={t.faq.a6} />
            <FAQItem question={t.faq.q7} answer={t.faq.a7} />
            <FAQItem question={t.faq.q8} answer={t.faq.a8} />
          </div>
        </div>
        <div id="vclani-se" className="space-y-10 sm:space-y-16 pt-10 sm:pt-20 border-t border-white/5">
          <div className="space-y-12">
            <h3 className="retro-font text-2xl sm:text-4xl text-teal-400 uppercase tracking-widest text-center font-black">Zakaj sem član Avtonostalgije 80&90?</h3>
            <div className="grid grid-cols-1 gap-8">
              <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 blur-[80px] group-hover:bg-teal-400/10 transition-colors duration-1000" />
                <div className="space-y-8 relative z-10 text-slate-300 leading-relaxed">
                  <div className="space-y-4 text-lg sm:text-xl text-slate-100 font-bold">
                    <p>Ker avtomobil ni zgolj prevozno sredstvo, temveč del moje identitete, mojih spominov in tehnične kulture svojega časa.</p>
                    <p>Ker verjamem, da imajo avtomobili 80. in 90. let resnično kulturno vrednost – vrednost, ki jo je treba razumeti, zagovarjati in aktivno ohranjati.</p>
                  </div>

                  <div className="py-6 border-y border-white/5">
                    <p className="text-xl sm:text-2xl text-pink-500 font-black uppercase tracking-tighter mb-2">Avtonostalgija 80&90 ni klub popustov.</p>
                    <p>Je skupnost ljudi, ki razumejo, da prihodnost youngtimerjev and oldtimerjev ni samoumevna in da brez organiziranega delovanja preprosto ne obstaja.</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-teal-400 font-black uppercase tracking-widest text-sm">Klub obstaja zato, da:</h4>
                    <ul className="space-y-3">
                      {[
                        "zastopa lastnike vozil v dialogu z zakonodajo v Sloveniji in Evropski uniji,",
                        "ohranja pravico do uporabe, vožnje in dolgoročne vrednosti mladodobnih in starodobnih vozil,",
                        "gradi okolje, v katerem so avtomobili 80. in 90. let prepoznani kot tehniška in kulturna dediščina,",
                        "povezuje znanje, izkušnje in ljudi na način, ki ga posameznik sam nikoli ne bi mogel doseči."
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0 shadow-[0_0_8px_#ec4899]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 italic">
                    <p className="font-bold text-slate-100 mb-2">Brez skupnosti zakonodaja ne deluje v našo korist.</p>
                    <p>Brez kluba ni dogodkov, ni tehničnih standardov, ni zaščite interesov in – kar je najpomembneje – ni prihodnosti za naše avtomobile.</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-teal-400 font-black uppercase tracking-widest text-sm">Kaj pomeni članstvo v praksi?</h4>
                    <p className="font-bold text-slate-200">Članstvo pomeni dostop do znanja, podpore and skupne moči:</p>
                    <ul className="space-y-3">
                      {[
                        "strokovno vodenje postopkov certificiranja in tehničnih vprašanj,",
                        "stalno spremljanje zakonodajnih sprememb in aktivnosti doma ter v tujini,",
                        "pomoč pri homologacijah, uvozu, predelavah in vrednotenju vozil,",
                        "možnost aktivnega sodelovanja na klubskih dogodkih, vožnjah in tehničnih dnevih,",
                        "večjo vidnost in priložnosti za vozila (mediji, filmi, razstave, posebni dogodki),",
                        "povezovanje s skupnostjo, ki deli iste vrednote, razumevanje in strast."
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0 shadow-[0_0_8px_#14b8a6]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p>Članstvo je pomembno, ker posameznik nima glasu, organizirana skupnost pa ga ima. Sodelovanje kluba s SVAMZ pa mu daje strokovno, pravno in institucionalno legitimnost ter glas v nacionalnih in evropskih zakonodajnih procesih, kjer se odloča o prihodnosti historičnih in youngtimer vozil; brez te povezave bi bil klub zgolj interesna skupina brez realnega vpliva, ne pa del sistema, ki dolgoročno ščiti pravico do obstoja, uporabe in priznanja teh vozil.</p>

                  <p>Z včlanitvijo v klub in SVAMZ ne iščeš ugodnosti, temveč se poistovetiš z misijo: ohraniti avtomobile 80. in 90. let kot živo dediščino, jim zagotoviti prostor na cestah ter ustvariti okolje, v katerem bodo lahko vozni, razumljeni in cenjeni tudi čez 10, 20 ali 30 let.</p>

                  <div className="py-4 text-center">
                    <p className="text-xl font-black text-pink-500 uppercase tracking-widest mb-1">Članstvo ni strošek.</p>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Je zavestna naložba v prihodnost avtomobilske kulture, ki ti je blizu.</p>
                  </div>

                  <div className="p-6 border border-teal-500/30 rounded-2xl bg-teal-500/5 text-center sm:text-left">
                    <p className="text-slate-100 font-bold leading-relaxed">
                      👉 Če razumeš, zakaj ti tvoj avto pomeni več kot le kos pločevine, potem Avtonostalgija 80&90 ni le klub. 
                      <br className="hidden sm:block" />
                      <span className="text-teal-400 uppercase font-black text-lg tracking-tighter">Je tvoj prostor. Skupaj smo močnejši!</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-12">
            <button onClick={() => setShowMembershipModal(true)} className="px-12 py-5 bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(20,184,166,0.4)] text-xl cursor-pointer">Postani član zdaj</button>
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
    <section id="hero" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={settings.heroImage} className="w-full h-full object-cover brightness-[1.0]" alt="Hero Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/5 to-slate-950/40"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-screen pt-24 pb-20">
        <img src="https://avtonostalgija.si/wp-content/uploads/2022/11/youngtimer-avtonostalgija-2.png" alt="Logo" className="h-32 sm:h-48 md:h-64 w-auto mb-8 sm:mb-12 object-contain" />
        <h1 className="retro-font font-black mb-4 sm:mb-6 tracking-tighter uppercase text-center w-full flex flex-col items-center">
          <span className="text-[6.2vw] xs:text-[7.5vw] sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl whitespace-nowrap block neon-text-pink leading-none pb-2 sm:pb-4">{namePart}</span>
          <span className="text-[12vw] xs:text-[11vw] sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl block neon-text-teal text-teal-400 leading-none">{yearPart}</span>
        </h1>
        <p className="text-sm sm:text-lg md:text-2xl text-teal-400 font-light mb-8 sm:mb-12 tracking-[0.2em] sm:tracking-[0.3em] uppercase italic opacity-90 text-center w-full max-w-3xl mx-auto" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>{t.hero.subtitle}</p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-4xl mx-auto">
          <button onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl retro-font text-xs sm:text-lg transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest cursor-pointer relative z-20">{translations[lang].sections.events}</button>
          <button onClick={() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 rounded-xl retro-font text-xs sm:text-lg transition-all transform hover:scale-105 uppercase tracking-widest cursor-pointer relative z-20">{translations[lang].sections.news}</button>
          <button onClick={() => document.getElementById('vclani-se')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 rounded-xl retro-font text-xs sm:text-lg transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest cursor-pointer relative z-20">Včlani se</button>
          <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
            <img src="https://svamz.com/wp-content/uploads/2023/01/logo200.jpg" alt="SVAMZ Logo" className="h-8 sm:h-10 w-auto object-contain relative z-20" />
            <a href="https://svamz.com/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 border-2 border-white/20 text-white hover:border-white hover:bg-white/10 rounded-xl retro-font text-xs sm:text-lg transition-all transform hover:scale-105 uppercase tracking-widest cursor-pointer relative z-20 flex items-center justify-center gap-2 shadow-lg">SVAMZ <ExternalLink size={18} /></a>
          </div>
        </div>
      </div>
    </section>
  );
};

const CookieBanner = ({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) => {
  const { lang } = useApp();
  const t = translations[lang].cookies;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] glass p-4 sm:p-6 border-t border-teal-500/30 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 hidden sm:flex">
            <Cookie size={24} />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {t.message}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onDecline}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] sm:text-xs uppercase font-black tracking-widest cursor-pointer"
          >
            {t.decline}
          </button>
          <button 
            onClick={onAccept}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all text-[10px] sm:text-xs uppercase font-black tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.3)] cursor-pointer"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginPageOverlay = ({ onClose }: { onClose: () => void }) => {
  const { setIsAdmin, setShowAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'ADMIN8090' && password === 't2Qy!BD$Q$(eFV8R') { setIsAdmin(true); onClose(); setShowAdmin(true); } 
    else alert('Napačno uporabniško ime ali geslo!');
  };
  return (
    <div className="fixed inset-0 z-[70] glass flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl w-full max-sm border border-pink-500/30 shadow-2xl relative">
        <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white" onClick={onClose} aria-label="Close login"><X size={24} /></button>
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
              <img src={item.image || (item.images && item.images[0])} className="w-full h-full object-cover" alt="Thumb" onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=100')} />
            </div>
            <span className="font-bold text-xs sm:text-sm truncate tracking-tight uppercase text-slate-200">{item.title[lang]}</span>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button type="button" onClick={() => onEdit(item)} className="flex-1 sm:flex-none p-2 text-teal-400 hover:bg-teal-400/10 rounded-xl transition-all cursor-pointer border border-teal-400/20 flex items-center justify-center"><Edit3 size={16} /></button>
            <button type="button" onClick={() => onDelete(item.id)} className="flex-1 sm:flex-none p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer border border-red-500/20 flex items-center justify-center"><Trash2 size={16} /></button>
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
  const [formData, setFormData] = useState({ titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '', image: '', location: '', date: new Date().toISOString().split('T')[0], galleryImages: [] as string[], author: 'Admin', category: 'Blog' });
  const [settingsData, setSettingsData] = useState<SiteSettings>(settings);

  const handleEdit = (type: 'article' | 'event' | 'gallery', item: any) => {
    setEditingId(item.id);
    setShowForm(type);
    if (type === 'gallery') {
      setFormData({ ...formData, titleSi: item.title.si, titleEn: item.title.en, galleryImages: item.images || [] });
    } else {
      setFormData({
        titleSi: item.title.si, 
        titleEn: item.title.en,
        excerptSi: (type === 'article' ? item.excerpt?.si : item.description?.si) || '',
        excerptEn: (type === 'article' ? item.excerpt?.en : item.description?.en) || '',
        contentSi: (type === 'article' ? item.content?.si : '') || '',
        contentEn: (type === 'article' ? item.content?.en : '') || '',
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
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const inputName = e.target.name;
    setUploading(true);
    try {
      if (showForm === 'gallery') {
        const fileArray = Array.from(files);
        const uploadPromises = fileArray.map(async (file) => {
           const blob = await compressImageToBlob(file as File, 1920, 0.8);
           return uploadImage(blob, 'gallery');
        });
        const urls = await Promise.all(uploadPromises);
        setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...urls] }));
      } else {
        const blob = await compressImageToBlob(files[0] as File, 1920, 0.8);
        const folder = showForm === 'settings' ? 'settings' : (showForm || 'misc');
        const url = await uploadImage(blob, folder);
        if (showForm === 'settings') {
          setSettingsData(prev => ({ ...prev, [inputName]: url }));
        } else {
          setFormData(prev => ({ ...prev, image: url }));
        }
      }
    } catch (err) { 
      console.error(err);
      alert("Napaka pri nalaganju slike. Preverite povezavo ali velikost datoteke."); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showForm === 'settings') { 
      setSettings(settingsData); 
      addLog('update', 'settings', 'site-settings'); 
      setShowForm(null); 
      return; 
    }
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
    <div className="fixed inset-0 z-[70] glass flex items-start justify-center p-4 lg:p-12 overflow-y-auto cursor-pointer" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-6 sm:p-12 border border-purple-500/30 shadow-2xl relative my-8 cursor-default" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors cursor-pointer text-white z-10" onClick={onClose} aria-label="Close CMS"><X size={20} /></button>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center sm:text-left"><h1 className="retro-font text-2xl sm:text-3xl text-teal-400 tracking-tighter uppercase font-black">Nadzorna Plošča</h1></div>
          <div className="flex items-center gap-4">
             <button onClick={() => { setSettingsData(settings); setShowForm('settings'); }} className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all font-bold uppercase tracking-widest text-xs text-indigo-400"><Settings size={16} /> Nastavitve</button>
             <button onClick={() => { setIsAdmin(false); onClose(); }} className="flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-xl hover:bg-pink-500 transition-all font-bold uppercase tracking-widest text-xs"><LogOut size={16} /> Odjava</button>
          </div>
        </div>

        {showForm === 'settings' && (
          <div className="fixed inset-0 z-[80] bg-slate-950/98 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowForm(null)}>
            <form onSubmit={handleSubmit} className="bg-slate-900 p-6 sm:p-8 rounded-2xl w-full max-w-2xl border border-indigo-500/50 max-h-[90vh] overflow-y-auto shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()}>
              <h2 className="retro-font text-xl sm:text-2xl text-indigo-400 mb-8 uppercase text-center font-black">Nastavitve Strani</h2>
              <div className="space-y-6 mb-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Sledilci</label>
                      <input name="memberCount" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={settingsData.memberCount} onChange={e => setSettingsData({...settingsData, memberCount: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Dogodki</label>
                      <input name="eventCount" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={settingsData.eventCount} onChange={e => setSettingsData({...settingsData, eventCount: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Slika "Zgodba o strasti"</label>
                    <label className="block p-4 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-400 text-center cursor-pointer group mb-3 transition-colors">
                       <input type="file" name="aboutImage" className="hidden" onChange={handleFileUpload} />
                       <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Naloži sliko
                       </div>
                    </label>
                    <input name="aboutImage" placeholder="URL slike" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-xs mb-2" value={settingsData.aboutImage} onChange={e => setSettingsData({...settingsData, aboutImage: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Hero ozadje</label>
                    <label className="block p-4 border-2 border-dashed border-slate-700 rounded-xl hover:border-pink-500 text-center cursor-pointer group mb-3 transition-colors">
                       <input type="file" name="heroImage" className="hidden" onChange={handleFileUpload} />
                       <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-pink-500 font-bold uppercase tracking-widest text-[10px]">
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Naloži ozadje
                       </div>
                    </label>
                    <input name="heroImage" placeholder="URL slike" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-xs" value={settingsData.heroImage} onChange={e => setSettingsData({...settingsData, heroImage: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-500 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-indigo-600 transition-colors">Shrani</button>
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 bg-slate-800 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-700 transition-colors">Prekliči</button>
              </div>
            </form>
          </div>
        )}

        {showForm && showForm !== 'settings' && (
          <div className="fixed inset-0 z-[80] bg-slate-950/98 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowForm(null)}>
            <form onSubmit={handleSubmit} className="bg-slate-900 p-6 sm:p-8 rounded-2xl w-full max-w-4xl border border-pink-500/50 max-h-[90vh] overflow-y-auto shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()}>
              <h2 className="retro-font text-xl sm:text-2xl text-pink-500 mb-6 uppercase text-center font-black">{editingId ? 'Uredi' : 'Ustvari'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                  <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 outline-none text-sm" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                  {(showForm === 'article' || showForm === 'event') && (
                    <>
                      <textarea required placeholder="Povzetek (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-20 outline-none text-sm" value={formData.excerptSi} onChange={e => setFormData({...formData, excerptSi: e.target.value})} />
                      <textarea required placeholder="Summary (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-20 outline-none text-sm" value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} />
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  {showForm === 'article' && (
                    <>
                      <textarea required placeholder="Vsebina (SI)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-32 outline-none text-sm" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} />
                      <textarea required placeholder="Content (EN)" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 h-32 outline-none text-sm" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} />
                    </>
                  )}
                  {showForm !== 'gallery' && (
                    <div className="space-y-4">
                      <label className="block p-4 border-2 border-dashed border-slate-700 rounded-xl hover:border-pink-500 text-center cursor-pointer group transition-colors">
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                        <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-pink-500 font-bold uppercase tracking-widest text-[10px]">
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Naloži sliko
                        </div>
                      </label>
                      <input placeholder="URL slike" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-xs" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                      {showForm === 'event' && <input placeholder="Lokacija" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-xs" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />}
                      <input type="date" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-xs" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                  )}
                  {showForm === 'gallery' && (
                    <div className="space-y-4">
                      <label className="block p-4 border-2 border-dashed border-slate-700 rounded-xl hover:border-pink-500 text-center cursor-pointer group transition-colors">
                        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                        <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-pink-500 font-bold uppercase tracking-widest text-[10px]">
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Dodaj slike
                        </div>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.galleryImages.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800">
                            <img src={img} className="w-full h-full object-cover" alt="" />
                            <button type="button" onClick={() => setFormData(prev => ({...prev, galleryImages: prev.galleryImages.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-pink-500 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-pink-600 transition-colors">Shrani</button>
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 bg-slate-800 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-700 transition-colors">Prekliči</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <AdminList title="Članki" icon={<ImageIcon size={20} className="text-pink-500" />} items={articles} onAdd={() => { setEditingId(null); setFormData({ ...formData, galleryImages: [] }); setShowForm('article'); }} onEdit={(item: any) => handleEdit('article', item)} onDelete={(id: string) => { setArticles(prev => prev.filter(a => a.id !== id)); addLog('delete', 'article', id); }} lang={lang} />
          <AdminList title="Dogodki" icon={<Calendar size={20} className="text-teal-400" />} items={events} onAdd={() => { setEditingId(null); setFormData({ ...formData, galleryImages: [] }); setShowForm('event'); }} onEdit={(item: any) => handleEdit('event', item)} onDelete={(id: string) => { setEvents(prev => prev.filter(e => e.id !== id)); addLog('delete', 'event', id); }} lang={lang} />
        </div>
        <div className="grid grid-cols-1 gap-8">
           <AdminList title="Galerija" icon={<ImageIcon size={20} className="text-purple-500" />} items={gallery} onAdd={() => { setEditingId(null); setFormData({ ...formData, galleryImages: [] }); setShowForm('gallery'); }} onEdit={(item: any) => handleEdit('gallery', item)} onDelete={(id: string) => { setGallery(prev => prev.filter(g => g.id !== id)); addLog('delete', 'gallery', id); }} lang={lang} />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>('si');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<{ images: string[]; index: number } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const storedArticles = await fetchPersistedData('an_articles');
      const storedEvents = await fetchPersistedData('an_events');
      const storedGallery = await fetchPersistedData('an_gallery');
      const storedLogs = await fetchPersistedData('an_logs');
      const storedSettings = await fetchPersistedData('an_settings');
      const storedCookieConsent = localStorage.getItem('an_cookie_consent');
      
      if (storedArticles) setArticles(storedArticles);
      if (storedEvents) setEvents(storedEvents);
      if (storedGallery) setGallery(storedGallery);
      if (storedLogs) setLogs(storedLogs);
      if (storedSettings) setSettings(storedSettings);
      if (storedCookieConsent !== null) setCookieConsent(storedCookieConsent === 'true');
      
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => { if (isLoaded) persistData('an_articles', articles); }, [articles, isLoaded]);
  useEffect(() => { if (isLoaded) persistData('an_events', events); }, [events, isLoaded]);
  useEffect(() => { if (isLoaded) persistData('an_gallery', gallery); }, [gallery, isLoaded]);
  useEffect(() => { if (isLoaded) persistData('an_logs', logs); }, [logs, isLoaded]);
  useEffect(() => { if (isLoaded) persistData('an_settings', settings); }, [settings, isLoaded]);

  const addLog = (action: ActivityLog['action'], type: ActivityLog['type'], targetId: string) => {
    const newLog: ActivityLog = { id: Date.now().toString(), action, type, targetId, timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const handleCookieConsent = (accept: boolean) => {
    localStorage.setItem('an_cookie_consent', accept.toString());
    setCookieConsent(accept);
  };

  return (
    <AppContext.Provider value={{
      lang, setLang, isAdmin, setIsAdmin, showLogin, setShowLogin, showAdmin, setShowAdmin,
      articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog,
      isSaving, setIsSaving, settings, setSettings, showMembershipModal, setShowMembershipModal
    }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500/30 selection:text-pink-400">
        <Navbar />
        <main>
          <Hero />
          
          <Section id="about" title={translations[lang].sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-950">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
              <div className="space-y-6 sm:space-y-8 order-2 lg:order-1 text-center lg:text-left">
                <p className="text-base sm:text-xl leading-relaxed text-slate-300 font-light">
                  Naš namen je predvsem druženje enako mislečih, izmenjava izkušenj in seveda ohranjanje tehnične kulture. Naši začetki segajo v avgust 2018, ko sva Tomaž Beguš in Janez Tomc postavila Facebook stran in malo kasneje tudi <a href="https://www.facebook.com/groups/avtonostalgija" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-teal-400 transition-colors underline">skupino</a>. V začetku leta 2020 smo registrirali uradni klub in se kmalu pridružili zvezi SVAMZ. Prvo Slovensko youngtimer srečanje smo organizirali 11. 5. 2019; z leti je postalo tradicionalno in vsako leto bolj izpopolnjeno.
                </p>
                <div className="grid grid-cols-2 gap-6 sm:gap-8 pt-6">
                  <div>
                    <div className="retro-font text-3xl sm:text-4xl text-pink-500 font-black mb-1">{settings.memberCount}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">SLEDILCEV</div>
                  </div>
                  <div>
                    <div className="retro-font text-3xl sm:text-4xl text-teal-400 font-black mb-1">{settings.eventCount}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">DOGODKOV</div>
                  </div>
                </div>
              </div>
              <div className="relative order-1 lg:order-2 group">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-teal-400 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src={settings.aboutImage} className="relative rounded-[2rem] shadow-2xl border border-white/10 w-full object-cover aspect-video sm:aspect-square lg:aspect-video" alt="About" />
              </div>
            </div>
          </Section>

          <Section id="news" title={translations[lang].sections.news} gradient="bg-gradient-to-b from-indigo-950 to-purple-950">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map(article => (
                <article key={article.id} onClick={() => setSelectedArticle(article)} className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all hover:-translate-y-2 cursor-pointer">
                  <div className="aspect-video overflow-hidden">
                    <img src={article.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={article.title[lang]} />
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      <span>{article.category}</span>
                      <span>{new Date(article.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-pink-500 transition-colors uppercase leading-tight">{article.title[lang]}</h3>
                    <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{article.excerpt[lang]}</p>
                    <button className="pt-4 flex items-center gap-2 text-teal-400 font-black uppercase tracking-widest text-[10px] group/btn">
                      {translations[lang].common.readMore} <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="events" title={translations[lang].sections.events} gradient="bg-gradient-to-b from-purple-950 to-slate-950">
            <div className="space-y-6">
              {events.map(event => (
                <div key={event.id} onClick={() => setSelectedEvent(event)} className="group flex flex-col lg:flex-row bg-slate-900/50 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-teal-400/50 transition-all cursor-pointer">
                  <div className="lg:w-1/3 aspect-video lg:aspect-auto overflow-hidden">
                    <img src={event.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={event.title[lang]} />
                  </div>
                  <div className="p-8 lg:p-12 flex-1 flex flex-col justify-center space-y-6">
                    <div className="flex flex-wrap gap-6 text-[10px] uppercase tracking-[0.2em] font-black">
                      <div className="flex items-center gap-2 text-pink-500"><Calendar size={14} /> {new Date(event.date).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2 text-teal-400"><MapPin size={14} /> {event.location}</div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">{event.title[lang]}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{event.description[lang]}</p>
                    <button className="w-fit px-8 py-3 bg-white/5 hover:bg-teal-400 hover:text-slate-950 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/10">Podrobnosti dogodka</button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950">
            <Section id="gallery" title={translations[lang].sections.gallery} gradient="bg-transparent">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {gallery.map(item => (
                    <div key={item.id} onClick={() => setSelectedGallery({ images: item.images, index: 0 })} className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all hover:-translate-y-2 cursor-pointer shadow-2xl">
                      <div className="aspect-video overflow-hidden relative">
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title[lang]} />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600"><ImageIcon size={48} /></div>
                        )}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1 border border-white/10">
                          <ImageIcon size={12} /> {item.images ? item.images.length : 0}
                        </div>
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                              <ExternalLink className="text-white" size={24} />
                           </div>
                        </div>
                      </div>
                      <div className="p-8 space-y-2">
                        <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight leading-tight">{item.title[lang]}</h3>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
                          Klikni za ogled ({item.images ? item.images.length : 0} slik)
                        </p>
                      </div>
                    </div>
                  ))}
               </div>
            </Section>
            <YoungtimerSection transparent />
          </div>

          <Section id="contact" title={translations[lang].nav.contact} gradient="bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-12 text-center sm:text-left">
              <div className="space-y-4">
                <h3 className="retro-font text-2xl text-teal-400 uppercase tracking-widest">Kje nas najdete?</h3>
                <p className="text-slate-400 leading-relaxed">Pridružite se nam na naših srečanjih ali nas kontaktirajte preko spodnjih podatkov.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="glass p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-3 justify-center sm:justify-start">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-lg"><Phone size={18} /></div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Janez Tomc</div>
                  </div>
                  <div className="text-slate-100 font-bold uppercase tracking-widest text-xs mb-1">Predsednik</div>
                  <div className="text-lg font-black tracking-tight">+386 51 319 618</div>
                </div>
                <div className="glass p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-3 justify-center sm:justify-start">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-lg"><Phone size={18} /></div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Darko Šturm</div>
                  </div>
                  <div className="text-slate-100 font-bold uppercase tracking-widest text-xs mb-1">Podpredsednik</div>
                  <div className="text-lg font-black tracking-tight">+386 31 790 605</div>
                </div>
                <div className="glass p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-3 justify-center sm:justify-start">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-lg"><Phone size={18} /></div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Damir Sterle</div>
                  </div>
                  <div className="text-slate-100 font-bold uppercase tracking-widest text-xs mb-1">Tajnik</div>
                  <div className="text-lg font-black tracking-tight">+386 31 759 331</div>
                </div>
                <div className="glass p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all group lg:col-start-2">
                  <div className="flex items-center gap-4 mb-3 justify-center sm:justify-start">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-lg"><Phone size={18} /></div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Tomaž Beguš</div>
                  </div>
                  <div className="text-slate-100 font-bold uppercase tracking-widest text-xs mb-1">Idejni vodja kluba</div>
                  <div className="text-lg font-black tracking-tight">+386 41 512 723</div>
                </div>
              </div>
              <div className="glass p-8 rounded-3xl border border-teal-400/20 flex flex-col items-center justify-center group hover:border-teal-400/50 transition-all">
                <Mail className="text-teal-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-2">Pišite nam na</div>
                <a href="mailto:avtonostalgija8090@gmail.com" className="text-xl sm:text-2xl font-black text-white hover:text-teal-400 transition-colors tracking-tight">avtonostalgija8090@gmail.com</a>
              </div>
            </div>
          </Section>
        </main>

        <footer className="py-16 border-t border-white/5 bg-slate-950 text-center">
          <div className="max-w-7xl mx-auto px-4 space-y-10">
            <img src="https://avtonostalgija.si/wp-content/uploads/2022/11/youngtimer-avtonostalgija-1.png" className="h-12 mx-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" alt="Logo" />
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-bold">Klub ljubiteljev mladodobnikov Avtonostalgija 80&90 • Trinkova ulica 58, 1000 Ljubljana</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-medium">Davčna št.: 55751369 • Matična št.: 4120493000<br/>IBAN SI56 6100 0002 3775 920 (26.2.2020, DH d.d.)</p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600 font-bold pt-6 border-t border-white/5">© {new Date().getFullYear()} AVTONOSTALGIJA 80&90. Vse pravice pridržane.</p>
          </div>
        </footer>

        {showLogin && <LoginPageOverlay onClose={() => setShowLogin(false)} />}
        {showAdmin && <AdminCMSOverlay onClose={() => setShowAdmin(false)} />}
        {showMembershipModal && <MembershipModal onClose={() => setShowMembershipModal(false)} />}
        {cookieConsent === null && <CookieBanner onAccept={() => handleCookieConsent(true)} onDecline={() => handleCookieConsent(false)} />}
        
        {selectedArticle && <DetailView item={selectedArticle} type="article" onClose={() => setSelectedArticle(null)} />}
        {selectedEvent && <DetailView item={selectedEvent} type="event" onClose={() => setSelectedEvent(null)} />}
        {selectedGallery && <GalleryLightbox images={selectedGallery.images} initialIndex={selectedGallery.index} onClose={() => setSelectedGallery(null)} />}
      </div>
    </AppContext.Provider>
  );
};

export default App;