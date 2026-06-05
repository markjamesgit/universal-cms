import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbInstance } from "./server/db";
import { sendRealEmail } from "./server/email";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // --- API ROUTE SYSTEM ---

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

  app.post("/api/tenants", (req, res) => {
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

      const newTenant = dbInstance.createBusiness({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
        logo: req.body.logo || "🏢",
        templateType: templateType || "hair-salon",
        heroHeading: heroHeading || `Welcome to ${name}`,
        heroSubheading: heroSubheading || "The ultimate bespoke experience customized just for you.",
        aboutText: aboutText || `${name} provides master craftsmanship and focused service.`,
        contactEmail: contactEmail || `hello@${slug}.com`,
        contactPhone: contactPhone || "+1 (555) 000-0000",
        contactAddress: contactAddress || "101 Grand Avenue",
        theme: theme || { primaryPalette: "neutral", fontFamily: "sans", bannerStyle: "minimal", buttonStyle: "rounded" },
        seo: seo || { metaTitle: `${name} | Book Specialist Appointments`, metaDescription: `Schedule online services with ${name}.`, ogImage: "" }
      });

      // Log action
      dbInstance.addAuditLog("SaaS Onboarding Manager", "CREATE_TENANT", `Successfully onboarded and provisioned tenant ${newTenant.name} (${newTenant.slug})`);
      
      res.json(newTenant);
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
      const { businessId, name, category, description, price, duration, image, staffIds, isActive } = req.body;
      if (!businessId || !name || price === undefined || !duration) {
        return res.status(400).json({ error: "Missing required service parameters (businessId, name, price, duration)" });
      }
      const created = dbInstance.createService({
        businessId,
        name,
        category,
        description,
        price: Number(price),
        duration: Number(duration),
        image: image || "",
        staffIds: staffIds || [],
        isActive: isActive !== undefined ? !!isActive : true
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

  app.post("/api/bookings", (req, res) => {
    try {
      const { businessId, serviceId, staffId, customerName, customerEmail, customerPhone, date, timeSlot, price, notes, paymentMethod, downpaymentPaid, gcashTxnRef } = req.body;
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

Thank you for your appointment request. We have received your query for ${service?.name || "Bespoke Treatment"} on ${date} at ${timeSlot} with ${staffMember?.name || "Specialist"}.

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

      // Dispatch real email via Nodemailer
      sendRealEmail(customerEmail, emailSubject, emailBody)
        .then(result => {
          if (result.success && result.previewUrl) {
            console.log(`[EMAIL] Delivery complete! Test Link: ${result.previewUrl}`);
            dbInstance.addAuditLog("Email System", "SEND_EMAIL", `Sent booking pending notice email to ${customerEmail}. Test Link: ${result.previewUrl}`);
          } else if (result.success) {
            console.log(`[EMAIL] Delivery complete to ${customerEmail}`);
            dbInstance.addAuditLog("Email System", "SEND_EMAIL", `Sent booking pending notice email to ${customerEmail}`);
          } else {
            console.error(`[EMAIL ERROR] SMTP delivery failed: ${result.error}`);
          }
        })
        .catch(err => console.error("[EMAIL ERROR] Background delivery crash: ", err));

      res.json({
        booking: created,
        notification: {
          sentTo: customerEmail,
          subject: emailSubject,
          body: emailBody,
          timestamp: new Date().toISOString()
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/bookings/:id/status", (req, res) => {
    try {
      const { status, cancellationRemarks } = req.body;
      if (!status) return res.status(400).json({ error: "Status must be pending, confirmed, or cancelled." });
      const updated = dbInstance.updateBookingStatus(req.params.id, status, cancellationRemarks);

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
        
        // Dispatch real email via Nodemailer
        sendRealEmail(updated.customerEmail, emailSubject, emailBody)
          .then(result => {
            if (result.success && result.previewUrl) {
              console.log(`[EMAIL CANCEL] Delivery complete! Test Link: ${result.previewUrl}`);
              dbInstance.addAuditLog("Email System", "SEND_EMAIL", `Sent appointment cancellation email to ${updated.customerEmail}. Reason: ${cancellationRemarks}. Test Link: ${result.previewUrl}`);
            } else if (result.success) {
              console.log(`[EMAIL CANCEL] Delivery complete to ${updated.customerEmail}`);
              dbInstance.addAuditLog("Email System", "SEND_EMAIL", `Sent appointment cancellation email to ${updated.customerEmail}. Reason: ${cancellationRemarks}`);
            } else {
              console.error(`[EMAIL CANCEL ERROR] SMTP delivery failed: ${result.error}`);
            }
          })
          .catch(err => console.error("[EMAIL CANCEL ERROR] Background delivery crash: ", err));
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

        const emailSubject = confirmationTemplate.subject
          .replace("{{customerName}}", updated.customerName)
          .replace("{{serviceName}}", service?.name || "Bespoke Treatment")
          .replace("{{bookingDate}}", updated.date)
          .replace("{{bookingTime}}", updated.timeSlot)
          .replace("{{staffName}}", staffMember?.name || "Specialist");

        let emailBody = confirmationTemplate.body
          .replace("{{customerName}}", updated.customerName)
          .replace("{{serviceName}}", service?.name || "Bespoke Treatment")
          .replace("{{bookingDate}}", updated.date)
          .replace("{{bookingTime}}", updated.timeSlot)
          .replace("{{staffName}}", staffMember?.name || "Specialist");

        emailBody += `\n\n---\nPayment Details:\n- Method selected: ${updated.paymentMethod === "gcash" ? "GCash" : "Cash on Premise"}\n- Amount secured: ₱${updated.downpaymentPaid || 0}\n${updated.gcashTxnRef ? `- GCash Ref: ${updated.gcashTxnRef}` : ""}`;

        console.log(`[EMAIL SYSTEM] Dispatching confirmation notification to ${updated.customerEmail}`);
        
        sendRealEmail(updated.customerEmail, emailSubject, emailBody)
          .then(result => {
            if (result.success && result.previewUrl) {
              dbInstance.addAuditLog("Email System", "SEND_EMAIL", `Sent booking confirmation email to ${updated.customerEmail}. Test Link: ${result.previewUrl}`);
            } else if (result.success) {
              dbInstance.addAuditLog("Email System", "SEND_EMAIL", `Sent booking confirmation email to ${updated.customerEmail}`);
            }
          })
          .catch(err => console.error("[EMAIL ERROR] Confirmation delivery error:", err));
      }

      res.json(updated);
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

  if (process.env.NODE_ENV !== "production") {
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Universal Booking Appointment CMS booted successfully on http://0.0.0.0:${PORT}`);
    console.log(`[CONFIG] Listening behind reverse proxy in port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start Full Stack Booking CMS server", err);
});
