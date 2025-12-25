
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight } from 'lucide-react';
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
    content: { 
      si: 'Ljudje se pogosto sprašujejo, kdaj avtomobil postane klasika. V Sloveniji se meja za Youngtimerje vztrajno pomika v devetdeseta leta. Modeli kot so BMW E30, VW Golf II in Mazda MX-5 so postali ikone, ki ne le ohranjajo vrednost, ampak jo strmo povečujejo.\n\nKljuč do uspeha je originalnost in zgodovina vzdrževanja. Mnogi zbiratelji danes iščejo vozila, ki niso bila predelana in imajo znano zgodovino. Youngtimerji nam ponujajo analogni občutek vožnje, ki ga v modernih digitaliziranih vozilih ne najdemo več.', 
      en: 'People often wonder when a car becomes a classic. In Slovenia, the threshold for Youngtimers is steadily moving into the nineties. Models like the BMW E30, VW Golf II, and Mazda MX-5 have become icons that not only retain value but increase it sharply.\n\nThe key to success is originality and maintenance history. Many collectors today are looking for vehicles that haven\'t been modified and have a known history. Youngtimers offer us an analog driving experience that can no longer be found in modern digitized vehicles.' 
    },
    image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800',
    author: 'Admin',
    date: '2024-03-20',
    category: 'Vodnik',
    tags: ['E30', '90s', 'Maintenance']
  }
];

const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    slug: 'retro-srecanje-ljubljana',
    title: { si: 'Retro Srečanje Ljubljana 2024', en: 'Retro Meet Ljubljana 2024' },
    description: { 
      si: 'Največje srečanje ljubiteljev 80ih in 90ih v osrednji Sloveniji. Pričakujemo več kot 200 vozil iz celotne regije. Dogodek bo vključeval razstavo vozil, druženje in podelitev nagrad za najbolje ohranjena vozila.', 
      en: 'The biggest meeting of 80s and 90s fans in central Slovenia. We expect more than 200 vehicles from the entire region. The event will include a vehicle exhibition, social gathering, and an award ceremony for the best-preserved vehicles.' 
    },
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
    title: { si: 'Car Meet Ljubljana 2023', en: 'Ljubljana Car Meet 2023' },
    images: [
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: '2',
    eventId: '2',
    title: { si: 'Zbor Maribor Retro', en: 'Maribor Retro Gathering' },
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&q=80&w=600'
    ]
  }
];

const Navbar = () => {
  const { lang, setLang, isAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    const performScroll = () => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(performScroll, 200);
    } else {
      performScroll();
    }
    setIsOpen(false);
  };

  const menuItems = [
    { label: t.nav.home, id: 'hero' },
    { label: t.nav.intro, id: 'about' },
    { label: t.nav.youngtimer, id: 'youngtimer' },
    { label: t.sections.news, id: 'news' },
    { label: t.sections.events, id: 'events' },
    { label: t.sections.gallery, id: 'gallery' },
    { label: t.nav.contact, id: 'contact' }
  ];

  return (
    <nav className="fixed w-full z-50 glass border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div onClick={() => scrollToSection('hero')} className="flex items-center space-x-2 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg">AN</div>
            <span className="retro-font text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400">
              80 & 90
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-4 text-xs xl:text-sm font-medium">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => scrollToSection(item.id)} className="hover:text-pink-500 transition-colors uppercase tracking-widest px-2">{item.label}</button>
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

          <button className="lg:hidden text-slate-100" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={28} /> : <Menu size={28} />}</button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden glass border-t border-purple-500/20 absolute top-20 w-full max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-4 py-8 space-y-6 flex flex-col items-center text-lg uppercase tracking-widest font-bold">
             {menuItems.map(item => (
               <button key={item.id} onClick={() => scrollToSection(item.id)}>{item.label}</button>
             ))}
             <div className="flex space-x-6 pt-6">
                <button onClick={() => { setLang('si'); setIsOpen(false); }} className={`px-4 py-1 rounded-full ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
                <button onClick={() => { setLang('en'); setIsOpen(false); }} className={`px-4 py-1 rounded-full ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
             </div>
             <Link to={isAdmin ? "/admin" : "/login"} onClick={() => setIsOpen(false)} className={isAdmin ? "text-teal-400" : "text-slate-400"}>{isAdmin ? "Admin Panel" : t.common.login}</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }: { images: string[], currentIndex: number, onClose: () => void, onPrev: () => void, onNext: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
    <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full z-[110]" onClick={onClose}><X size={32} /></button>
    
    {images.length > 1 && (
      <>
        <button className="absolute left-8 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-[110]" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ArrowLeft size={40} /></button>
        <button className="absolute right-8 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-[110]" onClick={(e) => { e.stopPropagation(); onNext(); }}><ArrowRight size={40} /></button>
      </>
    )}
    
    <div className="relative max-w-7xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
      <img src={images[currentIndex]} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
      <div className="mt-6 text-slate-500 text-sm font-mono tracking-widest">{currentIndex + 1} / {images.length}</div>
    </div>
  </div>
);

const Section = ({ id, title, children, gradient }: { id: string, title: any, children?: React.ReactNode, gradient: string }) => (
  <section id={id} className={`py-32 px-4 transition-all ${gradient}`}>
    <div className="max-w-7xl mx-auto">
      <h2 className="retro-font text-3xl md:text-5xl text-center mb-16 tracking-tighter">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 uppercase">{title}</span>
      </h2>
      {children}
    </div>
  </section>
);

const Hero = () => {
  const { lang } = useApp();
  const t = translations[lang];
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover brightness-[0.3]" alt="Hero Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-5xl">
        <h1 className="retro-font text-5xl md:text-9xl font-black mb-8 tracking-tighter neon-text-pink leading-none animate-pulse uppercase">
          {t.hero.title}
        </h1>
        <p className="text-xl md:text-3xl text-teal-400 font-light mb-16 tracking-[0.4em] uppercase italic opacity-80">
          {t.hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-8">
          <button onClick={() => scrollToSection('events')} className="px-14 py-6 bg-pink-500 hover:bg-pink-600 text-white rounded-full retro-font text-xl transition-all transform hover:scale-110 shadow-2xl shadow-pink-500/40 uppercase tracking-widest">
            {t.sections.events}
          </button>
          <button onClick={() => scrollToSection('gallery')} className="px-14 py-6 border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 rounded-full retro-font text-xl transition-all transform hover:scale-105 uppercase tracking-widest">
            {t.sections.gallery}
          </button>
        </div>
      </div>
    </section>
  );
};

const MainContent = () => {
  const { lang, events, articles, gallery } = useApp();
  const [activeGallery, setActiveGallery] = useState<GalleryItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const t = translations[lang];
  const navigate = useNavigate();

  return (
    <>
      {activeGallery && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-7xl rounded-[3rem] p-8 lg:p-16 border border-pink-500/30 relative">
            <button className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors" onClick={() => setActiveGallery(null)}>
              <X size={24} />
            </button>
            <h2 className="retro-font text-3xl text-teal-400 mb-12 border-l-4 border-pink-500 pl-4">{activeGallery.title[lang]}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeGallery.images.map((img, idx) => (
                <div key={idx} className="relative group cursor-zoom-in overflow-hidden rounded-2xl aspect-square shadow-xl" onClick={() => setLightboxIndex(idx)}>
                  <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Gallery" />
                  <div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
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
      
      <Section id="about" title={t.sections.introTitle} gradient="bg-gradient-to-b from-slate-950 to-indigo-950">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <p className="text-xl text-slate-300 leading-relaxed font-light">
              Avtonostalgija 80&90 ni zgolj klub, je časovni stroj. Oživljamo spomine na dobo, ko je bila vožnja analogna, občutki pa pristni.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 glass rounded-[2.5rem] border border-pink-500/20 text-center">
                <div className="text-4xl font-black text-pink-500 mb-2">500+</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Članov</div>
              </div>
              <div className="p-6 glass rounded-[2.5rem] border border-teal-500/20 text-center">
                <div className="text-4xl font-black text-teal-400 mb-2">20+</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Dogodkov letno</div>
              </div>
            </div>
            <button onClick={() => { document.getElementById('news')?.scrollIntoView({behavior:'smooth'}) }} className="px-14 py-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold retro-font hover:shadow-2xl transition-all shadow-pink-500/30 text-xl uppercase tracking-wider">Preberi zgodbe</button>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-teal-400 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800" className="relative z-10 rounded-[2.5rem] border border-white/10 shadow-2xl" alt="Classic Car" />
          </div>
        </div>
      </Section>

      <Section id="youngtimer" title={t.sections.youngtimerTitle} gradient="bg-gradient-to-b from-indigo-950 to-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { title: "Starost", desc: "Vozila stara med 20 in 30 let, ki se počasi poslavljajo od vsakdanje uporabe." },
            { title: "Kondicija", desc: "Poudarek na originalnosti in vrhunski ohranjenosti brez modernih predelav." },
            { title: "Karakter", desc: "Vozila, ki so v svojem času predstavljala tehnološki ali oblikovni vrhunec." }
          ].map((box, i) => (
            <div key={i} className="p-10 bg-slate-900/50 rounded-[3rem] border border-slate-800 hover:border-teal-400 transition-colors group">
              <h3 className="retro-font text-2xl text-teal-400 mb-6 group-hover:neon-text-teal tracking-tighter uppercase">{box.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-light">{box.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="events" title={t.sections.events} gradient="bg-gradient-to-b from-slate-950 to-purple-950">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {events.map((event) => (
            <Link key={event.id} to={`/event/${event.slug}`} className="group relative block bg-slate-900 rounded-[3.5rem] overflow-hidden border border-slate-800 hover:border-pink-500 transition-all shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={event.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={event.title[lang]} />
              </div>
              <div className="p-10">
                <div className="flex items-center text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
                  <Calendar size={14} className="mr-2 text-pink-500" /> {event.date}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-pink-500 transition-colors h-16 line-clamp-2">{event.title[lang]}</h3>
                <p className="text-sm text-slate-400 flex items-center"><MapPin size={16} className="text-teal-400 mr-2" /> {event.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-purple-950 to-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {articles.map((article) => (
            <Link key={article.id} to={`/article/${article.slug}`} className="flex flex-col lg:flex-row gap-8 items-center glass p-8 rounded-[3.5rem] border border-white/5 group transition-all hover:bg-white/10">
              <div className="w-full lg:w-48 h-48 shrink-0 overflow-hidden rounded-[2.5rem] border border-white/5">
                <img src={article.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={article.title[lang]} />
              </div>
              <div className="flex-1">
                <span className="bg-pink-500/20 text-pink-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{article.category}</span>
                <h3 className="text-2xl font-black mt-4 mb-3 group-hover:text-teal-400 transition-colors tracking-tight line-clamp-2">
                  {article.title[lang]}
                </h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed font-light">{article.excerpt[lang]}</p>
                <div className="text-pink-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  {t.common.readMore} <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-slate-950 to-teal-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {gallery.map((item) => (
            <div key={item.id} className="relative group cursor-pointer overflow-hidden rounded-[4rem] shadow-2xl aspect-[4/3] border border-slate-800 hover:border-teal-400 transition-all" onClick={() => setActiveGallery(item)}>
              <img src={item.images[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title[lang]} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-12">
                <h3 className="retro-font text-2xl text-white mb-2 group-hover:text-pink-500 transition-colors uppercase tracking-tight">{item.title[lang]}</h3>
                <div className="text-teal-400 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                  <ImageIcon size={14} /> {item.images.length} fotografij
                </div>
              </div>
              <div className="absolute top-10 right-10 p-4 bg-white/10 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={24} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" title={t.nav.contact} gradient="bg-gradient-to-b from-teal-950 to-slate-950">
        <div className="max-w-xl mx-auto glass p-14 rounded-[5rem] border border-pink-500/20 text-center space-y-12">
          <p className="text-3xl text-slate-300 font-light italic">"Klasika, ki jo pišete vi."</p>
          <div className="space-y-6">
             <div className="p-8 bg-slate-800/50 rounded-[2.5rem] hover:bg-pink-500 transition-all cursor-pointer group hover:scale-105">
               <p className="text-slate-400 group-hover:text-white font-bold text-xl uppercase tracking-widest">info@avtonostalgija.si</p>
             </div>
             <div className="p-8 bg-slate-800/50 rounded-[2.5rem] hover:bg-teal-400 transition-all cursor-pointer group hover:scale-105">
               <p className="text-slate-400 group-hover:text-slate-950 font-bold text-2xl tracking-widest">+386 41 000 000</p>
             </div>
          </div>
          <div className="flex justify-center gap-8 pt-4">
             {['fb', 'ig', 'li', 'yt'].map(soc => (
               <div key={soc} className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-all hover:scale-110 shadow-2xl text-xl font-black uppercase tracking-tighter border border-white/5">
                 {soc}
               </div>
             ))}
          </div>
        </div>
      </Section>
    </>
  );
};

const ArticlePage = () => {
  const { slug } = useParams();
  const { articles, lang } = useApp();
  const article = articles.find(a => a.slug === slug);
  const t = translations[lang];
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0,0); }, []);

  if (!article) return <div className="pt-48 text-center h-screen text-3xl retro-font">Članek ni bil najden</div>;

  return (
    <div className="pt-48 pb-32 px-4 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-4 text-pink-500 hover:-translate-x-3 transition-transform font-bold uppercase tracking-[0.3em] mb-16 text-sm">
         <ArrowLeft size={24} /> {t.common.back}
      </button>
      <div className="relative mb-20 rounded-[5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/5 group">
        <img src={article.image} className="w-full aspect-[21/9] object-cover group-hover:scale-105 transition-transform duration-2000" alt={article.title[lang]} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-16 left-16">
          <span className="bg-pink-500 px-12 py-4 rounded-full text-xs font-black uppercase tracking-[0.5em] shadow-2xl">{article.category}</span>
        </div>
      </div>
      <h1 className="text-6xl md:text-9xl font-black mb-16 retro-font leading-[0.85] tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-white to-teal-400 uppercase">
        {article.title[lang]}
      </h1>
      <div className="flex flex-wrap items-center gap-14 text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-20 border-y border-slate-900 py-14">
        <span className="flex items-center gap-4"><User size={20} className="text-pink-500" /> {t.common.author}: <strong className="text-slate-200">{article.author}</strong></span>
        <span className="flex items-center gap-4"><Calendar size={20} className="text-teal-400" /> {t.common.date}: <strong className="text-slate-200">{article.date}</strong></span>
      </div>
      <div className="prose prose-invert prose-pink max-w-none text-slate-300 leading-relaxed text-2xl space-y-14 whitespace-pre-wrap font-light tracking-tight">
        {article.content[lang]}
      </div>
    </div>
  );
};

const EventPage = () => {
  const { slug } = useParams();
  const { events, lang } = useApp();
  const event = events.find(e => e.slug === slug);
  const t = translations[lang];
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0,0); }, []);

  if (!event) return <div className="pt-48 text-center h-screen text-3xl retro-font">Dogodek ni bil najden</div>;

  return (
    <div className="pt-48 pb-32 px-4 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-4 text-teal-400 hover:-translate-x-3 transition-transform font-bold uppercase tracking-[0.3em] mb-16 text-sm">
         <ArrowLeft size={24} /> {t.common.back}
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
        <div className="lg:col-span-7">
          <div className="rounded-[5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 mb-16">
            <img src={event.image} className="w-full aspect-video object-cover" alt={event.title[lang]} />
          </div>
          <h1 className="text-6xl md:text-8xl font-black retro-font leading-[0.9] text-pink-500 tracking-tighter uppercase mb-16">{event.title[lang]}</h1>
          <p className="text-3xl text-slate-400 leading-relaxed font-light whitespace-pre-wrap opacity-90">{event.description[lang]}</p>
        </div>
        <div className="lg:col-span-5 sticky top-32 space-y-10">
          <div className="glass p-16 rounded-[5rem] border border-teal-500/20 shadow-2xl space-y-12">
            <div className="space-y-10">
              <div className="flex items-center gap-10 group">
                 <div className="p-8 bg-teal-400/10 rounded-[2.5rem] group-hover:bg-teal-400 group-hover:text-slate-950 transition-all duration-700 shadow-xl border border-white/5"><Calendar size={36} /></div>
                 <div>
                    <div className="text-[11px] uppercase tracking-[0.5em] text-slate-500 mb-4 font-black">Datum dogodka</div>
                    <div className="text-2xl font-bold tracking-tighter uppercase">{event.date}</div>
                 </div>
              </div>
              <div className="flex items-center gap-10 group">
                 <div className="p-8 bg-pink-500/10 rounded-[2.5rem] group-hover:bg-pink-500 group-hover:text-white transition-all duration-700 shadow-xl border border-white/5"><MapPin size={36} /></div>
                 <div>
                    <div className="text-[11px] uppercase tracking-[0.5em] text-slate-500 mb-4 font-black">Prizorišče</div>
                    <div className="text-2xl font-bold tracking-tighter uppercase">{event.location}</div>
                 </div>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-[4rem] border border-slate-800 h-96 overflow-hidden shadow-2xl group relative">
               <iframe src={event.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" className="grayscale invert opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { setIsAdmin, lang } = useApp();
  const [pass, setPass] = useState('');
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'admin') { 
      setIsAdmin(true); 
      localStorage.setItem('an_admin', 'true');
      navigate('/admin'); 
    } 
    else { alert('Wrong password (hint: admin)'); }
  };
  return (
    <div className="pt-48 pb-20 flex justify-center h-screen px-4 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950">
      <div className="glass p-16 rounded-[5rem] w-full max-w-md border border-pink-500/30 shadow-2xl h-fit">
        <h2 className="retro-font text-4xl text-pink-500 mb-12 text-center uppercase tracking-tighter font-black">Admin Portal</h2>
        <form onSubmit={handleLogin} className="space-y-12">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.6em] text-slate-500 mb-6 ml-6">Secure Key</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-full px-10 py-7 focus:border-pink-500 outline-none transition-all text-center tracking-[2em] text-3xl font-black" placeholder="••••" />
          </div>
          <button type="submit" className="w-full py-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold uppercase retro-font tracking-[0.3em] text-2xl shadow-2xl shadow-pink-500/40 hover:scale-105 transition-transform">Vstop</button>
        </form>
      </div>
    </div>
  );
};

const AdminCMS = () => {
  const { lang, isAdmin, setIsAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog } = useApp();
  const [showForm, setShowForm] = useState<'article' | 'event' | 'gallery' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[lang];
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800', 
    location: '', date: new Date().toISOString().split('T')[0], galleryImages: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin]);

  const handleEdit = (type: 'article' | 'event' | 'gallery', item: any) => {
    setEditingId(item.id);
    setShowForm(type);
    if (type === 'gallery') {
      setFormData({
        ...formData,
        titleSi: item.title.si, titleEn: item.title.en,
        galleryImages: item.images.join('\n')
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
        galleryImages: ''
      });
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
        image: formData.image, author: 'Admin', date: formData.date, category: 'Blog', tags: []
      };
      setArticles(prev => editingId ? prev.map(a => a.id === id ? artData : a) : [artData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'article', id);
    } else if (showForm === 'event') {
      const evData: Event = {
        id, slug, title: { si: formData.titleSi, en: formData.titleEn },
        description: { si: formData.excerptSi, en: formData.excerptEn },
        date: formData.date, author: 'Admin', image: formData.image, location: formData.location,
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2768.456!2d14.505!'
      };
      setEvents(prev => editingId ? prev.map(e => e.id === id ? evData : e) : [evData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'event', id);
    } else if (showForm === 'gallery') {
      const galData: GalleryItem = {
        id, eventId: 'custom', title: { si: formData.titleSi, en: formData.titleEn },
        images: formData.galleryImages.split('\n').filter(url => url.trim())
      };
      setGallery(prev => editingId ? prev.map(g => g.id === id ? galData : g) : [galData, ...prev]);
      addLog(editingId ? 'update' : 'create', 'gallery', id);
    }
    
    setShowForm(null);
    setEditingId(null);
    setFormData({
      titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800', 
      location: '', date: new Date().toISOString().split('T')[0], galleryImages: ''
    });
  };

  return (
    <div className="pt-32 pb-32 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-16">
        <h1 className="retro-font text-5xl text-teal-400 tracking-tighter uppercase font-black">Admin Nadzorna Plošča</h1>
        <button onClick={() => { setIsAdmin(false); navigate('/'); }} className="flex items-center gap-2 bg-slate-800 px-10 py-5 rounded-full hover:bg-pink-500 transition-all font-bold uppercase tracking-[0.2em] shadow-xl">
          <LogOut size={22} /> Odjava
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 p-12 rounded-[4.5rem] w-full max-w-4xl border border-pink-500/50 max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(236,72,153,0.2)]">
            <h2 className="retro-font text-4xl text-pink-500 mb-10 uppercase text-center tracking-tighter font-black">
              {editingId ? 'Uredi' : 'Dodaj novo'}: {showForm}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
              <div className="space-y-6">
                <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 focus:border-teal-400 outline-none text-lg" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 focus:border-teal-400 outline-none text-lg" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                {(showForm === 'article' || showForm === 'event') && (
                  <>
                    <textarea required placeholder="Povzetek (SI)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 h-28 focus:border-teal-400 outline-none" value={formData.excerptSi} onChange={e => setFormData({...formData, excerptSi: e.target.value})} />
                    <textarea required placeholder="Summary (EN)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 h-28 focus:border-teal-400 outline-none" value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} />
                  </>
                )}
              </div>
              <div className="space-y-6">
                {showForm === 'gallery' ? (
                  <textarea placeholder="URL-ji slik (vsak v svojo vrstico)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 h-72 focus:border-teal-400 outline-none font-mono text-sm leading-relaxed" value={formData.galleryImages} onChange={e => setFormData({...formData, galleryImages: e.target.value})} />
                ) : (
                  <>
                    <textarea required placeholder="Celotna vsebina (SI)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 h-40 focus:border-teal-400 outline-none leading-relaxed" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} />
                    <textarea required placeholder="Full Content (EN)" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 h-40 focus:border-teal-400 outline-none leading-relaxed" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} />
                  </>
                )}
                {showForm !== 'gallery' && (
                  <input placeholder="URL naslovne slike" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                )}
                <div className="grid grid-cols-2 gap-6">
                  <input type="date" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  {showForm === 'event' && <input placeholder="Lokacija" className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />}
                </div>
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="flex-1 py-8 bg-pink-500 rounded-full font-bold retro-font hover:bg-pink-600 flex items-center justify-center gap-5 text-2xl shadow-2xl shadow-pink-500/40 uppercase tracking-widest"><Save size={28} /> Shrani</button>
              <button type="button" onClick={() => { setShowForm(null); setEditingId(null); }} className="flex-1 py-8 bg-slate-800 rounded-full font-bold retro-font hover:bg-slate-700 text-2xl uppercase tracking-widest">Prekliči</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-20">
          <AdminList title="Novice / Članki" icon={<ImageIcon className="text-pink-500" />} items={articles} onAdd={() => setShowForm('article')} onEdit={(item: any) => handleEdit('article', item)} onDelete={(id: string) => { setArticles(a => a.filter(x => x.id !== id)); addLog('delete', 'article', id); }} lang={lang} />
          <AdminList title="Napovednik (Dogodki)" icon={<Calendar className="text-teal-400" />} items={events} onAdd={() => setShowForm('event')} onEdit={(item: any) => handleEdit('event', item)} onDelete={(id: string) => { setEvents(e => e.filter(x => x.id !== id)); addLog('delete', 'event', id); }} lang={lang} />
          <AdminList title="Galerije" icon={<ExternalLink className="text-purple-400" />} items={gallery} onAdd={() => setShowForm('gallery')} onEdit={(item: any) => handleEdit('gallery', item)} onDelete={(id: string) => { setGallery(g => g.filter(x => x.id !== id)); addLog('delete', 'gallery', id); }} lang={lang} />
        </div>
        <div className="bg-slate-900 p-12 rounded-[4.5rem] border border-slate-800 shadow-2xl h-fit sticky top-32">
          <h2 className="font-bold text-3xl mb-10 text-pink-500 tracking-widest flex items-center gap-5 uppercase font-black">Aktivnosti</h2>
          <div className="space-y-8 max-h-[700px] overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.length === 0 ? <p className="text-slate-600 italic text-xl">Ni zabeleženih aktivnosti.</p> : logs.map(log => (
              <div key={log.id} className="text-sm border-l-4 border-slate-800 pl-8 py-6 bg-slate-950/50 rounded-r-[2.5rem] shadow-inner">
                <div className="text-slate-500 mb-2 font-mono">{new Date(log.timestamp).toLocaleString()}</div>
                <div className="text-slate-200 text-lg"><span className="font-black text-teal-400 uppercase tracking-widest">{log.action}</span> {log.type}: <span className="opacity-40 text-sm">{log.targetId}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminList = ({ title, icon, items, onAdd, onEdit, onDelete, lang }: any) => (
  <div className="bg-slate-900 p-12 rounded-[5rem] border border-slate-800 shadow-2xl overflow-hidden">
    <div className="flex justify-between items-center mb-14">
      <h2 className="text-4xl font-black flex items-center gap-6">{icon} {title}</h2>
      <button onClick={onAdd} className="bg-pink-500 p-6 rounded-full hover:scale-110 transition-transform shadow-2xl shadow-pink-500/40 border border-white/10"><Plus size={36} /></button>
    </div>
    <div className="space-y-6">
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between p-8 bg-slate-950/50 rounded-[3rem] border border-slate-800 hover:border-pink-500 transition-all group hover:bg-slate-950">
          <div className="flex items-center gap-8 overflow-hidden">
            <img src={item.image || item.images?.[0]} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-2xl shrink-0 border border-white/5" alt="Thumb" />
            <span className="font-bold text-2xl truncate tracking-tighter uppercase">{item.title[lang]}</span>
          </div>
          <div className="flex gap-6 shrink-0">
            <button onClick={() => onEdit(item)} className="p-5 text-teal-400 hover:bg-teal-400/10 rounded-full transition-all hover:scale-110 border border-transparent hover:border-teal-400/30"><Edit3 size={32} /></button>
            <button onClick={() => { if(confirm('Ste prepričani, da želite izbrisati to vsebino?')){ onDelete(item.id); } }} className="p-5 text-pink-500 hover:bg-pink-500/10 rounded-full transition-all hover:scale-110 border border-transparent hover:border-pink-500/30"><Trash2 size={32} /></button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-slate-600 italic py-20 text-2xl font-light">Seznam je prazen.</p>}
    </div>
  </div>
);

const App = () => {
  const [lang, setLang] = useState<Language>('si');
  const [isAdmin, setIsAdmin] = useState(false);
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('an_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('an_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('an_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('an_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('an_articles', JSON.stringify(articles));
  }, [articles]);
  useEffect(() => {
    localStorage.setItem('an_events', JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem('an_gallery', JSON.stringify(gallery));
  }, [gallery]);
  useEffect(() => {
    localStorage.setItem('an_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const authed = localStorage.getItem('an_admin');
    if (authed === 'true') setIsAdmin(true);
  }, []);

  const addLog = (action: ActivityLog['action'], type: ActivityLog['type'], targetId: string) => {
    const newLog: ActivityLog = { id: Date.now().toString(), action, type, targetId, timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('an_admin');
  };

  return (
    <AppContext.Provider value={{ 
      lang, setLang, isAdmin, setIsAdmin: (b) => { setIsAdmin(b); if(!b) handleLogout(); }, 
      articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog 
    }}>
      <HashRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500 font-sans tracking-tight">
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
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-950 border-t border-purple-500/20 py-48 px-4 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_30px_#ec4899]" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-24 text-center md:text-left items-start">
        <div className="md:col-span-2 space-y-12">
          <h3 className="retro-font text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 mb-10 uppercase tracking-tighter">Avtonostalgija 80&90</h3>
          <p className="text-slate-400 text-3xl leading-relaxed max-w-xl font-light italic opacity-70">Skupaj ohranjamo zapuščino zlate dobe avtomobilizma za prihodnje generacije ljubiteljev.</p>
        </div>
        <div className="space-y-12">
          <h4 className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-600">Dokumentacija</h4>
          <div className="flex flex-col space-y-8 text-sm font-bold uppercase tracking-[0.3em]">
            <Link to="/privacy" className="hover:text-pink-500 transition-colors">Zasebnost</Link>
            <Link to="/terms" className="hover:text-pink-500 transition-colors">Pogoji uporabe</Link>
          </div>
        </div>
        <div className="space-y-12">
          <h4 className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-600">Podpora</h4>
          <div className="flex flex-col space-y-8 text-sm font-bold tracking-[0.2em]">
            <p className="text-slate-400 hover:text-white transition-colors cursor-pointer text-lg">info@avtonostalgija.si</p>
            <p className="text-slate-400 hover:text-white transition-colors cursor-pointer text-2xl font-black">+386 41 000 000</p>
          </div>
        </div>
      </div>
      <div className="mt-48 text-center text-[11px] font-black uppercase tracking-[0.8em] text-slate-800">
        &copy; MMXXIV Avtonostalgija 80&90. Vrhunska Digitalna Izkušnja.
      </div>
    </footer>
  );
};

export default App;
