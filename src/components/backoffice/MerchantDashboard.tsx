import React, { useState } from "react";
import { Check, X, Globe, ExternalLink } from "lucide-react";
import { Booking, Service, Staff, Customer, BusinessTenant, formatTimeSlot } from "../../types";
import { getTenantPublicUrl } from "../../lib/tenantUrl";

interface MerchantDashboardProps {
  bookings: Booking[];
  services: Service[];
  staff: Staff[];
  customers: Customer[];
  activeBusiness: BusinessTenant;
  handleUpdateBookingStatus: (bookingId: string, status: Booking["status"], cancellationRemarks?: string) => void;
  setActiveTab: (tab: any) => void;
  onOpenCmsPreview: () => void;
}

export default function MerchantDashboard({
  bookings,
  services,
  staff,
  customers,
  activeBusiness,
  handleUpdateBookingStatus,
  setActiveTab,
  onOpenCmsPreview,
}: MerchantDashboardProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [declineLoadingId, setDeclineLoadingId] = useState<string | null>(null);
  const tenantUrl = getTenantPublicUrl(activeBusiness.slug);

  const totalRevenue = bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + b.price, 0);
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const completedBookings = bookings.filter((b) => b.status === "confirmed");
  const averageTicket = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try { await handleUpdateBookingStatus(id, "confirmed"); } finally { setLoadingId(null); }
  };

  const handleDecline = async (id: string) => {
    const remarks = window.prompt("Reason for declining (sent to customer via email):", "Schedule conflict");
    if (remarks === null) return;
    setDeclineLoadingId(id);
    try { await handleUpdateBookingStatus(id, "cancelled", remarks || "Schedule conflict"); } finally { setDeclineLoadingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: `₱${totalRevenue}` },
          { label: "Bookings", value: String(bookings.length) },
          { label: "Avg. ticket", value: `₱${averageTicket.toFixed(0)}` },
          { label: "Customers", value: String(customers.length) },
        ].map((stat) => (
          <div key={stat.label} className="ui-card-pad">
            <p className="ui-label">{stat.label}</p>
            <p className="text-2xl font-semibold text-zinc-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 ui-card-pad space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="ui-heading">Pending bookings</h3>
              <p className="ui-subtext">Approve or decline appointment requests</p>
            </div>
            <button type="button" onClick={() => setActiveTab("calendar")} className="ui-btn-ghost text-sm">
              View calendar →
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingBookings.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">No pending bookings.</p>
            ) : (
              pendingBookings.map((bk) => {
                const srv = services.find((s) => s.id === bk.serviceId);
                const stf = staff.find((s) => s.id === bk.staffId);
                return (
                  <div key={bk.id} className="border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900">{bk.customerName}</span>
                        <span className="ui-badge ui-badge-pending">Pending</span>
                      </div>
                      <p className="text-sm text-zinc-600">{srv?.name || "Service"} · {stf?.name || "Any staff"}</p>
                      <p className="text-xs text-zinc-500">{bk.date} at {formatTimeSlot(bk.timeSlot)} · ₱{bk.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleApprove(bk.id)} disabled={!!loadingId || !!declineLoadingId} className="ui-btn-primary text-xs px-3 py-1.5">
                        {loadingId === bk.id ? "..." : "Approve"}
                      </button>
                      <button type="button" onClick={() => handleDecline(bk.id)} disabled={!!loadingId || !!declineLoadingId} className="ui-btn text-xs px-3 py-1.5 text-red-600 border-red-200">
                        {declineLoadingId === bk.id ? "..." : "Decline"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="ui-card-pad space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="ui-heading">Live website</h3>
                <p className="ui-subtext mt-1">Your public booking page</p>
              </div>
              <span className="ui-badge ui-badge-success">Live</span>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="ui-label">Public URL</p>
              <a href={tenantUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-900 break-all hover:underline mt-1 block">
                {tenantUrl}
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={onOpenCmsPreview} className="ui-btn-primary flex-1">
                <Globe className="w-4 h-4" /> Preview site
              </button>
              <a href={tenantUrl} target="_blank" rel="noopener noreferrer" className="ui-btn flex-1">
                <ExternalLink className="w-4 h-4" /> Open URL
              </a>
            </div>
          </div>

          <div className="ui-card-pad space-y-3">
            <h3 className="font-medium text-zinc-900">Team</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {staff.length === 0 ? (
                <p className="text-sm text-zinc-500">No staff added yet.</p>
              ) : (
                staff.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 py-1">
                    <img src={st.photo} alt={st.name} className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{st.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{st.position}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
