export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  BUSINESS_ADMIN = "BUSINESS_ADMIN",
  STAFF = "STAFF",
  CUSTOMER = "CUSTOMER"
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId?: string; // empty for super admins
  photo?: string;
  phone?: string;
  bio?: string;
}

export type ThemePalette = "neutral" | "emerald" | "amber" | "indigo" | "rose" | "violet" | "retro-slate";
export type ThemeFont = "sans" | "serif" | "mono";

export interface CMSTheme {
  primaryPalette: ThemePalette;
  fontFamily: ThemeFont;
  bannerStyle: "minimal" | "split" | "overlay";
  buttonStyle: "square" | "rounded" | "pill";
  customBgColor?: string;
  customTextColor?: string;
  customAccentColor?: string;
  fontSizeSetting?: "small" | "medium" | "large" | "extra-large";
  customFontGoogle?: string;
}

export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface BusinessTenant {
  id: string; // internal UUID
  slug: string; // e.g. "classic-barber", URL-friendly identifier
  name: string;
  logo: string;
  templateType: "hair-salon" | "nail-salon" | "tattoo-studio" | "makeup-artist" | "generic-coaching";
  aboutText: string;
  heroHeading: string;
  heroSubheading: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  theme: CMSTheme;
  seo: SEOConfig;
  isActive: boolean;
  createdAt: string;
  categories?: string[];
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image: string;
  staffIds: string[];
  isActive?: boolean;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  photo: string;
  position: string;
  rating: number;
  workingHours: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "18:00"
  };
  available?: boolean;
  isActive?: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  notes: string;
  totalSpending: number;
  lastAppointment?: string;
}

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string; // or "any"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "14:30"
  status: "pending" | "confirmed" | "cancelled";
  price: number;
  notes?: string;
  cancellationRemarks?: string;
  paymentMethod?: "cash" | "gcash";
  downpaymentPaid?: number;
  gcashTxnRef?: string;
  createdAt: string;
}

export interface BlockedSlot {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  timeSlot?: string; // if empty, blocks the whole day
  remarks: string;
  createdAt: string;
}

export interface Review {
  id: string;
  businessId: string;
  customerName: string;
  serviceName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

export interface BlogPost {
  id: string;
  businessId: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  date: string;
  author: string;
}

export interface FAQItem {
  id: string;
  businessId: string;
  question: string;
  answer: string;
}

export interface AuditLog {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  details: string;
}

export interface EmailTemplate {
  businessId: string;
  key: "booking_confirmation" | "booking_reminder" | "booking_cancellation" | "welcome_tenant";
  subject: string;
  body: string;
}

export function formatTimeSlot(slotStr: string): string {
  if (!slotStr) return "";
  const parts = slotStr.split(":");
  if (parts.length < 2) return slotStr;
  const hour = parseInt(parts[0], 10);
  const mins = parts[1];
  
  if (hour === 0) {
    return `12:${mins} MD`;
  } else if (hour === 12) {
    return `12:${mins} NN`;
  } else if (hour < 12) {
    // Keep double digits or single? E.g., "03:00" -> "3:00 AM" looks cleaner than "03:00 AM" (or we can just show the hour)
    return `${hour}:${mins} AM`;
  } else {
    return `${hour - 12}:${mins} PM`;
  }
}
