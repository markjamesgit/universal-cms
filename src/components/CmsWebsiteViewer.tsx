import React, { useState } from "react";
import { 
  Scissors, MapPin, Phone, Mail, Clock, Calendar, Star, Sparkles, 
  ChevronDown, Send, MessageSquare, BookOpen, ExternalLink, RefreshCw, Check
} from "lucide-react";
import { BusinessTenant, Service, Staff, Review, BlogPost, FAQItem } from "../types";

interface CmsWebsiteViewerProps {
  business: BusinessTenant;
  services: Service[];
  staffList: Staff[];
  reviews: Review[];
  blogs: BlogPost[];
  faqs: FAQItem[];
  onLaunchBooking: (service?: Service) => void;
  onSubmitReview: (reviewData: {
    customerName: string;
    serviceName: string;
    rating: number;
    comment: string;
  }) => Promise<any>;
}

export default function CmsWebsiteViewer({
  business,
  services,
  staffList,
  reviews,
  blogs,
  faqs,
  onLaunchBooking,
  onSubmitReview,
}: CmsWebsiteViewerProps) {
  const [activeTab, setActiveTab] = useState<"home" | "services" | "reviews" | "blog" | "faq">("home");
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewService, setReviewService] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Fallback hero images if not configured in JSON db
  const templateImages: Record<string, string> = {
    "hair-salon": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
    "nail-salon": "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=1200",
    "tattoo-studio": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=1200",
    "makeup-artist": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1200",
    "generic-coaching": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200"
  };

  const heroImage = templateImages[business.templateType] || templateImages["hair-salon"];

  const getThemeColorClass = () => {
    switch (business.theme.primaryPalette) {
      case "emerald": return "emerald";
      case "amber": return "amber";
      case "rose": return "rose";
      case "violet": return "violet";
      case "retro-slate": return "sky";
      default: return "indigo";
    }
  };

  const themeColor = getThemeColorClass();

  // Typography selection
  const fontClass = () => {
    if (business.theme.customFontGoogle) return "custom-font-override";
    if (business.theme.fontFamily === "serif") return "font-serif";
    if (business.theme.fontFamily === "mono") return "font-mono";
    return "font-sans";
  };

  const buttonRoundingClass = () => {
    if (business.theme.buttonStyle === "square") return "rounded-none";
    if (business.theme.buttonStyle === "pill") return "rounded-full";
    return "rounded-xl";
  };

  // Theme palettes CSS configs overrides
  const pBtnClass = "cms-p-btn";
  const pTextClass = "cms-p-text";
  const pBorderClass = "cms-p-border";
  const pBgClass = "cms-p-bg";

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      alert("Please provide custom guest name and text feedback.");
      return;
    }
    setSubmittingReview(true);
    try {
      await onSubmitReview({
        customerName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
        serviceName: reviewService || "Bespoke Treatment"
      });
      setReviewSubmittedSuccess(true);
      setTimeout(() => {
        setReviewName("");
        setReviewComment("");
        setReviewService("");
        setReviewRating(5);
        setReviewSubmittedSuccess(false);
        setWriteReviewOpen(false);
      }, 3000);
    } catch (err: any) {
      alert("Error posting review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const fallbackHexColor = 
    themeColor === "sky" ? "#38bdf8" :
    themeColor === "rose" ? "#ec4899" :
    themeColor === "violet" ? "#8b5cf6" :
    themeColor === "emerald" ? "#10b981" :
    themeColor === "amber" ? "#f59e0b" : "#6366f1";

  return (
    <div className={`w-full min-h-screen text-slate-100 bg-[#0e0f13] select-text relative pb-12 custom-bg-override custom-text-override font-size-container ${fontClass()}`}>
      
      {/* Dynamic Style injection block to bind custom fonts, colors, and font sizes with zero inline style attributes */}
      <style>{`
        ${business.theme.customFontGoogle ? `
          @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(business.theme.customFontGoogle)}:wght@300;400;500;700;900&display=swap');
          .custom-font-override {
            font-family: "${business.theme.customFontGoogle}", -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        ` : ''}

        ${business.theme.customBgColor ? `
          .custom-bg-override {
            background-color: ${business.theme.customBgColor} !important;
          }
        ` : ''}

        ${business.theme.customTextColor ? `
          .custom-text-override, .custom-text-override p, .custom-text-override h2, .custom-text-override h3, .custom-text-override h4, .custom-text-override span:not(.cms-p-btn) {
            color: ${business.theme.customTextColor} !important;
          }
        ` : ''}

        .cms-p-btn {
          background-color: ${business.theme.customAccentColor || fallbackHexColor} !important;
          color: #ffffff !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cms-p-btn:hover {
          filter: brightness(1.15) !important;
          box-shadow: 0 0 15px ${(business.theme.customAccentColor || fallbackHexColor)}40 !important;
        }
        .cms-p-text {
          color: ${business.theme.customAccentColor || fallbackHexColor} !important;
        }
        .cms-p-border {
          border-color: ${(business.theme.customAccentColor || fallbackHexColor)}30 !important;
        }
        .cms-p-bg {
          background-color: ${(business.theme.customAccentColor || fallbackHexColor)}12 !important;
        }

        /* Customizable global font scale overrides */
        .font-size-container {
          font-size: ${
            business.theme.fontSizeSetting === "small" ? "0.82rem" :
            business.theme.fontSizeSetting === "large" ? "1.1rem" :
            business.theme.fontSizeSetting === "extra-large" ? "1.25rem" : "0.95rem"
          } !important;
        }
        .font-size-container h1 {
          font-size: ${
            business.theme.fontSizeSetting === "small" ? "2rem" :
            business.theme.fontSizeSetting === "large" ? "3.25rem" :
            business.theme.fontSizeSetting === "extra-large" ? "4.25rem" : "2.75rem"
          } !important;
        }
        .font-size-container h2 {
          font-size: ${
            business.theme.fontSizeSetting === "small" ? "1.35rem" :
            business.theme.fontSizeSetting === "large" ? "2rem" :
            business.theme.fontSizeSetting === "extra-large" ? "2.5rem" : "1.75rem"
          } !important;
        }
        .font-size-container h3, .font-size-container h4 {
          font-size: ${
            business.theme.fontSizeSetting === "small" ? "1.05rem" :
            business.theme.fontSizeSetting === "large" ? "1.45rem" :
            business.theme.fontSizeSetting === "extra-large" ? "1.75rem" : "1.2rem"
          } !important;
        }
        .font-size-container p, .font-size-container span, .font-size-container button, .font-size-container select {
          font-size: ${
            business.theme.fontSizeSetting === "small" ? "0.78rem" :
            business.theme.fontSizeSetting === "large" ? "1.02rem" :
            business.theme.fontSizeSetting === "extra-large" ? "1.12rem" : "0.88rem"
          } !important;
        }
      `}</style>

      {/* Absolute Ambient Background Lights matching the business active palette */}
      <div className={`absolute top-0 right-[20%] w-[45%] h-[45%] bg-${themeColor}-500/10 rounded-full blur-[140px] pointer-events-none`}></div>
      <div className="absolute bottom-[15%] left-[10%] w-[35%] h-[35%] bg-slate-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Website Navigation Header inside dynamic glass */}
      <header className="sticky top-0 z-30 w-full bg-black/40 backdrop-blur-md border-b border-white/5 p-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner">
              {business.logo}
            </div>
            <div>
              <span className="text-md font-bold text-white tracking-tight">{business.name}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-green-500/10 text-green-400 text-[9px] uppercase font-bold tracking-widest rounded ml-2">CMS-Generated</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-350">
            <button 
              onClick={() => setActiveTab("home")} 
              className={`hover:text-white transition-colors py-1 ${activeTab === "home" ? `text-${themeColor}-400 border-b border-${themeColor}-400 font-bold` : ""}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("services")} 
              className={`hover:text-white transition-colors py-1 ${activeTab === "services" ? `text-${themeColor}-400 border-b border-${themeColor}-400 font-bold` : ""}`}
            >
              Services Menu
            </button>
            <button 
              onClick={() => setActiveTab("reviews")} 
              className={`hover:text-white transition-colors py-1 ${activeTab === "reviews" ? `text-${themeColor}-400 border-b border-${themeColor}-400 font-bold` : ""}`}
            >
              Testimonials
            </button>
            <button 
              onClick={() => setActiveTab("blog")} 
              className={`hover:text-white transition-colors py-1 ${activeTab === "blog" ? `text-${themeColor}-400 border-b border-${themeColor}-400 font-bold` : ""}`}
            >
              Blog
            </button>
            <button 
              onClick={() => setActiveTab("faq")} 
              className={`hover:text-white transition-colors py-1 ${activeTab === "faq" ? `text-${themeColor}-400 border-b border-${themeColor}-400 font-bold` : ""}`}
            >
              FAQs
            </button>
          </nav>

          <button 
            id="navbar-book-now-btn"
            onClick={() => onLaunchBooking()} 
            className={`px-4 py-2 text-xs font-bold transition-all shadow-md shadow-${themeColor}-600/10 active:scale-95 cursor-pointer ${pBtnClass} ${buttonRoundingClass()}`}
          >
            Book Appointment
          </button>
        </div>
      </header>

      {/* Website Navigation Toolbar on mobile screens */}
      <div className="md:hidden flex space-x-2 overflow-x-auto px-4 py-2 border-b border-white/5 bg-black/20 text-xs text-slate-400">
        <button onClick={() => setActiveTab("home")} className={`px-3 py-1 bg-white/5 rounded-full ${activeTab === "home" ? `bg-white/15 text-white` : ""}`}>Overview</button>
        <button onClick={() => setActiveTab("services")} className={`px-3 py-1 bg-white/5 rounded-full ${activeTab === "services" ? `bg-white/15 text-white` : ""}`}>Services</button>
        <button onClick={() => setActiveTab("reviews")} className={`px-3 py-1 bg-white/5 rounded-full ${activeTab === "reviews" ? `bg-white/15 text-white` : ""}`}>Reviews</button>
        <button onClick={() => setActiveTab("blog")} className={`px-3 py-1 bg-white/5 rounded-full ${activeTab === "blog" ? `bg-white/15 text-white` : ""}`}>Blog</button>
        <button onClick={() => setActiveTab("faq")} className={`px-3 py-1 bg-white/5 rounded-full ${activeTab === "faq" ? `bg-white/15 text-white` : ""}`}>FAQs</button>
      </div>

      {/* RENDER ACTIVE CMS SECTION */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        
        {/* HOMEPAGE SECTION OVERVIEW */}
        {activeTab === "home" && (
          <div className="space-y-12">
            
            {/* HERO PRESENTATION MODULE */}
            {business.theme.bannerStyle === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-3xl backdrop-blur-xl">
                <div className="space-y-5">
                  <span className={`px-3 py-1 rounded bg-${themeColor}-500/10 text-${themeColor}-400 text-xs font-semibold tracking-wider uppercase`}>
                    ★ Premium Selection
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-[1.1]">
                    {business.heroHeading}
                  </h1>
                  <p className="text-xs md:text-md text-slate-400 leading-relaxed font-light">
                    {business.heroSubheading}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <button 
                      onClick={() => onLaunchBooking()} 
                      className={`px-6 py-3 text-xs font-bold tracking-tight shadow-lg shadow-indigo-600/10 ${pBtnClass} ${buttonRoundingClass()}`}
                    >
                      Instant Booking Portal
                    </button>
                    <button 
                      onClick={() => setActiveTab("services")} 
                      className="px-6 py-3 text-xs border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      View Service List
                    </button>
                  </div>
                </div>
                <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img src={heroImage || undefined} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            )}

            {business.theme.bannerStyle === "overlay" && (
              <div className="relative h-96 md:h-[450px] rounded-3xl overflow-hidden border border-white/10 flex items-center bg-black">
                <div className="absolute inset-0 z-0">
                  <img src={heroImage || undefined} alt="Banner" className="w-full h-full object-cover opacity-45" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                </div>
                <div className="relative z-10 max-w-xl p-8 md:p-12 space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#38bdf8] bg-sky-950/40 px-2 py-1 rounded">Accent theme banner</span>
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tighter">
                    {business.heroHeading}
                  </h1>
                  <p className="text-xs text-slate-300">
                    {business.heroSubheading}
                  </p>
                  <div className="pt-2 flex gap-3">
                    <button 
                      onClick={() => onLaunchBooking()} 
                      className={`px-5 py-2.5 text-xs font-black shadow-lg ${pBtnClass} ${buttonRoundingClass()}`}
                    >
                      Start Scheduling Appt
                    </button>
                    <button 
                      onClick={() => setActiveTab("services")} 
                      className="px-5 py-2.5 text-xs bg-black/40 hover:bg-black/65 border border-white/10 rounded-xl transition-all"
                    >
                      Browse Offerings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {business.theme.bannerStyle === "minimal" && (
              <div className="text-center md:py-12 max-w-2xl mx-auto space-y-5">
                <span className={`inline-block px-3 py-1 rounded bg-${themeColor}-500/10 text-${themeColor}-400 text-xs font-semibold uppercase tracking-widest`}>
                  ⚡ Bespoke Standard Template
                </span>
                <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-none">
                  {business.heroHeading}
                </h1>
                <p className="text-xs md:text-md text-slate-400 font-light leading-relaxed">
                  {business.heroSubheading}
                </p>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <button 
                    onClick={() => onLaunchBooking()} 
                    className={`px-6 py-3 text-xs font-bold shadow-xl ${pBtnClass} ${buttonRoundingClass()}`}
                  >
                    Select Services
                  </button>
                  <button 
                    onClick={() => setActiveTab("reviews")} 
                    className="px-6 py-3 text-xs border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Guest Feedback
                  </button>
                </div>
              </div>
            )}

            {/* QUICK BRAND DETAIL (ABOUT) SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
              <div className="md:col-span-2 bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">Our Core Philosophy</h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {business.aboutText}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> {business.contactAddress}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-sky-400" /> {business.contactPhone}</span>
                </div>
              </div>

              {/* SERVICE HOURS CARD */}
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Our Operations</h3>
                <div className="space-y-2 mt-4 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Weekdays:</span>
                    <span className="font-semibold">09:00 AM - 08:00 PM</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Saturdays:</span>
                    <span className="font-semibold">09:00 AM - 07:00 PM</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5 text-rose-400">
                    <span>Sundays:</span>
                    <span className="font-bold">Closed (Auto Guard)</span>
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] text-slate-400">Book in advance through our custom CMS dashboard!</span>
                </div>
              </div>
            </div>

            {/* ACTIVE OFFERS HIGHLIGHTS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white tracking-tight">Our Specialists Offerings</h3>
                <span onClick={() => setActiveTab("services")} className={`text-xs text-${themeColor}-400 hover:underline cursor-pointer`}>View Service Catalog →</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.slice(0, 3).map(col => (
                  <div key={col.id} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col justify-between backdrop-blur group">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest bg-emerald-950/20 px-2 py-0.5 rounded inline-block">{col.category}</span>
                      <h4 className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">{col.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{col.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/5">
                      <div className="text-xs font-semibold text-slate-350">{col.duration} Mins</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">₱{col.price}</span>
                        <button 
                          onClick={() => onLaunchBooking(col)}
                          className={`p-1.5 text-xs font-black bg-white/10 text-white hover:bg-neutral-200 hover:text-black rounded-lg transition-all`}
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CLIENT REVIEWS CAROUSEL HIGHLIGHT */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Client Love & Feedback</h3>
                <span onClick={() => setActiveTab("reviews")} className={`text-xs text-${themeColor}-400 hover:underline cursor-pointer`}>Read All Reviews ({reviews.filter(r => r.approved).length}) →</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.filter(r => r.approved).slice(0, 2).map(re => (
                  <div key={re.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white">{re.customerName}</span>
                      <div className="flex text-yellow-500 text-xs">
                        {Array.from({ length: re.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-400 block mb-1">Treatment: {re.serviceName}</span>
                    <p className="text-xs text-slate-300 italic font-light">"{re.comment}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SERVICES TAB VIEW */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-white">Our Service Offerings</h2>
              <p className="text-xs text-slate-400 mt-2">Book directly with our accredited experts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(srv => (
                <div key={srv.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex gap-4 backdrop-blur-md">
                  {srv.image && (
                    <img src={srv.image || undefined} alt={srv.name} className="w-20 h-20 rounded-xl object-cover border border-white/5 flex-shrink-0" />
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold bg-white/5 px-2 py-0.5 rounded text-indigo-400">{srv.category}</span>
                        <span className="text-md font-bold text-white">₱{srv.price}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 mt-1">{srv.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{srv.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/5">
                      <span className="text-xs text-slate-400">{srv.duration} minutes</span>
                      <button
                        onClick={() => onLaunchBooking(srv)}
                        className={`px-4 py-1.5 text-xs font-bold transition-all ${pBtnClass} ${buttonRoundingClass()}`}
                      >
                        Book slot
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS COMMENTS TAB */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Guest Testimonials</h2>
                <p className="text-xs text-slate-450">Verified reviews and guest experiences</p>
              </div>
              <button 
                id="add-custom-review-btn"
                onClick={() => setWriteReviewOpen(!writeReviewOpen)}
                className={`px-4 py-2 text-xs font-bold transition-all ${pBtnClass} ${buttonRoundingClass()}`}
              >
                {writeReviewOpen ? "Close Panel" : "★ Write a Review"}
              </button>
            </div>

            {/* WRITE REVEW FORM GRID */}
            {writeReviewOpen && (
              <div className="bg-white/[0.04] p-5 border border-white/10 rounded-2xl max-w-xl space-y-4">
                <h3 className="text-sm font-bold text-white">Write a Client Review</h3>
                <p className="text-xs text-slate-400">Your review will be submitted for admin approval instantly.</p>
                
                {reviewSubmittedSuccess ? (
                  <div className="p-4 bg-emerald-900/30 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4" /> Guest Review registered! Moderated reviews appear in the system upon approval.
                  </div>
                ) : (
                  <form onSubmit={handlePostReview} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-350">Your Name:</label>
                        <input 
                          type="text" 
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="e.g. Sandra Bullock"
                          className="w-full bg-white/5 border border-white/10 px-3 py-1.5 rounded text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-350">Selected Service:</label>
                        <select 
                          value={reviewService}
                          onChange={(e) => setReviewService(e.target.value)}
                          className="w-full bg-[#121216] border border-white/10 px-3 py-1.5 rounded text-white"
                        >
                          <option value="">General Service</option>
                          {services.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-350">Client Rating:</label>
                      <div className="flex gap-2 text-xl text-yellow-405">
                        {[1, 2, 3, 4, 5].map(num => (
                          <button 
                            key={num}
                            type="button" 
                            onClick={() => setReviewRating(num)}
                            className="hover:scale-110 active:scale-95 transition-transform"
                          >
                            {num <= reviewRating ? "★" : "☆"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-350">Your Comments:</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Detail your professional experience with our styling results..."
                        className="w-full bg-white/5 border border-white/10 p-3 rounded text-white"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review for Review"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* REVIEWS GRID LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.filter(r => r.approved).length === 0 ? (
                <div className="p-8 border border-white/5 rounded-2xl text-slate-450 text-center col-span-2">
                  No testimonials approved for this tenant yet. Try submitting a test review!
                </div>
              ) : (
                reviews.filter(r => r.approved).map(rev => (
                  <div key={rev.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-white">{rev.customerName}</span>
                      <span className="text-[10px] text-slate-450">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 text-xs mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono tracking-wider block mb-1">Service: {rev.serviceName}</span>
                    <p className="text-xs text-slate-300 italic font-light">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* BLOG POSTS LIST */}
        {activeTab === "blog" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Our Studio Blog Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {blogs.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-450 border border-white/5 rounded-2xl">
                  No blogs written yet for this studio.
                </div>
              ) : (
                blogs.map((article) => (
                  <div key={article.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur flex flex-col justify-between group">
                    <div className="h-48 overflow-hidden relative border-b border-white/5">
                      <img src={article.image || undefined} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur text-[10px] px-2.5 py-1 text-indigo-300 rounded font-semibold">{article.category}</span>
                    </div>
                    <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-450">{article.date} • Written by {article.author}</span>
                        <h3 className="text-md font-bold text-white mt-1 group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                        <p className="text-xs text-slate-400 font-light mt-2 line-clamp-3 leading-relaxed">{article.content}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-4">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">In-depth reading</span>
                        <button 
                          onClick={() => alert(`Full article content: ${article.content}`)}
                          className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                        >
                          Read Full Article <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* FAQ ACCORDION PANEL */}
        {activeTab === "faq" && (
          <div className="space-y-6">
            <div className="text-center max-w-sm mx-auto mb-6">
              <h2 className="text-2xl font-black text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400 mt-1">Get immediate answers for studio reservations</p>
            </div>

            <div className="max-w-xl mx-auto space-y-3">
              {faqs.length === 0 ? (
                <div className="text-center p-8 border border-white/5 rounded-xl text-slate-450">
                  No FAQ questions set for this business yet.
                </div>
              ) : (
                faqs.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden backdrop-blur">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                      className="w-full p-4 flex justify-between items-center text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-xs md:text-sm font-semibold text-white">{item.question}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFaq === item.id ? "rotate-180 text-white" : ""}`} />
                    </button>
                    {expandedFaq === item.id && (
                      <div className="p-4 bg-white/[0.01] border-t border-white/5 text-xs text-slate-300 leading-relaxed font-light">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER METADATA BAR */}
      <footer className="max-w-6xl mx-auto mt-16 px-4 md:px-8 pt-8 border-t border-white/5 text-center space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">{business.logo}</span>
            <span className="text-white font-semibold">{business.name}</span>
          </div>
          <p>© 2026 {business.name} • CMS Generated Booking Website</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Booking Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
