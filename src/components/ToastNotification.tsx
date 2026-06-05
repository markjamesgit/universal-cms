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
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#121216]/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl flex gap-3 animate-slide-up"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        toast.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-450"
      }`}>
        {toast.type === "success" ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-white">{toast.message}</h4>
        {toast.submessage && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.submessage}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors h-fit self-start"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
