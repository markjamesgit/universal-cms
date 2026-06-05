import React, { useState } from "react";
import { X, Sparkles, Wand2 } from "lucide-react";
import { getTenantPublicUrl } from "../../lib/tenantUrl";
import { CategoryTemplate } from "../../types";
import {
  EMAIL_PLACEHOLDER,
  PHONE_PLACEHOLDER,
  normalizePhoneInput,
  validateEmail,
  validatePhone,
} from "../../lib/contactFormats";

interface OnboardingModalProps {
  categoryTemplates?: CategoryTemplate[];
  onClose: () => void;
  onSubmit: (tenantData: {
    name: string;
    slug: string;
    logo: string;
    templateType: string;
    heroHeading: string;
    heroSubheading: string;
    aboutText: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
  }) => Promise<void>;
}

export default function OnboardingModal({ categoryTemplates = [], onClose, onSubmit }: OnboardingModalProps) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo: "💈",
    templateType: "hair-salon",
    heroHeading: "",
    heroSubheading: "",
    aboutText: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ contactEmail?: string; contactPhone?: string }>({});

  const autoGenerateSlugAndContent = () => {
    if (!form.name) return;
    const generatedSlug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-");

    const tpl = categoryTemplates.find((t) => t.slug === form.templateType);
    const categoryText = tpl?.label || "Specialist Services";

    setForm({
      ...form,
      slug: generatedSlug,
      heroHeading: `Premium ${form.name}`,
      heroSubheading: `Bespoke ${categoryText} customized precisely around you.`,
      aboutText: `At ${form.name}, we hold our craft with professional rigor, blending premium materials with experienced attention to detail.`,
      contactEmail: `contact@${generatedSlug}.com`,
      contactPhone: "+1 (555) 019-2831",
      contactAddress: "742 Evergreen Terrace, Springfield",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      alert("Tenant name and website slug are mandatory.");
      return;
    }
    const emailError = validateEmail(form.contactEmail);
    if (emailError) {
      setFieldErrors((prev) => ({ ...prev, contactEmail: emailError }));
      alert("Contact email is required. Merchants sign in with this exact address.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      alert("Failed onboarding: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = form.slug ? getTenantPublicUrl(form.slug) : null;

  return (
    <div id="onboarding-modal-overlay" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-xl ui-card overflow-hidden flex flex-col my-8">

        <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">Register New Business</h3>
              <p className="text-sm text-zinc-500">Onboard a new tenant website</p>
            </div>
          </div>
          <button onClick={onClose} className="ui-btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[500px] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="ui-label">Business Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Velvet Crop Scissors"
                className="ui-input"
              />
            </div>
            <div className="space-y-1">
              <label className="ui-label">Category Template *</label>
              <select
                value={form.templateType}
                onChange={(e) => setForm({ ...form, templateType: e.target.value })}
                className="ui-input"
              >
                {(categoryTemplates.filter((t) => t.isActive).length
                  ? categoryTemplates.filter((t) => t.isActive)
                  : [{ slug: "hair-salon", label: "Hair Salon", icon: "💈" } as CategoryTemplate]
                ).map((t) => (
                  <option key={t.slug} value={t.slug}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="ui-label">Auto-fill helper</span>
              <button
                type="button"
                onClick={autoGenerateSlugAndContent}
                disabled={!form.name}
                className={`ui-btn-primary text-xs ${!form.name ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-fill content
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              Type the business name, then auto-fill to generate slug, hero copy, contacts, and URL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="ui-label">Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                placeholder="velvet-scissors"
                className="ui-input lowercase"
              />
            </div>
            <div className="space-y-1">
              <label className="ui-label">Logo Emoji *</label>
              <select
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="ui-input"
              >
                <option value="💈">💈 Barber Pole</option>
                <option value="✂️">✂️ Scissors</option>
                <option value="💅">💅 Nail Polish</option>
                <option value="✨">✨ Sparkles</option>
                <option value="💄">💄 Makeup</option>
                <option value="🖋️">🖋️ Tattoo</option>
                <option value="🧘">🧘 Coaching</option>
                <option value="🌱">🌱 Botanicals</option>
              </select>
            </div>
          </div>

          {previewUrl && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="ui-label">Public URL</p>
              <p className="text-sm font-medium text-zinc-900 break-all mt-1">{previewUrl}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="ui-label">Hero Heading</label>
            <input
              type="text"
              value={form.heroHeading}
              onChange={(e) => setForm({ ...form, heroHeading: e.target.value })}
              placeholder="e.g. Velvet Crop Scissors"
              className="ui-input"
            />
          </div>

          <div className="space-y-1">
            <label className="ui-label">Hero Subheading</label>
            <textarea
              rows={2}
              value={form.heroSubheading}
              onChange={(e) => setForm({ ...form, heroSubheading: e.target.value })}
              className="ui-input"
            />
          </div>

          <div className="space-y-1">
            <label className="ui-label">About Text</label>
            <textarea
              rows={3}
              value={form.aboutText}
              onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
              className="ui-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="ui-label">Contact Email *</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => {
                  setForm({ ...form, contactEmail: e.target.value });
                  if (fieldErrors.contactEmail) {
                    setFieldErrors((prev) => ({ ...prev, contactEmail: validateEmail(e.target.value) || undefined }));
                  }
                }}
                onBlur={() =>
                  setFieldErrors((prev) => ({ ...prev, contactEmail: validateEmail(form.contactEmail) || undefined }))
                }
                placeholder={EMAIL_PLACEHOLDER}
                className={`ui-input ${fieldErrors.contactEmail ? "border-red-400" : ""}`}
              />
              {fieldErrors.contactEmail && <p className="ui-field-error">{fieldErrors.contactEmail}</p>}
              <p className="text-xs text-zinc-500 mt-1">
                Merchant login uses this email — use a real inbox the owner can access.
              </p>
            </div>
            <div className="space-y-1">
              <label className="ui-label">Contact Phone</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => {
                  const next = normalizePhoneInput(e.target.value);
                  setForm({ ...form, contactPhone: next });
                  if (fieldErrors.contactPhone) {
                    setFieldErrors((prev) => ({ ...prev, contactPhone: validatePhone(next, true) || undefined }));
                  }
                }}
                onBlur={() =>
                  setFieldErrors((prev) => ({ ...prev, contactPhone: validatePhone(form.contactPhone, true) || undefined }))
                }
                placeholder={PHONE_PLACEHOLDER}
                className={`ui-input ${fieldErrors.contactPhone ? "border-red-400" : ""}`}
              />
              {fieldErrors.contactPhone && <p className="ui-field-error">{fieldErrors.contactPhone}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="ui-label">Street Address</label>
            <input
              type="text"
              value={form.contactAddress}
              onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
              placeholder="e.g. Ground Floor, Main Street, Metro Manila"
              className="ui-input"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="ui-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="ui-btn-primary">
              {loading ? "Creating..." : "Create Tenant Website"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
