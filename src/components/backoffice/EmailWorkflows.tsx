import React, { useState } from "react";
import { Mail, CheckCircle2, CloudLightning, Save } from "lucide-react";
import { EmailTemplate } from "../../types";

interface EmailWorkflowsProps {
  emailTemplates: EmailTemplate[];
  handleSaveEmailTemplate: (key: string, subject: string, body: string) => Promise<void>;
}

export default function EmailWorkflows({
  emailTemplates,
  handleSaveEmailTemplate,
}: EmailWorkflowsProps) {
  // Store form state locally for each key to make editing incredibly reliable
  const [editingTemplate, setEditingTemplate] = useState<Record<string, { subject: string; body: string }>>({});
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const syncTemplate = (key: string, item: EmailTemplate) => {
    if (!editingTemplate[key]) {
      setEditingTemplate({
        ...editingTemplate,
        [key]: { subject: item.subject, body: item.body },
      });
    }
  };

  const handleSave = async (key: string) => {
    const templ = editingTemplate[key];
    if (!templ) return;
    try {
      await handleSaveEmailTemplate(key, templ.subject, templ.body);
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 3000);
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-yellow-450" />
          Email Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Customize email receipts and reminder messages sent to guests when they schedule appointments.
        </p>
      </div>

      <div className="space-y-6">
        {emailTemplates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
            Preparing default notification parameters...
          </div>
        ) : (
          emailTemplates.map((item) => {
            // Lazy initialize local state for this item
            syncTemplate(item.key, item);
            const currentFormObj = editingTemplate[item.key] || { subject: item.subject, body: item.body };

            return (
              <div key={item.key} className="p-6 bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-2xl space-y-4 transition-all">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-xs font-black uppercase text-indigo-400 font-mono tracking-wider">
                    ✉️ Message Trigger: {item.key.replace("_", " ")}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-tight rounded-lg flex items-center gap-1 font-mono">
                    <CloudLightning className="w-3.5 h-3.5" /> Template Active
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2 text-xs">
                  <p className="text-slate-300 font-semibold font-mono">Dynamic Text Variables Supported:</p>
                  <p className="font-mono text-indigo-305 text-[11px] leading-relaxed select-all">
                    {"{{customerName}} • {{serviceName}} • {{bookingDate}} • {{bookingTime}} • {{staffName}}"}
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Email Subject Line:</label>
                    <input
                      type="text"
                      value={currentFormObj.subject}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          [item.key]: { ...currentFormObj, subject: e.target.value },
                        })
                      }
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2 text-white font-sans focus:outline-none focus:border-indigo-505"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Email Message Body:</label>
                    <textarea
                      rows={5}
                      value={currentFormObj.body}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          [item.key]: { ...currentFormObj, body: e.target.value },
                        })
                      }
                      className="w-full bg-[#121216] border border-white/10 rounded-xl p-3.5 text-slate-205 font-mono leading-relaxed focus:outline-none focus:border-indigo-550"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-550 italic font-mono font-light shrink-0">
                    Saves are updated immediately.
                  </span>
                  <div className="flex items-center gap-3">
                    {successKey === item.key && (
                      <span className="text-emerald-450 text-xs font-semibold flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved successfully!
                      </span>
                    )}
                    <button
                      onClick={() => handleSave(item.key)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Template
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
