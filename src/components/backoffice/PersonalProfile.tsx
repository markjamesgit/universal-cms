import React, { useState, useEffect } from "react";
import { User, UserRole } from "../../types";
import { User as UserIcon, Mail, Phone, Shield, FileText, Camera, Check, Sparkles, Layout, Type, Sliders } from "lucide-react";

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

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
];

const BACKOFFICE_THEMES = [
  { id: "indigo", name: "Cosmic Indigo", color: "#6366f1" },
  { id: "emerald", name: "Royal Emerald", color: "#10b981" },
  { id: "rose", name: "Crimson Rose", color: "#ec4899" },
  { id: "violet", name: "Futuristic Violet", color: "#8b5cf6" },
  { id: "sky", name: "Cyber Sky", color: "#38bdf8" },
  { id: "amber", name: "Sunset Amber", color: "#f59e0b" }
];

const ADMIN_FONTS = [
  { id: "inter", name: "Inter Sans-Serif", cssClass: "font-choice-inter", desc: "Clean & legibly modern" },
  { id: "space-grotesk", name: "Space Grotesk", cssClass: "font-choice-space-grotesk", desc: "Bold, geeky cyber-tech style" },
  { id: "playfair", name: "Playfair Serif", cssClass: "font-choice-playfair", desc: "Luxury, high-end design" },
  { id: "jetbrains-mono", name: "JetBrains Monospace", cssClass: "font-choice-jetbrains-mono", desc: "Cyberpunk developer terminals" }
];

const ADMIN_SIZES = [
  { id: "small", name: "Compact Size", cssClass: "size-choice-small", label: "A-" },
  { id: "regular", name: "Standard Size", cssClass: "size-choice-regular", label: "A" },
  { id: "large", name: "Readable Size", cssClass: "size-choice-large", label: "A+" },
  { id: "xl", name: "High Contrast XL", cssClass: "size-choice-xl", label: "A++" }
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

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setBio(currentUser.bio || "");
      setPhoto(currentUser.photo || AVATAR_PRESETS[0]);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
      await onUpdateProfile({
        name,
        email,
        phone,
        bio,
        photo
      });
      triggerToast("Profile Updated!", "Your personal admin views reflect edits successfully.");
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading personal administrator profile metadata...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-text leading-relaxed">
      
      {/* LEFT ASPECT SIDE - PROFILE SUMMARY CARD */}
      <div className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-lg flex flex-col items-center justify-between space-y-6">
        <div className="text-center w-full space-y-4">
          <div className="relative w-28 h-28 mx-auto group">
            <img
              src={photo || undefined}
              alt={name}
              className="w-full h-full rounded-full object-cover border-4 border-white/10 ring-2 ring-indigo-500/20 shadow-xl"
            />
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{name || "Anonymous Admin"}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-lg font-mono border border-indigo-500/10">
              🛡️ {currentUser.role.replace("_", " ")}
            </span>
          </div>

          <p className="text-xs text-slate-400 italic max-w-xs mx-auto px-4">
            {bio ? `"${bio}"` : "Add a custom biography to personalize your admin profile views."}
          </p>
        </div>

        {/* ADMIN STATS ROLES DETAILS */}
        <div className="w-full border-t border-white/5 pt-4 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Authentication Code:</span>
            <span className="font-mono text-[10px] text-slate-300">ID-{currentUser.id}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Primary Email Contact:</span>
            <span className="font-mono text-[10px] text-white truncate max-w-[150px]">{email}</span>
          </div>
          {phone && (
            <div className="flex justify-between text-slate-400">
              <span>Secure Telephone:</span>
              <span className="font-mono text-[10px] text-slate-300">{phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT ASPECT SIDE - EDIT PROFILE FORM */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-lg space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-widest flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                Administrative Profile Customizer
              </span>
              <span className="text-[9px] bg-indigo-400/20 text-indigo-305 tracking-normal px-2 py-0.5 rounded uppercase font-bold font-sans">
                Real-Time Sandbox Sync
              </span>
            </h2>
            <p className="text-xs text-slate-450 mt-0.5">
              Edit name, email, avatar image, and customized fonts, scales, and colour spectrums across devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Full Administrator Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold font-sans">Private Telephone Line (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1 col-span-1">
              <label className="text-slate-400 font-semibold">Profile Photo Selector URL</label>
              <input
                type="url"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono"
              />
            </div>
          </div>

          {/* CHOOSE PRESET AVATAR PICTURES */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 font-bold block">Quick Presets Profile Avatars</span>
            <div className="flex flex-wrap gap-3">
              {AVATAR_PRESETS.map((presetImg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhoto(presetImg)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                    photo === presetImg ? "border-indigo-500 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={presetImg} alt={`Avatar Preset ${idx}`} className="w-full h-full object-cover" />
                  {photo === presetImg && (
                    <div className="absolute inset-0 bg-indigo-550/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* PERSONAL DECOR / TEXT DESCRIPTION */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold">Personal Description / Custom Bio Motto</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Master colorist specializing in healthy blonde transformations, running operations for 5 straight years!"
              className="w-full bg-[#121216] border border-white/10 rounded-xl p-3 text-white placeholder-slate-550 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
            ></textarea>
          </div>

          {/* BACKOFFICE THEME SETTING */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div>
              <span className="text-[11px] text-white font-bold block uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-400" />
                Backoffice Control Pane Theme Color
              </span>
              <span className="text-[10px] text-slate-450 block mt-0.5">
                Change the theme color of this admin backoffice dashboard itself (colors buttons, sidebar items, highlights).
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {BACKOFFICE_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setBackofficeColor(theme.id);
                    triggerToast(`Admin Theme Switched!`, `Pane theme updated to ${theme.name}`);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    backofficeColor === theme.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-[#121216] text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: theme.color }}
                  ></span>
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC FONT CHOICE SELECTOR */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div>
              <span className="text-[11px] text-white font-bold block uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-sky-400" />
                Workspace Base Typography Family
              </span>
              <span className="text-[10px] text-slate-450 block mt-0.5">
                Choose a font that represents your brand aesthetic across admin consoles, calendars, and guest rosters.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADMIN_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    setAdminFont(font.id);
                    triggerToast(`Font Updated!`, `Workspace typographic family is now ${font.name}`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${font.cssClass} ${
                    adminFont === font.id
                      ? "bg-indigo-950/20 border-indigo-550/50 text-white"
                      : "bg-[#121216] border-white/5 text-slate-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  <p className="text-xs font-bold text-white transition-colors">{font.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{font.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC BODY FONT SIZE SCALE SELECTOR */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div>
              <span className="text-[11px] text-white font-bold block uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Workspace Text Scaling & Contrast
              </span>
              <span className="text-[10px] text-slate-450 block mt-0.5">
                Adjust standard container bounds, inputs, text heights, and layouts for optimal visibility on tablet and mobile displays.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center font-sans">
              {ADMIN_SIZES.map((sizeOption) => (
                <button
                  key={sizeOption.id}
                  type="button"
                  onClick={() => {
                    setAdminFontSize(sizeOption.id);
                    triggerToast("Workspace Scaling Adjusted!", `Set administrative container elements size format to ${sizeOption.name}.`);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    adminFontSize === sizeOption.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-[#121216] text-slate-400 border-white/5 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="font-mono text-lg font-black tracking-tight">{sizeOption.label}</span>
                  <span className="text-[10px] font-medium block">{sizeOption.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all hover:scale-[1.01] cursor-pointer"
          >
            {saving ? "Saving customized profile parameters..." : "Confirm & Save Profile Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
