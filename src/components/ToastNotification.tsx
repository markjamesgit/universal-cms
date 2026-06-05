import React from "react";
import { Check, Info, X } from "lucide-react";

interface ToastProps {
  toast: {
    message: string;
    submessage?: string;
    type: "success" | "info";
  } | null;
  onClose: () => void;
}

export default function ToastNotification({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      id="global-toast-notification"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-zinc-200 p-4 rounded-lg shadow-lg flex gap-3"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
      }`}>
        {toast.type === "success" ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-zinc-900">{toast.message}</h4>
        {toast.submessage && <p className="text-xs text-zinc-500 mt-0.5 break-words">{toast.submessage}</p>}
      </div>
      <button type="button" onClick={onClose} className="p-1 hover:bg-zinc-100 rounded text-zinc-400">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
