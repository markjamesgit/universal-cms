import React, { useState, useEffect } from "react";
import { User } from "../../types";
import { User as UserIcon, Check, Layout, Type, Sliders } from "lucide-react";
import { AVATAR_PRESETS, DEFAULT_AVATAR_URL } from "../../lib/avatarPresets";
import {
  EMAIL_PLACEHOLDER,
  PHONE_PLACEHOLDER,
  normalizePhoneInput,
  validateEmail,
  validatePhone,
} from "../../lib/contactFormats";

interface PersonalProfileProps {
  currentUser: User | null;
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
  backofficeColor: string;
  setBackofficeColor: (color: string) => void;
  triggerToast: (msg: string, sub?: string, type?: "success" | "info") => void;
  adminFont: string;
  setAdminFont: (font: string) => void;
  adminFontSize: string;
  setAdminFontSize: (size: string) => void;
}

const BACKOFFICE_THEMES = [
  { id: "indigo", name: "Indigo", color: "#6366f1" },
  { id: "emerald", name: "Emerald", color: "#10b981" },
  { id: "rose", name: "Rose", color: "#ec4899" },
  { id: "violet", name: "Violet", color: "#8b5cf6" },
  { id: "sky", name: "Sky", color: "#38bdf8" },
  { id: "amber", name: "Amber", color: "#f59e0b" }
];

const ADMIN_FONTS = [
  { id: "inter", name: "Inter Sans-Serif", cssClass: "font-choice-inter", desc: "Clean and modern" },
  { id: "space-grotesk", name: "Space Grotesk", cssClass: "font-choice-space-grotesk", desc: "Bold geometric style" },
  { id: "playfair", name: "Playfair Serif", cssClass: "font-choice-playfair", desc: "Elegant editorial" },
  { id: "jetbrains-mono", name: "JetBrains Mono", cssClass: "font-choice-jetbrains-mono", desc: "Monospace developer" }
];

const ADMIN_SIZES = [
  { id: "small", name: "Compact", cssClass: "size-choice-small", label: "A-" },
  { id: "regular", name: "Standard", cssClass: "size-choice-regular", label: "A" },
  { id: "large", name: "Large", cssClass: "size-choice-large", label: "A+" },
  { id: "xl", name: "Extra Large", cssClass: "size-choice-xl", label: "A++" }
];

export default function PersonalProfile({
  currentUser,
  onUpdateProfile,
  backofficeColor,
  setBackofficeColor,
  triggerToast,
  adminFont,
  setAdminFont,
  adminFontSize,
  setAdminFontSize
}: PersonalProfileProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string }>({});

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setBio(currentUser.bio || "");
      setPhoto(currentUser.photo || DEFAULT_AVATAR_URL);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    setFieldErrors({ email: emailError || undefined, phone: phoneError || undefined });
    if (emailError || phoneError) return;

    setSaving(true);
    try {
      await onUpdateProfile({ name, email, phone, bio, photo });
      triggerToast("Profile Updated!", "Your personal admin views reflect edits successfully.");
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-text items-start">
      <div className="ui-card-pad self-start flex flex-col items-center space-y-4 w-full">
        <div className="text-center w-full space-y-3">
          <div className="w-24 h-24 mx-auto">
            <img
              src={photo || DEFAULT_AVATAR_URL}
              alt={name}
              className="w-full h-full rounded-full object-cover border-4 border-zinc-200"
            />
          </div>
          <div>
            <h3 className="ui-heading">{name || "Anonymous Admin"}</h3>
            <span className="ui-badge mt-2">
              {currentUser.role.replace("_", " ")}
            </span>
          </div>
          {bio && (
            <p className="text-sm text-zinc-500 italic max-w-xs mx-auto px-2 line-clamp-3">
              "{bio}"
            </p>
          )}
        </div>
        <div className="w-full border-t border-zinc-200 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>User ID</span>
            <span className="text-xs text-zinc-600">ID-{currentUser.id}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Email</span>
            <span className="text-xs text-zinc-900 truncate max-w-[150px]">{email}</span>
          </div>
          {phone && (
            <div className="flex justify-between text-zinc-500">
              <span>Phone</span>
              <span className="text-xs text-zinc-600">{phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="ui-card-pad space-y-6">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="ui-heading flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-zinc-600" />
              Profile Settings
            </h2>
            <p className="ui-subtext mt-1">
              Edit name, email, avatar, fonts, and display preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="ui-label">Full Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="ui-input" />
            </div>
            <div className="space-y-1">
              <label className="ui-label">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) || undefined }));
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) || undefined }))}
                placeholder={EMAIL_PLACEHOLDER}
                className={`ui-input ${fieldErrors.email ? "border-red-400" : ""}`}
              />
              {fieldErrors.email && <p className="ui-field-error">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="ui-label">Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const next = normalizePhoneInput(e.target.value);
                  setPhone(next);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: validatePhone(next) || undefined }));
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, phone: validatePhone(phone) || undefined }))}
                placeholder={PHONE_PLACEHOLDER}
                className={`ui-input ${fieldErrors.phone ? "border-red-400" : ""}`}
              />
              {fieldErrors.phone && <p className="ui-field-error">{fieldErrors.phone}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="ui-label">Custom avatar URL (optional)</label>
              <input type="url" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://..." className="ui-input" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="ui-label">Avatar presets</span>
            <p className="ui-field-hint -mt-1 mb-2">Abstract icons — not photos of real people.</p>
            <div className="flex flex-wrap gap-3">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.label}
                  onClick={() => setPhoto(preset.url)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                    photo === preset.url ? "border-zinc-900 ring-2 ring-zinc-300 scale-105" : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  {photo === preset.url && (
                    <div className="absolute inset-0 bg-zinc-900/25 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="ui-label">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Master colorist specializing in healthy blonde transformations."
              className="ui-input"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-200">
            <div>
              <span className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-zinc-500" />
                Theme Color
              </span>
              <span className="ui-subtext block mt-0.5">
                Change the accent color of buttons, sidebar items, and highlights.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BACKOFFICE_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setBackofficeColor(theme.id);
                    triggerToast("Theme Switched", `Updated to ${theme.name}`);
                  }}
                  className={`ui-btn text-xs ${backofficeColor === theme.id ? "ring-2 ring-offset-1 border-zinc-400" : ""}`}
                  style={backofficeColor === theme.id ? { boxShadow: `0 0 0 2px ${theme.color}` } : undefined}
                >
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: theme.color }} />
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-200">
            <div>
              <span className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-500" />
                Typography
              </span>
              <span className="ui-subtext block mt-0.5">
                Choose a font for admin consoles, calendars, and rosters.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADMIN_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    setAdminFont(font.id);
                    triggerToast("Font Updated", `Now using ${font.name}`);
                  }}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${font.cssClass} ${
                    adminFont === font.id
                      ? "bg-zinc-100 border-zinc-400"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900">{font.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{font.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-200">
            <div>
              <span className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                Text Size
              </span>
              <span className="ui-subtext block mt-0.5">
                Adjust text size for better visibility on tablet and mobile.
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              {ADMIN_SIZES.map((sizeOption) => (
                <button
                  key={sizeOption.id}
                  type="button"
                  onClick={() => {
                    setAdminFontSize(sizeOption.id);
                    triggerToast("Size Adjusted", `Set to ${sizeOption.name}.`);
                  }}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    adminFontSize === sizeOption.id
                      ? "bg-zinc-100 border-zinc-400 text-zinc-900"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-lg font-semibold">{sizeOption.label}</span>
                  <span className="text-xs">{sizeOption.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="ui-btn-primary w-full">
            {saving ? "Saving..." : "Save Profile Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
