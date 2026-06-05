import React, { useState } from "react";
import { X, Sparkles, Wand2 } from "lucide-react";

interface OnboardingModalProps {
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

export default function OnboardingModal({ onClose, onSubmit }: OnboardingModalProps) {
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

  const autoGenerateSlugAndContent = () => {
    if (!form.name) return;
    const generatedSlug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-");

    const categoryText = 
      form.templateType === "hair-salon" ? "Hair Care & Styling" :
      form.templateType === "nail-salon" ? "Nail Styling & Artistry" :
      form.templateType === "tattoo-studio" ? "Accredited Body Ink" :
      form.templateType === "makeup-artist" ? "Artistry & Bridal Makeup" : "Specialist Training Coaching";

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
      alert("Tenant name and website subdomain slug handle are mandatory.");
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

  return (
    <div id="onboarding-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#121216] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col my-8">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#121216]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">Bootstrap New Tenancy Website</h3>
              <p className="text-xs text-slate-400">Onboard active franchises with dedicated subdomains</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[500px] space-y-4 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Business / Franchise Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Velvet Crop Scissors"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Business Category Template *</label>
              <select
                value={form.templateType}
                onChange={(e) => setForm({ ...form, templateType: e.target.value })}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-slate-200"
              >
                <option value="hair-salon">Hair Salon & Spa Care</option>
                <option value="nail-salon">Nail Lacquer Artistry</option>
                <option value="tattoo-studio">Tattoo & Body Ink Parlor</option>
                <option value="makeup-artist">Bridal Makeup Artist</option>
                <option value="generic-coaching">Personal Coaching Studio</option>
              </select>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">AI Auto-Generator Helper</span>
              <button
                type="button"
                onClick={autoGenerateSlugAndContent}
                disabled={!form.name}
                className={`flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg select-none ${
                  !form.name ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-Fill SEO & copy
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Onboarding requires subdomains & custom content. Type the name above, then hit the auto-fill to instantly generate SEO, hero copies, mock contacts, and URL identifiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Subdomain Identifier (slug) *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                  placeholder="velvet-scissors"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-24 py-2 text-white font-mono lowercase focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">.unibook.co</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Business Logo Emoji *</label>
              <select
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-slate-200"
              >
                <option value="💈">💈 Barber Barber Pole</option>
                <option value="✂️">✂️ Scissors Crop Shears</option>
                <option value="💅">💅 Nail Polish Lacquer</option>
                <option value="✨">✨ Sparkles Magic</option>
                <option value="💄">💄 Makeup Lipstick</option>
                <option value="🖋️">🖋️ Ink Tattoo needle</option>
                <option value="🧘">🧘 Coaching Zen yoga</option>
                <option value="🌱">🌱 Organic Botanicals</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Hero Heading Title Copy</label>
            <input
              type="text"
              value={form.heroHeading}
              onChange={(e) => setForm({ ...form, heroHeading: e.target.value })}
              placeholder="e.g. Velvet Crop Scissors"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Hero Subheading description</label>
            <textarea
              rows={2}
              value={form.heroSubheading}
              onChange={(e) => setForm({ ...form, heroSubheading: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
            ></textarea>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Merchant About Text</label>
            <textarea
              rows={3}
              value={form.aboutText}
              onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Contact Email Address</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="e.g. support@brandName.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Contact Phone Line</label>
              <input
                type="tel"
                pattern="[+0-9\s\-\(\)]*"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="e.g. +63 (917) 123-4567 or 0917-123-4567"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Physical Street Address Storefront</label>
            <input
              type="text"
              value={form.contactAddress}
              onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
              placeholder="e.g. Ground Floor, Building Main Street, Metro Manila, Philippines"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-white/5 bg-[#121216] flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded-xl text-slate-300 hover:bg-white/5 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-black text-white rounded-xl shadow-lg transition-all"
            >
              {loading ? "Booting Tenancy Workspace..." : "Initialize Tenant Live Website"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
