import React, { useState } from "react";
import { Trash2, Scissors, Plus, X, Tag, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Service, BusinessTenant, Staff, ServiceVariant } from "../../types";
import { hasServiceVariants, getEffectivePrice, newVariantId } from "../../lib/serviceUtils";
import ImageUploadField from "./ImageUploadField";

interface ServicesConfigProps {
  services: Service[];
  activeBusiness: BusinessTenant;
  staff: Staff[];
  categoryTemplates?: { slug: string; defaultCategories: string[] }[];
  handleCreateService: (e: React.FormEvent, serviceDetails: {
    name: string;
    category: string;
    description: string;
    price: number;
    duration: number;
    image: string;
    staffIds: string[];
    variants?: ServiceVariant[];
  }) => Promise<void>;
  handleUpdateService?: (id: string, updates: Partial<Service>) => Promise<void>;
  handleDeleteService: (id: string) => void;
  handleUpdateCmsSettings?: (adjustedData: any) => Promise<void>;
  handleUpdateServiceStatus?: (id: string, isActive: boolean) => void;
}

const defaultCategoriesByTemplate: Record<string, string[]> = {
  "hair-salon": ["Coloring", "Styling", "Therapy", "Consultation", "General"],
  "nail-salon": ["Artistry", "Manicure", "Pedicure", "Spa Care", "General"],
  "tattoo-studio": ["Tattooing", "Piercing", "Consultation", "Aftercare", "General"],
  "makeup-artist": ["Bridal Makeup", "Event Styling", "Lash & Brow", "General"],
  "generic-coaching": ["1-on-1 Coaching", "Group Workshop", "Mental Wellness", "General"],
};

function emptyVariant(): ServiceVariant {
  return { id: newVariantId(), name: "", description: "", price: 0, duration: 60 };
}

export default function ServicesConfig({
  services,
  activeBusiness,
  staff,
  categoryTemplates = [],
  handleCreateService,
  handleUpdateService,
  handleDeleteService,
  handleUpdateCmsSettings,
  handleUpdateServiceStatus,
}: ServicesConfigProps) {
  const templateDefaults = categoryTemplates.find((t) => t.slug === activeBusiness.templateType)?.defaultCategories;
  const activeCategories = activeBusiness.categories && activeBusiness.categories.length > 0
    ? activeBusiness.categories
    : (templateDefaults || defaultCategoriesByTemplate[activeBusiness.templateType] || ["General Care", "Consultation"]);

  const [formOpen, setFormOpen] = useState(false);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: activeCategories[0] || "General",
    description: "",
    price: 50,
    duration: 45,
    image: "",
    staffIds: [] as string[],
    useVariants: false,
    variants: [emptyVariant()] as ServiceVariant[],
  });

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const trimmed = newCatName.trim();
    if (activeCategories.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      alert("This category already exists.");
      return;
    }
    const updated = [...activeCategories, trimmed];
    if (handleUpdateCmsSettings) {
      await handleUpdateCmsSettings({ ...activeBusiness, categories: updated });
      setNewCatName("");
      setForm((prev) => ({ ...prev, category: trimmed }));
    }
  };

  const handleRemoveCategory = async (catToRemove: string) => {
    const isUsed = services.some((s) => s.category.toLowerCase() === catToRemove.toLowerCase());
    if (isUsed && !confirm(`Category "${catToRemove}" is in use. Remove anyway?`)) return;
    const updated = activeCategories.filter((c) => c !== catToRemove);
    if (handleUpdateCmsSettings) {
      await handleUpdateCmsSettings({ ...activeBusiness, categories: updated });
      if (form.category === catToRemove) {
        setForm((prev) => ({ ...prev, category: updated[0] || "General" }));
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert("Service name is required.");
      return;
    }
    if (form.useVariants) {
      const valid = form.variants.filter((v) => v.name.trim() && v.price > 0 && v.duration > 0);
      if (valid.length === 0) {
        alert("Add at least one pricing package with name, price, and duration.");
        return;
      }
      try {
        await handleCreateService(e, {
          name: form.name,
          category: form.category,
          description: form.description,
          price: Math.min(...valid.map((v) => v.price)),
          duration: valid[0].duration,
          image: form.image,
          staffIds: form.staffIds,
          variants: valid,
        });
      } catch (err: any) {
        alert(err.message);
        return;
      }
    } else {
      if (form.price <= 0 || form.duration <= 0) {
        alert("Price and duration are required.");
        return;
      }
      try {
        await handleCreateService(e, {
          name: form.name,
          category: form.category,
          description: form.description,
          price: form.price,
          duration: form.duration,
          image: form.image,
          staffIds: form.staffIds,
        });
      } catch (err: any) {
        alert(err.message);
        return;
      }
    }
    setForm({
      name: "",
      category: activeCategories[0] || "General",
      description: "",
      price: 50,
      duration: 45,
      image: "",
      staffIds: [],
      useVariants: false,
      variants: [emptyVariant()],
    });
    setFormOpen(false);
  };

  const updateVariant = (index: number, patch: Partial<ServiceVariant>) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  return (
    <div className="ui-card-pad space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="ui-heading flex items-center gap-2">
            <Scissors className="w-5 h-5 text-zinc-600" />
            Configure Services
          </h2>
          <p className="ui-subtext mt-1">
            Add services with optional pricing packages (e.g. wedding tiers with different durations and prices).
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsManagingCats(!isManagingCats)} className="ui-btn text-xs">
            <Tag className="w-3.5 h-3.5" /> Categories
          </button>
          <button type="button" onClick={() => setFormOpen(!formOpen)} className="ui-btn-primary text-xs">
            {formOpen ? "Close" : "Add service"}
          </button>
        </div>
      </div>

      {isManagingCats && (
        <div className="bg-zinc-50 p-5 border border-zinc-200 rounded-lg space-y-3 max-w-xl">
          <div className="flex flex-wrap gap-2">
            {activeCategories.map((cat) => (
              <span key={cat} className="ui-badge inline-flex items-center gap-1">
                {cat}
                <button type="button" onClick={() => handleRemoveCategory(cat)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="ui-input flex-1" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category" />
            <button type="button" onClick={handleAddCategory} className="ui-btn-primary text-xs">Add</button>
          </div>
        </div>
      )}

      {formOpen && (
        <form onSubmit={onSubmit} className="bg-zinc-50 p-6 border border-zinc-200 rounded-lg space-y-4 max-w-2xl">
          <h3 className="font-medium text-zinc-900 text-sm">New service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="ui-label">Service name *</label>
              <input className="ui-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wedding Hair Packages" />
            </div>
            <div>
              <label className="ui-label">Category *</label>
              <select className="ui-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {activeCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="ui-label">Overview description *</label>
            <textarea className="ui-input" rows={2} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this service group for customers..." />
          </div>
          <ImageUploadField
            businessId={activeBusiness.id}
            label="Service image"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            folder="services"
          />

          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.useVariants}
              onChange={(e) => setForm({ ...form, useVariants: e.target.checked, variants: e.target.checked && form.variants.length === 0 ? [emptyVariant()] : form.variants })}
            />
            <Layers className="w-4 h-4" />
            This service has multiple pricing packages (accordion menu)
          </label>

          {!form.useVariants ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ui-label">Price (₱) *</label>
                <input type="number" min={1} className="ui-input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="ui-label">Duration (mins) *</label>
                <input type="number" min={1} className="ui-input" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 border border-zinc-200 rounded-lg bg-white p-4">
              <p className="text-sm font-medium text-zinc-800">Pricing packages</p>
              {form.variants.map((variant, idx) => (
                <div key={variant.id} className="border border-zinc-200 rounded-lg p-3 space-y-2 bg-zinc-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-zinc-500">Package {idx + 1}</span>
                    {form.variants.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) })} className="text-xs text-red-600">Remove</button>
                    )}
                  </div>
                  <input className="ui-input text-sm" placeholder="Package name (e.g. Bride Day-Of)" value={variant.name} onChange={(e) => updateVariant(idx, { name: e.target.value })} />
                  <textarea className="ui-input text-sm" rows={2} placeholder="What's included in this package?" value={variant.description} onChange={(e) => updateVariant(idx, { description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min={1} className="ui-input text-sm" placeholder="Price ₱" value={variant.price || ""} onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })} />
                    <input type="number" min={1} className="ui-input text-sm" placeholder="Duration mins" value={variant.duration || ""} onChange={(e) => updateVariant(idx, { duration: Number(e.target.value) })} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, variants: [...form.variants, emptyVariant()] })} className="ui-btn text-xs w-full">
                <Plus className="w-3.5 h-3.5" /> Add package
              </button>
            </div>
          )}

          <button type="submit" className="ui-btn-primary">Save to catalog</button>
        </form>
      )}

      <div className="space-y-3">
        {services.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg">No services yet.</div>
        ) : (
          services.map((srv) => {
            const withVariants = hasServiceVariants(srv);
            const expanded = expandedServiceId === srv.id;
            return (
              <div key={srv.id} className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
                <div className="p-4 flex gap-4">
                  {srv.image && <img src={srv.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-zinc-200 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <span className="ui-badge">{srv.category}</span>
                        {withVariants && <span className="ui-badge ml-1">{srv.variants!.length} packages</span>}
                        <h4 className="text-sm font-medium text-zinc-900 mt-1">{srv.name}</h4>
                      </div>
                      <span className="text-sm font-semibold shrink-0">
                        {withVariants ? `from ₱${getEffectivePrice(srv)}` : `₱${srv.price}`}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{srv.description}</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-100">
                      <div className="flex items-center gap-2 text-xs">
                        {!withVariants && <span>{srv.duration} mins</span>}
                        {handleUpdateServiceStatus && (
                          <>
                            <button type="button" onClick={() => handleUpdateServiceStatus(srv.id, true)} className={`ui-badge text-xs ${srv.isActive !== false ? "ui-badge-success" : ""}`}>Active</button>
                            <button type="button" onClick={() => handleUpdateServiceStatus(srv.id, false)} className={`ui-badge text-xs ${srv.isActive === false ? "ui-badge-danger" : ""}`}>Inactive</button>
                          </>
                        )}
                        {withVariants && (
                          <button type="button" onClick={() => setExpandedServiceId(expanded ? null : srv.id)} className="ui-btn-ghost text-xs py-1">
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            Packages
                          </button>
                        )}
                      </div>
                      <button type="button" onClick={() => handleDeleteService(srv.id)} className="ui-btn-ghost p-1 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {expanded && withVariants && (
                  <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 space-y-2">
                    {srv.variants!.map((v) => (
                      <div key={v.id} className="flex justify-between gap-3 text-sm py-2 border-b border-zinc-200 last:border-0">
                        <div>
                          <p className="font-medium text-zinc-900">{v.name}</p>
                          <p className="text-xs text-zinc-500">{v.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold">₱{v.price}</p>
                          <p className="text-xs text-zinc-500">{v.duration} mins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
