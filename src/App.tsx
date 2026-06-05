import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Calendar as CalendarIcon, Users, Scissors, Settings, 
  Plus, Check, X, ChevronDown, ChevronRight, Star, Mail, Phone, 
  MapPin, Sparkles, TrendingUp, Trash2, Edit, ShieldAlert, FileText, 
  Sliders, Globe, RefreshCw, SlidersHorizontal, History, UserCheck, 
  LogOut, PlusCircle, AlertCircle, Info, Send, BookOpen, Layers,
  User as UserIcon
} from "lucide-react";
import { 
  UserRole, BusinessTenant, Service, ServiceVariant, Staff, Customer, 
  Booking, Review, BlogPost, FAQItem, AuditLog, EmailTemplate, ThemePalette, ThemeFont, User,
  CategoryTemplate,
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
import CategoryTemplateManager from "./components/backoffice/CategoryTemplateManager";
import SearchInput from "./components/ui/SearchInput";
import { parseAppRoute, pushRoute, getTenantPublicUrl, getTenantPublicPath } from "./lib/tenantUrl";
import { EMAIL_PLACEHOLDER, validateEmail } from "./lib/contactFormats";

type BackofficeTab = "dashboard" | "calendar" | "services" | "staff" | "crm" | "cms" | "emails" | "logs" | "profile" | "templates";

const isEmbedPreview =
  typeof window !== "undefined" &&
  (window.self !== window.top || new URLSearchParams(window.location.search).get("preview") === "1");

const ADMIN_SESSION_KEY = "unibook_admin_session";

type AdminSession = {
  loginEmail: string;
  currentRole: UserRole;
  activeBusinessId: string | null;
  activeTab: BackofficeTab;
};

const saveAdminSession = (session: AdminSession) => {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage unavailable
  }
};

const clearAdminSession = () => {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
};

const loadAdminSession = (): AdminSession | null => {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
};

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
  const [trackEmailError, setTrackEmailError] = useState("");
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
  // Layout View Modals and Overlays controllers
  const [activeTab, setActiveTab] = useState<BackofficeTab>("dashboard");
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false);
  const [wizardPreselect, setWizardPreselect] = useState<{ service?: Service; variant?: ServiceVariant } | null>(null);
  const [categoryTemplates, setCategoryTemplates] = useState<CategoryTemplate[]>([]);
  const [cmsPreviewOpen, setCmsPreviewOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ message: string; submessage?: string; type: "success" | "info" } | null>(null);

  // Load Baseline Tenants and Platform Ledger initially
  useEffect(() => {
    fetchTenants();
    fetchAuditLogs();
    fetchUsers();
    fetchCategoryTemplates();
  }, []);

  const fetchCategoryTemplates = async () => {
    try {
      const res = await fetch("/api/category-templates");
      const data = await res.json();
      if (Array.isArray(data)) setCategoryTemplates(data);
    } catch {
      // ignore
    }
  };

  const openBookingWizard = (service?: Service, variant?: ServiceVariant) => {
    setWizardPreselect(service ? { service, variant } : null);
    setBookingWizardOpen(true);
  };

  // Keep admin session alive across reloads while in backoffice
  useEffect(() => {
    if (appView === "backoffice" && loginEmail) {
      saveAdminSession({
        loginEmail,
        currentRole,
        activeBusinessId: activeBusiness?.id || null,
        activeTab,
      });
    }
  }, [appView, loginEmail, currentRole, activeBusiness, activeTab]);

  const openTenantBySlug = async (slug: string) => {
    let tenant = tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
    if (!tenant) {
      try {
        const res = await fetch(`/api/tenants/${slug}`);
        const data = await res.json();
        if (!data.error) tenant = data;
      } catch {
        // ignore
      }
    }
    if (!tenant) return;
    setSelectedBusiness(tenant);
    setActiveBusiness(tenant);
    setAppView("customer_site");
    pushRoute(getTenantPublicPath(tenant.slug));
    await fetchBusinessData(tenant.id);
  };

  // Pre-fill merchant login from welcome email link (?email=...)
  useEffect(() => {
    if (appView !== "login") return;
    const invitedEmail = new URLSearchParams(window.location.search).get("email");
    if (invitedEmail) {
      setLoginTab("merchant");
      setLoginEmail(invitedEmail);
      setLoginError("");
    }
  }, [appView]);

  // URL-based routing: /s/:slug, /admin, /login
  useEffect(() => {
    if (tenants.length === 0) return;

    const route = parseAppRoute(window.location.pathname, window.location.hostname);
    if (route.view === "tenant") {
      openTenantBySlug(route.slug);
      return;
    }
    if (route.view === "login") {
      setAppView("login");
      return;
    }
    if (route.view === "admin" && loadAdminSession()) {
      setAppView("backoffice");
    }
  }, [tenants.length]);

  useEffect(() => {
    const onPopState = () => {
      const route = parseAppRoute(window.location.pathname, window.location.hostname);
      if (route.view === "tenant") {
        openTenantBySlug(route.slug);
      } else if (route.view === "admin") {
        setAppView(loadAdminSession() ? "backoffice" : "login");
      } else if (route.view === "login") {
        setAppView("login");
      } else {
        setAppView("marketplace");
        setSelectedBusiness(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [tenants]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        if (data.length > 0 && !currentUser) {
          setCurrentUser(data[0]);
        } else if (data.length === 0) {
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

  const clearBusinessData = () => {
    setServices([]);
    setStaff([]);
    setBookings([]);
    setCustomers([]);
    setReviews([]);
    setBlogs([]);
    setFaqs([]);
    setEmailTemplates([]);
  };

  const parseArrayResponse = async (res: Response) => {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  // When active tenant shifts, sync appropriate sub-datasets
  useEffect(() => {
    if (activeBusiness?.id) {
      clearBusinessData();
      fetchBusinessData(activeBusiness.id);
    } else {
      clearBusinessData();
    }
  }, [activeBusiness?.id]);

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
        const session = loadAdminSession();
        const route = parseAppRoute(window.location.pathname, window.location.hostname);
        if (route.view === "tenant") {
          // Handled by URL routing effect
        } else if (session) {
          setAppView("backoffice");
          setCurrentRole(session.currentRole);
          setActiveTab(session.activeTab);
          setLoginEmail(session.loginEmail);
          const restoredBusiness = session.activeBusinessId
            ? data.find((t: BusinessTenant) => t.id === session.activeBusinessId) || data[0]
            : data[0];
          if (restoredBusiness) {
            setActiveBusiness(restoredBusiness);
          }
          if (route.view !== "marketplace") {
            pushRoute("/admin");
          }
        } else if (data.length > 0 && !activeBusiness) {
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
    if (!businessId?.trim()) {
      clearBusinessData();
      return;
    }
    try {
      const encodedId = encodeURIComponent(businessId);
      const [srvRes, stfRes, bkRes, custRes, revRes, blgRes, faqRes, tempRes] = await Promise.all([
        fetch(`/api/services?businessId=${encodedId}`),
        fetch(`/api/staff?businessId=${encodedId}`),
        fetch(`/api/bookings?businessId=${encodedId}`),
        fetch(`/api/customers?businessId=${encodedId}`),
        fetch(`/api/reviews?businessId=${encodedId}`),
        fetch(`/api/blogs?businessId=${encodedId}`),
        fetch(`/api/faqs?businessId=${encodedId}`),
        fetch(`/api/email-templates?businessId=${encodedId}`)
      ]);

      setServices(await parseArrayResponse(srvRes));
      setStaff(await parseArrayResponse(stfRes));
      setBookings(await parseArrayResponse(bkRes));
      setCustomers(await parseArrayResponse(custRes));
      setReviews(await parseArrayResponse(revRes));
      setBlogs(await parseArrayResponse(blgRes));
      setFaqs(await parseArrayResponse(faqRes));
      setEmailTemplates(await parseArrayResponse(tempRes));
    } catch (e) {
      console.error("Failed database synchronizations for business: " + businessId, e);
      clearBusinessData();
    }
  };

  const handleManageTenant = async (tenant: BusinessTenant) => {
    clearBusinessData();
    setActiveBusiness(tenant);
    setCurrentRole(UserRole.BUSINESS_ADMIN);
    setActiveTab("dashboard");
    await fetchBusinessData(tenant.id);
  };

  // Core Authentication & Booking Tracking routines
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const trimmedEmail = loginEmail.trim().toLowerCase();

    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setLoginError(emailError);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          intent: loginTab === "super_admin" ? "admin" : "merchant",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed. Please try again.");
        return;
      }

      setLoginEmail(trimmedEmail);
      if (data.user) setCurrentUser(data.user);

      if (data.role === UserRole.SUPER_ADMIN || data.role === "SUPER_ADMIN") {
        setCurrentRole(UserRole.SUPER_ADMIN);
        setActiveBusiness(data.business || tenants[0] || null);
        setActiveTab("dashboard");
        setAppView("backoffice");
        pushRoute("/admin");
        triggerToast("Access granted", "Logged in as platform administrator.");
        return;
      }

      if (data.business) {
        setCurrentRole(UserRole.BUSINESS_ADMIN);
        setActiveBusiness(data.business);
        setActiveTab("dashboard");
        setAppView("backoffice");
        pushRoute("/admin");
        triggerToast("Welcome back", `Signed in to ${data.business.name}`);
        return;
      }

      setLoginError("No business workspace found for this account.");
    } catch {
      setLoginError("Could not reach the server. Please try again.");
    }
  };

  const handleTrackBookings = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackedBookings([]);
    setHasTracked(false);
    
    const trimmed = trackEmail.trim().toLowerCase();
    const emailError = validateEmail(trimmed);
    if (emailError) {
      setTrackEmailError(emailError);
      return;
    }
    setTrackEmailError("");
    
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

      triggerToast("Workspace created", `Onboarded: ${data.name}`);
      if (data.welcomeEmail?.success) {
        triggerToast(
          "Welcome email sent",
          data.welcomeEmail.isTestMode
            ? `Test preview: ${data.welcomeEmail.previewUrl}`
            : `Login link sent to ${data.welcomeEmail.sentTo}`,
          data.welcomeEmail.isTestMode ? "info" : "success"
        );
      } else if (data.welcomeEmail && !data.welcomeEmail.success) {
        triggerToast("Welcome email failed", data.welcomeEmail.error || "SMTP not configured", "info");
      }
      setOnboardingModalOpen(false);

      await fetchTenants();
      if (data.merchantUser) setCurrentUser(data.merchantUser);
      await handleManageTenant(data);
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

  const handleUpdateService = async (id: string, updates: Partial<Service>) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      triggerToast("Service Updated", "Catalog changes saved.");
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
      if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);

      triggerToast(`Appointment is now ${status.toUpperCase()}!`, `Registered under code #${data.id}`);

      const email = data.emailNotification;
      if (email) {
        if (email.success && email.isTestMode) {
          triggerToast(
            "Email in Test Mode Only",
            `SMTP not active — preview: ${email.previewUrl}`,
            "info"
          );
        } else if (email.success) {
          triggerToast("Customer Email Sent", `Gmail notification delivered to ${email.sentTo}`);
        } else {
          triggerToast("Customer Email Failed", email.error || "Could not send notification email", "info");
        }
      }

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
    const business = selectedBusiness || activeBusiness;
    if (!business) return;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bookingDetails, businessId: business.id })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);

    const notification = data.notification;
    if (notification?.success && notification.isTestMode) {
      triggerToast(
        "Email in Test Mode Only",
        `SMTP not active — preview: ${notification.previewUrl}`,
        "info"
      );
    } else if (notification?.success) {
      triggerToast("Booking Email Sent", `Gmail pending notice sent to ${notification.sentTo}`);
    } else if (notification && !notification.success) {
      triggerToast("Booking Email Failed", notification.error || "Could not send pending notice", "info");
    } else {
      triggerToast("Booking Created", `Pending request registered for ${bookingDetails.customerEmail}`);
    }

    reloadActiveBusinessData();
    return data;
  };

  // 10. Public portal review dispatcher
  const handleReviewSubmissionFromCms = async (reviewData: any) => {
    const business = selectedBusiness || activeBusiness;
    if (!business) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...reviewData, businessId: business.id })
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

  const boCls = {
    btn: "ui-btn-primary",
    text: "text-zinc-700",
    border: "border-zinc-200",
    bg: "bg-zinc-100",
  };

  return (
    <div className="h-screen bg-zinc-50 text-zinc-900 relative overflow-hidden flex flex-col">

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
          ...categoryTemplates.filter((t) => t.isActive).map((t) => ({ id: t.slug, label: t.label, icon: t.icon })),
        ];

        return (
          <div className="flex-1 overflow-y-auto relative z-10 flex flex-col bg-zinc-50">
            <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">UniBook</h1>
                <p className="text-sm text-zinc-500">Find and book local services</p>
              </div>
              <button
                id="admin-console-signin-btn"
                onClick={() => {
                  setLoginEmail("");
                  setLoginError("");
                  setAppView("login");
                  pushRoute("/login");
                }}
                className="ui-btn text-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Partner Log In</span>
              </button>
            </header>

            <div className="px-6 py-10 text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight">
                Book appointments online
              </h2>
              <p className="text-sm text-zinc-500">
                Browse businesses, reserve a time, and get email confirmations.
              </p>
            </div>

            {/* Main Interactive Workspace Area */}
            <div className="px-6 md:px-12 max-w-7xl w-full mx-auto pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT AREA: PROVIDERS DIRECTORY (8 cols on lg) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search & Filter Bar */}
                <div className="ui-card-pad space-y-4">
                  <SearchInput
                    value={marketplaceSearch}
                    onChange={setMarketplaceSearch}
                    placeholder="Search by name, description, or location..."
                    clearable
                  />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {discoveryCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setMarketplaceCategory(cat.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors border ${
                            marketplaceCategory === cat.id
                              ? "bg-zinc-900 border-zinc-900 text-white font-medium"
                              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid of Providers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h3 className="text-sm font-medium text-zinc-700">
                      Providers ({filteredTenants.length})
                    </h3>
                    {marketplaceCategory !== "all" && (
                      <span className="ui-badge">
                        {marketplaceCategory.replace("-", " ")}
                      </span>
                    )}
                  </div>

                  {filteredTenants.length === 0 ? (
                    <div className="p-12 border border-dashed border-zinc-300 rounded-lg text-center space-y-3 bg-white">
                      <p className="text-sm text-zinc-600">No providers match your search.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMarketplaceSearch("");
                          setMarketplaceCategory("all");
                        }}
                        className="text-sm text-zinc-900 font-medium hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTenants.map((ten) => (
                        <div
                          key={ten.id}
                          id={`tenant-card-${ten.slug}`}
                          className="ui-card-pad flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-3">
                              <div className="w-11 h-11 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center text-xl shrink-0">
                                {ten.logo}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="ui-badge capitalize">
                                  {ten.templateType.replace("-", " ")}
                                </span>
                                <span className="ui-badge-success text-xs flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  Accepting bookings
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-base font-semibold text-zinc-900">{ten.name}</h4>
                              <p className="text-xs text-zinc-500 mt-0.5">{getTenantPublicUrl(ten.slug)}</p>
                            </div>

                            <p className="text-sm text-zinc-600 line-clamp-3 leading-relaxed">
                              {ten.aboutText}
                            </p>

                            <div className="space-y-1.5 text-sm text-zinc-600 pt-2 border-t border-zinc-200">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                <span className="leading-snug">{ten.contactAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                                <span>{ten.contactPhone}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            id={`visit-site-${ten.slug}`}
                            onClick={() => openTenantBySlug(ten.slug)}
                            className="w-full ui-btn-primary"
                          >
                            <span>Book at {ten.name}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT AREA: BOOKING TRACKER */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-medium text-zinc-700 border-b border-zinc-200 pb-2">
                  Track your bookings
                </h3>

                <div className="ui-card-pad space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-700">
                      <Info className="w-4 h-4 shrink-0 text-zinc-500" />
                      <h4 className="text-sm font-medium">Look up by email</h4>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      Enter the email you used when booking to see status, date, and time.
                    </p>
                  </div>

                  <form onSubmit={handleTrackBookings} className="space-y-3">
                    <div>
                      <label htmlFor="track-appointment-email-input" className="ui-label">
                        Email address
                      </label>
                      <input
                        id="track-appointment-email-input"
                        type="email"
                        required
                        placeholder={EMAIL_PLACEHOLDER}
                        value={trackEmail}
                        onChange={(e) => {
                          setTrackEmail(e.target.value);
                          if (trackEmailError) setTrackEmailError(validateEmail(e.target.value) || "");
                        }}
                        onBlur={() => setTrackEmailError(validateEmail(trackEmail) || "")}
                        className={`ui-input ${trackEmailError ? "border-red-400" : ""}`}
                      />
                      {trackEmailError && <p className="ui-field-error">{trackEmailError}</p>}
                    </div>

                    <button
                      id="track-submit-btn"
                      type="submit"
                      disabled={isSearchingTrack}
                      className="w-full ui-btn-primary disabled:opacity-50"
                    >
                      {isSearchingTrack ? "Searching..." : "Find my bookings"}
                    </button>
                  </form>

                  {hasTracked && (
                    <div className="pt-4 border-t border-zinc-200 space-y-3">
                      <p className="text-sm font-medium text-zinc-700">
                        {trackedBookings.length} booking{trackedBookings.length !== 1 ? "s" : ""} found
                      </p>

                      {trackedBookings.length === 0 ? (
                        <div className="p-6 border border-dashed border-zinc-300 rounded-lg text-center space-y-1 bg-zinc-50">
                          <p className="text-sm text-zinc-600">No bookings for this email.</p>
                          <p className="text-xs text-zinc-500">Check the spelling and try again.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                          {trackedBookings.map((b) => {
                            const biz = tenants.find((t) => t.id === b.businessId);
                            const bizLogo = biz?.logo || "🏢";
                            const bizName = biz?.name || "Business";
                            const isConfirmed = b.status === "confirmed";
                            const isCancelled = b.status === "cancelled";

                            return (
                              <div key={b.id} className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
                                <div className="px-4 py-3 border-b border-zinc-200 flex justify-between items-center gap-2 bg-zinc-50">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">{bizLogo}</span>
                                    <h5 className="font-medium text-sm text-zinc-900 truncate">{bizName}</h5>
                                  </div>
                                  <span
                                    className={`ui-badge shrink-0 capitalize ${
                                      isConfirmed
                                        ? "ui-badge-success"
                                        : isCancelled
                                        ? "ui-badge-danger"
                                        : "ui-badge-pending"
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </div>

                                <div className="p-4 space-y-3 text-sm">
                                  <p className="text-xs text-zinc-500">
                                    Ref: <span className="font-mono text-zinc-700">#{b.id.substring(0, 8).toUpperCase()}</span>
                                  </p>

                                  <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-zinc-500">Customer</dt>
                                      <dd className="font-medium text-zinc-900 truncate">{b.customerName}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-zinc-500">Price</dt>
                                      <dd className="font-medium text-zinc-900">₱{b.price}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-zinc-500">Date</dt>
                                      <dd className="font-medium text-zinc-900">{b.date}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-zinc-500">Time</dt>
                                      <dd className="font-medium text-zinc-900">{b.timeSlot}</dd>
                                    </div>
                                  </dl>

                                  {isCancelled && b.cancellationRemarks && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                                      <span className="font-medium block mb-1">Declined</span>
                                      {b.cancellationRemarks}
                                    </div>
                                  )}

                                  {!isCancelled && !isConfirmed && (
                                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                                      Pending review. If you sent a GCash downpayment, verification is in progress.
                                    </div>
                                  )}

                                  {isConfirmed && (
                                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                                      Approved. Please arrive 10 minutes before your appointment.
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
                    <div className="pt-4 border-t border-zinc-200 text-center py-8 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg mx-auto">
                        📅
                      </div>
                      <p className="text-sm text-zinc-600">Your bookings will appear here.</p>
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
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-zinc-50">
          <div className="w-full max-w-md ui-card-pad space-y-6 shadow-sm">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold text-zinc-900">Sign in</h2>
              <p className="text-sm text-zinc-500">Access your business dashboard</p>
            </div>

            <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
              <button
                type="button"
                onClick={() => { setLoginTab("merchant"); setLoginEmail(""); setLoginError(""); }}
                className={`flex-1 py-2 px-2 rounded-md text-sm transition-all ${
                  loginTab === "merchant" ? "bg-white text-zinc-900 shadow-sm font-medium" : "text-zinc-500"
                }`}
              >
                Merchant
              </button>
              <button
                type="button"
                onClick={() => { setLoginTab("super_admin"); setLoginEmail(""); setLoginError(""); }}
                className={`flex-1 py-2 px-2 rounded-md text-sm transition-all ${
                  loginTab === "super_admin" ? "bg-white text-zinc-900 shadow-sm font-medium" : "text-zinc-500"
                }`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{loginError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="ui-label">
                  {loginTab === "super_admin" ? "Platform admin email" : "Business email"}
                </label>
                <input
                  id="admin-login-email-input"
                  type="email"
                  required
                  placeholder={EMAIL_PLACEHOLDER}
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError(validateEmail(e.target.value) || "");
                  }}
                  className={`ui-input ${loginError ? "border-red-400" : ""}`}
                />
              </div>

              <button id="admin-login-submit-btn" type="submit" className="w-full ui-btn-primary">
                Continue
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                id="back-to-marketplace-btn"
                onClick={() => {
                  setLoginEmail("");
                  setLoginError("");
                  setAppView("marketplace");
                  pushRoute("/");
                }}
                className="ui-btn-ghost text-sm"
              >
                &larr; Back to Discovery Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZED CUSTOMER THEMED WEBSITE PREVIEW */}
      {appView === "customer_site" && selectedBusiness && (
        <div className="flex-1 flex flex-col relative z-20 overflow-hidden bg-white">
          {!isEmbedPreview && (
            <div className="admin-header shrink-0">
              <p className="text-sm text-zinc-600">
                <span className="font-medium text-zinc-900">{selectedBusiness.name}</span>
              </p>
              <button
                id="exit-customer-site-btn"
                type="button"
                onClick={() => {
                  setAppView("marketplace");
                  setSelectedBusiness(null);
                  pushRoute("/");
                }}
                className="ui-btn text-sm"
              >
                ← Back to directory
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <CmsWebsiteViewer
              business={selectedBusiness}
              services={services}
              staffList={staff}
              reviews={reviews}
              blogs={blogs}
              faqs={faqs}
              embedded={isEmbedPreview}
              onLaunchBooking={(service, variant) => openBookingWizard(service, variant)}
              onSubmitReview={handleReviewSubmissionFromCms}
            />
          </div>
        </div>
      )}

      {/* BODY COLUMN WORKSPACE / ADMIN BACKOFFICE CONSOLE */}
      {appView === "backoffice" && (
        <div className={`admin-shell admin-theme-${backofficeColor} flex-1 min-h-0 font-choice-${adminFont} size-choice-${adminFontSize}`}>
          <aside className="admin-sidebar">
          <div className="p-4 border-b border-zinc-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{activeBusiness?.logo || "💈"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {activeBusiness?.name || "Loading..."}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {activeBusiness ? getTenantPublicUrl(activeBusiness.slug) : ""}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {currentRole === UserRole.SUPER_ADMIN ? (
              <div className="space-y-1">
                <p className="sidebar-section-label">Platform</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`nav-item justify-between ${activeTab === "dashboard" ? "nav-item-active" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Tenants</span>
                  </div>
                  <span className="ui-badge text-xs">{tenants.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("logs")}
                  className={`nav-item ${activeTab === "logs" ? "nav-item-active" : ""}`}
                >
                  <History className="w-4 h-4" />
                  <span>Audit logs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("templates")}
                  className={`nav-item ${activeTab === "templates" ? "nav-item-active" : ""}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Category templates</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="sidebar-section-label">Overview</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`nav-item ${activeTab === "dashboard" ? "nav-item-active" : ""}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("calendar")}
                  className={`nav-item justify-between ${activeTab === "calendar" ? "nav-item-active" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Bookings</span>
                  </div>
                  {bookings.filter(b => b.status === "pending").length > 0 && (
                    <span className="nav-count-badge">
                      {bookings.filter(b => b.status === "pending").length}
                    </span>
                  )}
                </button>

                <p className="sidebar-section-label">Manage</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("services")}
                  className={`nav-item ${activeTab === "services" ? "nav-item-active" : ""}`}
                >
                  <Scissors className="w-4 h-4" />
                  <span>Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("staff")}
                  className={`nav-item ${activeTab === "staff" ? "nav-item-active" : ""}`}
                >
                  <Users className="w-4 h-4" />
                  <span>Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("crm")}
                  className={`nav-item ${activeTab === "crm" ? "nav-item-active" : ""}`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Customers</span>
                </button>

                <p className="sidebar-section-label">Website</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("cms")}
                  className={`nav-item ${activeTab === "cms" ? "nav-item-active" : ""}`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Customize site</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("emails")}
                  className={`nav-item ${activeTab === "emails" ? "nav-item-active" : ""}`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email workflows</span>
                </button>

                <p className="sidebar-section-label">Account</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`nav-item ${activeTab === "profile" ? "nav-item-active" : ""}`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>
              </div>
            )}
          </nav>

          <div className="p-3 border-t border-zinc-200">
            <button
              type="button"
              id="exit-console-sidebar-btn"
              onClick={() => {
                clearAdminSession();
                setAppView("marketplace");
                setLoginEmail("");
                setLoginError("");
                pushRoute("/");
                triggerToast("Signed Out", "You have successfully signed out of the workspace.");
              }}
              className="w-full ui-btn text-sm text-red-700 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>

          <div className="p-3 border-t border-zinc-200 bg-zinc-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <p className="text-xs font-medium text-zinc-700">Connected</p>
                <p className="text-xs text-zinc-500">Local database</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <h1 className="text-sm font-medium text-zinc-900 capitalize">
              {activeTab.replace("_", " ")}
              {currentRole === UserRole.SUPER_ADMIN ? " · Admin" : activeBusiness ? ` · ${activeBusiness.name}` : ""}
            </h1>
            <div className="flex items-center gap-2">
              {currentRole === UserRole.BUSINESS_ADMIN && (
                <button type="button" onClick={() => openBookingWizard()} className="ui-btn-primary text-sm">
                  <Plus className="w-4 h-4" /> New booking
                </button>
              )}
            </div>
          </header>

          <div className="admin-content max-w-6xl w-full mx-auto space-y-6">
            
            {/* 1. SUPER ADMIN ROOT DASHBOARD */}
            {currentRole === UserRole.SUPER_ADMIN && activeTab === "dashboard" && (
              <SuperAdminDashboard
                tenants={tenants}
                activeBusiness={activeBusiness}
                setActiveBusiness={setActiveBusiness}
                auditLogs={auditLogs}
                fetchAuditLogs={fetchAuditLogs}
                setOnboardingModalOpen={setOnboardingModalOpen}
                onManageTenant={handleManageTenant}
              />
            )}

            {/* 2. SUPER ADMIN SECURITY AUDIT LOGS FULLVIEW */}
            {currentRole === UserRole.SUPER_ADMIN && activeTab === "logs" && (
              <AuditLogsManager
                auditLogs={auditLogs}
                fetchAuditLogs={fetchAuditLogs}
              />
            )}

            {currentRole === UserRole.SUPER_ADMIN && activeTab === "templates" && (
              <CategoryTemplateManager
                templates={categoryTemplates.length ? categoryTemplates : []}
                onRefresh={fetchCategoryTemplates}
                triggerToast={triggerToast}
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
                categoryTemplates={categoryTemplates}
                handleCreateService={handleCreateService}
                handleUpdateService={handleUpdateService}
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
          categoryTemplates={categoryTemplates}
        />
      )}

      {/* B. BACKOFFICE RESERVATIONS WIZARD MODAL */}
      {bookingWizardOpen && (selectedBusiness || activeBusiness) && (
        <BookingWizard
          business={(selectedBusiness || activeBusiness)!}
          services={services}
          staffList={staff}
          bookings={bookings}
          preSelectedService={wizardPreselect?.service}
          preSelectedVariant={wizardPreselect?.variant}
          onClose={() => {
            setBookingWizardOpen(false);
            setWizardPreselect(null);
          }}
          onSubmit={handleWizardSubmit}
        />
      )}

      {cmsPreviewOpen && activeBusiness && (
        <div className="fixed inset-0 z-50 bg-zinc-900/30 flex flex-col">
          <div className="h-14 bg-white border-b border-zinc-200 px-4 md:px-6 flex items-center justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">Site preview</p>
              <p className="text-xs text-zinc-500 truncate">{getTenantPublicUrl(activeBusiness.slug)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={getTenantPublicUrl(activeBusiness.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-btn text-sm"
              >
                Open in new tab
              </a>
              <button id="cms-preview-close" type="button" onClick={() => setCmsPreviewOpen(false)} className="ui-btn-primary text-sm">
                Close
              </button>
            </div>
          </div>
          <iframe
            title="Live site preview"
            src={`${getTenantPublicPath(activeBusiness.slug)}?preview=1`}
            className="flex-1 w-full border-0 bg-white"
          />
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
