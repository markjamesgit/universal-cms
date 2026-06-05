import React, { useState } from "react";
import { LayoutDashboard, Users, Scissors, TrendingUp, History, Check, X, Calendar, Globe, Mail, Phone, Info } from "lucide-react";
import { Booking, Service, Staff, Customer, BusinessTenant, formatTimeSlot } from "../../types";

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

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await handleUpdateBookingStatus(id, "confirmed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    const remarks = window.prompt("Reason for declining this appointment request (this reason will be sent to the customer via email):", "Schedule conflict / fully booked");
    if (remarks === null) return;
    setDeclineLoadingId(id);
    try {
      await handleUpdateBookingStatus(id, "cancelled", remarks || "Schedule conflict");
    } finally {
      setDeclineLoadingId(null);
    }
  };

  // Statistics computations
  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.price, 0);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const completedBookings = bookings.filter((b) => b.status === "confirmed");

  const averageTicket = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

  return (
    <div className="space-y-6">
      {/* Statistics Highlights bar matching Frosted Glass look */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-lg">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Total Confirmed Revenue</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">₱{totalRevenue}</span>
            <span className="text-emerald-400 text-[10px] font-bold pb-1 flex items-center">▲ Live Sync</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-lg">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Total Appointments</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{bookings.length}</span>
            <span className="text-slate-500 text-[11px] pb-1 font-mono">Bookings</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-lg">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Avg. Ticket Price</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">₱{averageTicket.toFixed(2)}</span>
            <span className="text-indigo-400 text-[11px] pb-1 font-mono">Average</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-lg">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">CRM Client volume</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{customers.length}</span>
            <span className="text-violet-400 text-[11px] pb-1 font-mono">Guests</span>
          </div>
        </div>
      </div>

      {/* Dashboard layout workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Appointments Quick View */}
        <div className="lg:col-span-2 bg-white/5 border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div>
              <h3 className="text-md font-bold text-white tracking-tight">Recent Pending Sessions Pending Review</h3>
              <p className="text-xs text-slate-400 mt-0.5">Authorize or adjust incoming bookings instantly</p>
            </div>
            <button
              onClick={() => setActiveTab("calendar")}
              className="text-xs text-indigo-400 hover:text-white font-bold transition-colors"
            >
              Launch Agenda Scheduler →
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-550 text-xs italic">
                No pending appointments require review. Good job! Fully booked.
              </div>
            ) : (
              pendingBookings.map((bk) => {
                const srv = services.find((s) => s.id === bk.serviceId);
                const stf = staff.find((s) => s.id === bk.staffId);
                return (
                  <div
                    key={bk.id}
                    className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{bk.customerName}</span>
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] uppercase font-bold tracking-tight rounded-lg">
                          Pending Auth
                        </span>
                      </div>
                      <p className="text-xs text-slate-350 mt-0.5 leading-relaxed">
                        Service: <strong className="text-white">{srv?.name || "Bespoke session"}</strong> • Specialist:{" "}
                        <strong className="text-slate-300">{stf?.name || "Any Active Professional"}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        Date: {bk.date} at {formatTimeSlot(bk.timeSlot)} (₱{bk.price})
                      </p>
                      {bk.notes && (
                        <p className="text-[10px] bg-white/[0.03] border border-white/5 text-indigo-200 px-2 py-1 rounded inline-block mt-2 font-mono">
                          📝 Note: "{bk.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleApprove(bk.id)}
                        disabled={loadingId !== null || declineLoadingId !== null}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingId === bk.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleDecline(bk.id)}
                        disabled={loadingId !== null || declineLoadingId !== null}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {declineLoadingId === bk.id ? "Declining..." : "Decline"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Portal status and fast shortcuts */}
        <div className="space-y-6">
          <div 
            onClick={onOpenCmsPreview}
            className="group cursor-pointer bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 p-6 rounded-2xl space-y-4 transition-all duration-300 relative select-none"
          >
            {/* Ambient indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] uppercase font-bold font-mono rounded-md border border-indigo-500/20 group-hover:bg-indigo-650 group-hover:text-white transition-colors">
              <Globe className="w-3 h-3" />
              <span>Preview Live Site</span>
            </div>

            <h3 className="text-xs font-extrabold text-slate-300 group-hover:text-indigo-400 uppercase font-mono tracking-widest transition-colors">Client public Website status</h3>
            
            <div className="p-4 bg-black/45 border border-white/10 group-hover:border-indigo-500/20 rounded-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-550 font-mono block">Tenant URL:</span>
                  <span className="text-white font-bold text-xs block mt-0.5 font-mono">
                    {activeBusiness.slug}.unibook.co
                  </span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px]">
                <span className="text-slate-450 uppercase font-bold font-mono">Layout Category:</span>
                <span className="text-indigo-400 font-extrabold uppercase font-mono">{activeBusiness.templateType}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light group-hover:text-slate-300 transition-colors">
              This tenant utilizes unibook's dynamic CMS engine. Click anywhere on this card container to simulate, preview and test your client-themed public website.
            </p>
          </div>

          <div className="bg-white/5 border border-white/5 p-6 rounded-2xl space-y-3">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase font-mono tracking-widest">Active specialist roster</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {staff.length === 0 ? (
                <p className="text-xs font-light italic text-slate-550">Roster clear. Register staff members first.</p>
              ) : (
                staff.map((st) => (
                  <div key={st.id} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <img src={st.photo || undefined} alt={st.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <div>
                        <h4 className="text-white font-bold text-xs">{st.name}</h4>
                        <span className="text-[10px] text-slate-500 text-ellipsis block">{st.position}</span>
                      </div>
                    </div>
                    <span className="text-xs text-yellow-400">★ {st.rating.toFixed(1)}</span>
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
