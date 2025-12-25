
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronRight, MapPin, Calendar, Image as ImageIcon, Trash2, Edit3, Plus, ExternalLink, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { translations } from './translations';
import { Language, Article, Event, GalleryItem, ActivityLog } from './types';

// Context for global state management
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

// --- INITIAL DATA ---
const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'vstop-v-svet-youngtimerjev',
    title: { si: 'Vstop v svet Youngtimerjev', en: 'Entering the World of Youngtimers' },
    excerpt: { si: 'Kaj definira avtomobil iz 80-ih in 90-ih kot klasiko?', en: 'What defines an 80s or 90s car as a classic?' },
    content: { 
      si: 'V Sloveniji se meja za Youngtimerje vztrajno pomika v devetdeseta leta. Modeli kot so BMW E30, VW Golf II in Mazda MX-5 so postali ikone.\n\nKljuč do uspeha je originalnost. Mnogi zbiratelji danes iščejo vozila, ki niso bila predelana in imajo znano zgodovino. Youngtimerji nam ponujajo analogni občutek vožnje, ki ga v modernih digitaliziranih vozilih ne najdemo več.', 
      en: 'In Slovenia, the threshold for Youngtimers is steadily moving into the nineties. Models like the BMW E30, VW Golf II, and Mazda MX-5 have become icons.\n\nThe key to success is originality. Many collectors today are looking for vehicles that haven\'t been modified and have a known history. Youngtimers offer us an analog driving experience that can no longer be found in modern digitized vehicles.' 
    },
    image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800',
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
      en: 'The biggest meeting of 80s and 90s fans in central Slovenia. We expect more than 200 vehicles from the entire region.' 
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
    title: { si: 'Car Meet 1', en: 'Car Meet 1' },
    images: [
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600'
    ]
  }
];

// --- COMPONENTS ---

const Navbar = () => {
  const { lang, setLang, isAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
          <div onClick={() => handleNavClick('hero')} className="flex items-center space-x-2 cursor-pointer z-10 relative">
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
            <Link to={isAdmin ? "/admin" : "/login"} className="p-2 text-slate-400 hover:text-pink-500 cursor-pointer">
              <User size={20} className={isAdmin ? "text-teal-400" : ""} />
            </Link>
          </div>

          <button className="lg:hidden text-slate-100 p-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden glass border-t border-purple-500/20 absolute top-20 w-full max-h-[calc(100vh-5rem)] overflow-y-auto z-50">
          <div className="px-4 py-8 space-y-6 flex flex-col items-center text-lg uppercase tracking-widest font-bold">
             {menuItems.map(item => (
               <button key={item.id} onClick={() => handleNavClick(item.id)} className="cursor-pointer">{item.label}</button>
             ))}
             <div className="flex space-x-6 pt-6">
                <button onClick={() => { setLang('si'); setIsOpen(false); }} className={`px-4 py-1 rounded-full cursor-pointer ${lang === 'si' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>SI</button>
                <button onClick={() => { setLang('en'); setIsOpen(false); }} className={`px-4 py-1 rounded-full cursor-pointer ${lang === 'en' ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>EN</button>
             </div>
             <Link to={isAdmin ? "/admin" : "/login"} onClick={() => setIsOpen(false)} className={`cursor-pointer ${isAdmin ? 'text-teal-400' : 'text-slate-400'}`}>
              {isAdmin ? "Admin Panel" : t.common.login}
             </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const Section = ({ id, title, children, gradient }: { id: string, title: string, children?: React.ReactNode, gradient: string }) => (
  <section id={id} className={`py-24 px-4 transition-all relative ${gradient}`}>
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
      <div className="relative z-10 text-center px-4 w-full flex flex-col items-center">
        <h1 className="retro-font text-5xl md:text-8xl font-black mb-8 tracking-tighter neon-text-pink leading-none uppercase text-center w-full">
          {t.hero.title}
        </h1>
        <p className="text-lg md:text-2xl text-teal-400 font-light mb-12 tracking-[0.4em] uppercase italic opacity-80 text-center w-full">
          {t.hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg retro-font text-lg transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest cursor-pointer">
            {t.sections.events}
          </button>
          <button onClick={() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 rounded-lg retro-font text-lg transition-all transform hover:scale-105 uppercase tracking-widest cursor-pointer">
            {t.sections.news}
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

  return (
    <>
      {activeGallery && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-7xl rounded-3xl p-8 lg:p-16 border border-pink-500/30 relative">
            <button className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full hover:bg-pink-500 transition-colors cursor-pointer" onClick={() => setActiveGallery(null)}>
              <X size={24} />
            </button>
            <h2 className="retro-font text-3xl text-teal-400 mb-12 border-l-4 border-pink-500 pl-4">{activeGallery.title[lang]}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeGallery.images.map((img, idx) => (
                <div key={idx} className="relative group cursor-zoom-in overflow-hidden rounded-xl aspect-square shadow-xl" onClick={() => setLightboxIndex(idx)}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-xl text-slate-300 leading-relaxed font-light">
              Avtonostalgija 80&90 ni zgolj klub, je skupnost ljubiteljev analogne dobe, ko je bila vožnja čisti užitek brez digitalnih pomagal.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 glass rounded-2xl border border-pink-500/20 text-center">
                <div className="text-4xl font-black text-pink-500 mb-2">500+</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Članov</div>
              </div>
              <div className="p-6 glass rounded-2xl border border-teal-500/20 text-center">
                <div className="text-4xl font-black text-teal-400 mb-2">20+</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Dogodkov letno</div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800" className="relative z-10 rounded-2xl border border-white/10 shadow-2xl" alt="Classic Car" />
          </div>
        </div>
      </Section>

      <Section id="events" title={t.sections.events} gradient="bg-gradient-to-b from-indigo-950 to-purple-950">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <Link key={event.id} to={`/event/${event.slug}`} className="group relative block bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-pink-500 transition-all shadow-xl z-20">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={event.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={event.title[lang]} />
              </div>
              <div className="p-8">
                <div className="flex items-center text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
                  <Calendar size={14} className="mr-2 text-pink-500" /> {event.date}
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-pink-500 transition-colors h-14 line-clamp-2 uppercase">{event.title[lang]}</h3>
                <p className="text-sm text-slate-400 flex items-center font-light"><MapPin size={16} className="text-teal-400 mr-2" /> {event.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="news" title={t.sections.news} gradient="bg-gradient-to-b from-purple-950 to-teal-950">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {articles.map((article) => (
            <Link key={article.id} to={`/article/${article.slug}`} className="flex flex-col lg:flex-row gap-6 items-center glass p-6 rounded-2xl border border-white/5 group transition-all hover:bg-white/10 z-20 relative">
              <div className="w-full lg:w-40 h-40 shrink-0 overflow-hidden rounded-xl border border-white/10">
                <img src={article.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={article.title[lang]} />
              </div>
              <div className="flex-1">
                <span className="bg-pink-500/20 text-pink-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{article.category}</span>
                <h3 className="text-xl font-black mt-4 mb-2 group-hover:text-teal-400 transition-colors tracking-tight line-clamp-2 uppercase">
                  {article.title[lang]}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed font-light">{article.excerpt[lang]}</p>
                <div className="text-pink-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  {t.common.readMore} <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="gallery" title={t.sections.gallery} gradient="bg-gradient-to-b from-teal-950 to-slate-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {gallery.map((item) => (
            <div key={item.id} className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-xl aspect-[4/3] border border-slate-800 hover:border-teal-400 transition-all z-20" onClick={() => setActiveGallery(item)}>
              <img src={item.images[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title[lang]} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8">
                <h3 className="retro-font text-xl text-white mb-2 group-hover:text-pink-500 transition-colors uppercase tracking-tight">{item.title[lang]}</h3>
                <div className="text-teal-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <ImageIcon size={14} /> {item.images.length} fotografij
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" title={t.nav.contact} gradient="bg-gradient-to-t from-black to-slate-950">
        <div className="max-w-xl mx-auto glass p-10 rounded-3xl border border-pink-500/20 text-center space-y-10">
          <p className="text-2xl text-slate-300 font-light italic">"Klasika, ki jo pišete vi."</p>
          <div className="space-y-4">
             <div className="p-6 bg-slate-800/50 rounded-xl hover:bg-pink-500 transition-all cursor-pointer group z-20 relative">
               <p className="text-slate-400 group-hover:text-white font-bold text-lg">info@avtonostalgija.si</p>
             </div>
             <div className="p-6 bg-slate-800/50 rounded-xl hover:bg-teal-400 transition-all cursor-pointer group z-20 relative">
               <p className="text-slate-400 group-hover:text-slate-950 font-bold text-xl">+386 41 000 000</p>
             </div>
          </div>
          <div className="flex justify-center gap-6">
             {['fb', 'ig', 'li', 'yt'].map(soc => (
               <div key={soc} className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-all hover:scale-110 shadow-lg text-lg font-black uppercase border border-white/5">
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

  if (!article) return <div className="pt-48 text-center h-screen text-3xl retro-font uppercase">Članek ni bil najden</div>;

  return (
    <div className="pt-32 pb-32 px-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-3 text-pink-500 hover:text-white transition-colors font-bold uppercase tracking-widest mb-12 text-sm cursor-pointer">
         <ArrowLeft size={20} /> {t.common.back}
      </button>
      <div className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <img src={article.image} className="w-full aspect-video object-cover" alt={article.title[lang]} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
      </div>
      <h1 className="text-4xl md:text-6xl font-black mb-10 retro-font leading-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 uppercase">
        {article.title[lang]}
      </h1>
      <div className="flex flex-wrap items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500 mb-12 border-y border-slate-900 py-8">
        <span className="flex items-center gap-3"><User size={18} className="text-pink-500" /> {t.common.author}: <strong className="text-slate-200">{article.author}</strong></span>
        <span className="flex items-center gap-3"><Calendar size={18} className="text-teal-400" /> {t.common.date}: <strong className="text-slate-200">{article.date}</strong></span>
      </div>
      <div className="prose prose-invert prose-pink max-w-none text-slate-300 leading-relaxed text-lg space-y-10 whitespace-pre-wrap font-light">
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

  if (!event) return <div className="pt-48 text-center h-screen text-3xl retro-font uppercase">Dogodek ni bil najden</div>;

  return (
    <div className="pt-32 pb-32 px-4 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-3 text-teal-400 hover:text-white transition-colors font-bold uppercase tracking-widest mb-12 text-sm cursor-pointer">
         <ArrowLeft size={20} /> {t.common.back}
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/5 mb-10">
            <img src={event.image} className="w-full aspect-video object-cover" alt={event.title[lang]} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black retro-font leading-tight text-pink-500 tracking-tighter uppercase mb-10">{event.title[lang]}</h1>
          <p className="text-xl text-slate-400 leading-relaxed font-light whitespace-pre-wrap">{event.description[lang]}</p>
        </div>
        <div className="lg:col-span-5 sticky top-32 space-y-8">
          <div className="glass p-10 rounded-3xl border border-teal-500/20 shadow-2xl space-y-10">
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-teal-400/10 rounded-2xl text-teal-400"><Calendar size={28} /></div>
                 <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-black">Datum dogodka</div>
                    <div className="text-xl font-bold">{event.date}</div>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-pink-500/10 rounded-2xl text-pink-500"><MapPin size={28} /></div>
                 <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-black">Prizorišče</div>
                    <div className="text-xl font-bold">{event.location}</div>
                 </div>
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 h-64 overflow-hidden shadow-inner">
               <iframe src={event.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" className="grayscale invert opacity-40 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { setIsAdmin } = useApp();
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
    <div className="pt-48 pb-20 flex justify-center h-screen px-4">
      <div className="glass p-12 rounded-3xl w-full max-w-md border border-pink-500/30 shadow-2xl h-fit">
        <h2 className="retro-font text-3xl text-pink-500 mb-10 text-center uppercase tracking-tighter font-black">Admin Nadzor</h2>
        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-4 ml-4">Secure Key</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-full px-8 py-4 focus:border-pink-500 outline-none transition-all text-center tracking-widest text-2xl font-black" placeholder="••••" />
          </div>
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-700 rounded-full font-bold uppercase retro-font tracking-widest text-lg shadow-xl hover:scale-105 transition-transform cursor-pointer">Vstop</button>
        </form>
      </div>
    </div>
  );
};

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }: { images: string[], currentIndex: number, onClose: () => void, onPrev: () => void, onNext: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
    <button className="absolute top-8 right-8 text-white p-3 hover:bg-white/10 rounded-full z-[110] transition-colors cursor-pointer" onClick={onClose}><X size={32} /></button>
    
    {images.length > 1 && (
      <>
        <button className="absolute left-8 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ArrowLeft size={48} /></button>
        <button className="absolute right-8 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-[110] transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }}><ArrowRight size={48} /></button>
      </>
    )}
    
    <div className="relative max-w-7xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
      <img src={images[currentIndex]} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="Lightbox" />
      <div className="mt-6 text-slate-500 text-sm font-black tracking-widest uppercase">{currentIndex + 1} / {images.length}</div>
    </div>
  </div>
);

const AdminCMS = () => {
  const { lang, isAdmin, setIsAdmin, articles, setArticles, events, setEvents, gallery, setGallery, logs, addLog } = useApp();
  const [showForm, setShowForm] = useState<'article' | 'event' | 'gallery' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    titleSi: '', titleEn: '', excerptSi: '', excerptEn: '', contentSi: '', contentEn: '',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800', 
    location: '', date: new Date().toISOString().split('T')[0], galleryImages: ''
  });

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

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
    <div className="pt-24 pb-32 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-16">
        <h1 className="retro-font text-4xl text-teal-400 tracking-tighter uppercase font-black">CMS Panel</h1>
        <button onClick={() => { setIsAdmin(false); navigate('/'); }} className="flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-lg hover:bg-pink-500 transition-all font-bold uppercase tracking-widest shadow-xl cursor-pointer">
          <LogOut size={20} /> Odjava
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 p-10 rounded-3xl w-full max-w-4xl border border-pink-500/50 max-h-[90vh] overflow-y-auto">
            <h2 className="retro-font text-3xl text-pink-500 mb-10 uppercase text-center tracking-tighter font-black">
              {editingId ? 'Uredi' : 'Ustvari'}: {showForm}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <input required placeholder="Naslov (SI)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.titleSi} onChange={e => setFormData({...formData, titleSi: e.target.value})} />
                <input required placeholder="Title (EN)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                {(showForm === 'article' || showForm === 'event') && (
                  <>
                    <textarea required placeholder="Povzetek (SI)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 h-24 focus:border-teal-400 outline-none" value={formData.excerptSi} onChange={e => setFormData({...formData, excerptSi: e.target.value})} />
                    <textarea required placeholder="Summary (EN)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 h-24 focus:border-teal-400 outline-none" value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} />
                  </>
                )}
              </div>
              <div className="space-y-6">
                {showForm === 'gallery' ? (
                  <textarea placeholder="URL-ji slik (vsak v svojo vrstico)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 h-64 focus:border-teal-400 outline-none font-mono text-sm leading-relaxed" value={formData.galleryImages} onChange={e => setFormData({...formData, galleryImages: e.target.value})} />
                ) : (
                  <>
                    <textarea required placeholder="Celotna vsebina (SI)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 h-40 focus:border-teal-400 outline-none leading-relaxed" value={formData.contentSi} onChange={e => setFormData({...formData, contentSi: e.target.value})} />
                    <textarea required placeholder="Full Content (EN)" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 h-40 focus:border-teal-400 outline-none leading-relaxed" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} />
                  </>
                )}
                {showForm !== 'gallery' && (
                  <input placeholder="URL naslovne slike" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  {showForm === 'event' && <input placeholder="Lokacija" className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 focus:border-teal-400 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />}
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <button type="submit" className="flex-1 py-4 bg-pink-500 rounded-lg font-black retro-font hover:bg-pink-600 flex items-center justify-center gap-4 text-xl shadow-xl uppercase tracking-widest cursor-pointer"><Save size={24} /> Shrani</button>
              <button type="button" onClick={() => { setShowForm(null); setEditingId(null); }} className="flex-1 py-4 bg-slate-800 rounded-lg font-black retro-font hover:bg-slate-700 text-xl uppercase tracking-widest cursor-pointer">Prekliči</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-16">
          <AdminList title="Članki" icon={<ImageIcon className="text-pink-500" />} items={articles} onAdd={() => setShowForm('article')} onEdit={(item: any) => handleEdit('article', item)} onDelete={(id: string) => { setArticles(a => a.filter(x => x.id !== id)); addLog('delete', 'article', id); }} lang={lang} />
          <AdminList title="Dogodki" icon={<Calendar className="text-teal-400" />} items={events} onAdd={() => setShowForm('event')} onEdit={(item: any) => handleEdit('event', item)} onDelete={(id: string) => { setEvents(e => e.filter(x => x.id !== id)); addLog('delete', 'event', id); }} lang={lang} />
          <AdminList title="Galerije" icon={<ExternalLink className="text-purple-400" />} items={gallery} onAdd={() => setShowForm('gallery')} onEdit={(item: any) => handleEdit('gallery', item)} onDelete={(id: string) => { setGallery(g => g.filter(x => x.id !== id)); addLog('delete', 'gallery', id); }} lang={lang} />
        </div>
        <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl h-fit sticky top-32">
          <h2 className="font-black text-2xl mb-8 text-pink-500 tracking-widest flex items-center gap-4 uppercase">Dnevnik</h2>
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.length === 0 ? <p className="text-slate-600 italic text-lg font-light">Seznam je prazen.</p> : logs.map(log => (
              <div key={log.id} className="text-sm border-l-4 border-slate-800 pl-6 py-6 bg-slate-950/50 rounded-r-2xl shadow-inner">
                <div className="text-slate-500 mb-2 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</div>
                <div className="text-slate-200 text-base"><span className="font-black text-teal-400 uppercase tracking-widest">{log.action}</span> {log.type}: <span className="opacity-40 text-xs">{log.targetId}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminList = ({ title, icon, items, onAdd, onEdit, onDelete, lang }: any) => (
  <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
    <div className="flex justify-between items-center mb-10">
      <h2 className="text-3xl font-black flex items-center gap-6 uppercase">{icon} {title}</h2>
      <button onClick={onAdd} className="bg-pink-500 p-4 rounded-full hover:scale-110 transition-transform shadow-xl border border-white/10 cursor-pointer"><Plus size={28} /></button>
    </div>
    <div className="space-y-6">
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-pink-500 transition-all group">
          <div className="flex items-center gap-6 overflow-hidden">
            <img src={item.image || item.images?.[0]} className="w-20 h-20 rounded-xl object-cover shadow-xl shrink-0 border border-white/5" alt="Thumb" />
            <span className="font-bold text-xl truncate tracking-tighter uppercase">{item.title[lang]}</span>
          </div>
          <div className="flex gap-4 shrink-0">
            <button onClick={() => onEdit(item)} className="p-4 text-teal-400 hover:bg-teal-400/10 rounded-full transition-all hover:scale-110 cursor-pointer"><Edit3 size={28} /></button>
            <button onClick={() => { if(confirm('Ste prepričani?')){ onDelete(item.id); } }} className="p-4 text-pink-500 hover:bg-pink-500/10 rounded-full transition-all hover:scale-110 cursor-pointer"><Trash2 size={28} /></button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-slate-600 italic py-12 text-xl font-light">Seznam je prazen.</p>}
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

  return (
    <AppContext.Provider value={{ 
      lang, setLang, isAdmin, setIsAdmin: (b) => { setIsAdmin(b); if(!b) { localStorage.removeItem('an_admin'); setIsAdmin(false); } }, 
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

  return (
    <footer className="bg-slate-950 border-t border-purple-500/20 py-24 px-4 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_30px_#ec4899]" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left items-start">
        <div className="md:col-span-2 space-y-12">
          <h3 className="retro-font text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-teal-400 mb-8 uppercase tracking-tighter">Avtonostalgija 80&90</h3>
          <p className="text-slate-400 text-2xl leading-relaxed max-w-xl font-light italic opacity-80">Skupaj ohranjamo zapuščino zlate dobe avtomobilizma.</p>
        </div>
        <div className="space-y-10">
          <h4 className="font-black uppercase tracking-[0.4em] text-[12px] text-slate-600">Informacije</h4>
          <div className="flex flex-col space-y-6 text-sm font-bold uppercase tracking-widest">
            <span className="hover:text-pink-500 transition-colors cursor-pointer">Zasebnost</span>
            <span className="hover:text-pink-500 transition-colors cursor-pointer">Pogoji uporabe</span>
          </div>
        </div>
        <div className="space-y-10">
          <h4 className="font-black uppercase tracking-[0.4em] text-[12px] text-slate-600">Kontakt</h4>
          <div className="flex flex-col space-y-6 text-sm font-bold tracking-widest">
            <p className="text-slate-400 hover:text-white transition-colors cursor-pointer">info@avtonostalgija.si</p>
            <p className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl font-black">+386 41 000 000</p>
          </div>
        </div>
      </div>
      <div className="mt-24 text-center text-[11px] font-black uppercase tracking-[0.8em] text-slate-800">
        &copy; 2024 Avtonostalgija 80&90.
      </div>
    </footer>
  );
};

export default App;
