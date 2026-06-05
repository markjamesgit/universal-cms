import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { 
  User, UserRole, BusinessTenant, Service, Staff, Customer, 
  Booking, Review, BlogPost, FAQItem, AuditLog, EmailTemplate, BlockedSlot,
  CategoryTemplate
} from "../src/types";

export const DEFAULT_CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    id: "ct-1",
    slug: "hair-salon",
    label: "Hair & Barber",
    icon: "✂️",
    description: "Salons, barbershops, and hair styling studios",
    defaultCategories: ["Coloring", "Styling", "Therapy", "Consultation", "General"],
    defaultHeroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "ct-2",
    slug: "nail-salon",
    label: "Nails & Glow",
    icon: "💅",
    description: "Nail art, manicure, pedicure, and spa services",
    defaultCategories: ["Artistry", "Manicure", "Pedicure", "Spa Care", "General"],
    defaultHeroImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=1200",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "ct-3",
    slug: "tattoo-studio",
    label: "Ink & Art",
    icon: "🎨",
    description: "Tattoo studios and body art specialists",
    defaultCategories: ["Tattooing", "Piercing", "Consultation", "Aftercare", "General"],
    defaultHeroImage: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=1200",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "ct-4",
    slug: "makeup-artist",
    label: "Makeup & Style",
    icon: "💄",
    description: "Makeup artists, bridal, and event styling",
    defaultCategories: ["Bridal Makeup", "Event Styling", "Lash & Brow", "General"],
    defaultHeroImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1200",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "ct-5",
    slug: "generic-coaching",
    label: "Wellness Clinic",
    icon: "🌱",
    description: "Coaching, wellness, and appointment-based clinics",
    defaultCategories: ["1-on-1 Coaching", "Group Workshop", "Mental Wellness", "General"],
    defaultHeroImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200",
    isActive: true,
    sortOrder: 5,
  },
];

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Dynamic Firestore Setup — env vars (Vercel) or firebase-applet-config.json (local)
function loadFirebaseConfig(): Record<string, string> | null {
  const jsonEnv = process.env.FIREBASE_CONFIG?.trim();
  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv);
    } catch (err) {
      console.error("[FIREBASE CONFIG] FIREBASE_CONFIG JSON parse error:", err);
    }
  }

  const fromEnv = {
    apiKey: process.env.FIREBASE_API_KEY?.trim(),
    authDomain: process.env.FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.FIREBASE_APP_ID?.trim(),
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID?.trim(),
  };
  if (fromEnv.apiKey && fromEnv.projectId && fromEnv.appId) {
    return fromEnv as Record<string, string>;
  }

  const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    } catch (err) {
      console.error("[FIREBASE CONFIG] Parse error:", err);
    }
  }
  return null;
}

const firebaseConfig = loadFirebaseConfig();

let firebaseApp: any = null;
let firestoreDb: any = null;

if (firebaseConfig) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    console.log(`[FIREBASE] Integrated Web SDK successfully with Long Polling! Target Project: ${firebaseConfig.projectId}`);
  } catch (err) {
    console.error("[FIREBASE ERROR] Connection failed: ", err);
  }
}

// Global Remote Firestore Wrappers
async function loadCollection(colName: string): Promise<any[]> {
  if (!firestoreDb) return [];
  try {
    const colRef = collection(firestoreDb, colName);
    const q = query(colRef, where("serverSecret", "==", "A7xK9_SERVER_SECURE_TOKEN_2026"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach(docRef => {
      const data = docRef.data();
      delete data.serverSecret;
      list.push({ id: docRef.id, ...data });
    });
    return list;
  } catch (err) {
    console.error(`[FIREBASE READ ERROR] Fail in col: ${colName}`, err);
    return [];
  }
}

async function saveDocument(colName: string, id: string, data: any): Promise<void> {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, colName, id);
    const payload = { ...data, serverSecret: "A7xK9_SERVER_SECURE_TOKEN_2026" };
    await setDoc(docRef, payload);
  } catch (err) {
    console.error(`[FIREBASE WRITE ERROR] Fail in col: ${colName} doc: ${id}`, err);
  }
}

async function deleteDocument(colName: string, id: string): Promise<void> {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, colName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[FIREBASE DELETE ERROR] Fail in col: ${colName} doc: ${id}`, err);
  }
}

interface DBStructure {
  users: User[];
  businesses: BusinessTenant[];
  services: Service[];
  staff: Staff[];
  customers: Customer[];
  bookings: Booking[];
  reviews: Review[];
  blogs: BlogPost[];
  faqs: FAQItem[];
  emailTemplates: EmailTemplate[];
  auditLogs: AuditLog[];
  blockedSlots?: BlockedSlot[];
  categoryTemplates?: CategoryTemplate[];
}

const INITIAL_DB: DBStructure = {
  users: [
    { id: "u-1", email: "unibook562026@gmail.com", name: "Super Platform Admin", role: UserRole.SUPER_ADMIN },
    { id: "u-2", email: "sarah@chiccuts.com", name: "Sarah Connor (Owner)", role: UserRole.BUSINESS_ADMIN, businessId: "b-1" },
    { id: "u-3", email: "david@chiccuts.com", name: "David Johnson", role: UserRole.STAFF, businessId: "b-1" },
    { id: "u-4", email: "customer1@gmail.com", name: "Alex Mercer", role: UserRole.CUSTOMER },
  ],
  businesses: [
    {
      id: "b-1",
      slug: "chic-cuts",
      name: "Chic Cuts Hair Salon",
      logo: "💇‍♀️",
      templateType: "hair-salon",
      heroHeading: "Revitalize Your Hair, Express Your Personal Style",
      heroSubheading: "Premium hair care, hair painting, styling, and texturizing services in a modern, inclusive space.",
      aboutText: "Founded in 2020, Chic Cuts is dedicated to high-end hair transformations. Our certified color specialists use state-of-the-art formulations to keep your hair healthy, bright, and resilient.",
      contactEmail: "reservations@chiccuts.com",
      contactPhone: "+1 (555) 123-4567",
      contactAddress: "452 Premium Blvd, Suite C, Austin TX",
      theme: {
        primaryPalette: "indigo",
        fontFamily: "sans",
        bannerStyle: "split",
        buttonStyle: "rounded"
      },
      seo: {
        metaTitle: "Chic Cuts - Luxury Hair Salon & Color Specialists",
        metaDescription: "Book top hair treatments, balayage, cut and styling at Chic Cuts Austin.",
        ogImage: "chic_cuts_preview"
      },
      isActive: true,
      createdAt: "2026-01-10T11:00:00Z"
    },
    {
      id: "b-2",
      slug: "vivid-nails",
      name: "Vivid Nails & Spa",
      logo: "💅",
      templateType: "nail-salon",
      heroHeading: "Exquisite Nail Artistry & Organic Spa Pampering",
      heroSubheading: "Treat yourself to precision manicures, customized polygel extensions, and botanical foot therapies.",
      aboutText: "At Vivid Nails, hygiene and custom detail-driven art are our priorities. We offer high-performance organic products, custom gel painting, and sensory pedicure paths under strict medical-grade sterilization.",
      contactEmail: "info@vividnails.com",
      contactPhone: "+1 (555) 890-4411",
      contactAddress: "108 Wellness Circle, Venice Beach CA",
      theme: {
        primaryPalette: "rose",
        fontFamily: "serif",
        bannerStyle: "minimal",
        buttonStyle: "pill"
      },
      seo: {
        metaTitle: "Vivid Nails - Advanced Nail Artistry & Hand Spa",
        metaDescription: "Book certified polygel extensions and customized manicure gel styling.",
        ogImage: "vivid_nails_preview"
      },
      isActive: true,
      createdAt: "2026-02-15T09:30:00Z"
    },
    {
      id: "b-3",
      slug: "ink-master",
      name: "Ink & Steel Tattoo Studio",
      logo: "🔥",
      templateType: "tattoo-studio",
      heroHeading: "Permanently Crafted Masterpieces",
      heroSubheading: "Fine-line, modern illustrative realism, and blackwork tattoos from accredited award-winning resident artists.",
      aboutText: "Ink & Steel is an advanced, sterile studio focusing on bespoke, story-led body art. Every piece is meticulously customized, respecting high-end sanitary norms and absolute artistic integrity.",
      contactEmail: "artists@inksteel.com",
      contactPhone: "+1 (555) 777-6666",
      contactAddress: "88 Industrial Alley, Brooklyn NY",
      theme: {
        primaryPalette: "retro-slate",
        fontFamily: "mono",
        bannerStyle: "overlay",
        buttonStyle: "square"
      },
      seo: {
        metaTitle: "Ink & Steel - Bespoke Linework & Illustrative Tattoos",
        metaDescription: "Premier Brooklyn custom tattoo consultations and sterile body art.",
        ogImage: "ink_steel_preview"
      },
      isActive: true,
      createdAt: "2026-03-01T14:45:00Z"
    }
  ],
  services: [
    { id: "s-101", businessId: "b-1", name: "Premium Balayage & Olaplex", category: "Coloring", description: "Seamless, hand-painted balayage lighting with full structural plex reconstruction. Includes wash, scalp massage, and blowout.", price: 185, duration: 150, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=300", staffIds: ["st-1", "st-2"] },
    { id: "s-102", businessId: "b-1", name: "Designer Cut & Customized Treatment", category: "Styling", description: "Artistic hair profile mapping, texturizing, structural style restoration, and hydration masks.", price: 85, duration: 60, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=300", staffIds: ["st-1", "st-2", "st-3"] },
    { id: "s-103", businessId: "b-1", name: "Scalp Hydromassage & Botanical Restructure", category: "Therapy", description: "Exfoliating wash, micro-steam hydration infusion, tea tree scalp cleanse, and essential oil sensory therapy.", price: 60, duration: 45, image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=300", staffIds: ["st-2", "st-3"] },
    {
      id: "s-104",
      businessId: "b-1",
      name: "Bridal & Wedding Hair Packages",
      category: "Styling",
      description: "Complete wedding hair services — from trial sessions to day-of styling for the bride and bridal party.",
      price: 350,
      duration: 120,
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300",
      staffIds: ["st-1", "st-2"],
      variants: [
        { id: "sv-trial", name: "Bridal Trial Session", description: "90-minute trial with style consultation, test updo or waves, and photo references.", price: 150, duration: 90 },
        { id: "sv-bride", name: "Bride Day-Of Styling", description: "On-location or in-salon styling on wedding day including prep and finishing.", price: 450, duration: 150 },
        { id: "sv-party", name: "Bridal Party (per person)", description: "Coordinated styling for bridesmaids — blowout, curls, or simple updo.", price: 120, duration: 60 },
        { id: "sv-full", name: "Full Wedding Package", description: "Trial + bride day-of + up to 4 bridal party members. Best value for complete wedding prep.", price: 950, duration: 360 },
      ],
    },
    { id: "s-201", businessId: "b-2", name: "Bespoke Gel Painting & Hard Gel Full Set", category: "Artistry", description: "Nailbed structure analysis, tip extension, advanced sculpture, and custom fine-art hand painted graphics.", price: 120, duration: 90, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=300", staffIds: ["st-4", "st-5"] },
    { id: "s-202", businessId: "b-2", name: "Matcha Botanical Hand & Arm Spa", category: "Spa Care", description: "Warm matcha herbal bath clean, Dead sea salt mineral scrub, paraffin moisture wax wrap, and rose oil massage.", price: 55, duration: 45, image: "https://images.unsplash.com/photo-1519415590266-606093cd53fc?auto=format&fit=crop&q=80&w=300", staffIds: ["st-5"] },
    { id: "s-301", businessId: "b-3", name: "Custom Tattoo Conception Session", category: "Consultation", description: "One-on-one session with our master, visual mood boarding, reference mapping, sketching layout, and skin placement test.", price: 50, duration: 60, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=300", staffIds: ["st-6", "st-7"] },
    { id: "s-302", businessId: "b-3", name: "Fine Line Illustrative Session (Small/Medium)", category: " tattooing", description: "Active tattooing of fine-line design, micro-realism portrait matching, or elegant modern lettering up to 4 inches. Includes bio-protection patch.", price: 190, duration: 120, image: "https://images.unsplash.com/photo-1504198266287-1659872e6590?auto=format&fit=crop&q=80&w=300", staffIds: ["st-6", "st-7"] }
  ],
  staff: [
    { id: "st-1", businessId: "b-1", name: "Sarah Connor", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", position: "Master Colorist & Founder", rating: 4.9, workingHours: { start: "09:00", end: "18:00" } },
    { id: "st-2", businessId: "b-1", name: "David Johnson", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", position: "Senior Hair Designer", rating: 4.8, workingHours: { start: "10:00", end: "19:00" } },
    { id: "st-3", businessId: "b-1", name: "Isabel Carter", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150", position: "Junior Therapist", rating: 4.7, workingHours: { start: "09:00", end: "17:00" } },
    { id: "st-4", businessId: "b-2", name: "Mila Kunis", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", position: "Lead Nail Designer", rating: 4.9, workingHours: { start: "10:00", end: "19:00" } },
    { id: "st-5", businessId: "b-2", name: "Tiffany Vance", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150", position: "Botanical Aromatherapist", rating: 4.7, workingHours: { start: "09:00", end: "18:00" } },
    { id: "st-6", businessId: "b-3", name: "Marcus 'Steel' Vane", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150", position: "Custom Illustrative Specialist", rating: 4.95, workingHours: { start: "12:00", end: "21:00" } },
    { id: "st-7", businessId: "b-3", name: "Luna Blackwood", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150", position: "Accredited Fine-line Resident", rating: 4.88, workingHours: { start: "11:00", end: "20:00" } }
  ],
  customers: [
    { id: "c-1", businessId: "b-1", name: "Alex Mercer", email: "alex.m@gmail.com", phone: "+1 (555) 303-1244", tags: ["VIP", "High-Spender"], notes: "Enjoys warm chamomile tea, prefers cold air blower.", totalSpending: 540, lastAppointment: "2026-05-18" },
    { id: "c-2", businessId: "b-1", name: "Sophia Martinez", email: "sophia.mar@yahoo.com", phone: "+1 (555) 441-9233", tags: ["Co-operative"], notes: "Warm, talks about botanical biology.", totalSpending: 170, lastAppointment: "2026-05-22" },
    { id: "c-3", businessId: "b-2", name: "Brittany Spears", email: "gimme.more@pop.net", phone: "+1 (555) 101-0909", tags: ["Frequent"], notes: "Prefers extreme stiletto nails with heavy glitter.", totalSpending: 360, lastAppointment: "2026-06-01" },
    { id: "c-4", businessId: "b-3", name: "Vince Taylor", email: "vince.t@industry.com", phone: "+1 (555) 888-9999", tags: ["New-Cover"], notes: "Getting half sleeve design mapping soon.", totalSpending: 50, lastAppointment: "2026-06-03" }
  ],
  bookings: [
    { id: "bk-1", businessId: "b-1", serviceId: "s-101", staffId: "st-1", customerId: "c-1", customerName: "Alex Mercer", customerEmail: "alex.m@gmail.com", customerPhone: "+1 (555) 303-1244", date: "2026-06-01", timeSlot: "10:00", status: "confirmed", price: 185, createdAt: "2026-05-28T14:22:00Z" },
    { id: "bk-2", businessId: "b-1", serviceId: "s-102", staffId: "st-2", customerId: "c-2", customerName: "Sophia Martinez", customerEmail: "sophia.mar@yahoo.com", customerPhone: "+1 (555) 441-9233", date: "2026-06-05", timeSlot: "14:30", status: "pending", price: 85, createdAt: "2026-06-01T09:12:00Z", notes: "Please keep length above shoulders!" },
    { id: "bk-3", businessId: "b-1", serviceId: "s-103", staffId: "st-3", customerId: "c-1", customerName: "Alex Mercer", customerEmail: "alex.m@gmail.com", customerPhone: "+1 (555) 303-1244", date: "2026-06-08", timeSlot: "11:00", status: "confirmed", price: 60, createdAt: "2026-06-02T15:10:00Z" },
    { id: "bk-4", businessId: "b-2", serviceId: "s-201", staffId: "st-4", customerId: "c-3", customerName: "Brittany Spears", customerEmail: "gimme.more@pop.net", customerPhone: "+1 (555) 101-0909", date: "2026-06-06", timeSlot: "11:30", status: "confirmed", price: 120, createdAt: "2026-06-02T10:45:00Z" },
    { id: "bk-5", businessId: "b-3", serviceId: "s-301", staffId: "st-6", customerId: "c-4", customerName: "Vince Taylor", customerEmail: "vince.t@industry.com", customerPhone: "+1 (555) 888-9999", date: "2026-06-04", timeSlot: "13:00", status: "confirmed", price: 50, createdAt: "2026-06-03T09:00:00Z" },
    { id: "bk-6", businessId: "b-3", serviceId: "s-302", staffId: "st-7", customerId: "c-4", customerName: "Vince Taylor", customerEmail: "vince.t@industry.com", customerPhone: "+1 (555) 888-9999", date: "2026-06-12", timeSlot: "15:00", status: "pending", price: 190, createdAt: "2026-06-03T17:15:00Z" }
  ],
  reviews: [
    { id: "r-1", businessId: "b-1", customerName: "Alex Mercer", serviceName: "Premium Balayage", rating: 5, comment: "Sarah is absolute magician! Color blended flawlessly and Olaplex treatment left my tips glowing.", date: "2026-05-18", approved: true },
    { id: "r-2", businessId: "b-1", customerName: "Sophia Martinez", serviceName: "Designer Cut", rating: 4, comment: "David cuts very neat patterns. A bit quiet but professional.", date: "2026-05-22", approved: true },
    { id: "r-3", businessId: "b-2", customerName: "Brittany Spears", serviceName: "Bespoke Gel Painting", rating: 5, comment: "Oh my god, the details are unbelievable! I asked for starry celestial swirls, Mila delivered masterpieces.", date: "2026-06-01", approved: true }
  ],
  blogs: [
    { id: "bl-1", businessId: "b-1", title: "5 Essential Tips to Maintain Healthy Balayage Shine", excerpt: "Keep your hand-painted highlights bright, rich, and brass-free elements without washing away structure.", content: "Balayage is the golden standard for luxurious dimensional color. However, chemical bleaching alters cortex protein structures. To maintain pristine reflections:\n\n1. Use zero-sulfate purple shampoos every 3rd wash to clear brass.\n2. Infuse lightweight botanical oils (argan, camellia) into damp ends.\n3. Always apply deep heat protectants before hot iron contact.\n4. Avoid hot chlorinated swimming pools without hair barriers.", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400", category: "Color Care", date: "2026-05-10", author: "Sarah Connor" },
    { id: "bl-2", businessId: "b-1", title: "Understanding Scalp Micro-circulation Wellness", excerpt: "Why professional botanical therapies prevent dryness, improve thickness, and enhance sensory peace.", content: "A clean scalp breeds resilient follicles. Our state-of-the-art scalp steam-cleaning treatments loosen mineral deposits, open deep pores, and improve lymphatic circulation of essential scalp nutrients.", image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=400", category: "Scalp Health", date: "2026-05-20", author: "Isabel Carter" }
  ],
  faqs: [
    { id: "fq-1", businessId: "b-1", question: "How long does a premium balayage color session take?", answer: "Usually between 2 to 3 hours depending on hair density and target lightness. We take our time to process with protective bond builders safely." },
    { id: "fq-2", businessId: "b-1", question: "Do you accept walk-ins?", answer: "We are strictly appointment-based to ensure focused, personalized attention with our master designers." },
    { id: "fq-3", businessId: "b-2", question: "How do you sterilize your instruments?", answer: "We run all reusable metal implements through an FDA-approved medical-grade autoclave. Cleanliness and client safety are our top non-negotiable standards." }
  ],
  emailTemplates: [
    { businessId: "b-1", key: "booking_confirmation", subject: "Confimations! Your Hair Session at Chic Cuts", body: "Dear {{customerName}},\n\nWe are absolutely thrilled to confirm your booking for {{serviceName}} on {{bookingDate}} at {{bookingTime}}! Your session has been mapped with {{staffName}}.\n\nAddress: 452 Premium Blvd, Suite C, Austin TX\n\nIf you need to reschedule or cancel, please let us know at least 24 hours in advance.\n\nWarmest regards,\nChic Cuts Team" },
    { businessId: "b-2", key: "booking_confirmation", subject: "Reservation Confirmed: Vivid Nails & Spa", body: "Dear {{customerName}},\n\nYour organic pampering appointment is locked in!\n\nDetails:\n- Service: {{serviceName}}\n- Artist: {{staffName}}\n- Clock: {{bookingTime}} on {{bookingDate}}\n\nGet ready for beautiful, healthy artistry!\n\nBest,\nVivid Nails Studio" }
  ],
  auditLogs: [
    { id: "log-1", createdAt: "2026-06-03T09:12:00Z", actor: "System Seed", action: "PLATFORM_INIT", details: "Bootstrap multi-tenant database with 3 industry tenant presets successfully." }
  ],
  blockedSlots: [],
  categoryTemplates: DEFAULT_CATEGORY_TEMPLATES,
};

export class Database {
  private data: DBStructure;

  constructor() {
    this.data = { ...INITIAL_DB };
    this.load();
    this.initializeFirestore();
  }

  // Dual Synchronizer: Pulls from remote Cloud Firestore and merges into live Node.js container context
  async initializeFirestore() {
    if (!firestoreDb) {
      console.log("[FIREBASE] Running in local sandbox filesystem mode.");
      return;
    }
    console.log("[FIREBASE] Syncing memory with remote Firestore collection ledger...");
    try {
      const loadedBusinesses = await loadCollection("businesses");
      if (loadedBusinesses.length === 0) {
        console.log("[FIREBASE SEEDING] Cloud Database is clean. Provisioning templates now...");
        
        for (const item of INITIAL_DB.businesses) {
          await saveDocument("businesses", item.id, item);
        }
        for (const item of INITIAL_DB.users) {
          await saveDocument("users", item.id, item);
        }
        for (const item of INITIAL_DB.services) {
          await saveDocument("services", item.id, item);
        }
        for (const item of INITIAL_DB.staff) {
          await saveDocument("staff", item.id, item);
        }
        for (const item of INITIAL_DB.customers) {
          await saveDocument("customers", item.id, item);
        }
        for (const item of INITIAL_DB.bookings) {
          await saveDocument("bookings", item.id, item);
        }
        for (const item of INITIAL_DB.reviews) {
          await saveDocument("reviews", item.id, item);
        }
        for (const item of INITIAL_DB.blogs) {
          await saveDocument("blogs", item.id, item);
        }
        for (const item of INITIAL_DB.faqs) {
          await saveDocument("faqs", item.id, item);
        }
        for (const item of INITIAL_DB.emailTemplates) {
          await saveDocument("emailTemplates", `${item.businessId}-${item.key}`, item);
        }
        for (const item of INITIAL_DB.auditLogs) {
          await saveDocument("auditLogs", item.id, item);
        }
        
        console.log("[FIREBASE COMPLETE] Seeding complete! State is secured remotely.");
        this.data = { ...INITIAL_DB };
      } else {
        console.log("[FIREBASE RESTORING] Remote state found. Discharging disk files...");
        this.data.businesses = loadedBusinesses;
        this.data.users = await loadCollection("users");
        this.data.services = await loadCollection("services");
        this.data.staff = await loadCollection("staff");
        this.data.customers = await loadCollection("customers");
        this.data.bookings = await loadCollection("bookings");
        this.data.reviews = await loadCollection("reviews");
        this.data.blogs = await loadCollection("blogs");
        this.data.faqs = await loadCollection("faqs");
        this.data.emailTemplates = await loadCollection("emailTemplates");
        this.data.auditLogs = await loadCollection("auditLogs");
        
        const slots = await loadCollection("blockedSlots");
        this.data.blockedSlots = slots || [];
        
        console.log("[FIREBASE OK] Remote sync operation ended successfully.");
      }
      this.save();
    } catch (err) {
      console.error("[FIREBASE ENGINE ERROR] Initialization task aborted: ", err);
    }
  }

  private load(): void {
    try {
      const parentDir = path.dirname(DB_PATH);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, "utf-8");
        this.data = JSON.parse(fileContent);
        if (!this.data.blockedSlots) {
          this.data.blockedSlots = [];
        }
        if (!this.data.categoryTemplates || this.data.categoryTemplates.length === 0) {
          this.data.categoryTemplates = [...DEFAULT_CATEGORY_TEMPLATES];
          this.save();
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load schema from db.json. Defaulting to initial dataset.", e);
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Critical: Failed to save to db.json", e);
    }
  }

  // --- BUSINESS TENANTS ---
  getBusinesses(): BusinessTenant[] {
    return this.data.businesses;
  }

  getBusinessBySlug(slug: string): BusinessTenant | undefined {
    return this.data.businesses.find(b => b.slug.toLowerCase() === slug.toLowerCase());
  }

  getBusinessById(id: string): BusinessTenant | undefined {
    return this.data.businesses.find(b => b.id === id);
  }

  createBusiness(b: Omit<BusinessTenant, "id" | "createdAt" | "isActive">): BusinessTenant {
    const newBusiness: BusinessTenant = {
      ...b,
      id: "b-" + Math.random().toString(36).substr(2, 9),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.data.businesses.push(newBusiness);

    // Bootstrap default emails templates
    const templates: EmailTemplate[] = [
      {
        businessId: newBusiness.id,
        key: "booking_confirmation",
        subject: `Your Booking at ${newBusiness.name} is Confirmed!`,
        body: `Hi {{customerName}},\n\nYour appointment for {{serviceName}} is confirmed for {{bookingDate}} at {{bookingTime}} with {{staffName}}.\n\nWe look forward to seeing you at ${newBusiness.contactAddress}!\n\nBest regards,\n${newBusiness.name} Team`
      }
    ];
    this.data.emailTemplates.push(...templates);

    // Bootstrap placeholder FAQs
    const defaultFAQ: FAQItem = {
      id: "fq-" + Math.random().toString(36).substr(2, 9),
      businessId: newBusiness.id,
      question: "Do I need to book in advance?",
      answer: "We strongly recommend booking through our custom CMS site to guarantee your preferred time slot!"
    };
    this.data.faqs.push(defaultFAQ);

    this.save();

    // Propagate Async
    saveDocument("businesses", newBusiness.id, newBusiness);
    for (const t of templates) {
      saveDocument("emailTemplates", `${t.businessId}-${t.key}`, t);
    }
    saveDocument("faqs", defaultFAQ.id, defaultFAQ);

    return newBusiness;
  }

  updateBusiness(id: string, updates: Partial<BusinessTenant>): BusinessTenant {
    const idx = this.data.businesses.findIndex(b => b.id === id);
    if (idx === -1) throw new Error("Tenant not found");
    this.data.businesses[idx] = { ...this.data.businesses[idx], ...updates };
    this.save();

    // Propagate Async
    saveDocument("businesses", id, this.data.businesses[idx]);
    return this.data.businesses[idx];
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(u: Omit<User, "id">): User {
    const newUser: User = {
      ...u,
      id: "u-" + Math.random().toString(36).substr(2, 9)
    };
    this.data.users.push(newUser);
    this.save();

    // Propagate Async
    saveDocument("users", newUser.id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();

    // Propagate Async
    saveDocument("users", id, this.data.users[idx]);
    return this.data.users[idx];
  }

  // --- SERVICES ---
  getServices(businessId?: string): Service[] {
    if (businessId) {
      return this.data.services.filter(s => s.businessId === businessId);
    }
    return this.data.services;
  }

  createService(s: Omit<Service, "id">): Service {
    const service: Service = {
      ...s,
      id: "s-" + Math.random().toString(36).substr(2, 9)
    };
    this.data.services.push(service);
    this.save();

    // Propagate Async
    saveDocument("services", service.id, service);
    return service;
  }

  updateService(id: string, updates: Partial<Service>): Service {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Service not found");
    this.data.services[idx] = { ...this.data.services[idx], ...updates };
    this.save();

    // Propagate Async
    saveDocument("services", id, this.data.services[idx]);
    return this.data.services[idx];
  }

  deleteService(id: string): void {
    this.data.services = this.data.services.filter(s => s.id !== id);
    this.save();

    // Propagate Async
    deleteDocument("services", id);
  }

  // --- STAFF ---
  getStaff(businessId?: string): Staff[] {
    if (businessId) {
      return this.data.staff.filter(st => st.businessId === businessId);
    }
    return this.data.staff;
  }

  createStaff(st: Omit<Staff, "id" | "rating">): Staff {
    const staff: Staff = {
      ...st,
      id: "st-" + Math.random().toString(36).substr(2, 9),
      rating: 5.0
    };
    this.data.staff.push(staff);
    this.save();

    // Propagate Async
    saveDocument("staff", staff.id, staff);
    return staff;
  }

  updateStaff(id: string, updates: Partial<Staff>): Staff {
    const idx = this.data.staff.findIndex(st => st.id === id);
    if (idx === -1) throw new Error("Staff member not found");
    this.data.staff[idx] = { ...this.data.staff[idx], ...updates };
    this.save();

    // Propagate Async
    saveDocument("staff", id, this.data.staff[idx]);
    return this.data.staff[idx];
  }

  deleteStaff(id: string): void {
    this.data.staff = this.data.staff.filter(st => st.id !== id);
    this.save();

    // Propagate Async
    deleteDocument("staff", id);
  }

  // --- CUSTOMERS ---
  getCustomers(businessId?: string): Customer[] {
    if (businessId) {
      return this.data.customers.filter(c => c.businessId === businessId);
    }
    return this.data.customers;
  }

  getOrCreateCustomer(businessId: string, email: string, name: string, phone: string): Customer {
    const existing = this.data.customers.find(
      c => c.businessId === businessId && c.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return existing;
    }
    const newCust: Customer = {
      id: "c-" + Math.random().toString(36).substr(2, 9),
      businessId,
      name,
      email,
      phone,
      tags: ["New"],
      notes: "Registered via customized Booking Site.",
      totalSpending: 0,
      lastAppointment: new Date().toISOString().split("T")[0]
    };
    this.data.customers.push(newCust);
    this.save();

    // Propagate Async
    saveDocument("customers", newCust.id, newCust);
    return newCust;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Customer not found");
    this.data.customers[idx] = { ...this.data.customers[idx], ...updates };
    this.save();

    // Propagate Async
    saveDocument("customers", id, this.data.customers[idx]);
    return this.data.customers[idx];
  }

  // --- BOOKINGS ---
  getBookings(businessId?: string): Booking[] {
    if (businessId) {
      return this.data.bookings.filter(bk => bk.businessId === businessId);
    }
    return this.data.bookings;
  }

  createBooking(bk: Omit<Booking, "id" | "createdAt" | "status"> & { status?: Booking["status"] }): Booking {
    const booking: Booking = {
      ...bk,
      id: "bk-" + Math.random().toString(36).substr(2, 9),
      status: bk.status || "pending",
      createdAt: new Date().toISOString()
    };
    this.data.bookings.push(booking);

    // Update customer lifetime statistics if confirmed
    const customer = this.data.customers.find(c => c.id === booking.customerId);
    if (customer) {
      customer.lastAppointment = booking.date;
      if (booking.status === "confirmed") {
        customer.totalSpending += booking.price;
        if (!customer.tags.includes("Booked")) {
          customer.tags = customer.tags.filter(t => t !== "New").concat("Active");
        }
      }
      saveDocument("customers", customer.id, customer);
    }

    // Write audit log
    this.addAuditLog("Booking Engine", "CREATE_BOOKING", `Created ${booking.status} booking #${booking.id} for ${booking.customerName}`);

    this.save();

    // Propagate Async
    saveDocument("bookings", booking.id, booking);
    return booking;
  }

  updateBookingStatus(id: string, status: "pending" | "confirmed" | "cancelled", cancellationRemarks?: string): Booking {
    const idx = this.data.bookings.findIndex(bk => bk.id === id);
    if (idx === -1) throw new Error("Booking not found");
    
    const prevStatus = this.data.bookings[idx].status;
    this.data.bookings[idx].status = status;
    if (status === "cancelled" && cancellationRemarks) {
      this.data.bookings[idx].cancellationRemarks = cancellationRemarks;
    }

    // Update customer spending trends if matched in stats
    const booking = this.data.bookings[idx];
    const customer = this.data.customers.find(c => c.id === booking.customerId);
    if (customer) {
      if (prevStatus !== "confirmed" && status === "confirmed") {
        customer.totalSpending += booking.price;
      } else if (prevStatus === "confirmed" && status !== "confirmed") {
        customer.totalSpending = Math.max(0, customer.totalSpending - booking.price);
      }
      saveDocument("customers", customer.id, customer);
    }

    this.addAuditLog("Business Dashboard", "UPDATE_BOOKING_STATUS", `Booking #${booking.id} status changed from ${prevStatus} to ${status}${cancellationRemarks ? ` (Remarks: ${cancellationRemarks})` : ""}`);
    
    this.save();

    // Propagate Async
    saveDocument("bookings", booking.id, booking);
    return booking;
  }

  deleteBooking(id: string): void {
    this.data.bookings = this.data.bookings.filter(bk => bk.id !== id);
    this.save();

    // Propagate Async
    deleteDocument("bookings", id);
  }

  // --- BLOCKED SLOTS ---
  getBlockedSlots(businessId?: string): BlockedSlot[] {
    if (!this.data.blockedSlots) {
      this.data.blockedSlots = [];
    }
    if (businessId) {
      return this.data.blockedSlots.filter(bs => bs.businessId === businessId);
    }
    return this.data.blockedSlots;
  }

  createBlockedSlot(slot: Omit<BlockedSlot, "id" | "createdAt">): BlockedSlot {
    if (!this.data.blockedSlots) {
      this.data.blockedSlots = [];
    }
    const slotObj = slot as any;
    const remarks = slotObj.remarks || slotObj.reason || "Slot Blocked";
    
    const newSlot: BlockedSlot = {
      ...slot,
      remarks: remarks,
      id: "bs-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.data.blockedSlots.push(newSlot);
    this.addAuditLog("Admin Panel", "DISABLE_DATE_TIME", `Disabled slot on ${slot.date} ${slot.timeSlot ? `at ${slot.timeSlot}` : "(all day)"} with remarks: "${remarks}"`);
    this.save();

    // Propagate Async
    saveDocument("blockedSlots", newSlot.id, newSlot);
    return newSlot;
  }

  deleteBlockedSlot(id: string): void {
    if (!this.data.blockedSlots) {
      this.data.blockedSlots = [];
    }
    this.data.blockedSlots = this.data.blockedSlots.filter(s => s.id !== id);
    this.save();

    // Propagate Async
    deleteDocument("blockedSlots", id);
  }

  // --- REVIEWS ---
  getReviews(businessId?: string, approvedOnly = false): Review[] {
    let list = this.data.reviews;
    if (businessId) {
      list = list.filter(r => r.businessId === businessId);
    }
    if (approvedOnly) {
      list = list.filter(r => r.approved);
    }
    return list;
  }

  createReview(r: Omit<Review, "id" | "date" | "approved">): Review {
    const review: Review = {
      ...r,
      id: "r-" + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split("T")[0],
      approved: false
    };
    this.data.reviews.push(review);
    this.save();

    // Propagate Async
    saveDocument("reviews", review.id, review);
    return review;
  }

  updateReviewStatus(id: string, approved: boolean): Review {
    const idx = this.data.reviews.findIndex(r => r.id === id);
    if (idx === -1) throw new Error("Review not found");
    this.data.reviews[idx].approved = approved;
    this.save();

    // Propagate Async
    saveDocument("reviews", id, this.data.reviews[idx]);
    return this.data.reviews[idx];
  }

  // --- BLOGS ---
  getBlogs(businessId?: string): BlogPost[] {
    if (businessId) {
      return this.data.blogs.filter(b => b.businessId === businessId);
    }
    return this.data.blogs;
  }

  createBlog(b: Omit<BlogPost, "id" | "date">): BlogPost {
    const blog: BlogPost = {
      ...b,
      id: "bl-" + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split("T")[0]
    };
    this.data.blogs.push(blog);
    this.save();

    // Propagate Async
    saveDocument("blogs", blog.id, blog);
    return blog;
  }

  deleteBlog(id: string): void {
    this.data.blogs = this.data.blogs.filter(b => b.id !== id);
    this.save();

    // Propagate Async
    deleteDocument("blogs", id);
  }

  // --- FAQs ---
  getFAQs(businessId?: string): FAQItem[] {
    if (businessId) {
      return this.data.faqs.filter(f => f.businessId === businessId);
    }
    return this.data.faqs;
  }

  createFAQ(f: Omit<FAQItem, "id">): FAQItem {
    const faq: FAQItem = {
      ...f,
      id: "fq-" + Math.random().toString(36).substr(2, 9)
    };
    this.data.faqs.push(faq);
    this.save();

    // Propagate Async
    saveDocument("faqs", faq.id, faq);
    return faq;
  }

  deleteFAQ(id: string): void {
    this.data.faqs = this.data.faqs.filter(f => f.id !== id);
    this.save();

    // Propagate Async
    deleteDocument("faqs", id);
  }

  // --- EMAIL TEMPLATES ---
  getEmailTemplates(businessId: string): EmailTemplate[] {
    return this.data.emailTemplates.filter(et => et.businessId === businessId);
  }

  updateEmailTemplate(businessId: string, key: string, updates: Pick<EmailTemplate, "subject" | "body">): EmailTemplate {
    const idx = this.data.emailTemplates.findIndex(et => et.businessId === businessId && et.key === key);
    let template: EmailTemplate;
    if (idx === -1) {
      template = {
        businessId,
        key: key as any,
        ...updates
      };
      this.data.emailTemplates.push(template);
    } else {
      this.data.emailTemplates[idx] = { ...this.data.emailTemplates[idx], ...updates };
      template = this.data.emailTemplates[idx];
    }
    this.save();

    // Propagate Async
    saveDocument("emailTemplates", `${businessId}-${key}`, template);
    return template;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  addAuditLog(actor: string, action: string, details: string): void {
    const log: AuditLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      actor,
      action,
      details
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 300) {
      this.data.auditLogs.pop();
    }
    this.save();

    // Propagate Async
    saveDocument("auditLogs", log.id, log);
  }

  // --- CATEGORY TEMPLATES (platform) ---
  getCategoryTemplates(activeOnly = false): CategoryTemplate[] {
    const list = this.data.categoryTemplates || DEFAULT_CATEGORY_TEMPLATES;
    const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
    return activeOnly ? sorted.filter((t) => t.isActive) : sorted;
  }

  createCategoryTemplate(t: Omit<CategoryTemplate, "id">): CategoryTemplate {
    if (!this.data.categoryTemplates) this.data.categoryTemplates = [];
    const template: CategoryTemplate = {
      ...t,
      id: "ct-" + Math.random().toString(36).substr(2, 9),
    };
    this.data.categoryTemplates.push(template);
    this.save();
    return template;
  }

  updateCategoryTemplate(id: string, updates: Partial<CategoryTemplate>): CategoryTemplate {
    if (!this.data.categoryTemplates) this.data.categoryTemplates = [...DEFAULT_CATEGORY_TEMPLATES];
    const idx = this.data.categoryTemplates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Category template not found");
    this.data.categoryTemplates[idx] = { ...this.data.categoryTemplates[idx], ...updates };
    this.save();
    return this.data.categoryTemplates[idx];
  }

  deleteCategoryTemplate(id: string): void {
    if (!this.data.categoryTemplates) return;
    this.data.categoryTemplates = this.data.categoryTemplates.filter((t) => t.id !== id);
    this.save();
  }
}

export const dbInstance = new Database();
