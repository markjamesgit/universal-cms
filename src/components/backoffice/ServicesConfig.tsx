import React, { useState } from "react";
import { Trash2, Scissors, HelpCircle, Sparkles, Plus, X, Tag } from "lucide-react";
import { Service, BusinessTenant, Staff } from "../../types";

interface ServicesConfigProps {
  services: Service[];
  activeBusiness: BusinessTenant;
  staff: Staff[];
  handleCreateService: (e: React.FormEvent, serviceDetails: {
    name: string;
    category: string;
    description: string;
    price: number;
    duration: number;
    image: string;
    staffIds: string[];
  }) => Promise<void>;
  handleDeleteService: (id: string) => void;
  handleUpdateCmsSettings?: (adjustedData: any) => Promise<void>;
  handleUpdateServiceStatus?: (id: string, isActive: boolean) => void;
}

export default function ServicesConfig({
  services,
  activeBusiness,
  staff,
  handleCreateService,
  handleDeleteService,
  handleUpdateCmsSettings,
  handleUpdateServiceStatus,
}: ServicesConfigProps) {
  const defaultCategoriesByTemplate: Record<string, string[]> = {
    "hair-salon": ["Coloring", "Styling", "Therapy", "Consultation", "General"],
    "nail-salon": ["Artistry", "Manicure", "Pedicure", "Spa Care", "General"],
    "tattoo-studio": ["Tattooing", "Piercing", "Consultation", "Aftercare", "General"],
    "makeup-artist": ["Bridal Makeup", "Event Styling", "Lash & Brow", "General"],
    "generic-coaching": ["1-on-1 Coaching", "Group Workshop", "Mental Wellness", "General"]
  };

  const activeCategories = activeBusiness.categories && activeBusiness.categories.length > 0
    ? activeBusiness.categories
    : (defaultCategoriesByTemplate[activeBusiness.templateType] || ["General Care", "Consultation"]);

  const [formOpen, setFormOpen] = useState(false);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: activeCategories[0] || "General",
    description: "",
    price: 50,
    duration: 45,
    image: "",
    staffIds: [] as string[],
  });

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const trimmed = newCatName.trim();
    if (activeCategories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      alert("This category tag already exists for your business!");
      return;
    }
    const updated = [...activeCategories, trimmed];
    if (handleUpdateCmsSettings) {
      try {
        await handleUpdateCmsSettings({
          ...activeBusiness,
          categories: updated
        });
        setNewCatName("");
        setForm(prev => ({ ...prev, category: trimmed }));
      } catch (err: any) {
        alert("Failure saving custom category: " + err.message);
      }
    } else {
      alert("Feature configuration missing! CMS update prop is required.");
    }
  };

  const handleRemoveCategory = async (catToRemove: string) => {
    const isUsed = services.some(s => s.category.toLowerCase() === catToRemove.toLowerCase());
    if (isUsed) {
      if (!confirm(`Warning: The category "${catToRemove}" is currently used by your catalog services. Removing this tag may require updating those services. Do you wish to proceed?`)) {
        return;
      }
    }
    const updated = activeCategories.filter(c => c !== catToRemove);
    if (handleUpdateCmsSettings) {
      try {
        await handleUpdateCmsSettings({
          ...activeBusiness,
          categories: updated
        });
        if (form.category === catToRemove) {
          setForm(prev => ({ ...prev, category: updated[0] || "General" }));
        }
      } catch (err: any) {
        alert("Failed deleting category: " + err.message);
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0 || form.duration <= 0) {
      alert("Please check that all mandatory service menu parameters are provided correctly.");
      return;
    }
    try {
      await handleCreateService(e, form);
      // Reset form on success
      setForm({
        name: "",
        category: activeCategories[0] || "General",
        description: "",
        price: 50,
        duration: 45,
        image: "",
        staffIds: [],
      });
      setFormOpen(false);
    } catch (err: any) {
      alert("Failure creating service listing: " + err.message);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-pink-400" />
            Configure Services Menu
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage treatment categories, session durations, detailed descriptions, and public pricing sheets.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsManagingCats(!isManagingCats)}
            className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              isManagingCats 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> {isManagingCats ? "Close Categories" : "Maintain Categories"}
          </button>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {formOpen ? "Close Panel" : "Add Service Offering"}
          </button>
        </div>
      </div>

      {/* CATEGORIES MAINTENANCE INTERFACE */}
      {isManagingCats && (
        <div className="bg-indigo-950/10 p-5 border border-indigo-500/15 rounded-2xl space-y-4 max-w-xl transition-all">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            Treatment Categories Maintenance
          </h3>
          <p className="text-xs text-slate-400">
            Maintain public service tags styled strictly for your <strong>{activeBusiness.name} ({activeBusiness.templateType})</strong> website template.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {activeCategories.map((cat, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-slate-200 text-xs rounded-full font-medium"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="p-0.5 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-slate-450"
                  title={`Delete Category ${cat}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md pt-2">
            <input 
              type="text" 
              placeholder="e.g. Therapeutic Care, Bridal, Hair Coloring"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button 
              type="button" 
              onClick={handleAddCategory}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Category
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <form onSubmit={onSubmit} className="bg-white/5 p-6 border border-white/10 rounded-2xl max-w-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
            Enroll Service Option
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Treatment Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Balayage & Olaplex Treatment"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Category Tag *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-slate-200"
              >
                {activeCategories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Duration in Minutes *</label>
              <input
                type="number"
                required
                min={1}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Base Price Amount (₱) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold font-mono">Comprehensive Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detail the technical execution phases, materials used, and end advantages of this treatment..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 leading-normal"
            ></textarea>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold">Menu Image URL (Optional)</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="e.g. https://images.unsplash.com/photo-..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Save Service to Catalog Menu
          </button>
        </form>
      )}

      {/* Display Service Listings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {services.length === 0 ? (
          <div className="col-span-1 md:col-span-2 p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
            Service catalog menu is currently empty. Tap the "Add Service" button to populate your list.
          </div>
        ) : (
          services.map((srv) => (
            <div
              key={srv.id}
              className="p-5 bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-2xl flex gap-4 transition-all relative group"
            >
              {srv.image && (
                <img
                  src={srv.image || undefined}
                  alt={srv.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-6">
                    <span className="text-[9px] bg-white/5 text-indigo-400 px-2.5 py-0.5 rounded-lg font-black uppercase font-mono tracking-wider">
                      {srv.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5 truncate leading-snug">{srv.name}</h4>
                  </div>
                  <span className="text-sm font-black text-white shrink-0 font-mono">₱{srv.price}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed font-light font-sans max-w-sm">
                  {srv.description}
                </p>
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>⏱ {srv.duration} mins</span>
                    <span className="text-slate-600">•</span>
                    {handleUpdateServiceStatus ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceStatus(srv.id, true)}
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold transition-all cursor-pointer ${
                            srv.isActive !== false
                              ? "bg-emerald-600 text-white font-extrabold border border-emerald-500 shadow-sm"
                              : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceStatus(srv.id, false)}
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold transition-all cursor-pointer ${
                            srv.isActive === false
                              ? "bg-rose-600 text-white font-extrabold border border-rose-500 shadow-sm"
                              : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    ) : (
                      <span className={srv.isActive !== false ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {srv.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteService(srv.id)}
                    className="p-1 hover:text-rose-400 hover:bg-rose-500/15 rounded transition-colors text-slate-500"
                    title="Remove Service Option"
                  >
                    <Trash2 className="w-4 h-4 text-rose-450" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
