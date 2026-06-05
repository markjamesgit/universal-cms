import React, { useState, useEffect } from "react";
import { Trash2, Globe, Sparkles, HelpCircle, BookOpen, Settings2, ImageIcon, Plus } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import { BusinessTenant, FAQItem, BlogPost, ThemePalette, ThemeFont } from "../../types";
import { getTenantPublicUrl } from "../../lib/tenantUrl";

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

type CmsTab = "styling" | "images" | "faqs" | "blogs";

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

  const tenantUrl = getTenantPublicUrl(activeBusiness.slug);

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
        heroImage: activeBusiness.heroImage || "",
        aboutImage: activeBusiness.aboutImage || "",
        galleryImages: activeBusiness.galleryImages || [],
        gcashQrImage: activeBusiness.gcashQrImage || "",
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
      setNewBlogData({ title: "", excerpt: "", content: "", category: "Styling", author: "Founder", image: "" });
      setBlogFormOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="ui-card-pad space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="ui-heading flex items-center gap-2">
            <Globe className="w-5 h-5 text-zinc-600" />
            Website Builder
          </h2>
          <p className="ui-subtext mt-1">
            Design your public landing page. Changes sync instantly.
          </p>
          <a href={tenantUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline mt-1 inline-block">
            {tenantUrl}
          </a>
        </div>
        <div className="flex gap-2 self-start md:self-center">
          <button
            onClick={onUpdateCmsSettingsSubmit}
            disabled={savingSettings}
            className="ui-btn-primary text-xs disabled:opacity-50"
          >
            {savingSettings ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={() => setCmsPreviewOpen(true)} className="ui-btn text-xs">
            Preview Site
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 pb-2">
        {(["styling", "images", "faqs", "blogs"] as CmsTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveCmsTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeCmsTab === tab ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {tab === "faqs" ? "FAQs" : tab === "blogs" ? "Articles" : tab === "images" ? "Images" : "Branding"}
          </button>
        ))}
      </div>

      {activeCmsTab === "styling" && stylingForm.theme && stylingForm.seo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="space-y-6">
            <div className="bg-zinc-50 p-5 border border-zinc-200 rounded-lg space-y-4">
              <h3 className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-zinc-500" />
                Theme Presets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="ui-label">Primary Palette *</label>
                  <select
                    value={stylingForm.theme.primaryPalette}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, primaryPalette: e.target.value as ThemePalette },
                      })
                    }
                    className="ui-input"
                  >
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                    <option value="violet">Violet</option>
                    <option value="retro-slate">Slate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="ui-label">Typography *</label>
                  <select
                    value={stylingForm.theme.fontFamily}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, fontFamily: e.target.value as ThemeFont },
                      })
                    }
                    className="ui-input"
                  >
                    <option value="sans">Sans-Serif (Modern)</option>
                    <option value="serif">Serif (Elegant)</option>
                    <option value="mono">Monospace (Tech)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="ui-label">Banner Style *</label>
                  <select
                    value={stylingForm.theme.bannerStyle}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, bannerStyle: e.target.value as any },
                      })
                    }
                    className="ui-input"
                  >
                    <option value="split">Split Columns</option>
                    <option value="overlay">Banner Overlay</option>
                    <option value="minimal">Minimalist</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="ui-label">Button Style *</label>
                  <select
                    value={stylingForm.theme.buttonStyle}
                    onChange={(e) =>
                      setStylingForm({
                        ...stylingForm,
                        theme: { ...stylingForm.theme!, buttonStyle: e.target.value as any },
                      })
                    }
                    className="ui-input"
                  >
                    <option value="rounded">Rounded</option>
                    <option value="pill">Pill</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 p-5 border border-zinc-200 rounded-lg space-y-4">
              <h3 className="font-medium text-zinc-900 text-sm flex items-center gap-1.5 border-b border-zinc-200 pb-2">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                Custom Overrides
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="ui-label">Custom Google Font</label>
                    <input
                      type="text"
                      placeholder="e.g. Space Grotesk, Outfit"
                      value={stylingForm.theme.customFontGoogle || ""}
                      onChange={(e) =>
                        setStylingForm({
                          ...stylingForm,
                          theme: { ...stylingForm.theme!, customFontGoogle: e.target.value },
                        })
                      }
                      className="ui-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="ui-label">Font Size</label>
                    <select
                      value={stylingForm.theme.fontSizeSetting || "medium"}
                      onChange={(e) =>
                        setStylingForm({
                          ...stylingForm,
                          theme: { ...stylingForm.theme!, fontSizeSetting: e.target.value as any },
                        })
                      }
                      className="ui-input"
                    >
                      <option value="small">Compact</option>
                      <option value="medium">Standard</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: "customBgColor" as const, label: "Background", default: "#fafafa" },
                    { key: "customTextColor" as const, label: "Text", default: "#18181b" },
                    { key: "customAccentColor" as const, label: "Accent", default: "#18181b" },
                  ].map(({ key, label, default: def }) => (
                    <div key={key} className="space-y-1">
                      <label className="ui-label">{label}</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="color"
                          value={stylingForm.theme![key] || def}
                          onChange={(e) =>
                            setStylingForm({
                              ...stylingForm,
                              theme: { ...stylingForm.theme!, [key]: e.target.value },
                            })
                          }
                          className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={stylingForm.theme![key] || ""}
                          placeholder={def}
                          onChange={(e) =>
                            setStylingForm({
                              ...stylingForm,
                              theme: { ...stylingForm.theme!, [key]: e.target.value },
                            })
                          }
                          className="ui-input text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                  className="ui-btn-ghost text-xs text-red-600"
                >
                  Reset overrides
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
              Marketing Copy
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="ui-label">Hero Title *</label>
                <input
                  type="text"
                  required
                  value={stylingForm.heroHeading || ""}
                  onChange={(e) => setStylingForm({ ...stylingForm, heroHeading: e.target.value })}
                  className="ui-input"
                />
              </div>
              <div className="space-y-1">
                <label className="ui-label">Hero Subheading *</label>
                <textarea
                  required
                  rows={2}
                  value={stylingForm.heroSubheading || ""}
                  onChange={(e) => setStylingForm({ ...stylingForm, heroSubheading: e.target.value })}
                  className="ui-input"
                />
              </div>
              <div className="space-y-1">
                <label className="ui-label">About Text *</label>
                <textarea
                  required
                  rows={3}
                  value={stylingForm.aboutText || ""}
                  onChange={(e) => setStylingForm({ ...stylingForm, aboutText: e.target.value })}
                  className="ui-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCmsTab === "images" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="space-y-5">
            <h3 className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-zinc-500" />
              Site imagery
            </h3>
            <ImageUploadField
              businessId={activeBusiness.id}
              label="Hero banner image"
              hint="Shown on your homepage banner. Overrides the default template image."
              value={stylingForm.heroImage || ""}
              onChange={(url) => setStylingForm({ ...stylingForm, heroImage: url })}
              folder="hero"
            />
            <ImageUploadField
              businessId={activeBusiness.id}
              label="About section image"
              value={stylingForm.aboutImage || ""}
              onChange={(url) => setStylingForm({ ...stylingForm, aboutImage: url })}
              folder="about"
            />
            <ImageUploadField
              businessId={activeBusiness.id}
              label="Social share image (OG)"
              value={stylingForm.seo?.ogImage || ""}
              onChange={(url) =>
                setStylingForm({
                  ...stylingForm,
                  seo: { ...stylingForm.seo!, ogImage: url },
                })
              }
              folder="seo"
            />
            <ImageUploadField
              businessId={activeBusiness.id}
              label="GCash payment QR"
              hint="Customers scan this code when paying the booking downpayment via GCash."
              value={stylingForm.gcashQrImage || ""}
              onChange={(url) => setStylingForm({ ...stylingForm, gcashQrImage: url })}
              folder="gcash"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-zinc-900 text-sm">Photo gallery</h3>
              <button
                type="button"
                className="ui-btn text-xs"
                onClick={() =>
                  setStylingForm({
                    ...stylingForm,
                    galleryImages: [...(stylingForm.galleryImages || []), ""],
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add slot
              </button>
            </div>
            <p className="text-xs text-zinc-500">Showcase your work, studio, or team on the homepage.</p>
            {(stylingForm.galleryImages || []).map((img, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1">
                  <ImageUploadField
                    businessId={activeBusiness.id}
                    label={`Gallery photo ${idx + 1}`}
                    value={img}
                    onChange={(url) => {
                      const next = [...(stylingForm.galleryImages || [])];
                      next[idx] = url;
                      setStylingForm({ ...stylingForm, galleryImages: next.filter(Boolean) });
                    }}
                    folder="gallery"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = (stylingForm.galleryImages || []).filter((_, i) => i !== idx);
                    setStylingForm({ ...stylingForm, galleryImages: next });
                  }}
                  className="ui-btn-ghost p-2 text-red-600 mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!stylingForm.galleryImages || stylingForm.galleryImages.length === 0) && (
              <button
                type="button"
                className="ui-btn w-full border-dashed"
                onClick={() => setStylingForm({ ...stylingForm, galleryImages: [""] })}
              >
                <Plus className="w-4 h-4" /> Upload your first gallery photo
              </button>
            )}
          </div>
        </div>
      )}

      {activeCmsTab === "faqs" && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-200 flex-wrap gap-2">
            <h3 className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-500" />
              FAQ Manager
            </h3>
            <button onClick={() => setFaqFormOpen(!faqFormOpen)} className="ui-btn text-xs">
              {faqFormOpen ? "Close" : "Add FAQ"}
            </button>
          </div>

          {faqFormOpen && (
            <form onSubmit={onAddFaqSubmit} className="bg-zinc-50 p-5 border border-zinc-200 rounded-lg max-w-lg space-y-3">
              <div className="space-y-1">
                <label className="ui-label">Question</label>
                <input
                  type="text"
                  required
                  value={newFaqData.question}
                  onChange={(e) => setNewFaqData({ ...newFaqData, question: e.target.value })}
                  placeholder="e.g. Do I need to book in advance?"
                  className="ui-input"
                />
              </div>
              <div className="space-y-1">
                <label className="ui-label">Answer</label>
                <textarea
                  required
                  rows={3}
                  value={newFaqData.answer}
                  onChange={(e) => setNewFaqData({ ...newFaqData, answer: e.target.value })}
                  placeholder="e.g. Yes! We are strictly appointment-based..."
                  className="ui-input"
                />
              </div>
              <button type="submit" className="ui-btn-primary text-xs">Save FAQ</button>
            </form>
          )}

          <div className="space-y-2">
            {faqs.length === 0 ? (
              <p className="text-sm text-zinc-500">No FAQs created yet.</p>
            ) : (
              faqs.map((el) => (
                <div key={el.id} className="p-4 bg-white border border-zinc-200 rounded-lg flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-900 block">Q: {el.question}</span>
                    <span className="text-sm text-zinc-500 block mt-1">A: {el.answer}</span>
                  </div>
                  <button onClick={() => handleDeleteFAQ(el.id)} className="ui-btn-ghost p-1 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeCmsTab === "blogs" && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-200 flex-wrap gap-2">
            <h3 className="font-medium text-zinc-900 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-zinc-500" />
              Articles
            </h3>
            <button onClick={() => setBlogFormOpen(!blogFormOpen)} className="ui-btn text-xs">
              {blogFormOpen ? "Close" : "Compose Article"}
            </button>
          </div>

          {blogFormOpen && (
            <form onSubmit={onAddBlogSubmit} className="bg-zinc-50 p-5 border border-zinc-200 rounded-lg space-y-3 max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="ui-label">Title</label>
                  <input
                    type="text"
                    required
                    value={newBlogData.title}
                    onChange={(e) => setNewBlogData({ ...newBlogData, title: e.target.value })}
                    placeholder="e.g. 5 Hair Wellness Secrets"
                    className="ui-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="ui-label">Cover Image URL</label>
                  <input
                    type="url"
                    value={newBlogData.image}
                    onChange={(e) => setNewBlogData({ ...newBlogData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="ui-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="ui-label">Category</label>
                  <input
                    type="text"
                    value={newBlogData.category}
                    onChange={(e) => setNewBlogData({ ...newBlogData, category: e.target.value })}
                    placeholder="e.g. Hair Care"
                    className="ui-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="ui-label">Author</label>
                  <input
                    type="text"
                    value={newBlogData.author}
                    onChange={(e) => setNewBlogData({ ...newBlogData, author: e.target.value })}
                    placeholder="Owner"
                    className="ui-input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="ui-label">Content</label>
                <textarea
                  required
                  rows={5}
                  value={newBlogData.content}
                  onChange={(e) => setNewBlogData({ ...newBlogData, content: e.target.value })}
                  placeholder="Write your article content..."
                  className="ui-input"
                />
              </div>
              <button type="submit" className="ui-btn-primary text-xs">Publish</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.length === 0 ? (
              <p className="text-sm text-zinc-500 col-span-2">No articles published yet.</p>
            ) : (
              blogs.map((item) => (
                <div key={item.id} className="p-4 bg-white border border-zinc-200 rounded-lg flex gap-4 hover:border-zinc-300 transition-colors">
                  {item.image && (
                    <img
                      src={item.image}
                      alt="preview"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded object-cover flex-shrink-0 border border-zinc-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zinc-900 text-sm truncate">{item.title}</h4>
                    <span className="text-xs text-zinc-500 block mt-0.5">
                      {item.category} · by {item.author}
                    </span>
                    <div className="flex justify-between items-center mt-3 text-xs text-zinc-500">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeleteBlog(item.id)}
                        className="ui-btn-ghost text-xs text-red-600 p-0"
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
