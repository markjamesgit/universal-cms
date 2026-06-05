import React, { useState } from "react";
import { Globe, MapPin, RefreshCw, PlusCircle, History } from "lucide-react";
import { BusinessTenant, AuditLog, UserRole } from "../../types";
import { getTenantPublicUrl } from "../../lib/tenantUrl";
import PaginationBar from "../ui/PaginationBar";

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  const totalPages = Math.ceil(tenants.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = tenants.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <div className="ui-card-pad flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="ui-heading">Platform Administrator</h2>
          <p className="ui-subtext mt-1 max-w-xl">
            Register businesses, adjust branding, review security actions, and manage tenant sites.
          </p>
        </div>
        <button
          onClick={() => setOnboardingModalOpen(true)}
          className="ui-btn-primary text-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Register Business
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
          <h3 className="font-medium text-zinc-900 text-sm">
            Partner Businesses ({tenants.length})
          </h3>
          <span className="text-xs text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTenants.map((ten) => {
            const isActive = activeBusiness?.id === ten.id;
            return (
              <div
                key={ten.id}
                className={`ui-card-pad flex flex-col justify-between cursor-pointer transition-colors hover:border-zinc-300 ${
                  isActive ? "border-zinc-900 ring-1 ring-zinc-900" : ""
                }`}
                onClick={() => setActiveBusiness(ten)}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-xl select-none">
                      {ten.logo}
                    </div>
                    <span className="ui-badge capitalize">
                      {ten.templateType.replace("-", " ")}
                    </span>
                  </div>

                  <h4 className="font-medium text-zinc-900 mt-4">{ten.name}</h4>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2 min-h-[40px]">
                    {ten.heroSubheading}
                  </p>

                  <div className="space-y-1.5 mt-4 text-sm text-zinc-500">
                    <p className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <a
                        href={getTenantPublicUrl(ten.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-700 hover:text-zinc-900 hover:underline truncate"
                      >
                        {getTenantPublicUrl(ten.slug)}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{ten.contactAddress}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Created {new Date(ten.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBusiness(ten);
                      setCurrentRole(UserRole.BUSINESS_ADMIN);
                      setActiveTab("dashboard");
                    }}
                    className="ui-btn-ghost text-xs"
                  >
                    Manage &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={tenants.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="businesses"
        />
      </div>

      <div className="ui-card-pad space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            <h3 className="font-medium text-zinc-900 text-sm">
              Platform Activity
            </h3>
          </div>
          <button
            onClick={fetchAuditLogs}
            className="ui-btn-ghost p-1.5"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {auditLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="text-sm flex items-start gap-4 p-3.5 bg-zinc-50 rounded-lg border border-zinc-200"
            >
              <span className="ui-badge shrink-0 mt-0.5">{log.action}</span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-700 leading-relaxed">{log.details}</p>
                <span className="text-xs text-zinc-500 mt-1 block">
                  {new Date(log.createdAt).toLocaleString()} · {log.actor}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
