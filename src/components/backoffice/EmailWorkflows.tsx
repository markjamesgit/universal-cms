import React, { useState } from "react";
import { Mail, CheckCircle2, Save } from "lucide-react";
import { EmailTemplate } from "../../types";

interface EmailWorkflowsProps {
  emailTemplates: EmailTemplate[];
  handleSaveEmailTemplate: (key: string, subject: string, body: string) => Promise<void>;
}

export default function EmailWorkflows({
  emailTemplates,
  handleSaveEmailTemplate,
}: EmailWorkflowsProps) {
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
    <div className="ui-card-pad space-y-6">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="ui-heading flex items-center gap-2">
          <Mail className="w-5 h-5 text-zinc-600" />
          Email Notifications
        </h2>
        <p className="ui-subtext mt-1">
          Customize email receipts and reminders sent to guests when they schedule appointments.
        </p>
      </div>

      <div className="space-y-6">
        {emailTemplates.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
            Preparing default notification parameters...
          </div>
        ) : (
          emailTemplates.map((item) => {
            syncTemplate(item.key, item);
            const currentFormObj = editingTemplate[item.key] || { subject: item.subject, body: item.body };

            return (
              <div key={item.key} className="p-5 bg-white border border-zinc-200 rounded-lg space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="font-medium text-zinc-900 text-sm capitalize">
                    {item.key.replace("_", " ")}
                  </span>
                  <span className="ui-badge ui-badge-success">Active</span>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-2">
                  <p className="ui-label">Dynamic variables</p>
                  <p className="text-sm text-zinc-600 select-all">
                    {"{{customerName}} · {{serviceName}} · {{bookingDate}} · {{bookingTime}} · {{staffName}}"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="ui-label">Email Subject</label>
                    <input
                      type="text"
                      value={currentFormObj.subject}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          [item.key]: { ...currentFormObj, subject: e.target.value },
                        })
                      }
                      className="ui-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="ui-label">Email Body</label>
                    <textarea
                      rows={5}
                      value={currentFormObj.body}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          [item.key]: { ...currentFormObj, body: e.target.value },
                        })
                      }
                      className="ui-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-zinc-500">Changes save immediately.</span>
                  <div className="flex items-center gap-3">
                    {successKey === item.key && (
                      <span className="text-sm text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Saved
                      </span>
                    )}
                    <button onClick={() => handleSave(item.key)} className="ui-btn-primary text-xs">
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
