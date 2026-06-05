import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbInstance, dbReady } from "./server/db";
import { sendRealEmail, logSmtpStatus, sendMerchantWelcomeEmail, loadEnv } from "./server/email";
import { buildMerchantLoginUrl, buildTenantSiteUrl } from "./server/urls";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

let cachedApp: express.Express | null = null;

async function buildApp(): Promise<express.Express> {
  logSmtpStatus();
  loadEnv();
  await dbReady;
  const superAdminConfigured = Boolean(process.env.SUPER_ADMIN_EMAIL?.trim());
  console.log(`[AUTH] Super admin email configured: ${superAdminConfigured ? "yes" : "no (set SUPER_ADMIN_EMAIL in .env)"}`);

  const app = express();
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

  if (!isProd && !fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Middleware for body parsing (large limit for base64 image uploads)
  app.use(express.json({ limit: "12mb" }));
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- API ROUTE SYSTEM ---

  app.post("/api/auth/login", async (req, res) => {
    try {
      loadEnv();
      const email = String(req.body.email || "").trim().toLowerCase();
      const intent = req.body.intent === "admin" ? "admin" : "merchant";

      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      const configuredSuperAdmin = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
      const superAdminUser = dbInstance.getUsers().find(
        (u) => u.email.trim().toLowerCase() === email && u.role === "SUPER_ADMIN"
      );

      // CRITICAL: Only allow super admin login if EXPLICITLY registered as SUPER_ADMIN role
      // Do NOT allow merchant users to access admin by just matching SUPER_ADMIN_EMAIL
      if (superAdminUser) {
        const businesses = dbInstance.getBusinesses();
        return res.json({
          role: "SUPER_ADMIN",
          business: businesses[0] || null,
          user: superAdminUser,
        });
      }

      // Allow configured super admin EMAIL only if they haven't been registered as merchant yet
      const user = dbInstance.getUserByEmail(email);
      if (configuredSuperAdmin && email === configuredSuperAdmin && (!user || user.role === "SUPER_ADMIN")) {
        const businesses = dbInstance.getBusinesses();
        return res.json({
          role: "SUPER_ADMIN",
          business: businesses[0] || null,
          user: user || null,
        });
      }

      if (intent === "admin") {
        return res.status(401).json({
          error: "This email is not authorized as platform admin. Contact the platform owner if you need access.",
        });
      }

      const business = dbInstance.getBusinessByContactEmail(email);
      if (business) {
        const user = dbInstance.getUserByEmail(email) || await dbInstance.ensureMerchantUser(business);
        return res.json({
          role: "BUSINESS_ADMIN",
          business,
          user,
        });
      }

      const user = dbInstance.getUserByEmail(email);
      if (user?.businessId) {
        const linkedBusiness = dbInstance.getBusinessById(user.businessId);
        if (linkedBusiness) {
          return res.json({
            role: user.role,
            business: linkedBusiness,
            user,
          });
        }
      }

      return res.status(401).json({
        error:
          "No business is registered with this contact email. Use the exact email from your welcome email (not your personal Gmail unless that was set as the business contact).",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Users
  app.get("/api/users", (req, res) => {
    try {
      res.json(dbInstance.getUsers());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    try {
      const updated = dbInstance.updateUser(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tenants
  app.get("/api/tenants", (req, res) => {
    try {
      res.json(dbInstance.getBusinesses());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tenants/:slug", (req, res) => {
    try {
      const tenant = dbInstance.getBusinessBySlug(req.params.slug);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });
      res.json(tenant);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const { name, slug, templateType, heroHeading, heroSubheading, aboutText, contactEmail, contactPhone, contactAddress, theme, seo } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ error: "Business Name and Subdomain identifier are required." });
      }

      // Check double names/slugs
      const existing = dbInstance.getBusinessBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: "This subdomain handle is already taken by another merchant." });
      }

      const normalizedContactEmail = String(contactEmail || "").trim().toLowerCase();
      if (!normalizedContactEmail) {
        return res.status(400).json({ error: "Contact email is required — merchants log in with this exact address." });
      }

      const newTenant = await dbInstance.createBusiness({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
        logo: req.body.logo || "🏢",
        templateType: templateType || "hair-salon",
        heroHeading: heroHeading || `Welcome to ${name}`,
        heroSubheading: heroSubheading || "The ultimate bespoke experience customized just for you.",
        aboutText: aboutText || `${name} provides master craftsmanship and focused service.`,
        contactEmail: normalizedContactEmail,
        contactPhone: contactPhone || "+1 (555) 000-0000",
        contactAddress: contactAddress || "101 Grand Avenue",
        theme: theme || { primaryPalette: "neutral", fontFamily: "sans", bannerStyle: "minimal", buttonStyle: "rounded" },
        seo: seo || { metaTitle: `${name} | Book Specialist Appointments`, metaDescription: `Schedule online services with ${name}.`, ogImage: "" }
      });

      const merchantUser = await dbInstance.ensureMerchantUser(newTenant);

      dbInstance.addAuditLog("SaaS Onboarding Manager", "CREATE_TENANT", `Successfully onboarded and provisioned tenant ${newTenant.name} (${newTenant.slug}) for ${newTenant.contactEmail}`);

      const merchantEmail = newTenant.contactEmail.trim();
      const siteUrl = buildTenantSiteUrl(newTenant.slug);
      const loginUrl = buildMerchantLoginUrl(merchantEmail);

      let welcomeEmail = null;
      if (merchantEmail) {
        const emailResult = await sendMerchantWelcomeEmail({
          to: merchantEmail,
          businessName: newTenant.name,
          siteUrl,
          loginUrl,
        });
        welcomeEmail = {
          sentTo: merchantEmail,
          success: emailResult.success,
          isTestMode: emailResult.isTestMode ?? false,
          previewUrl: emailResult.previewUrl || null,
          error: emailResult.error || null,
        };
        if (emailResult.success) {
          dbInstance.addAuditLog(
            "Email System",
            "SEND_EMAIL",
            emailResult.isTestMode
              ? `Sent merchant welcome email to ${merchantEmail}. Preview: ${emailResult.previewUrl}`
              : `Sent merchant welcome email to ${merchantEmail}`
          );
        }
      }

      res.json({ ...newTenant, merchantUser, welcomeEmail });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/tenants/:id", (req, res) => {
    try {
      const updated = dbInstance.updateBusiness(req.params.id, req.body);
      dbInstance.addAuditLog("CMS Website Builder", "UPDATE_CMS_THEME", `Updated CMS presentation, layout and details for ${updated.name}`);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Category templates (super admin)
  app.get("/api/category-templates", (req, res) => {
    try {
      const activeOnly = req.query.active === "1";
      res.json(dbInstance.getCategoryTemplates(activeOnly));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/category-templates", (req, res) => {
    try {
      const { slug, label, icon, description, defaultCategories, defaultHeroImage, isActive, sortOrder } = req.body;
      if (!slug || !label) {
        return res.status(400).json({ error: "Slug and label are required." });
      }
      const created = dbInstance.createCategoryTemplate({
        slug: String(slug).toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
        label,
        icon: icon || "🏢",
        description: description || "",
        defaultCategories: Array.isArray(defaultCategories) ? defaultCategories : ["General"],
        defaultHeroImage: defaultHeroImage || "",
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 99,
      });
      dbInstance.addAuditLog("Super Admin", "CREATE_CATEGORY_TEMPLATE", `Added category template "${created.label}" (${created.slug})`);
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/category-templates/:id", (req, res) => {
    try {
      const updated = dbInstance.updateCategoryTemplate(req.params.id, req.body);
      dbInstance.addAuditLog("Super Admin", "UPDATE_CATEGORY_TEMPLATE", `Updated category template "${updated.label}"`);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/category-templates/:id", (req, res) => {
    try {
      dbInstance.deleteCategoryTemplate(req.params.id);
      dbInstance.addAuditLog("Super Admin", "DELETE_CATEGORY_TEMPLATE", `Removed category template ${req.params.id}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Image uploads (base64 → filesystem)
  app.post("/api/upload", (req, res) => {
    try {
      const { businessId, folder, filename, dataUrl } = req.body;
      if (!businessId || !dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "businessId and dataUrl are required." });
      }
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid image data. Use JPEG, PNG, WebP, or GIF." });
      }
      const mime = match[1];
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/gif" ? "gif" : "jpg";
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "Image exceeds 5 MB limit." });
      }
      const safeFolder = String(folder || "cms").replace(/[^a-z0-9-_]/gi, "");
      const dir = path.join(UPLOADS_DIR, String(businessId), safeFolder);
      fs.mkdirSync(dir, { recursive: true });
      const baseName = String(filename || "image")
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-z0-9-_]/gi, "-")
        .slice(0, 40) || "image";
      const filePath = path.join(dir, `${baseName}-${Date.now()}.${ext}`);
      fs.writeFileSync(filePath, buffer);
      const relative = path.relative(UPLOADS_DIR, filePath).split(path.sep).join("/");
      res.json({ url: `/uploads/${relative}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Services
  app.get("/api/services", (req, res) => {
    try {
      const { businessId } = req.query;
      res.json(dbInstance.getServices(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/services", (req, res) => {
    try {
      const { businessId, name, category, description, price, duration, image, staffIds, isActive, variants } = req.body;
      if (!businessId || !name) {
        return res.status(400).json({ error: "Missing required service parameters (businessId, name)" });
      }
      const variantList = Array.isArray(variants) ? variants : [];
      const hasVariants = variantList.length > 0;
      if (!hasVariants && (price === undefined || duration === undefined)) {
        return res.status(400).json({ error: "Price and duration are required when no pricing packages are defined." });
      }
      const resolvedPrice = hasVariants
        ? Math.min(...variantList.map((v: { price: number }) => Number(v.price)))
        : Number(price);
      const resolvedDuration = hasVariants
        ? Number(variantList[0].duration)
        : Number(duration);
      const created = dbInstance.createService({
        businessId,
        name,
        category,
        description,
        price: resolvedPrice,
        duration: resolvedDuration,
        image: image || "",
        staffIds: staffIds || [],
        isActive: isActive !== undefined ? !!isActive : true,
        variants: hasVariants ? variantList : undefined,
      });
      dbInstance.addAuditLog("Business Console", "CREATE_SERVICE", `Created service details for "${name}" ($${price})`);
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/services/:id", (req, res) => {
    try {
      const updated = dbInstance.updateService(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/services/:id", (req, res) => {
    try {
      dbInstance.deleteService(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Staff
  app.get("/api/staff", (req, res) => {
    try {
      const { businessId } = req.query;
      res.json(dbInstance.getStaff(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/staff", (req, res) => {
    try {
      const { businessId, name, photo, position, workingHours, isActive } = req.body;
      if (!businessId || !name || !position) {
        return res.status(400).json({ error: "Missing parameters (businessId, name, position)" });
      }
      const created = dbInstance.createStaff({
        businessId,
        name,
        photo: photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        position,
        workingHours: workingHours || { start: "09:00", end: "18:00" },
        isActive: isActive !== undefined ? !!isActive : true
      });
      dbInstance.addAuditLog("Business Console", "CREATE_STAFF", `Added staff specialist: ${name} (${position})`);
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/staff/:id", (req, res) => {
    try {
      const updated = dbInstance.updateStaff(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/staff/:id", (req, res) => {
    try {
      dbInstance.deleteStaff(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Customers (CRM)
  app.get("/api/customers", (req, res) => {
    try {
      const { businessId } = req.query;
      res.json(dbInstance.getCustomers(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/customers/:id", (req, res) => {
    try {
      const updated = dbInstance.updateCustomer(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Bookings
  app.get("/api/bookings", (req, res) => {
    try {
      const { businessId, customerEmail } = req.query;
      if (customerEmail) {
        const bookings = dbInstance.getBookings().filter(b => b.customerEmail.toLowerCase() === (customerEmail as string).trim().toLowerCase());
        return res.json(bookings);
      }
      res.json(dbInstance.getBookings(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const { businessId, serviceId, staffId, customerName, customerEmail, customerPhone, date, timeSlot, price, notes, paymentMethod, downpaymentPaid, gcashTxnRef, variantId, variantName } = req.body;
      if (!businessId || !serviceId || !customerName || !customerEmail || !date || !timeSlot) {
        return res.status(400).json({ error: "Missing core booking details." });
      }

      // Unified High-Precision Calendar Slot Conflict & Overlap Check
      const slotBookings = dbInstance.getBookings(businessId).filter(
        b => b.date === date && b.timeSlot === timeSlot && b.status !== "cancelled"
      );
      
      const staffList = dbInstance.getStaff(businessId).filter(st => st.available !== false);
      const service = dbInstance.getServices(businessId).find(s => s.id === serviceId);
      const eligibleStaff = staffList.filter(st => {
        return !service || service.staffIds.length === 0 || service.staffIds.includes(st.id);
      });

      if (staffId === "any") {
        if (slotBookings.length >= eligibleStaff.length) {
          return res.status(400).json({ error: "All eligible specialists are already reserved at this time slot. Please select another slot." });
        }
      } else {
        const isDirectlyBooked = slotBookings.some(b => b.staffId === staffId);
        if (isDirectlyBooked || slotBookings.length >= eligibleStaff.length) {
          return res.status(400).json({ error: "The selected professional is already reserved at this time slot. Please select another slot." });
        }
      }

      // Spam/Duplicate prevention check: Reject duplicate bookings only if the customer already has an active pending reservation for the EXACT same date, time slot, and specialist.
      const activePending = dbInstance.getBookings(businessId).filter(
        b => b.customerEmail.toLowerCase().trim() === customerEmail.toLowerCase().trim() &&
             b.date === date &&
             b.timeSlot === timeSlot &&
             b.status === "pending"
      );
      if (activePending.length > 0) {
        return res.status(400).json({
          error: "You already have a pending booking request for this exact date and time. Please wait for our confirmation."
        });
      }

      // Check for disabled/blocked slots
      const blockEntries = dbInstance.getBlockedSlots(businessId);
      const isBlocked = blockEntries.some(
        b => b.date === date && (!b.timeSlot || b.timeSlot === timeSlot)
      );
      if (isBlocked) {
        const matchedBlock = blockEntries.find(b => b.date === date && (!b.timeSlot || b.timeSlot === timeSlot));
        return res.status(400).json({ error: `Warning! This time slot on ${date} is blocked/disabled by management: "${matchedBlock?.remarks || "Emergency"}"` });
      }

      // Get or create customer profile
      const customer = dbInstance.getOrCreateCustomer(businessId, customerEmail, customerName, customerPhone || "");

      const serviceLabel = variantName
        ? `${service?.name || "Service"} — ${variantName}`
        : (service?.name || "Bespoke Treatment");

      const created = dbInstance.createBooking({
        businessId,
        serviceId,
        staffId: staffId || "any",
        customerId: customer.id,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        date,
        timeSlot,
        price: Number(price || 0),
        status: "pending",
        variantId: variantId || undefined,
        variantName: variantName || undefined,
        notes: notes || "",
        paymentMethod: paymentMethod || "cash",
        downpaymentPaid: downpaymentPaid ? Number(downpaymentPaid) : 0,
        gcashTxnRef: gcashTxnRef || ""
      });

      // DISPATCH PENDING APPROVAL SIMULATED EMAIL NOTIFICATION
      const business = dbInstance.getBusinessById(businessId);
      const staffMember = dbInstance.getStaff(businessId).find(st => st.id === staffId);

      const emailSubject = `⏰ Appointment Request Pending: ${business?.name || "Unibook"}`;
      const emailBody = `Dear ${customerName},

Thank you for your appointment request. We have received your query for ${serviceLabel} on ${date} at ${timeSlot} with ${staffMember?.name || "Specialist"}.

Please note that your booking is currently PENDING administrator verification. We will send you a follow-up CONFIRMATION email once the reservation has been approved and accepted by management!

Payment Details:
- Mode of Payment Chosen: ${paymentMethod === "gcash" ? "GCash (E-Wallet)" : "Cash on Premise"}
- Downpayment Secured: ₱${downpaymentPaid || 0}
${paymentMethod === "gcash" ? `- GCash Transaction Reference Code: ${gcashTxnRef}` : ""}

Warm regards,
${business?.name || "Management"} Team`;

      console.log(`[EMAIL SYSTEM] Dispatching pending notification to ${customerEmail}`);
      console.log(`[EMAIL SUBJECT]: ${emailSubject}`);
      console.log(`[EMAIL BODY]:\n${emailBody}\n---`);

      const emailResult = await sendRealEmail(customerEmail, emailSubject, emailBody);
      if (emailResult.success) {
        dbInstance.addAuditLog(
          "Email System",
          "SEND_EMAIL",
          emailResult.isTestMode
            ? `Sent test booking notice to ${customerEmail}. Preview: ${emailResult.previewUrl}`
            : `Sent booking pending notice email to ${customerEmail}`
        );
      } else {
        console.error(`[EMAIL ERROR] SMTP delivery failed: ${emailResult.error}`);
      }

      res.json({
        booking: created,
        notification: {
          sentTo: customerEmail,
          subject: emailSubject,
          body: emailBody,
          timestamp: new Date().toISOString(),
          success: emailResult.success,
          isTestMode: emailResult.isTestMode ?? false,
          previewUrl: emailResult.previewUrl || null,
          error: emailResult.error || null
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/bookings/:id/status", async (req, res) => {
    try {
      const { status, cancellationRemarks } = req.body;
      if (!status) return res.status(400).json({ error: "Status must be pending, confirmed, or cancelled." });
      const updated = dbInstance.updateBookingStatus(req.params.id, status, cancellationRemarks);
      let emailNotification: {
        sentTo: string;
        subject: string;
        success: boolean;
        isTestMode: boolean;
        previewUrl?: string;
        error?: string;
      } | null = null;

      if (status === "cancelled") {
        // Send email too as requested: "if the admin cancel the appointment it has a remarks and reflect it on the customer and send via email too"
        const business = dbInstance.getBusinessById(updated.businessId);
        const service = dbInstance.getServices(updated.businessId).find(s => s.id === updated.serviceId);
        
        const emailSubject = `⚠️ APPOINTMENT CANCELLED: Your booking at ${business?.name || "Unibook"}`;
        const emailBody = `Dear ${updated.customerName},

We regret to inform you that your upcoming appointment for ${service?.name || "Bespoke Treatment"} on ${updated.date} at ${updated.timeSlot} has been cancelled by the administrator.

Reason for Cancellation: 
"${cancellationRemarks || "Emergency / Schedule conflict."}"

If you've already made your ₱300 downpayment via GCash, our team will process your refund shortly. You can book an alternative slot on our webpage.

Warm regards,
${business?.name || "Management"} Team`;

        console.log(`[EMAIL CANCEL SYSTEM] Dispatching cancellation notification to ${updated.customerEmail}`);
        console.log(`[EMAIL SUBJECT]: ${emailSubject}`);
        console.log(`[EMAIL BODY]:\n${emailBody}\n---`);
        
        const emailResult = await sendRealEmail(updated.customerEmail, emailSubject, emailBody);
        emailNotification = {
          sentTo: updated.customerEmail,
          subject: emailSubject,
          success: emailResult.success,
          isTestMode: emailResult.isTestMode ?? false,
          previewUrl: emailResult.previewUrl,
          error: emailResult.error
        };
        if (emailResult.success) {
          dbInstance.addAuditLog(
            "Email System",
            "SEND_EMAIL",
            emailResult.isTestMode
              ? `Sent test cancellation email to ${updated.customerEmail}. Preview: ${emailResult.previewUrl}`
              : `Sent appointment cancellation email to ${updated.customerEmail}. Reason: ${cancellationRemarks}`
          );
        } else {
          console.error(`[EMAIL CANCEL ERROR] SMTP delivery failed: ${emailResult.error}`);
        }
      }

      if (status === "confirmed") {
        // Dispatch the official template-based confirmation email now that the admin has accepted/approved!
        const business = dbInstance.getBusinessById(updated.businessId);
        const service = dbInstance.getServices(updated.businessId).find(s => s.id === updated.serviceId);
        const staffMember = dbInstance.getStaff(updated.businessId).find(st => st.id === updated.staffId);
        const templates = dbInstance.getEmailTemplates(updated.businessId);
        const confirmationTemplate = templates.find(t => t.key === "booking_confirmation") || {
          subject: `Your Booking at ${business?.name || "Unibook"} is Confirmed!`,
          body: `Hi {{customerName}},\n\nYour appointment for {{serviceName}} is confirmed for {{bookingDate}} at {{bookingTime}} with {{staffName}}.\n\nWe look forward to seeing you!\n\nBest regards,\n${business?.name || "Management"} Team`
        };

        const replaceAll = (text: string, search: string, replacement: string) =>
          text.split(search).join(replacement);

        const emailSubject = replaceAll(confirmationTemplate.subject, "{{customerName}}", updated.customerName)
          .replaceAll("{{serviceName}}", service?.name || "Bespoke Treatment")
          .replaceAll("{{bookingDate}}", updated.date)
          .replaceAll("{{bookingTime}}", updated.timeSlot)
          .replaceAll("{{staffName}}", staffMember?.name || "Specialist");

        let emailBody = replaceAll(confirmationTemplate.body, "{{customerName}}", updated.customerName)
          .replaceAll("{{serviceName}}", service?.name || "Bespoke Treatment")
          .replaceAll("{{bookingDate}}", updated.date)
          .replaceAll("{{bookingTime}}", updated.timeSlot)
          .replaceAll("{{staffName}}", staffMember?.name || "Specialist");

        emailBody += `\n\n---\nPayment Details:\n- Method selected: ${updated.paymentMethod === "gcash" ? "GCash" : "Cash on Premise"}\n- Amount secured: ₱${updated.downpaymentPaid || 0}\n${updated.gcashTxnRef ? `- GCash Ref: ${updated.gcashTxnRef}` : ""}`;

        console.log(`[EMAIL SYSTEM] Dispatching confirmation notification to ${updated.customerEmail}`);

        const emailResult = await sendRealEmail(updated.customerEmail, emailSubject, emailBody);
        emailNotification = {
          sentTo: updated.customerEmail,
          subject: emailSubject,
          success: emailResult.success,
          isTestMode: emailResult.isTestMode ?? false,
          previewUrl: emailResult.previewUrl,
          error: emailResult.error
        };
        if (emailResult.success) {
          dbInstance.addAuditLog(
            "Email System",
            "SEND_EMAIL",
            emailResult.isTestMode
              ? `Sent test confirmation email to ${updated.customerEmail}. Preview: ${emailResult.previewUrl}`
              : `Sent booking confirmation email to ${updated.customerEmail}`
          );
        } else {
          console.error("[EMAIL ERROR] Confirmation delivery error:", emailResult.error);
        }
      }

      res.json({ ...updated, emailNotification });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Blocked Slots management endpoints
  app.get("/api/blocked-slots", (req, res) => {
    try {
      const { businessId } = req.query;
      res.json(dbInstance.getBlockedSlots(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blocked-slots", (req, res) => {
    try {
      const { businessId, date, timeSlot, remarks } = req.body;
      if (!businessId || !date || !remarks) {
        return res.status(400).json({ error: "Missing required parameters (businessId, date, remarks)" });
      }
      const created = dbInstance.createBlockedSlot({ businessId, date, timeSlot, remarks });
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/blocked-slots/:id", (req, res) => {
    try {
      dbInstance.deleteBlockedSlot(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Reviews
  app.get("/api/reviews", (req, res) => {
    try {
      const { businessId, approvedOnly } = req.query;
      res.json(dbInstance.getReviews(businessId as string, approvedOnly === "true"));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/reviews", (req, res) => {
    try {
      const { businessId, customerName, serviceName, rating, comment } = req.body;
      if (!businessId || !customerName || !rating) {
        return res.status(400).json({ error: "Missing reviews parameters." });
      }
      const created = dbInstance.createReview({
        businessId,
        customerName,
        serviceName: serviceName || "General Service",
        rating: Number(rating),
        comment: comment || ""
      });
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/reviews/:id/approve", (req, res) => {
    try {
      const { approved } = req.body;
      const updated = dbInstance.updateReviewStatus(req.params.id, !!approved);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Blogs CMS
  app.get("/api/blogs", (req, res) => {
    try {
      const { businessId } = req.query;
      res.json(dbInstance.getBlogs(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blogs", (req, res) => {
    try {
      const { businessId, title, excerpt, content, image, category, author } = req.body;
      if (!businessId || !title || !content) {
        return res.status(400).json({ error: "Title and body content are required." });
      }
      const created = dbInstance.createBlog({
        businessId,
        title,
        excerpt: excerpt || title.substring(0, 100),
        content,
        image: image || "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400",
        category: category || "General",
        author: author || "Owner"
      });
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/blogs/:id", (req, res) => {
    try {
      dbInstance.deleteBlog(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // FAQs CMS
  app.get("/api/faqs", (req, res) => {
    try {
      const { businessId } = req.query;
      res.json(dbInstance.getFAQs(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/faqs", (req, res) => {
    try {
      const { businessId, question, answer } = req.body;
      if (!businessId || !question || !answer) {
        return res.status(400).json({ error: "FAQ Question and Answer are required." });
      }
      const created = dbInstance.createFAQ({ businessId, question, answer });
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/faqs/:id", (req, res) => {
    try {
      dbInstance.deleteFAQ(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Email Templates CMS
  app.get("/api/email-templates", (req, res) => {
    try {
      const { businessId } = req.query;
      if (!businessId) return res.status(400).json({ error: "businessId parameter required" });
      res.json(dbInstance.getEmailTemplates(businessId as string));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/email-templates", (req, res) => {
    try {
      const { businessId, key, subject, body } = req.body;
      if (!businessId || !key || !subject || !body) {
        return res.status(400).json({ error: "Missing template save details" });
      }
      const updated = dbInstance.updateEmailTemplate(businessId, key, { subject, body });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Audit view
  app.get("/api/audit-logs", (req, res) => {
    try {
      res.json(dbInstance.getAuditLogs());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- VITE AND FRONTEND ROUTING ---

  if (!isProd) {
    console.log("Configuring Vite Dev Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static bundle in production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  return app;
}

async function getApp(): Promise<express.Express> {
  if (!cachedApp) {
    cachedApp = await buildApp();
  }
  return cachedApp;
}

// Vercel serverless handler
export default async function handler(req: express.Request, res: express.Response) {
  const app = await getApp();
  return app(req, res);
}

// Local development server
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  getApp()
    .then((app) => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`[SYSTEM] Universal Booking Appointment CMS booted on http://0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start Full Stack Booking CMS server", err);
      process.exit(1);
    });
}
