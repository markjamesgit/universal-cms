import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Calendar as CalendarIcon, Users, Scissors, Settings, 
  Plus, Search, Check, X, ChevronDown, ChevronRight, Star, Mail, Phone, 
  MapPin, Sparkles, TrendingUp, Trash2, Edit, ShieldAlert, FileText, 
  Sliders, Globe, RefreshCw, SlidersHorizontal, History, UserCheck, 
  LogOut, PlusCircle, AlertCircle, Info, Send, BookOpen, Layers,
  Smartphone, Tablet, Monitor, User as UserIcon
} from "lucide-react";
import { 
  UserRole, BusinessTenant, Service, Staff, Customer, 
  Booking, Review, BlogPost, FAQItem, AuditLog, EmailTemplate, ThemePalette, ThemeFont, User
} from "./types";

// Business Core Sub-Components
import BookingWizard from "./components/BookingWizard";
import CmsWebsiteViewer from "./components/CmsWebsiteViewer";
import ToastNotification from "./components/ToastNotification";

// Backoffice Sub-Components
import OnboardingModal from "./components/backoffice/OnboardingModal";
import SuperAdminDashboard from "./components/backoffice/SuperAdminDashboard";
import AuditLogsManager from "./components/backoffice/AuditLogsManager";
import MerchantDashboard from "./components/backoffice/MerchantDashboard";
import BookingSchedule from "./components/backoffice/BookingSchedule";
import ServicesConfig from "./components/backoffice/ServicesConfig";
import StaffManager from "./components/backoffice/StaffManager";
import CrmGuests from "./components/backoffice/CrmGuests";
import CmsCustomizer from "./components/backoffice/CmsCustomizer";
import EmailWorkflows from "./components/backoffice/EmailWorkflows";
import PersonalProfile from "./components/backoffice/PersonalProfile";

type BackofficeTab = "dashboard" | "calendar" | "services" | "staff" | "crm" | "cms" | "emails" | "logs" | "profile";

export default function App() {
  // Authentication & Actors simulations switcher
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [activeBusiness, setActiveBusiness] = useState<BusinessTenant | null>(null);

  // Discovery Marketplace and Auth states
  const [appView, setAppView] = useState<"marketplace" | "login" | "backoffice" | "customer_site">("marketplace");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessTenant | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackedBookings, setTrackedBookings] = useState<Booking[]>([]);
  const [hasTracked, setHasTracked] = useState(false);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);
  const [marketplaceSearch, setMarketplaceSearch] = useState("");
  const [marketplaceCategory, setMarketplaceCategory] = useState("all");
  
  // Centralized Database Table lists
  const [tenants, setTenants] = useState<BusinessTenant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  // Admin user profiles simulation states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backofficeColor, setBackofficeColor] = useState<string>("indigo");
  const [adminFont, setAdminFont] = useState<string>("inter");
  const [adminFontSize, setAdminFontSize] = useState<string>("regular");
  const [loginTab, setLoginTab] = useState<"merchant" | "super_admin">("merchant");

  // Multi-brand device simulation frames
  const [simDevice, setSimDevice] = useState<"desktop" | "iphone" | "samsung" | "pixel" | "ipad-pro" | "ipad-mini">("desktop");

  // Layout View Modals and Overlays controllers
  const [activeTab, setActiveTab] = useState<BackofficeTab>("dashboard");
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false);
  const [cmsPreviewOpen, setCmsPreviewOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ message: string; submessage?: string; type: "success" | "info" } | null>(null);

  // Load Baseline Tenants and Platform Ledger initially
  useEffect(() => {
    fetchTenants();
    fetchAuditLogs();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        if (data.length > 0) {
          setCurrentUser(data[0]);
        } else {
          // fallback
          const defaultAdmin: User = {
            id: "u-admin",
            name: "Alexander Mercer",
            email: "owner@unibook.co",
            role: UserRole.BUSINESS_ADMIN,
            phone: "+1 (415) 880-9900",
            bio: "Experienced salon operator and aesthetic designer.",
            photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
          };
          setCurrentUser(defaultAdmin);
        }
      }
    } catch (e) {
      console.error("Failed to load user list profiles", e);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCurrentUser(data);
      setUsers(prev => prev.map(u => u.id === data.id ? data : u));
    } catch (e: any) {
      console.error("Failed profile updates", e);
      throw e;
    }
  };

  // When active tenant shifts, sync appropriate sub-datasets
  useEffect(() => {
    if (activeBusiness) {
      fetchBusinessData(activeBusiness.id);
    } else {
      setServices([]);
      setStaff([]);
      setBookings([]);
      setCustomers([]);
      setReviews([]);
      setBlogs([]);
      setFaqs([]);
      setEmailTemplates([]);
    }
  }, [activeBusiness]);

  const triggerToast = (message: string, submessage?: string, type: "success" | "info" = "success") => {
    setNotificationToast({ message, submessage, type });
    setTimeout(() => setNotificationToast(null), 6000);
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTenants(data);
        if (data.length > 0 && !activeBusiness) {
          setActiveBusiness(data[0]);
        }
      }
    } catch (e) {
      console.error("Failed loading tenants list", e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Failed to load audit logs", e);
    }
  };

  const fetchBusinessData = async (businessId: string) => {
    try {
      const [srvRes, stfRes, bkRes, custRes, revRes, blgRes, faqRes, tempRes] = await Promise.all([
        fetch(`/api/services?businessId=${businessId}`),
        fetch(`/api/staff?businessId=${businessId}`),
        fetch(`/api/bookings?businessId=${businessId}`),
        fetch(`/api/customers?businessId=${businessId}`),
        fetch(`/api/reviews?businessId=${businessId}`),
        fetch(`/api/blogs?businessId=${businessId}`),
        fetch(`/api/faqs?businessId=${businessId}`),
        fetch(`/api/email-templates?businessId=${businessId}`)
      ]);

      setServices(await srvRes.json() || []);
      setStaff(await stfRes.json() || []);
      setBookings(await bkRes.json() || []);
      setCustomers(await custRes.json() || []);
      setReviews(await revRes.json() || []);
      setBlogs(await blgRes.json() || []);
      setFaqs(await faqRes.json() || []);
      setEmailTemplates(await tempRes.json() || []);
    } catch (e) {
      console.error("Failed database synchronizations for business: " + businessId, e);
    }
  };

  // Core Authentication & Booking Tracking routines
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const trimmedEmail = loginEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setLoginError("Please enter your registered email address.");
      return;
    }

    // 1. Check Super Admin Email (hardcoded secure value)
    if (trimmedEmail === "markjames.villagonzalo06@gmail.com") {
      setCurrentRole(UserRole.SUPER_ADMIN);
      if (tenants.length > 0) {
        setActiveBusiness(tenants[0]);
      }
      setActiveTab("dashboard");
      setAppView("backoffice");
      triggerToast("Access Granted!", "Logged in as Platform Super Administrator.");
      return;
    }

    // 2. Check Business Tenants Admin emails dynamically
    const foundBusiness = tenants.find(t => t.contactEmail.trim().toLowerCase() === trimmedEmail);
    if (foundBusiness) {
      setCurrentRole(UserRole.BUSINESS_ADMIN);
      setActiveBusiness(foundBusiness);
      setActiveTab("dashboard");
      setAppView("backoffice");
      triggerToast("Welcome Back!", `Successfully signed in for ${foundBusiness.name}`);
      return;
    }

    // 3. Fallback matching user logins in db seeded users
    const matchedUser = users.find(u => u.email.trim().toLowerCase() === trimmedEmail);
    if (matchedUser) {
      if (matchedUser.role === UserRole.SUPER_ADMIN) {
        setCurrentRole(UserRole.SUPER_ADMIN);
        if (tenants.length > 0) {
          setActiveBusiness(tenants[0]);
        }
        setActiveTab("dashboard");
        setAppView("backoffice");
        triggerToast("Access Granted!", "Authenticated from directory ledger.");
        return;
      } else {
        setCurrentRole(UserRole.BUSINESS_ADMIN);
        const biz = tenants.find(t => t.id === matchedUser.businessId) || tenants[0];
        if (biz) {
          setActiveBusiness(biz);
        }
        setActiveTab("dashboard");
        setAppView("backoffice");
        triggerToast("Welcome Back!", `Inbound admin connection validated: ${matchedUser.name}`);
        return;
      }
    }

    setLoginError("Credentials do not match any registered platform administrator or active business contact email.");
  };

  const handleTrackBookings = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackedBookings([]);
    setHasTracked(false);
    
    const trimmed = trackEmail.trim().toLowerCase();
    if (!trimmed) return;
    
    setIsSearchingTrack(true);
    try {
      const res = await fetch(`/api/bookings?customerEmail=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrackedBookings(data);
      }
      setHasTracked(true);
    } catch (err) {
      console.error("Booking tracking error", err);
    } finally {
      setIsSearchingTrack(false);
    }
  };

  const reloadActiveBusinessData = () => {
    if (activeBusiness) {
      fetchBusinessData(activeBusiness.id);
      fetchAuditLogs();
      fetchTenants();
    }
  };

  // 1. SaaS Brand Onboarding Processor
  const handleOnboardTenant = async (tenantData: any) => {
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      triggerToast("Dynamic Workspace Bootstrapped!", `Onboarded: ${data.name}`);
      setOnboardingModalOpen(false);

      await fetchTenants();
      setActiveBusiness(data);
      setCurrentRole(UserRole.BUSINESS_ADMIN);
      setActiveTab("dashboard");
      setAppView("backoffice");
    } catch (e: any) {
      alert("Platform onboarding failure: " + e.message);
    }
  };

  // 2. Services config handlers
  const handleCreateService = async (e: React.FormEvent, serviceDetails: any) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...serviceDetails, businessId: activeBusiness.id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    triggerToast("Service Added Successfully!", data.name);
    reloadActiveBusinessData();
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Confirm deletion of this service menu item?")) return;
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" });
      triggerToast("Service Discontinued", "Service removed from menu");
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateServiceStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      triggerToast("Service Status Updated", `Service is now ${isActive ? "active" : "inactive"}`);
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 3. Staff roster handlers
  const handleCreateStaff = async (e: React.FormEvent, staffDetails: any) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...staffDetails, businessId: activeBusiness.id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    triggerToast("Accredited Specialist Enrolled!", data.name);
    reloadActiveBusinessData();
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Confirm dismissal of this specialist from active roster?")) return;
    try {
      await fetch(`/api/staff/${id}`, { method: "DELETE" });
      triggerToast("Specialist Removed", "Staff member deleted");
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateStaffAvailability = async (id: string, available: boolean) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      triggerToast("Availability Updated", `Specialist is now ${available ? "ACTIVE" : "INACTIVE"}`);
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 4. FAQ accordions handlers
  const handleCreateFAQ = async (faqDetails: any) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...faqDetails, businessId: activeBusiness.id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    triggerToast("FAQ Published!", "FAQ is now live on public website.");
    reloadActiveBusinessData();
  };

  const handleDeleteFAQ = async (id: string) => {
    try {
      await fetch(`/api/faqs/${id}`, { method: "DELETE" });
      triggerToast("FAQ Removed", "Item deleted from layout");
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 5. Blog composing handlers
  const handleCreateBlog = async (blogDetails: any) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...blogDetails, businessId: activeBusiness.id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    triggerToast("Blog Insights Published!", "Article added to dynamic client feed");
    reloadActiveBusinessData();
  };

  const handleDeleteBlog = async (id: string) => {
    try {
      await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      triggerToast("Blog Removed", "Deleted successfully");
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 6. Theme and styling persistence handler
  const handleUpdateCmsSettings = async (adjustedData: any) => {
    if (!activeBusiness) return;
    const res = await fetch(`/api/tenants/${activeBusiness.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adjustedData)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    triggerToast("Theme Settings Live!", "Presentation re-applied and updated instantly");
    setActiveBusiness(data);
    fetchTenants();
  };

  // 7. Booking state transition handler
  const handleUpdateBookingStatus = async (bookingId: string, status: Booking["status"], cancellationRemarks?: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancellationRemarks })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      triggerToast(`Appointment is now ${status.toUpperCase()}!`, `Registered under code #${data.id}`);
      reloadActiveBusinessData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 8. SMTP transaction templates save handler
  const handleSaveEmailTemplate = async (key: string, subject: string, body: string) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: activeBusiness.id, key, subject, body })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    triggerToast("Receipt SMTP template updated!", "Reminders will carry updated dynamic formulas");
    reloadActiveBusinessData();
  };

  // 9. Booking guest confirmation submit
  const handleWizardSubmit = async (bookingDetails: any) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bookingDetails, businessId: activeBusiness.id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    triggerToast("SMTP Simulated Dispatch!", `Email receipt notification sent to ${bookingDetails.customerEmail}`, "info");
    reloadActiveBusinessData();
    return data;
  };

  // 10. Public portal review dispatcher
  const handleReviewSubmissionFromCms = async (reviewData: any) => {
    if (!activeBusiness) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...reviewData, businessId: activeBusiness.id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    triggerToast("Guest Review Submitted!", "Pending owner approval and moderation details", "info");
    reloadActiveBusinessData();
    return data;
  };

  const getThemePaletteClass = () => {
    if (!activeBusiness) return "theme-palette-indigo";
    return `theme-palette-${activeBusiness.theme.primaryPalette}`;
  };

  const getBackofficeClasses = () => {
    switch (backofficeColor) {
      case "emerald":
        return {
          btn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
          bg: "bg-emerald-500/10",
          accent: "emerald"
        };
      case "amber":
        return {
          btn: "bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/20",
          bg: "bg-amber-500/10",
          accent: "amber"
        };
      case "rose":
        return {
          btn: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/10",
          text: "text-rose-400",
          border: "border-rose-500/20",
          bg: "bg-rose-500/10",
          accent: "rose"
        };
      case "violet":
        return {
          btn: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/10",
          text: "text-violet-400",
          border: "border-violet-500/20",
          bg: "bg-violet-500/10",
          accent: "violet"
        };
      case "sky":
        return {
          btn: "bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-sky-500/10",
          text: "text-sky-400",
          border: "border-sky-500/20",
          bg: "bg-sky-500/10",
          accent: "sky"
        };
      default: // indigo
        return {
          btn: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/10",
          text: "text-indigo-400",
          border: "border-indigo-500/20",
          bg: "bg-indigo-500/10",
          accent: "indigo"
        };
    }
  };

  const boCls = getBackofficeClasses();

  return (
    <div className={`h-screen bg-[#0A0A0B] text-slate-200 select-none relative overflow-hidden flex flex-col ${getThemePaletteClass()}`}>
      
      {/* Background Mesh Blobs reflecting selected Backoffice Custom theme */}
      <div className={`absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000 ${
        boCls.accent === "emerald" ? "bg-emerald-500/10" :
        boCls.accent === "amber" ? "bg-amber-500/10" :
        boCls.accent === "rose" ? "bg-rose-500/10" :
        boCls.accent === "violet" ? "bg-violet-500/10" :
        boCls.accent === "sky" ? "bg-sky-500/10" : "bg-indigo-500/10"
      }`}></div>
      <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[30%] w-[35%] h-[35%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* DISCOVERY MARKETPLACE SCREEN */}
      {appView === "marketplace" && (() => {
        const filteredTenants = tenants.filter((ten) => {
          const matchesSearch =
            marketplaceSearch.trim() === "" ||
            ten.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) ||
            ten.aboutText.toLowerCase().includes(marketplaceSearch.toLowerCase()) ||
            ten.contactAddress.toLowerCase().includes(marketplaceSearch.toLowerCase());
          const matchesCategory =
            marketplaceCategory === "all" || ten.templateType === marketplaceCategory;
          return matchesSearch && matchesCategory;
        });

        const discoveryCategories = [
          { id: "all", label: "All Services", icon: "✨" },
          { id: "hair-salon", label: "Hair & Barber", icon: "✂️" },
          { id: "nail-salon", label: "Nails & Glow", icon: "💅" },
          { id: "tattoo-studio", label: "Ink & Art", icon: "🎨" },
          { id: "makeup-artist", label: "Makeup & Style", icon: "💄" },
          { id: "generic-coaching", label: "Wellness Clinic", icon: "🌱" }
        ];

        return (
          <div className="flex-1 overflow-y-auto relative z-10 flex flex-col select-text">
            {/* Minimal Header */}
            <header className="border-b border-white/5 bg-black/30 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-base shadow border border-indigo-500/10">
                  ⚡
                </div>
                <div>
                  <h1 className="text-sm font-black text-white tracking-widest uppercase font-mono">UniBook</h1>
                  <p className="text-[9px] text-indigo-400 font-bold font-mono tracking-wider -mt-0.5">Appointment Discovery Network</p>
                </div>
              </div>
              <button
                id="admin-console-signin-btn"
                onClick={() => {
                  setLoginEmail("");
                  setLoginError("");
                  setAppView("login");
                }}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-mono text-[10px] font-bold rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Partner Log In</span>
              </button>
            </header>

            {/* Premium Typographic Hero Section */}
            <div className="px-6 py-12 md:py-16 text-center max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 text-[9px] uppercase font-bold tracking-widest rounded-full font-mono">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Next-Gen Booking Engine</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none animate-fade-in">
                Bespoke Services, <br />
                <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Effortless Reservations.
                </span>
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-light">
                Discover elite self-care specialists nearby. Secure instant booking slots with downpayment security, trace confirmation status live, and unlock your reservation pass.
              </p>
            </div>

            {/* Main Interactive Workspace Area */}
            <div className="px-6 md:px-12 max-w-7xl w-full mx-auto pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT AREA: PROVIDERS DIRECTORY (8 cols on lg) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search & Filter Bar */}
                <div className="bg-[#121216]/40 border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 backdrop-blur-xl">
                  {/* Text search input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search providers by name, descriptions or location..."
                      value={marketplaceSearch}
                      onChange={(e) => setMarketplaceSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {marketplaceSearch && (
                      <button
                        onClick={() => setMarketplaceSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-505 hover:text-white text-xs font-bold font-mono"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Horizontal Scrollable Category Pills */}
                  <div className="space-y-2">
                    <p className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Quick Palette Filter</p>
                    <div className="flex flex-wrap gap-2">
                      {discoveryCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setMarketplaceCategory(cat.id)}
                          className={`px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-sans select-none border text-left ${
                            marketplaceCategory === cat.id
                              ? "bg-indigo-600 border-indigo-400 text-white font-bold shadow-md shadow-indigo-600/10"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="text-xs">{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid of Providers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      Verified Service Outlets ({filteredTenants.length})
                    </h3>
                    {marketplaceCategory !== "all" && (
                      <span className="text-[9px] text-[#38bdf8] uppercase font-mono font-bold">
                        Filter: {marketplaceCategory.replace("-", " ")}
                      </span>
                    )}
                  </div>

                  {filteredTenants.length === 0 ? (
                    <div className="p-12 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-center space-y-2">
                      <p className="text-xs text-slate-400 italic">No registered providers match your search parameters.</p>
                      <button
                        onClick={() => {
                          setMarketplaceSearch("");
                          setMarketplaceCategory("all");
                        }}
                        className="text-xs text-indigo-400 hover:underline font-bold"
                      >
                        Clear Active Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredTenants.map((ten) => (
                        <div
                          key={ten.id}
                          id={`tenant-card-${ten.slug}`}
                          className="group relative p-6 bg-[#121216]/45 hover:bg-[#121216]/85 border border-white/5 hover:border-indigo-500/20 rounded-2xl flex flex-col justify-between space-y-5 transition-all duration-350 shadow-sm"
                        >
                          {/* Accent Gradient Border */}
                          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                          <div className="space-y-3.5 relative z-10">
                            <div className="flex justify-between items-start">
                              <div className="w-11 h-11 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xl shadow-inner select-none transition-transform group-hover:scale-105">
                                {ten.logo}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] text-[#38bdf8] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-sky-950/30 border border-sky-500/10 font-mono">
                                  {ten.templateType.replace("-", " ")}
                                </span>
                                <span className="text-[8px] text-emerald-400 font-bold font-mono tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  ACTIVE BOOKINGS
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-[#38bdf8] transition-colors">{ten.name}</h4>
                              <p className="text-[9px] text-indigo-300 font-mono">https://{ten.slug}.unibook.co</p>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-light">
                              {ten.aboutText}
                            </p>

                            <div className="space-y-1.5 text-[10.5px] text-slate-400 pt-2 border-t border-white/5">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <span className="leading-snug text-slate-350">{ten.contactAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="text-slate-350">{ten.contactPhone}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            id={`visit-site-${ten.slug}`}
                            onClick={() => {
                              setSelectedBusiness(ten);
                              setActiveBusiness(ten);
                              setAppView("customer_site");
                            }}
                            className="relative z-10 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all group-hover:bg-indigo-500 cursor-pointer select-none font-sans"
                          >
                            <span>Book at {ten.name}</span>
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT AREA: RESERVATION STATUS TRACKER (4 cols on lg) */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                    Track Reservation
                  </h3>
                </div>

                <div className="p-5 bg-[#121216]/40 border border-white/5 rounded-2xl space-y-5 backdrop-blur-xl relative">
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <h4 className="text-xs font-bold text-white">Instant Search Protocol</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal font-light">
                      Input your registered customer email to instantly retrieve appointment times, schedules, assigned specialists and confirmation slips.
                    </p>
                  </div>

                  {/* Active Email Search Form */}
                  <form onSubmit={handleTrackBookings} className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-slate-400 font-bold font-mono tracking-wider">Customer Email Address</label>
                      <input
                        id="track-appointment-email-input"
                        type="email"
                        required
                        placeholder="e.g. customer@example.com"
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600 font-sans"
                      />
                    </div>
                    
                    <button
                      id="track-submit-btn"
                      type="submit"
                      disabled={isSearchingTrack}
                      className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      <span>{isSearchingTrack ? "Searching Ledger..." : "Search My Bookings"}</span>
                    </button>
                  </form>

                  {/* High Quality Display of Tracked Appointments */}
                  {hasTracked && (
                    <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-305">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                          Found slips ({trackedBookings.length})
                        </span>
                        {trackedBookings.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                        )}
                      </div>
                      
                      {trackedBookings.length === 0 ? (
                        <div className="p-6 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center space-y-1.5">
                          <p className="text-slate-400 text-xs font-light">No appointment records found for this email address.</p>
                          <p className="text-[9px] text-slate-500 font-mono">Verify your email address spelling and try again.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-white/10">
                          {trackedBookings.map((b) => {
                            const biz = tenants.find((t) => t.id === b.businessId);
                            const bizLogo = biz?.logo || "🏢";
                            const bizName = biz?.name || "Partner Salon";
                            
                            // Visual Steps Stepper Status Computations
                            const isConfirmed = b.status === "confirmed";
                            const isCancelled = b.status === "cancelled";
                            
                            return (
                              <div
                                key={b.id}
                                className="relative bg-black/40 border border-white/5 rounded-xl overflow-hidden shadow-md flex flex-col"
                              >
                                {/* Boarding Ticket Notch Design */}
                                <div className="absolute top-1/2 left-0 w-2.5 h-4 bg-[#0a0a0c] rounded-r-full -translate-x-1/2 -translate-y-1/2 border-r border-[#0a0a0c]" />
                                <div className="absolute top-1/2 right-0 w-2.5 h-4 bg-[#0a0a0c] rounded-l-full translate-x-1/2 -translate-y-1/2 border-l border-[#0a0a0c]" />

                                {/* Ticket Header */}
                                <div className="p-3 bg-white/[0.02] border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.01] to-transparent">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm select-none shrink-0">{bizLogo}</span>
                                    <h5 className="font-bold text-white text-[11px] truncate max-w-[130px] leading-tight select-text font-sans">
                                      {bizName}
                                    </h5>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest ${
                                      isConfirmed
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                        : isCancelled
                                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </div>

                                <div className="p-4 space-y-3 text-[11px]">
                                  {/* Code Reference ID */}
                                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 -mt-1">
                                    <span>ORDER REFERENCE</span>
                                    <span className="text-indigo-400 font-bold select-all uppercase">
                                      #{b.id.substring(0, 8).toUpperCase()}
                                    </span>
                                  </div>

                                  {/* Interactive Progress Segment */}
                                  <div className="py-2.5 px-1 bg-black/20 rounded-lg flex items-center justify-between text-[9px] font-mono border border-white/5">
                                    {/* Stop 1 */}
                                    <div className="flex flex-col items-center flex-1 text-center">
                                      <div className="w-4 h-4 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-[8px]">
                                        ✓
                                      </div>
                                      <span className="text-slate-400 mt-1 font-bold">Placed</span>
                                    </div>

                                    <div className={`h-[1px] flex-1 bg-white/10 ${!isCancelled ? "bg-emerald-500/30" : ""}`} />

                                    {/* Stop 2 */}
                                    <div className="flex flex-col items-center flex-1 text-center font-sans">
                                      <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] border ${
                                          isCancelled
                                            ? "bg-rose-500/25 border-rose-500 text-rose-400"
                                            : isConfirmed
                                            ? "bg-emerald-500/25 border-emerald-400 text-emerald-400"
                                            : "bg-amber-500/25 border-amber-505 text-amber-400 animate-pulse"
                                        }`}
                                      >
                                        {isCancelled ? "✗" : isConfirmed ? "✓" : "⏰"}
                                      </div>
                                      <span className="text-slate-400 mt-1 font-bold">Review</span>
                                    </div>

                                    <div className={`h-[1px] flex-1 bg-white/10 ${isConfirmed ? "bg-emerald-500/30" : ""}`} />

                                    {/* Stop 3 */}
                                    <div className="flex flex-col items-center flex-1 text-center">
                                      <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] border ${
                                          isCancelled
                                            ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                            : isConfirmed
                                            ? "bg-emerald-500/25 border-emerald-400 text-emerald-400"
                                            : "bg-white/5 border-white/10 text-slate-500"
                                        }`}
                                      >
                                        {isCancelled ? "✗" : isConfirmed ? "✓" : "3"}
                                      </div>
                                      <span className="text-slate-400 mt-1">Ready</span>
                                    </div>
                                  </div>

                                  {/* Detailed Schedule info */}
                                  <div className="space-y-1 pt-1 font-mono text-[10px]">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 uppercase">Registered Customer:</span>
                                      <span className="text-slate-300 font-bold truncate max-w-[130px]">{b.customerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 uppercase">Treatment Price:</span>
                                      <span className="text-slate-200 font-bold">₱{b.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 uppercase">Schedule Session:</span>
                                      <span className="text-[#38bdf8] font-bold">{b.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 uppercase">Exact Hours:</span>
                                      <span className="text-white font-bold">{b.timeSlot}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 uppercase">Therapist Specialist:</span>
                                      <span className="text-slate-300 font-bold">Specialist Assigned</span>
                                    </div>
                                  </div>

                                  {/* Cancellation reason detail block */}
                                  {isCancelled && b.cancellationRemarks && (
                                    <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-400 leading-normal font-sans text-[10.5px]">
                                      <span className="font-bold block uppercase text-[8px] tracking-wide font-mono mb-1 text-rose-300">
                                        ❌ DECLINED REMARKS
                                      </span>
                                      "{b.cancellationRemarks}"
                                    </div>
                                  )}

                                  {/* Normal helper instructions based on state */}
                                  {!isCancelled && !isConfirmed && (
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/15 text-amber-300 text-[10px] leading-relaxed font-sans">
                                      Your reservation is queued for review. If GCash downpayment of ₱300 was sent, verification is in progress.
                                    </div>
                                  )}

                                  {isConfirmed && (
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 text-[10px] leading-relaxed font-sans">
                                      ✓ Booking approved! Enjoy your session. Please arrive 10 minutes prior to your schedule.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {!hasTracked && (
                    <div className="pt-6 border-t border-white/5 text-center text-slate-500 text-[11px] py-12 flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 select-none">
                        📅
                      </div>
                      <p className="font-light text-slate-400 font-sans">Discover your bookings instantly.</p>
                      <p className="text-[9px] text-slate-500 max-w-[170px] mx-auto font-mono">
                        Supports global email matching lookup.
                      </p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* SECURE ADMIN LOGIN SCREEN */}
      {appView === "login" && (
        <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto">
          <div className="w-full max-w-md bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-3xl">🛡️</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Portal Authentication</h2>
              <p className="text-xs text-slate-400">
                Please select your workspace role to sign in to the dashboard.
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-1 p-1 bg-black/40 border border-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLoginTab("merchant");
                  setLoginEmail("");
                  setLoginError("");
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase transition-all font-mono tracking-wider cursor-pointer ${
                  loginTab === "merchant" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                💼 Partner Merchant
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab("super_admin");
                  setLoginEmail("markjames.villagonzalo06@gmail.com");
                  setLoginError("");
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase transition-all font-mono tracking-wider cursor-pointer ${
                  loginTab === "super_admin" ? "bg-purple-650 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                🔐 System Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-normal">{loginError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-400 font-bold font-mono">
                  {loginTab === "super_admin" ? "Platform Administrator Email" : "Business Owner Email Address"}
                </label>
                <input
                  id="admin-login-email-input"
                  type="email"
                  required
                  placeholder={loginTab === "super_admin" ? "markjames.villagonzalo06@gmail.com" : "e.g. contact@business.com"}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors select-text"
                />
                {loginTab === "super_admin" ? (
                  <p className="text-[9px] text-amber-400/80 font-mono leading-relaxed bg-amber-955/20 p-2 rounded-lg border border-amber-500/10">
                    System admin operates global operations, tenant enrollment grids, and audit logs.
                  </p>
                ) : (
                  <p className="text-[9px] text-slate-500 font-mono leading-normal">
                    Sign in with your registered accredited merchant contact email.
                  </p>
                )}
              </div>

              <button
                id="admin-login-submit-btn"
                type="submit"
                className={`w-full py-2.5 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.01] flex items-center justify-center gap-1.5 ${
                  loginTab === "super_admin" ? "bg-purple-600 hover:bg-purple-500" : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                <span>Authenticate {loginTab === "super_admin" ? "System Core" : "Merchant Edge"}</span>
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                id="back-to-marketplace-btn"
                onClick={() => {
                  setLoginEmail("");
                  setLoginError("");
                  setAppView("marketplace");
                }}
                className="text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
              >
                &larr; Back to Discovery Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZED CUSTOMER THEMED WEBSITE PREVIEW */}
      {appView === "customer_site" && selectedBusiness && (
        <div className="flex-1 flex flex-col relative z-20 overflow-hidden bg-[#0A0A0B]">
          {/* Top Return Sticky Bar */}
          <div className="bg-[#121216]/90 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0 text-xs text-slate-300 z-40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="font-mono">
                Visiting: <span className="font-bold text-white">{selectedBusiness.name}</span>
              </p>
            </div>
            <button
              id="exit-customer-site-btn"
              onClick={() => {
                setAppView("marketplace");
                setSelectedBusiness(null);
              }}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-lg font-bold transition-all hover:scale-[1.02] cursor-pointer"
            >
              &larr; Exit & Return to Marketplace
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <CmsWebsiteViewer
              business={selectedBusiness}
              services={services}
              staffList={staff}
              reviews={reviews}
              blogs={blogs}
              faqs={faqs}
              onLaunchBooking={(selectedService) => {
                setBookingWizardOpen(true);
              }}
              onSubmitReview={handleReviewSubmissionFromCms}
            />
          </div>
        </div>
      )}

      {/* BODY COLUMN WORKSPACE / ADMIN BACKOFFICE CONSOLE */}
      {appView === "backoffice" && (
        <div className={`flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative z-10 font-choice-${adminFont} size-choice-${adminFontSize} transition-all`}>
          
          {/* SIDE BAR NAVIGATION */}
          <aside className="w-full md:w-64 border-r border-white/5 bg-[#0a0b0d]/50 backdrop-blur-xl flex flex-col z-20 md:h-full overflow-hidden shrink-0">
          <div className="p-5 border-b border-white/5 flex items-center justify-between text-xs py-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xl shrink-0">{activeBusiness?.logo || "💈"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-white tracking-tight line-clamp-1 truncate select-text">
                  {activeBusiness?.name || "Initializing..."}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-1 truncate font-mono select-text">
                  {activeBusiness?.slug}.unibook.co
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 mt-3 text-xs overflow-y-auto">
            {currentRole === UserRole.SUPER_ADMIN ? (
              // SUPERADMIN COMPONENT PATHS
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase text-slate-500 font-bold px-3 tracking-widest mb-2 font-mono">
                  SaaS Core Control
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "dashboard" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    <span>Tenant Control Center</span>
                  </div>
                  <span className="bg-indigo-550/20 text-indigo-300 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono">
                    {tenants.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "logs" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <History className="w-4 h-4 text-sky-400" />
                  <span>Platform System Audits</span>
                </button>
              </div>
            ) : (
              // MERCHANT BACKOFFICE VIEW CONSOLES
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase text-slate-500 font-bold px-3 tracking-widest mb-2 font-mono">
                  Merchant Console
                </p>
                
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "dashboard" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-405" />
                  <span>Dashboard Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "calendar" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-emerald-400" />
                    <span>Booking Schedule</span>
                  </div>
                  {bookings.filter(b => b.status === "pending").length > 0 && (
                    <span className="bg-amber-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">
                      {bookings.filter(b => b.status === "pending").length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("services")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "services" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Scissors className="w-4 h-4 text-pink-400" />
                  <span>Configure Services</span>
                </button>

                <button
                  onClick={() => setActiveTab("staff")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "staff" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Specialist Roster</span>
                </button>

                <button
                  onClick={() => setActiveTab("crm")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "crm" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-violet-405" />
                  <span>CRM Guest Profiles</span>
                </button>

                <button
                  onClick={() => setActiveTab("cms")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "cms" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-405" />
                  <span>Website CMS Customizer</span>
                </button>

                <button
                  onClick={() => setActiveTab("emails")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "emails" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Mail className="w-4 h-4 text-yellow-500" />
                  <span>Simulated workflows</span>
                </button>

                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === "profile" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <UserIcon className={`w-4 h-4 ${boCls.text}`} />
                  <span>Personal Profile Settings</span>
                </button>
              </div>
            )}
          </nav>

          {/* Logout Action Button */}
          <div className="p-4 border-t border-white/5 bg-black/10">
            <button
              id="exit-console-sidebar-btn"
              onClick={() => {
                setAppView("marketplace");
                setLoginEmail("");
                setLoginError("");
                triggerToast("Signed Out", "You have successfully signed out of the workspace.");
              }}
              className="w-full px-3 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/10 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-450" />
              <span>Exit Console</span>
            </button>
          </div>

          {/* Core server stats footer block */}
          <div className="p-4 mt-auto border-t border-white/5 bg-black/20 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <span className="text-[10px] text-slate-350 font-extrabold uppercase block tracking-wider">Dynamic Sandbox Sync</span>
                <span className="text-[9px] text-slate-500 font-mono block">FS SQLite DB active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* WORKSPACE MAIN LAYOUT PANEL */}
        <main className="flex-1 flex flex-col min-h-0 relative select-text h-full overflow-hidden">
          
          {/* Backoffice Toolbar Header */}
          <header className="h-16 border-b border-white/5 bg-[#0d0f13]/65 backdrop-blur-md flex items-center justify-between px-6 md:px-8 shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black tracking-widest text-[#38bdf8] uppercase font-mono">
                {activeTab.replace("_", " ")} Workspace / {currentRole === UserRole.SUPER_ADMIN ? "Super Control" : activeBusiness?.name}
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {currentRole === UserRole.BUSINESS_ADMIN && (
                <button
                  onClick={() => setBookingWizardOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-4 h-4" /> Book Appointment
                </button>
              )}
              <div className="w-9 h-9 border border-white/10 bg-white/5 rounded-full flex items-center justify-center text-slate-300">
                <Info className="w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>
          </header>

          {/* Dynamic Scrollable Working Canvas */}
          <div className="p-6 md:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
            
            {/* 1. SUPER ADMIN ROOT DASHBOARD */}
            {currentRole === UserRole.SUPER_ADMIN && activeTab === "dashboard" && (
              <SuperAdminDashboard
                tenants={tenants}
                activeBusiness={activeBusiness}
                setActiveBusiness={setActiveBusiness}
                auditLogs={auditLogs}
                fetchAuditLogs={fetchAuditLogs}
                setOnboardingModalOpen={setOnboardingModalOpen}
                setCurrentRole={setCurrentRole}
                setActiveTab={setActiveTab}
              />
            )}

            {/* 2. SUPER ADMIN SECURITY AUDIT LOGS FULLVIEW */}
            {currentRole === UserRole.SUPER_ADMIN && activeTab === "logs" && (
              <AuditLogsManager
                auditLogs={auditLogs}
                fetchAuditLogs={fetchAuditLogs}
              />
            )}

            {/* 3. MERCHANT MAIN DASHBOARD OVERVIEW */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "dashboard" && activeBusiness && (
              <MerchantDashboard
                bookings={bookings}
                services={services}
                staff={staff}
                customers={customers}
                activeBusiness={activeBusiness}
                handleUpdateBookingStatus={handleUpdateBookingStatus}
                setActiveTab={setActiveTab}
                onOpenCmsPreview={() => setCmsPreviewOpen(true)}
              />
            )}

            {/* 4. MERCHANT BOOKING AGENDA CALENDAR */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "calendar" && (
              <BookingSchedule
                bookings={bookings}
                services={services}
                staff={staff}
                handleUpdateBookingStatus={handleUpdateBookingStatus}
                activeBusinessId={activeBusiness?.id || ""}
              />
            )}

            {/* 5. MERCHANT SERVICE CONFIG MENU */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "services" && activeBusiness && (
              <ServicesConfig
                services={services}
                activeBusiness={activeBusiness}
                staff={staff}
                handleCreateService={handleCreateService}
                handleDeleteService={handleDeleteService}
                handleUpdateCmsSettings={handleUpdateCmsSettings}
                handleUpdateServiceStatus={handleUpdateServiceStatus}
              />
            )}

            {/* 6. MERCHANT SPECIALISTS ROSTER LIST */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "staff" && activeBusiness && (
              <StaffManager
                staff={staff}
                bookings={bookings}
                activeBusiness={activeBusiness}
                handleCreateStaff={handleCreateStaff}
                handleDeleteStaff={handleDeleteStaff}
                handleUpdateStaffAvailability={handleUpdateStaffAvailability}
              />
            )}

            {/* 7. MERCHANT CRM SYSTEM DETAILS LIST */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "crm" && (
              <CrmGuests
                customers={customers}
              />
            )}

            {/* 8. MERCHANT CMS CUSTOMIZER CONFIGS */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "cms" && activeBusiness && (
              <CmsCustomizer
                activeBusiness={activeBusiness}
                faqs={faqs}
                blogs={blogs}
                handleUpdateCmsSettings={handleUpdateCmsSettings}
                handleCreateFAQ={handleCreateFAQ}
                handleDeleteFAQ={handleDeleteFAQ}
                handleCreateBlog={handleCreateBlog}
                handleDeleteBlog={handleDeleteBlog}
                setCmsPreviewOpen={setCmsPreviewOpen}
              />
            )}

            {/* 9. MERCHANT SMTP EMAIL WORKFLOWS */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "emails" && (
              <EmailWorkflows
                emailTemplates={emailTemplates}
                handleSaveEmailTemplate={handleSaveEmailTemplate}
              />
            )}

            {/* 10. MERCHANT PERSONAL ADMIN PROFILE CUSTOMIZER */}
            {currentRole === UserRole.BUSINESS_ADMIN && activeTab === "profile" && (
              <PersonalProfile
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
                backofficeColor={backofficeColor}
                setBackofficeColor={setBackofficeColor}
                triggerToast={triggerToast}
                adminFont={adminFont}
                setAdminFont={setAdminFont}
                adminFontSize={adminFontSize}
                setAdminFontSize={setAdminFontSize}
              />
            )}

           </div>
        </main>
      </div>
      )}

      {/* --- OVERLAYS, POPUPS, DETACHED MODALS --- */}

      {/* A. PLATFORM DYNAMIC ONBOARDING MODAL */}
      {onboardingModalOpen && (
        <OnboardingModal
          onClose={() => setOnboardingModalOpen(false)}
          onSubmit={handleOnboardTenant}
        />
      )}

      {/* B. BACKOFFICE RESERVATIONS WIZARD MODAL */}
      {bookingWizardOpen && activeBusiness && (
        <BookingWizard
          business={activeBusiness}
          services={services}
          staffList={staff}
          bookings={bookings}
          onClose={() => setBookingWizardOpen(false)}
          onSubmit={handleWizardSubmit}
        />
      )}

      {/* C. VISITOR WEBSITE PREVIEW MODAL IFRAME SIMU */}
      {cmsPreviewOpen && activeBusiness && (
        <div className="fixed inset-0 bg-[#060708] z-50 overflow-y-auto flex flex-col select-text leading-relaxed">
          {/* Preview simulation control top bar */}
          <div className="bg-[#121216] border-b border-white/10 p-3.5 flex flex-col md:flex-row items-center justify-between text-xs px-6 md:px-8 shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></span>
              <div>
                <p className="text-white font-mono font-bold">
                  CMS Multi-Brand Simulator Mode:{" "}
                  <span className="text-indigo-400 select-all underline">https://{activeBusiness.slug}.unibook.co</span>
                </p>
                <p className="text-[10px] text-slate-450">Simulate viewport responsiveness on mobile, tablet, and desktop brands instantly.</p>
              </div>
            </div>

            {/* Devices brand preset switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 px-2 py-1 bg-black/40 border border-white/5 rounded-xl text-[11px]">
              <button
                onClick={() => setSimDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  simDevice === "desktop" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Fluid Desktop
              </button>

              <button
                onClick={() => setSimDevice("iphone")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  simDevice === "iphone" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> iPhone 15 Pro
              </button>

              <button
                onClick={() => setSimDevice("samsung")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  simDevice === "samsung" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Galaxy S23
              </button>

              <button
                onClick={() => setSimDevice("pixel")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  simDevice === "pixel" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-400" /> Google Pixel 8
              </button>

              <button
                onClick={() => setSimDevice("ipad-pro")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  simDevice === "ipad-pro" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Tablet className="w-3.5 h-3.5 text-violet-400" /> iPad Pro 11"
              </button>

              <button
                onClick={() => setSimDevice("ipad-mini")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  simDevice === "ipad-mini" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Tablet className="w-3.5 h-3.5 text-amber-400" /> iPad Mini
              </button>
            </div>

            <button
              id="cms-preview-close"
              onClick={() => setCmsPreviewOpen(false)}
              className="px-4 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap self-stretch md:self-auto flex items-center justify-center"
            >
              🔐 Close Simulator
            </button>
          </div>

          <div className="flex-1 bg-[#090a0c] overflow-y-auto p-2 md:p-6 flex flex-col items-center justify-start select-text relative">
            
            {/* Ambient Background Glow for simulated viewport canvas */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-indigo-550/5 rounded-full blur-[140px] pointer-events-none"></div>

            {/* Device-specific outer frame decoration */}
            <div className={`transition-all duration-300 relative select-text ${
              simDevice === "iphone" ? "w-[393px] h-[852px] border-[12px] border-slate-800 rounded-[52px] shadow-2xl relative bg-[#0e0f13] overflow-y-auto scrollbar-thin overflow-x-hidden my-4 ring-4 ring-white/5" :
              simDevice === "samsung" ? "w-[360px] h-[800px] border-[10px] border-neutral-800 rounded-[38px] shadow-2xl relative bg-[#0e0f13] overflow-y-auto scrollbar-thin overflow-x-hidden my-4 ring-4 ring-white/5" :
              simDevice === "pixel" ? "w-[412px] h-[915px] border-[11px] border-zinc-900 rounded-[44px] shadow-2xl relative bg-[#0e0f13] overflow-y-auto scrollbar-thin overflow-x-hidden my-4 ring-4 ring-white/5" :
              simDevice === "ipad-pro" ? "w-[834px] h-[1050px] border-[16px] border-neutral-800 rounded-[32px] shadow-2xl relative bg-[#0e0f13] overflow-y-auto scrollbar-thin overflow-x-hidden my-4 ring-4 ring-white/5" :
              simDevice === "ipad-mini" ? "w-[768px] h-[960px] border-[14px] border-slate-800 rounded-[28px] shadow-2xl relative bg-[#0e0f13] overflow-y-auto scrollbar-thin overflow-x-hidden my-4 ring-4 ring-white/5" :
              "w-full min-h-screen"
            }`}>
              
              {/* iPhone Dynamic Island Mock notch cutout */}
              {simDevice === "iphone" && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-40 hidden md:block border border-white/5 pointer-events-none"></div>
              )}
              
              {/* Samsung / Pixel punchhole cameras cutout */}
              {(simDevice === "samsung" || simDevice === "pixel") && (
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-40 hidden md:block border border-white/5 pointer-events-none"></div>
              )}

              <CmsWebsiteViewer
                business={activeBusiness}
                services={services}
                staffList={staff}
                reviews={reviews}
                blogs={blogs}
                faqs={faqs}
                onLaunchBooking={(selectedService) => {
                  setCmsPreviewOpen(false);
                  setBookingWizardOpen(true);
                }}
                onSubmitReview={handleReviewSubmissionFromCms}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global Application Toast elements */}
      <ToastNotification 
        toast={notificationToast}
        onClose={() => setNotificationToast(null)}
      />

    </div>
  );
}
