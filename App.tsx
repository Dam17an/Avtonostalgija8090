import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight, Upload, Loader2, ChevronDown, MessageSquare, Phone, Mail, Settings, Clock, Cookie, Facebook } from 'lucide-react';
import { translations } from './translations';
import { Language, StrapiArticle, StrapiAnnouncement, StrapiGallery, SiteSettings } from './types';

// --- STRAPI CONFIGURATION ---
const STRAPI_BASE_URL = 'https://my-backend-production-220b.up.railway.app';

const AppContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  isAdmin: boolean;
  setIsAdmin: (b: boolean) => void;
  showLogin: boolean;
  setShowLogin: (b: boolean) => void;
  showAdmin: boolean;
  setShowAdmin: (b: boolean) => void;
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

// --- STRAPI CONTENT HELPERS ---

const getMediaUrl = (media: any) => {
  if (!media) return null;
  // Handle Strapi v5 flattened structure
  if (media.url) return `${STRAPI_BASE_URL}${media.url}`;
  // Handle Strapi v4 structure or variations
  if (media.data?.attributes?.url) return `${STRAPI_BASE_URL}${media.data.attributes.url}`;
  if (media.data?.url) return `${STRAPI_BASE_URL}${media.data.url}`;
  // Handle array of media
  if (Array.isArray(media) && media[0]?.url) return `${STRAPI_BASE_URL}${media[0].url}`;
  return null;
};

const getContentText = (content: any): string => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((block: any) => {
        if (block.children && Array.isArray(block.children)) {
          return block.children.map((child: any) => child.text || "").join("");
        }
        return "";
      })
      .join(" ");
  }
  return "";
};

const renderContent = (content: any) => {
  if (!content) return null;
  if (typeof content === 'string') return <p className="whitespace-pre-wrap">{content}</p>;
  
  if (Array.isArray(content)) {
    return content.map((block: any, i: number) => {
      if (block.type === 'paragraph') {
        return (
          <p key={i} className="mb-4">
            {block.children?.map((child: any, j: number) => (
              <span key={j} style={{ 
                fontWeight: child.bold ? 'bold' : 'normal',
                fontStyle: child.italic ? 'italic' : 'normal',
                textDecoration: child.underline ? 'underline' : 'none'
              }}>
                {child.text}
              </span>
            ))}
          </p>
        );
      }
      if (block.type === 'heading') {
        const Tag = `h${block.level || 3}` as any;
        return (
          <Tag key={i} className="text-xl font-bold mt-6 mb-3 text-white">
             {block.children?.map((child: any) => child.text).join("")}
          </Tag>
        );
      }
      return null;
    });
  }
  return null;
};

// --- UI COMPONENTS ---

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

const DetailView = ({ item, onClose }: { item: StrapiArticle; onClose: () => void }) => {
  const imageUrl = getMediaUrl(item.Slika) || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=800';
  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5">
          <img src={imageUrl} className="w-full h-full object-cover" alt={item.Naslov} />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest font-black text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> {item.Datum}</span>
          </div>
          <h2 className="retro-font text-2xl sm:text-4xl text-white font-black uppercase tracking-tighter leading-tight">{item.Naslov}</h2>
          <div className="text-slate-300 leading-relaxed text-sm sm:text-lg">
            {renderContent(item.Vsebina)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const AnnouncementDetailView = ({ item, onClose }: { item: StrapiAnnouncement; onClose: () => void }) => {
  const imageUrl = getMediaUrl(item.Slika) || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=800';
  const formattedTime = item.Ura ? item.Ura.split(':').slice(0, 2).join(':') : "";
  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5">
          <img src={imageUrl} className="w-full h-full object-cover" alt={item.Naslov} />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-pink-500 text-[10px] uppercase font-black">
            <span className="flex items-center gap-2"><Calendar size={14}/> {item.Datum}</span>
            <span className="flex items-center gap-2"><Clock size={14}/> {formattedTime}</span>
          </div>
          <h2 className="retro-font text-2xl sm:text-4xl text-white font-black uppercase tracking-tighter leading-tight">{item.Naslov}</h2>
          <div className="text-slate-300 leading-relaxed text-sm sm:text-lg">
            {renderContent(item.Vsebina)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const GalleryLightbox = ({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) => {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handlePrev = (e?: React.MouseEvent) => { 
    if (e) e.stopPropagation(); 
    setIndex(prev => (prev > 0 ? prev - 1 : images.length - 1)); 
  };
  const handleNext = (e?: React.MouseEvent) => { 
    if (e) e.stopPropagation(); 
    setIndex(prev => (prev < images.length - 1 ? prev + 1 : 0)); 
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 cursor-default" 
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button className="absolute top-6 right-6 p-4 text-white hover:text-pink-500 transition-colors z-20" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={32} /></button>
      <button className="absolute left-2 sm:left-6 p-2 sm:p-4 text-white hover:text-pink-500 transition-colors z-20" onClick={handlePrev}><ArrowLeft size={32} className="sm:scale-150" /></button>
      <button className="absolute right-2 sm:right-6 p-2 sm:p-4 text-white hover:text-pink-500 transition-colors z-20" onClick={handleNext}><ArrowRight size={32} className="sm:scale-150" /></button>
      <img src={images[index]} className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in fade-in duration-300 select-none" alt="Gallery" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 font-bold uppercase tracking-widest text-xs">
        {index + 1} / {images.length}
      </div>
    </div>
  );
};

const SignaturePad = ({ onSave }: { onSave: (data: string) => void }) => {
  const { lang } = useApp();
  const t = translations[lang];
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
      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t.membership.signature}</label>
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
        <button type="button" onClick={clear} className="absolute bottom-2 right-2 p-1 bg-slate-800/80 rounded text-[8px] uppercase font-bold text-slate-400 hover:text-white transition-colors">{t.membership.signatureClear}</button>
      </div>
    </div>
  );
};

const MembershipModal = ({ onClose }: { onClose: () => void }) => {
  const { lang } = useApp();
  const t = translations[lang];
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signature) {
      alert(t.membership.signPrompt);
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
      alert(t.membership.success);
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      alert(t.membership.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] glass flex items-start justify-center p-4 overflow-y-auto cursor-pointer" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-teal-500/30 shadow-2xl relative my-8 overflow-hidden flex flex-col md:flex-row cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-800">
          <button className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors z-10 text-white" onClick={onClose} aria-label="Close modal"><X size={24} /></button>
          <h2 className="retro-font text-xl sm:text-2xl text-teal-400 mb-8 uppercase text-center font-black tracking-tighter">{t.membership.formTitle}</h2>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.name}</label>
                <input required name="name" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder={t.membership.namePlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.address}</label>
                <input required name="address" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder={t.membership.addressPlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.phone}</label>
                <input required name="phone" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder={t.membership.phonePlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.email}</label>
                <input required type="email" name="email" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder={t.membership.emailPlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.emso}</label>
                <input required name="emso" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder={t.membership.emsoPlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.birthPlace}</label>
                <input required name="birth_place" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" placeholder={t.membership.birthPlacePlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.vehicleType}</label>
                <input required name="vehicle_type" className="w-full bg-slate-950 p-3 rounded-xl border border-teal-400 text-sm" placeholder={t.membership.vehicleTypePlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.shirtSize}</label>
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
              {t.membership.agreementText}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <SignaturePad onSave={setSignature} />
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">{t.membership.date}</label>
                <input required type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 outline-none focus:border-teal-400 text-sm" />
              </div>
            </div>
            <div className="flex items-start gap-3 px-1">
              <input required type="checkbox" id="agreement" className="mt-1 accent-teal-400" />
              <label htmlFor="agreement" className="text-[10px] text-slate-500 leading-snug">
                {t.membership.consentCheckbox}
              </label>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-4 bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin mx-auto" /> : t.membership.submit}
            </button>
          </form>
        </div>
        <div className="w-full md:w-80 lg:w-96 p-6 sm:p-10 bg-slate-950/50 flex flex-col space-y-6">
          <div className="space-y-4">
            <h3 className="text-teal-400 font-black uppercase tracking-widest text-sm">{t.membership.paymentInstructions}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t.membership.paymentDetails}</p>
            {/* QR Code Section */}
            <div className="mt-4 p-2 bg-white rounded-xl shadow-lg border border-teal-500/20 overflow-hidden">
              <img 
                src="https://my-backend-production-220b.up.railway.app/uploads/8ca02f15185e47ef827e98c821573153_ff23f24ca0.png" 
                alt="QR Code Payment" 
                className="w-full h-auto block object-contain"
                loading="lazy"
              />
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.code}</div><div className="font-mono">OTHR</div></div>
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.purpose}</div><div className="font-mono">{t.membership.purposeText}</div></div>
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.amount}</div><div className="font-mono">25,00 EUR</div></div>
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.bic}</div><div className="font-mono">HDELSI22</div></div>
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.iban}</div><div className="font-mono">SI56 6100 0002 3775 920</div></div>
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.ref}</div><div className="font-mono">SI00 “yyyymmdd”</div></div>
            <div><div className="text-[9px] uppercase font-bold text-slate-500">{t.membership.recipient}</div><div className="font-mono">{t.membership.recipientText}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
            <h3 className="retro-font text-2xl sm:text-4xl text-teal-400 uppercase tracking-widest text-center font-black">{lang === 'si' ? 'Zakaj sem član Avtonostalgije 80&90?' : 'Why am I a member of Avtonostalgija 80&90?'}</h3>
            <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
              <div className="space-y-8 relative z-10 text-slate-300 leading-relaxed text-sm sm:text-base text-justify">
                {lang === 'si' ? (
                  <>
                    <div className="space-y-6">
                      <p className="text-slate-100 font-bold text-lg">Ker avtomobil ni zgolj prevozno sredstvo, temveč del moje identitete, mojih spominov in tehnične kulture svojega časa.</p>
                      <p className="text-slate-100">Ker verjamem, da imajo avtomobili 80. in 90. let resnično kulturno vrednost – vrednost, ki jo je treba razumeti, zagovarjati in aktivno ohranjati.</p>
                    </div>

                    <div className="py-6 border-y border-white/5">
                      <p className="retro-font text-xl sm:text-2xl text-pink-500 font-black uppercase tracking-tighter mb-2">Avtonostalgija 80&90 ni klub popustov.</p>
                      <p className="text-slate-100 font-bold">Je skupnost ljudi, ki razumejo, da prihodnost youngtimerjev and oldtimerjev ni samoumevna in da brez organiziranega delovanja preprosto ne obstaja.</p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-teal-400 font-black uppercase tracking-widest text-sm">Klub obstaja zato, da:</h4>
                      <ul className="space-y-4">
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

                    <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5">
                      <p className="text-lg font-bold text-slate-100 mb-2">Brez skupnosti zakonodaja ne deluje v našo korist.</p>
                      <p>Brez kluba ni dogodkov, ni tehničnih standardov, ni zaščite interesov i – kar je najpomembneje – ni prihodnosti za naše avtomobile.</p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-teal-400 font-black uppercase tracking-widest text-sm text-center">Kaj pomeni članstvo v praksi?</h4>
                      <p className="font-bold text-slate-100 text-center">Članstvo pomeni dostop do znanja, podpore and skupne moči:</p>
                      <ul className="space-y-4">
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

                    <div className="space-y-4">
                      <p>Članstvo je pomembno, ker posameznik nima glasu, organizirana skupnost pa ga ima. Sodelovanje kluba s SVAMZ pa mu daje strokovno, pravno in institucionalno legitimnost ter glas v nacionalnih in evropskih zakonodajnih procesih, kjer se odloča o prihodnosti historičnih in youngtimer vozil; brez te povezave bi bil klub zgolj interesna skupina brez realnega vpliva, ne pa del sistema, ki dolgoročno ščiti pravico do obstoja, uporabe in priznanja teh vozil.</p>
                      <p>Z včlanitvijo v klub in SVAMZ ne iščeš ugodnosti, temveč se poistovetiš z misijo: ohraniti avtomobile 80. in 90. let kot živo dediščino, jim zagotoviti prostor na cestah ter ustvariti okolje, v katerem bodo lahko vozni, razumljeni in cenjeni tudi čez 10, 20 ali 30 let.</p>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-4 text-center">
                      <p className="text-xl sm:text-2xl text-pink-500 font-black uppercase tracking-widest">Članstvo ni strošek.</p>
                      <p className="italic text-slate-100 font-bold">Je zavestna naložba v prihodnost avtomobilske kulture, ki ti je blizu.</p>
                      <div className="mt-8 p-6 bg-teal-400/5 rounded-2xl border border-teal-400/20">
                        <p className="text-teal-400 font-black tracking-tight text-lg">
                          👉 Če razumeš, zakaj ti tvoj avto pomeni več kot le kos pločevine, potem Avtonostalgija 80&90 ni le klub. Je tvoj prostor. Skupaj smo močnejši!
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <p className="text-slate-100 font-bold text-lg">Because a car is not just a means of transport, but part of my identity, my memories and the technical culture of its time.</p>
                      <p className="text-slate-100">Because I believe that the cars of the 80s and 90s have true cultural value - a value that needs to be understood, defended and actively preserved.</p>
                    </div>

                    <div className="py-6 border-y border-white/5">
                      <p className="retro-font text-xl sm:text-2xl text-pink-500 font-black uppercase tracking-tighter mb-2">Avtonostalgija 80&90 is not a discount club.</p>
                      <p className="text-slate-100 font-bold">It is a community of people who understand that the future of youngtimers and oldtimers is not self-evident and simply does not exist without organized action.</p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-teal-400 font-black uppercase tracking-widest text-sm">The club exists to:</h4>
                      <ul className="space-y-4">
                        {[
                          "represent vehicle owners in dialogue with legislation in Slovenia and the European Union,",
                          "preserve the right to use, drive and the long-term value of youngtimer and oldtimer vehicles,",
                          "build an environment where cars of the 80s and 90s are recognized as technical and cultural heritage,",
                          "connect knowledge, experiences and people in a way that an individual alone could never achieve."
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0 shadow-[0_0_8px_#ec4899]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5">
                      <p className="text-lg font-bold text-slate-100 mb-2">Without a community, legislation does not work in our favor.</p>
                      <p>Without the club, there are no events, no technical standards, no protection of interests and – most importantly – no future for our cars.</p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-teal-400 font-black uppercase tracking-widest text-sm text-center">What does membership mean in practice?</h4>
                      <p className="font-bold text-slate-100 text-center">Membership means access to knowledge, support and collective strength:</p>
                      <ul className="space-y-4">
                        {[
                          "professional guidance for certification procedures and technical questions,",
                          "constant monitoring of legislative changes and activities at home and abroad,",
                          "assistance with homologations, imports, modifications and vehicle evaluations,",
                          "opportunity to actively participate in club events, drives and technical days,",
                          "greater visibility and opportunities for vehicles (media, films, exhibitions, special events),",
                          "connecting with a community that shares the same values, understanding and passion."
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0 shadow-[0_0_8px_#14b8a6]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <p>Membership is important because an individual has no voice, but an organized community does. The club's cooperation with SVAMZ gives it professional, legal and institutional legitimacy and a voice in national and European legislative processes where the future of historic and youngtimer vehicles is decided; without this connection, the club would be merely an interest group without real influence, rather than part of a system that long-term protects the right to exist, use and recognize these vehicles.</p>
                      <p>By joining the club and SVAMZ, you are not looking for benefits, but identifying with a mission: to preserve the cars of the 80s and 90s as a living heritage, to provide them with space on the roads and to create an environment in which they can be driven, understood and appreciated even in 10, 20 or 30 years.</p>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-4 text-center">
                      <p className="text-xl sm:text-2xl text-pink-500 font-black uppercase tracking-widest">Membership is not an expense.</p>
                      <p className="italic text-slate-100 font-bold">It is a conscious investment in the future of the automotive culture that is close to you.</p>
                      <div className="mt-8 p-6 bg-teal-400/5 rounded-2xl border border-teal-400/20">
                        <p className="text-teal-400 font-black tracking-tight text-lg">
                          👉 If you understand why your car means more to you than just a piece of metal, then Avtonostalgija 80&90 is not just a club. It is your space. Together we are stronger!
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-12">
            <button onClick={() => setShowMembershipModal(true)} className="px-12 py-5 bg-gradient-to-r from-teal-400 to-teal-600 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(20,184,166,0.4)] text-xl cursor-pointer">{t.sections.memberTitle}</button>
          </div>
        </div>
      </div>
    </Section>
  );
};

const CookieBanner = ({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) => {
  const { lang } = useApp();
  const t = translations[lang].cookies;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] glass p-4 sm:p-6 border-t border-teal-500/30 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Cookie size={24} className="text-teal-400 shrink-0" />
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{t.message}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={onDecline} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 text-[10px] uppercase font-black">{t.decline}</button>
          <button onClick={onAccept} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 text-[10px] uppercase font-black">{t.accept}</button>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { lang, setLang, isAdmin, setShowLogin, setShowAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];
  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };
  const menuItems = [
    { label: t.nav.home, id: 'hero' },
    { label: t.nav.intro, id: 'about' },
    { label: t.sections.news, id: 'news' },
    { label: t.sections.events, id: 'announcements' },
    { label: t.sections.gallery, id: 'gallery' },
    { label: t.faq.title, id: 'youngtimer' },
    { label: t.nav.contact, id: 'contact' }
  ];
  return (
    <nav className="fixed w-full z-50 glass border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div onClick={() => handleNavClick('hero')} className="flex items-center cursor-pointer flex-shrink-0 gap-3">
            <img 
              src="https://my-backend-production-220b.up.railway.app/uploads/youngtimer_avtonostalgija_1_53027830c7.png" 
              alt="Logo" 
              className="h-10 sm:h-12 block w-auto object-contain" 
              loading="eager"
            />
            <img 
              src="https://my-backend-production-220b.up.railway.app/uploads/logo1111_svamz_02a00c69a5.png" 
              alt="SVAMZ Logo" 
              className="h-10 sm:h-12 block w-auto object-contain" 
              loading="eager"
            />
          </div>
          <div className="hidden lg:flex items-center space-x-4 text-xs font-medium">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="hover:text-pink-500 transition-colors uppercase tracking-widest px-2">{item.label}</button>
            ))}
            <div className="flex items-center space-x-2 border-l border-slate-700 pl-4">
              <button onClick={() => setLang('si')} className={`px-2 py-1 rounded-full text-[10px] font-bold ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-full text-[10px] font-bold ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
            </div>
            <button onClick={() => isAdmin ? setShowAdmin(true) : setShowLogin(true)} className="p-2 text-slate-400 hover:text-pink-500">
              <User size={20} className={isAdmin ? 'text-teal-400' : ''} />
            </button>
          </div>
          <button className="lg:hidden text-slate-100 p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      {/* MOBILE MENU */}
      {isOpen && (
        <div className="lg:hidden glass border-t border-purple-500/30 py-6 px-4 space-y-2 animate-in slide-in-from-top duration-300 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} className="block w-full text-left py-4 px-4 hover:bg-white/10 rounded-xl transition-colors uppercase tracking-widest text-xs font-black text-slate-100">{item.label}</button>
          ))}
          <div className="flex items-center justify-between pt-6 border-t border-white/5 px-4 mt-4">
            <div className="flex gap-4">
              <button onClick={() => { setLang('si'); setIsOpen(false); }} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400 border border-white/10'}`}>SI</button>
              <button onClick={() => { setLang('en'); setIsOpen(false); }} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400 border border-white/10'}`}>EN</button>
            </div>
            <button onClick={() => { isAdmin ? setShowAdmin(true) : setShowLogin(true); setIsOpen(false); }} className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-pink-500 transition-colors">
              <User size={20} className={isAdmin ? 'text-teal-400' : ''} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  const { lang } = useApp();
  const t = translations[lang];
  
  const heroBtnClass = "w-[160px] sm:w-[200px] md:w-[280px] py-3 md:py-4 bg-transparent border-2 border-teal-400 text-teal-400 rounded-xl retro-font text-[10px] sm:text-xs md:text-lg transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-95 hover:bg-teal-400/5 flex items-center justify-center gap-2 font-bold backdrop-blur-[2px] text-center";

  return (
    <section id="hero" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://my-backend-production-220b.up.railway.app/uploads/Gemini_Generated_Image_2za4n12za4n12za4_3cf33c7b31.png" 
          className="w-full h-full object-cover block" 
          alt="Hero" 
          loading="eager"
        />
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full pt-20">
        <img 
          src="https://my-backend-production-220b.up.railway.app/uploads/youngtimer_avtonostalgija_2_2ceda473cc.png" 
          alt="Logo" 
          className="h-24 sm:h-32 md:h-48 mx-auto mb-8 md:mb-12 object-contain block w-auto" 
          loading="eager"
        />
        <h1 className="retro-font font-black mb-6 tracking-tighter uppercase text-center flex flex-col items-center">
          <span className="text-[clamp(1.5rem,8vw,13rem)] lg:text-[clamp(1.5rem,9vw,14rem)] neon-text-pink leading-none pb-2 md:pb-4">AVTONOSTALGIJA</span>
          <span className="text-[clamp(1.5rem,8vw,13rem)] lg:text-[clamp(1.5rem,9vw,14rem)] neon-text-teal text-teal-400 leading-none">80&90</span>
        </h1>
        <p className="text-[10px] md:text-2xl text-teal-400 font-bold mb-10 md:mb-12 tracking-[0.2em] md:tracking-[0.3em] uppercase italic opacity-90 text-border-white px-2">{t.hero.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-6">
          <button onClick={() => document.getElementById('announcements')?.scrollIntoView({ behavior: 'smooth' })} className={heroBtnClass}>{t.sections.events}</button>
          <button onClick={() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })} className={heroBtnClass}>{lang === 'si' ? 'Novice' : 'News'}</button>
          <a href="https://svamz.com/" target="_blank" rel="noopener noreferrer" className={heroBtnClass}>SVAMZ <ExternalLink size={16} /></a>
          <button onClick={() => document.getElementById('vclani-se')?.scrollIntoView({ behavior: 'smooth' })} className={heroBtnClass}>{lang === 'si' ? 'Včlani se' : 'Join Us'}</button>
        </div>
      </div>
    </section>
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
      <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm border border-pink-500/30 relative shadow-2xl">
        <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors" onClick={onClose}><X size={24} /></button>
        <h2 className="retro-font text-xl text-pink-500 mb-8 text-center uppercase font-black">Admin Vstop</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 outline-none focus:border-pink-500 text-sm" placeholder="Username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 outline-none focus:border-pink-500 text-sm" placeholder="••••" required />
          <button type="submit" className="w-full py-4 bg-pink-500 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-transform">Prijava</button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>('si');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({ heroImage: '', aboutImage: '', memberCount: '36.000', eventCount: '30+' });
  
  const [articles, setArticles] = useState<StrapiArticle[]>([]);
  const [galleries, setGalleries] = useState<StrapiGallery[]>([]);
  const [announcements, setAnnouncements] = useState<StrapiAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedArticle, setSelectedArticle] = useState<StrapiArticle | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<StrapiAnnouncement | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem('an_cookie_consent');
    if (consent !== null) setCookieConsent(consent === 'true');

    const fetchData = async () => {
      try {
        const [artRes, galRes, annRes] = await Promise.all([
          fetch(`${STRAPI_BASE_URL}/api/articles?populate=*`),
          fetch(`${STRAPI_BASE_URL}/api/galleries?populate=*`),
          fetch(`${STRAPI_BASE_URL}/api/announcements?populate=*`)
        ]);
        const artData = await artRes.json();
        const galData = await galRes.json();
        const annData = await annRes.json();
        setArticles(artData.data || []);
        setGalleries(galData.data || []);
        setAnnouncements(annData.data || []);
      } catch (err) {
        console.error("Data fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCookieConsent = (accept: boolean) => {
    localStorage.setItem('an_cookie_consent', accept.toString());
    setCookieConsent(accept);
  };

  const t = translations[lang];

  return (
    <AppContext.Provider value={{
      lang, setLang, isAdmin, setIsAdmin, showLogin, setShowLogin, showAdmin, setShowAdmin,
      settings, setSettings, showMembershipModal, setShowMembershipModal
    }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500/30 selection:text-pink-400">
        <Navbar />
        <main>
          <Hero />
          
          <Section id="about" title={t.sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-950">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <p className="text-xl leading-relaxed text-slate-300 font-light">
                  {lang === 'si' 
                    ? 'Naš namen je predvsem druženje enako mislečih, izmenjava izkušenj in seveda ohranjanje tehnične kulture. Naši začetki segajo v avgust 2018, ko sva Tomaž Beguš in Janez Tomc postavila Facebook stran in malo kasneje tudi skupino. V začetku leta 2020 smo registrirali uradni klub in se kmalu pridružili zvezi SVAMZ. Prvo Slovensko youngtimer srečanje smo organizirali 11. 5. 2019; z leti je postalo tradicionalno in vsako leto bolj izpopolnjeno.'
                    : 'Our purpose is primarily the gathering of like-minded enthusiasts, the exchange of experiences, and of course, the preservation of technical culture. Our beginnings date back to August 2018, when Tomaž Beguš and Janez Tomc created a Facebook page and, a little later, a group. In early 2020, we registered as an official club and soon joined the SVAMZ association. We organized the first Slovenian Youngtimer meeting on May 11, 2019; over the years, it has become traditional and increasingly refined.'
                  }
                </p>
                <div className="flex justify-center lg:justify-start">
                   <a href="https://www.facebook.com/groups/avtonostalgija" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-blue-600/20 border border-blue-500/50 rounded-xl hover:bg-blue-600/40 transition-all text-blue-400 font-bold uppercase tracking-widest text-xs">
                     <Facebook size={20} /> {lang === 'si' ? 'Pridruži se FB skupini' : 'Join our FB group'}
                   </a>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div><div className="retro-font text-4xl text-pink-500 font-black">{settings.memberCount}</div><div className="text-[10px] uppercase font-bold text-slate-500">{lang === 'si' ? 'sledilcev' : 'followers'}</div></div>
                  <div><div className="retro-font text-4xl text-teal-400 font-black">{settings.eventCount}</div><div className="text-[10px] uppercase font-bold text-slate-500">{lang === 'si' ? 'DOGODKOV' : 'EVENTS'}</div></div>
                </div>
              </div>
              <img 
                src="https://my-backend-production-220b.up.railway.app/uploads/IMG_1053_b94aabeced.jpg" 
                className="rounded-[2rem] shadow-2xl border border-white/10 w-full object-cover block h-auto max-h-[500px]" 
                alt="About" 
                loading="lazy"
              />
            </div>
          </Section>

          {/* Announcements Section - Renamed to Napovednik with Fixed Image, Click Logic, and Clean HH:mm formatting */}
          <Section id="announcements" title={t.sections.events} gradient="bg-gradient-to-b from-indigo-950 to-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {announcements.map((item) => {
                const imageUrl = getMediaUrl(item.Slika);
                // Correct HH:mm formatting by removing seconds
                const formattedTime = item.Ura ? item.Ura.split(':').slice(0, 2).join(':') : "";
                return (
                  <div key={item.id} onClick={() => setSelectedAnnouncement(item)} className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all cursor-pointer shadow-xl">
                    <div className="aspect-video overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.Naslov} loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                          <ImageIcon size={48} />
                        </div>
                      )}
                    </div>
                    <div className="p-8 space-y-4">
                      {/* Visual separation with flex row and clear gap-x-6 between date and time groups */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-pink-500 text-[10px] uppercase font-black">
                        <span className="flex items-center gap-2"><Calendar size={14}/> {item.Datum}</span>
                        <span className="flex items-center gap-2"><Clock size={14}/> {formattedTime}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-100 group-hover:text-pink-500 transition-colors uppercase leading-tight">{item.Naslov}</h3>
                      <div className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{getContentText(item.Vsebina)}</div>
                    </div>
                  </div>
                );
              })}
              {!loading && announcements.length === 0 && <p className="text-center text-slate-500 uppercase tracking-widest text-[10px] col-span-full py-12">{lang === 'si' ? 'Ni novih obvestil.' : 'No new announcements.'}</p>}
            </div>
          </Section>

          {/* News Section */}
          <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-slate-900 to-purple-950">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map(article => {
                const imageUrl = getMediaUrl(article.Slika);
                return (
                  <article key={article.id} onClick={() => setSelectedArticle(article)} className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all cursor-pointer shadow-xl">
                    <div className="aspect-video overflow-hidden">
                      {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={article.Naslov} loading="lazy" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600"><ImageIcon size={48} /></div>}
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{article.Datum}</div>
                      <h3 className="text-xl font-bold text-slate-100 group-hover:text-pink-500 transition-colors uppercase leading-tight">{article.Naslov}</h3>
                      <p className="text-slate-400 text-sm line-clamp-3">{getContentText(article.Vsebina)}</p>
                      <button className="pt-4 flex items-center gap-2 text-teal-400 font-black uppercase text-[10px]">{t.common.readMore} <ChevronRight size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Section>

          {/* Gallery Section */}
          <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-purple-950 to-slate-950">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {galleries.map(item => {
                  const images = item.Slike?.map(img => `${STRAPI_BASE_URL}${img.url}`) || [];
                  return (
                    <div key={item.id} onClick={() => images.length > 0 && setSelectedGallery({ images, index: 0 })} className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer shadow-2xl">
                      <div className="aspect-video overflow-hidden relative">
                        {images.length > 0 ? <img src={images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.Naslov} loading="lazy" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600"><ImageIcon size={48} /></div>}
                        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1"><ImageIcon size={12} /> {images.length}</div>
                      </div>
                      <div className="p-8 space-y-2">
                        <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{item.Naslov}</h3>
                        <p className="text-slate-500 text-[10px] uppercase font-black">{lang === 'si' ? `Klikni za ogled (${images.length} slik)` : `Click to view (${images.length} photos)`}</p>
                      </div>
                    </div>
                  );
                })}
             </div>
          </Section>

          <YoungtimerSection />

          <Section id="contact" title={t.nav.contact} gradient="bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-12 text-center sm:text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-8 rounded-2xl border border-white/10 hover:border-teal-400/30 transition-all flex flex-col items-center sm:items-start shadow-xl">
                  <div className="text-2xl font-black text-teal-400 uppercase tracking-tight leading-tight mb-1">Janez Tomc</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-5">{t.contactRoles.president}</div>
                  <div className="text-base font-black tracking-tight text-slate-100">+386 51 319 618</div>
                </div>
                <div className="glass p-8 rounded-2xl border border-white/10 hover:border-teal-400/30 transition-all flex flex-col items-center sm:items-start shadow-xl">
                  <div className="text-2xl font-black text-teal-400 uppercase tracking-tight leading-tight mb-1">Darko Šturm</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-5">{t.contactRoles.vicePresident}</div>
                  <div className="text-base font-black tracking-tight text-slate-100">+386 31 790 605</div>
                </div>
                <div className="glass p-8 rounded-2xl border border-white/10 hover:border-teal-400/30 transition-all flex flex-col items-center sm:items-start shadow-xl">
                  <div className="text-2xl font-black text-teal-400 uppercase tracking-tight leading-tight mb-1">Damir Sterle</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-5">{t.contactRoles.secretary}</div>
                  <div className="text-base font-black tracking-tight text-slate-100">+386 31 759 331</div>
                </div>
                <div className="glass p-8 rounded-2xl border border-white/10 hover:border-teal-400/30 transition-all flex flex-col items-center sm:items-start shadow-xl">
                  <div className="text-2xl font-black text-teal-400 uppercase tracking-tight leading-tight mb-1">Tomaž Beguš</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-5">{t.contactRoles.founder}</div>
                  <div className="text-base font-black tracking-tight text-slate-100">+386 41 512 723</div>
                </div>
                <div className="glass p-8 rounded-3xl border border-teal-400/20 flex flex-col items-center justify-center group hover:border-teal-400/50 transition-all col-span-full shadow-2xl">
                  <Mail className="text-teal-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
                  <a href="mailto:avtonostalgija8090@gmail.com" className="text-xl sm:text-2xl font-black text-white hover:text-teal-400 transition-colors tracking-tight">avtonostalgija8090@gmail.com</a>
                </div>
              </div>
            </div>
          </Section>
        </main>

        <footer className="py-16 border-t border-white/5 bg-slate-950 text-center">
          <div className="max-w-7xl mx-auto px-4 space-y-10">
            <div className="flex justify-center">
              <img 
                src="https://my-backend-production-220b.up.railway.app/uploads/youngtimer_avtonostalgija_1_53027830c7.png" 
                className="h-10 sm:h-12 grayscale opacity-50 block w-auto object-contain" 
                alt="Logo" 
                loading="lazy"
              />
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600 font-bold">© {new Date().getFullYear()} AVTONOSTALGIJA 80&90. {lang === 'si' ? 'Vse pravice pridržane.' : 'All rights reserved.'}</p>
              <div className="max-w-xl mx-auto text-[9px] text-slate-600 leading-relaxed uppercase tracking-widest space-y-2 px-4">
                <p>Klub ljubiteljev mladodobnikov Avtonostalgija 80&90 • Trinkova ulica 58, 1000 Ljubljana</p>
                <p>Davčna št.: 55751369 • Matična št.: 4120493000</p>
                <p>IBAN SI56 6100 0002 3775 920 (26.2.2020, DH d.d.)</p>
              </div>
            </div>
          </div>
        </footer>

        {selectedArticle && <DetailView item={selectedArticle} onClose={() => setSelectedArticle(null)} />}
        {selectedAnnouncement && <AnnouncementDetailView item={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />}
        {selectedGallery && <GalleryLightbox images={selectedGallery.images} initialIndex={selectedGallery.index} onClose={() => setSelectedGallery(null)} />}
        {showMembershipModal && <MembershipModal onClose={() => setShowMembershipModal(false)} />}
        {showLogin && <LoginPageOverlay onClose={() => setShowLogin(false)} />}
        {cookieConsent === null && <CookieBanner onAccept={() => handleCookieConsent(true)} onDecline={() => handleCookieConsent(false)} />}
      </div>
    </AppContext.Provider>
  );
};

export default App;