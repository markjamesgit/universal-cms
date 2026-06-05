import React, { useState, useEffect } from "react";
import { Trash2, Globe, Sparkles, PlusCircle, HelpCircle, BookOpen, Settings2 } from "lucide-react";
import { BusinessTenant, FAQItem, BlogPost, ThemePalette, ThemeFont } from "../../types";

interface CmsCustomizerProps {
  activeBusiness: BusinessTenant;
  faqs: FAQItem[];
  blogs: BlogPost[];
  handleUpdateCmsSettings: (updatedData: Partial<BusinessTenant>) => Promise<void>;
  handleCreateFAQ: (faqData: { question: string; answer: string }) => Promise<void>;
  handleDeleteFAQ: (id: string) => Promise<void>;
  handleCreateBlog: (blogData: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    author: string;
    image: string;
  }) => Promise<void>;
  handleDeleteBlog: (id: string) => Promise<void>;
  setCmsPreviewOpen: (open: boolean) => void;
}

type CmsTab = "styling" | "faqs" | "blogs";

export default function CmsCustomizer({
  activeBusiness,
  faqs,
  blogs,
  handleUpdateCmsSettings,
  handleCreateFAQ,
  handleDeleteFAQ,
  handleCreateBlog,
  handleDeleteBlog,
  setCmsPreviewOpen,
}: CmsCustomizerProps) {
  const [activeCmsTab, setActiveCmsTab] = useState<CmsTab>("styling");

  // Local state for the styling form to ensure instant responsiveness
  const [stylingForm, setStylingForm] = useState<Partial<BusinessTenant>>({});
  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [newFaqData, setNewFaqData] = useState({ question: "", answer: "" });
  const [blogFormOpen, setBlogFormOpen] = useState(false);
  const [newBlogData, setNewBlogData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Styling",
    author: "Founder",
    image: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync state if activeBusiness moves
  useEffect(() => {
    if (activeBusiness) {
      setStylingForm({
        name: activeBusiness.name,
        heroHeading: activeBusiness.heroHeading,
        heroSubheading: activeBusiness.heroSubheading,
        aboutText: activeBusiness.aboutText,
        contactEmail: activeBusiness.contactEmail,
        contactPhone: activeBusiness.contactPhone,
        contactAddress: activeBusiness.contactAddress,
        theme: { ...activeBusiness.theme },
        seo: { ...activeBusiness.seo },
      });
    }
  }, [activeBusiness]);

  const onUpdateCmsSettingsSubmit = async () => {
    setSavingSettings(true);
    try {
      await handleUpdateCmsSettings(stylingForm);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const onAddFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqData.question || !newFaqData.answer) return;
    try {
      await handleCreateFAQ(newFaqData);
      setNewFaqData({ question: "", answer: "" });
      setFaqFormOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const onAddBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogData.title || !newBlogData.content) return;
    try {
      await handleCreateBlog(newBlogData);
      setNewBlogData({
        title: "",
        excerpt: "",
        content: "",
        category: "Styling",
        author: "Founder",
        image: "",
      });
      setBlogFormOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
      
      {/* CMS Toolbar Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Website Builder & Content Management System
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Design your public landing website template. Customizing syncs style configurations instantly.
          </p>
        </div>
        <div className="flex gap-2 text-xs self-start md:self-center">
          <button
            onClick={onUpdateCmsSettingsSubmit}
            disabled={savingSettings}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {savingSettings ? "Saving Settings..." : "Save Brand Customization"}
          </button>
          <button
            onClick={() => setCmsPreviewOpen(true)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 transition-colors hover:bg-white/10"
          >
            Preview Site ↗
          </button>
        </div>
      </div>

      {/* Internal CMS Tab Selection Switch */}
      <div className="flex gap-2 border-b border-white/5 pb-2 text-xs text-slate-400">
        {(["styling", "faqs", "blogs"] as CmsTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveCmsTab(tab)}
            className={`px-4 py-1.5 rounded-xl font-semibold capitalize transition-all ${
              activeCmsTab === tab ? "bg-white/10 text-white font-bold" : "hover:text-white"
            }`}
          >
            {tab === "faqs" ? "FAQs Config" : tab === "blogs" ? "Article Publishing" : "Branding & Layout"}
          </button>
        ))}
      </div>

      {/* STYLE INTEGRATOR PANEL */}
      {activeCmsTab === "styling" && stylingForm.theme && stylingForm.seo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Aesthetic variables select options */}
          <div className="space-y-6">
            <div className="bg-white/[0.01] p-5 border border-white/5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-widest flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                Aesthetic Presets Styling
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Branding Primary Theme Palette *</label>
                  <select
                    value={stylingForm.theme.primaryPalette}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, primaryPalette: e.target.value as ThemePalette },
                      })
                    }
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="indigo">Cosmic Indigo Preset</option>
                    <option value="emerald">Organic Emerald Preset</option>
                    <option value="amber">Vintage Amber Preset</option>
                    <option value="rose">Soft Coral Rose Preset</option>
                    <option value="violet">Techno Violet Preset</option>
                    <option value="retro-slate">Cyber Sky Preset</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Branding Typography Pairing *</label>
                  <select
                    value={stylingForm.theme.fontFamily}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, fontFamily: e.target.value as ThemeFont },
                      })
                    }
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="sans">Sans-Serif (Modern - Plus Jakarta Sans)</option>
                    <option value="serif">Serif (Elegant - Editorial Merriweather)</option>
                    <option value="mono">Monospace (Cyberpunk Tech - JetBrains Mono)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Layout Banner Presentation Style *</label>
                  <select
                    value={stylingForm.theme.bannerStyle}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, bannerStyle: e.target.value as any },
                      })
                    }
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="split">Split Columns (Grid highlight right)</option>
                    <option value="overlay">Banner Overlay (Translucent card header)</option>
                    <option value="minimal">Minimalist (Clean center focus text)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Button Core Rounding style *</label>
                  <select
                    value={stylingForm.theme.buttonStyle}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, buttonStyle: e.target.value as any },
                      })
                    }
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="rounded">Smooth Round Corners</option>
                    <option value="pill">Max Pill Capsule</option>
                    <option value="square">Modern Brutalist Square Edge</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NEW GRANULAR USER OVERRIDES ELEMENT MODULE */}
            <div className="bg-white/[0.01] p-5 border border-white/5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-405" />
                Granular Branding Theme Overrides
              </h3>

              <div className="space-y-4 text-xs">
                {/* Brand Custom Fonts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Custom Google Font Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Space Grotesk, Outfit, Playfair Display"
                      value={stylingForm.theme.customFontGoogle || ""}
                      onChange={(e) =>
                        setStylingForm({
                          ...stylingForm,
                          theme: { ...stylingForm.theme!, customFontGoogle: e.target.value },
                        })
                      }
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Global Base Font Size Scale</label>
                    <select
                      value={stylingForm.theme.fontSizeSetting || "medium"}
                      onChange={(e) =>
                        setStylingForm({
                          ...stylingForm,
                          theme: { ...stylingForm.theme!, fontSizeSetting: e.target.value as any },
                        })
                      }
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2 text-white"
                    >
                      <option value="small">Compact (Cozy / Tiny Text)</option>
                      <option value="medium">Standard (Balanced Medium)</option>
                      <option value="large">Spacious (Editorial Large)</option>
                      <option value="extra-large">Boutique Giant (Display Core)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Color Overrides */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 block truncate">Main Page Background</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={stylingForm.theme.customBgColor || "#0e0f13"}
                        onChange={(e) =>
                          setStylingForm({
                            ...stylingForm,
                            theme: { ...stylingForm.theme!, customBgColor: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={stylingForm.theme.customBgColor || ""}
                        placeholder="#0e0f13"
                        onChange={(e) =>
                          setStylingForm({
                            ...stylingForm,
                            theme: { ...stylingForm.theme!, customBgColor: e.target.value },
                          })
                        }
                        className="w-full bg-[#121216] border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 block truncate">Text / Paragraph Color</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={stylingForm.theme.customTextColor || "#e2e8f0"}
                        onChange={(e) =>
                          setStylingForm({
                            ...stylingForm,
                            theme: { ...stylingForm.theme!, customTextColor: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={stylingForm.theme.customTextColor || ""}
                        placeholder="#e2e8f0"
                        onChange={(e) =>
                          setStylingForm({
                            ...stylingForm,
                            theme: { ...stylingForm.theme!, customTextColor: e.target.value },
                          })
                        }
                        className="w-full bg-[#121216] border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 block truncate">Accent / Highlight Glow</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={stylingForm.theme.customAccentColor || "#6366f1"}
                        onChange={(e) =>
                          setStylingForm({
                            ...stylingForm,
                            theme: { ...stylingForm.theme!, customAccentColor: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={stylingForm.theme.customAccentColor || ""}
                        placeholder="#6366f1"
                        onChange={(e) =>
                          setStylingForm({
                            ...stylingForm,
                            theme: { ...stylingForm.theme!, customAccentColor: e.target.value },
                          })
                        }
                        className="w-full bg-[#121216] border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStylingForm({
                        ...stylingForm,
                        theme: {
                          ...stylingForm.theme!,
                          customBgColor: undefined,
                          customTextColor: undefined,
                          customAccentColor: undefined,
                          customFontGoogle: undefined,
                          fontSizeSetting: "medium"
                        }
                      });
                    }}
                    className="text-[10px] text-rose-450 hover:text-rose-400 font-bold hover:underline"
                  >
                    Reset Overrides back to Palette Presets
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Texts and custom copy adjustment variables */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-405 uppercase font-mono tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              General copies & Marketing info
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Hero Title Heading *</label>
                <input
                  type="text"
                  required
                  value={stylingForm.heroHeading || ""}
                  onChange={(e) => setStylingForm({ ...stylingForm, heroHeading: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-550 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Hero Subheading description *</label>
                <textarea
                  required
                  rows={2}
                  value={stylingForm.heroSubheading || ""}
                  onChange={(e) => setStylingForm({ ...stylingForm, heroSubheading: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-550 focus:outline-none leading-relaxed"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Merchant Philosophy About text *</label>
                <textarea
                  required
                  rows={3}
                  value={stylingForm.aboutText || ""}
                  onChange={(e) => setStylingForm({ ...stylingForm, aboutText: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-550 focus:outline-none leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ MANAGER SUB PANEL */}
      {activeCmsTab === "faqs" && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center pb-2 border-b border-white/5 flex-wrap gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              FAQ Accordion Publisher
            </h3>
            <button
              onClick={() => setFaqFormOpen(!faqFormOpen)}
              className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs rounded-xl border border-indigo-500/10 transition-colors"
            >
              {faqFormOpen ? "Close panel" : "★ Enlist FAQ"}
            </button>
          </div>

          {faqFormOpen && (
            <form onSubmit={onAddFaqSubmit} className="bg-white/5 p-5 border border-white/10 rounded-xl max-w-lg space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300">Question Title:</label>
                <input
                  type="text"
                  required
                  value={newFaqData.question}
                  onChange={(e) => setNewFaqData({ ...newFaqData, question: e.target.value })}
                  placeholder="e.g. Do I need to book in advance?"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white placeholder-slate-550"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300">Answer message body:</label>
                <textarea
                  required
                  rows={3}
                  value={newFaqData.answer}
                  onChange={(e) => setNewFaqData({ ...newFaqData, answer: e.target.value })}
                  placeholder="e.g. Yes! We are strictly appointment-based..."
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-slate-550 leading-relaxed"
                ></textarea>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 transition-colors text-white rounded font-bold"
              >
                Save FAQ
              </button>
            </form>
          )}

          <div className="space-y-2">
            {faqs.length === 0 ? (
              <p className="text-slate-500 text-xs italic font-light">No FAQs created yet on CMS dashboard.</p>
            ) : (
              faqs.map((el) => (
                <div key={el.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block">Q: {el.question}</span>
                    <span className="text-xs text-slate-400 block mt-1 leading-relaxed">A: {el.answer}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFAQ(el.id)}
                    className="p-1 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-450" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BLOG INSIGHTS SUB PANEL */}
      {activeCmsTab === "blogs" && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center pb-2 border-b border-white/5 flex-wrap gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-450" />
              Blog Insights Articles publisher
            </h3>
            <button
              onClick={() => setBlogFormOpen(!blogFormOpen)}
              className="px-3 py-1.5 bg-indigo-505/10 text-indigo-400 hover:bg-indigo-550/15 text-xs rounded-xl border border-indigo-500/10 transition-colors focus:outline-none"
            >
              {blogFormOpen ? "Close panel" : "★ Compose Article"}
            </button>
          </div>

          {blogFormOpen && (
            <form onSubmit={onAddBlogSubmit} className="bg-white/5 p-5 border border-white/10 rounded-xl space-y-3 text-xs max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-350">Article Title:</label>
                  <input
                    type="text"
                    required
                    value={newBlogData.title}
                    onChange={(e) => setNewBlogData({ ...newBlogData, title: e.target.value })}
                    placeholder="e.g. 5 Hair Wellness Secrets"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-slate-100 placeholder-slate-550"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-350">Image Cover URL:</label>
                  <input
                    type="url"
                    value={newBlogData.image}
                    onChange={(e) => setNewBlogData({ ...newBlogData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-slate-100 placeholder-slate-550"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-350">Category Tag:</label>
                  <input
                    type="text"
                    value={newBlogData.category}
                    onChange={(e) => setNewBlogData({ ...newBlogData, category: e.target.value })}
                    placeholder="e.g. Hair Care, Styling Tips"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-slate-100 placeholder-slate-550"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-350">Author Name:</label>
                  <input
                    type="text"
                    value={newBlogData.author}
                    onChange={(e) => setNewBlogData({ ...newBlogData, author: e.target.value })}
                    placeholder="Owner"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-slate-100 placeholder-slate-550"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-350">Content Paragraphs:</label>
                <textarea
                  required
                  rows={5}
                  value={newBlogData.content}
                  onChange={(e) => setNewBlogData({ ...newBlogData, content: e.target.value })}
                  placeholder="Begin writing deep industry insights for your clients..."
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-slate-100 focus:outline-none leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 transition-colors text-white rounded font-bold"
              >
                Publish Insight
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.length === 0 ? (
              <p className="text-slate-500 text-xs italic font-light col-span-2">No dynamic articles published yet.</p>
            ) : (
              blogs.map((item) => (
                <div key={item.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex gap-4 hover:border-white/10 transition-colors">
                  {item.image && (
                    <img
                      src={item.image}
                      alt="preview"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded object-cover flex-shrink-0 border border-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0 select-none">
                    <h4 className="font-bold text-white text-xs truncate leading-snug">{item.title}</h4>
                    <span className="text-[10px] text-indigo-400 font-mono italic block mt-0.5">
                      {item.category} • by {item.author}
                    </span>
                    <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-mono">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeleteBlog(item.id)}
                        className="text-rose-405 hover:text-rose-300 flex items-center gap-1 font-bold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
