import React, { useState } from "react";
import { Plus, Trash2, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { CategoryTemplate } from "../../types";

interface CategoryTemplateManagerProps {
  templates: CategoryTemplate[];
  onRefresh: () => void;
  triggerToast: (title: string, msg: string) => void;
}

const emptyForm = {
  slug: "",
  label: "",
  icon: "🏢",
  description: "",
  defaultCategories: "General, Consultation",
  sortOrder: 99,
};

export default function CategoryTemplateManager({
  templates,
  onRefresh,
  triggerToast,
}: CategoryTemplateManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.label.trim()) {
      alert("Slug and label are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/category-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          label: form.label,
          icon: form.icon,
          description: form.description,
          defaultCategories: form.defaultCategories.split(",").map((c) => c.trim()).filter(Boolean),
          defaultHeroImage: "",
          sortOrder: Number(form.sortOrder),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      triggerToast("Template added", `${data.label} is now available for onboarding.`);
      setForm(emptyForm);
      setFormOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setTemplateActive = async (tpl: CategoryTemplate, isActive: boolean) => {
    try {
      const res = await fetch(`/api/category-templates/${tpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      triggerToast(isActive ? "Template activated" : "Template deactivated", tpl.label);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (tpl: CategoryTemplate) => {
    if (!confirm(`Remove template "${tpl.label}"? Existing businesses keep their type; new signups won't see it.`)) return;
    try {
      await fetch(`/api/category-templates/${tpl.id}`, { method: "DELETE" });
      triggerToast("Template removed", tpl.label);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateField = async (tpl: CategoryTemplate, field: string, value: unknown) => {
    try {
      const res = await fetch(`/api/category-templates/${tpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="ui-card-pad space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="ui-heading flex items-center gap-2">
            <Tag className="w-5 h-5 text-zinc-600" />
            Category templates
          </h2>
          <p className="ui-subtext mt-1">
            Manage business types for marketplace and onboarding. Merchants upload images on their own website settings.
          </p>
        </div>
        <button type="button" onClick={() => setFormOpen(!formOpen)} className="ui-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          {formOpen ? "Close" : "Add template"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 space-y-4 max-w-2xl">
          <h3 className="font-medium text-zinc-900 text-sm">New category template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ui-label">Label *</label>
              <input className="ui-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Pet Grooming" required />
            </div>
            <div>
              <label className="ui-label">Slug (ID) *</label>
              <input className="ui-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. pet-grooming" required />
            </div>
            <div>
              <label className="ui-label">Icon</label>
              <input className="ui-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🏢" />
            </div>
            <div>
              <label className="ui-label">Sort order</label>
              <input type="number" className="ui-input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="ui-label">Description</label>
            <input className="ui-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="ui-label">Default service categories (comma-separated)</label>
            <input className="ui-input" value={form.defaultCategories} onChange={(e) => setForm({ ...form, defaultCategories: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="ui-btn-primary">
            {saving ? "Saving..." : "Create template"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4">
              <button
                type="button"
                className="flex items-center gap-3 min-w-0 text-left flex-1"
                onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
              >
                <span className="text-xl shrink-0">{tpl.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{tpl.label}</p>
                  <p className="text-xs text-zinc-500 font-mono">{tpl.slug}</p>
                </div>
                {expandedId === tpl.id ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
              </button>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span className={`ui-badge text-xs ${tpl.isActive ? "ui-badge-success" : ""}`}>
                  {tpl.isActive ? "Active" : "Inactive"}
                </span>
                {tpl.isActive ? (
                  <button type="button" onClick={() => setTemplateActive(tpl, false)} className="ui-btn text-xs">
                    Deactivate
                  </button>
                ) : (
                  <button type="button" onClick={() => setTemplateActive(tpl, true)} className="ui-btn-primary text-xs">
                    Activate
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(tpl)} className="ui-btn-ghost p-1.5 text-red-600" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedId === tpl.id && (
              <div className="px-4 pb-4 pt-0 border-t border-zinc-100 space-y-3 text-sm">
                <p className="text-zinc-600 pt-3">{tpl.description || "No description"}</p>
                <div>
                  <span className="text-xs font-medium text-zinc-500">Default categories: </span>
                  <span className="text-zinc-700">{tpl.defaultCategories.join(", ")}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input
                    className="ui-input text-xs flex-1 min-w-[200px]"
                    defaultValue={tpl.label}
                    onBlur={(e) => e.target.value !== tpl.label && updateField(tpl, "label", e.target.value)}
                  />
                  <input
                    type="number"
                    className="ui-input text-xs w-24"
                    defaultValue={tpl.sortOrder}
                    onBlur={(e) => Number(e.target.value) !== tpl.sortOrder && updateField(tpl, "sortOrder", Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
