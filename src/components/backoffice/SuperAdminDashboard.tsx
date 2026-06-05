import React, { useState } from "react";
import { LayoutDashboard, Users, Globe, MapPin, RefreshCw, PlusCircle, History } from "lucide-react";
import { BusinessTenant, AuditLog, UserRole } from "../../types";

interface SuperAdminDashboardProps {
  tenants: BusinessTenant[];
  activeBusiness: BusinessTenant | null;
  setActiveBusiness: (b: BusinessTenant | null) => void;
  auditLogs: AuditLog[];
  fetchAuditLogs: () => void;
  setOnboardingModalOpen: (open: boolean) => void;
  setCurrentRole: (role: UserRole) => void;
  setActiveTab: (tab: any) => void;
}

export default function SuperAdminDashboard({
  tenants,
  activeBusiness,
  setActiveBusiness,
  auditLogs,
  fetchAuditLogs,
  setOnboardingModalOpen,
  setCurrentRole,
  setActiveTab,
}: SuperAdminDashboardProps) {
  // Pagination State for Businesses
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  const totalPages = Math.ceil(tenants.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = tenants.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Onboard header block */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/20 to-sky-950/20 border border-indigo-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🛡️</span> Multi-Business Platform Administrator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            As a Platform Administrator, you are permitted to register businesses, adjust custom branding schemes, review security actions, and manage custom subdomains.
          </p>
        </div>
        <button
          onClick={() => setOnboardingModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-700/10 cursor-pointer transition-all hover:scale-[1.02] font-sans shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Register New Partner Business
        </button>
      </div>

      {/* Platform Tenants Overview Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase font-mono">
            Accredited Partner Businesses ({tenants.length})
          </h3>
          <span className="text-[10px] text-indigo-400 font-semibold font-mono">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTenants.map((ten) => {
            const isActive = activeBusiness?.id === ten.id;
            return (
              <div
                key={ten.id}
                className={`p-5 rounded-2xl flex flex-col justify-between border cursor-pointer transition-all hover:border-slate-500/30 leading-relaxed ${
                  isActive ? "border-indigo-500 bg-indigo-950/10" : "border-white/5 bg-white/[0.01]"
                }`}
                onClick={() => setActiveBusiness(ten)}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner select-none">
                      {ten.logo}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold px-2.5 py-1 rounded-lg bg-white/5 font-mono">
                      {ten.templateType.replace("-", " ")}
                    </span>
                  </div>

                  <h4 className="text-md font-bold text-white mt-4">{ten.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                    {ten.heroSubheading}
                  </p>

                  <div className="space-y-1.5 mt-4 text-[11px] text-slate-400 font-mono">
                    <p className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      {ten.slug}.unibook.co
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {ten.contactAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-mono">
                    Created on: {new Date(ten.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBusiness(ten);
                      setCurrentRole(UserRole.BUSINESS_ADMIN);
                      setActiveTab("dashboard");
                    }}
                    className="text-xs text-indigo-400 hover:text-white font-bold flex items-center gap-1 transition-colors font-sans"
                  >
                    Manage Business Dashboard &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Pagination Footer for Merchants listing */}
        {tenants.length > pageSize && (
          <div className="flex justify-end gap-1.5 pt-2 text-xs">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-slate-350 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
            >
              &larr; Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all font-bold ${
                  currentPage === idx + 1
                    ? "bg-indigo-650 text-white border-indigo-500 shadow-sm"
                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-slate-355 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* SuperAdmin Quick Platform Audit logs list */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase font-mono tracking-wider">
              Platform General Operations History
            </h3>
          </div>
          <button
            onClick={fetchAuditLogs}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {auditLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="text-xs flex items-start gap-4 p-3.5 bg-white/[0.01] hover:bg-white/[0.03] rounded-xl border border-white/5"
            >
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-305 font-mono rounded-lg text-[9px] mt-0.5 font-bold uppercase shrink-0">
                {log.action}
              </span>
              <div className="flex-1">
                <p className="text-slate-200 font-semibold text-[11px] leading-relaxed">
                  {log.details}
                </p>
                <span className="text-[10px] text-slate-550 mt-1 block font-mono">
                  {new Date(log.createdAt).toLocaleString()} • Action Operator:{" "}
                  <strong className="text-slate-400">{log.actor}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
