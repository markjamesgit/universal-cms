import React, { useState, useEffect } from "react";
import { Mail, Phone, Calendar as CalendarIcon, Filter, Search, CheckCircle, AlertTriangle, XCircle, Trash2, ShieldAlert, Check, X } from "lucide-react";
import { Booking, Service, Staff, BlockedSlot, formatTimeSlot } from "../../types";

interface BookingScheduleProps {
  bookings: Booking[];
  services: Service[];
  staff: Staff[];
  handleUpdateBookingStatus: (bookingId: string, status: Booking["status"], cancellationRemarks?: string) => void;
  activeBusinessId: string;
}

type FilterStatus = "all" | "pending" | "confirmed" | "cancelled";

export default function BookingSchedule({
  bookings,
  services,
  staff,
  handleUpdateBookingStatus,
  activeBusinessId,
}: BookingScheduleProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination & Detail States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [activeDetailBooking, setActiveDetailBooking] = useState<Booking | null>(null);

  // States to manage emergency block lists
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockDate, setBlockDate] = useState("");
  const [blockTimeSlot, setBlockTimeSlot] = useState("");
  const [blockRemarks, setBlockRemarks] = useState("");
  const [loadingBlock, setLoadingBlock] = useState(false);

  // States to manage cancellation dialogs inline
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelRemarks, setCancelRemarks] = useState("");

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // Base timeslot options mapping for blocks (Available from 3:00 AM until 12:00 Midnight)
  const baseTimeSlots = [
    "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"
  ];

  const fetchBlocks = async () => {
    try {
      const res = await fetch(`/api/blocked-slots?businessId=${activeBusinessId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlockedSlots(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [activeBusinessId]);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockRemarks) {
      alert("Please choose a date and specify emergency remarks/reasons.");
      return;
    }
    setLoadingBlock(true);
    try {
      const res = await fetch("/api/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusinessId,
          date: blockDate,
          timeSlot: blockTimeSlot || undefined,
          remarks: blockRemarks
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBlockDate("");
      setBlockTimeSlot("");
      setBlockRemarks("");
      fetchBlocks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingBlock(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const res = await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchBlocks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter((bk) => {
    const matchesFilter = activeFilter === "all" || bk.status === activeFilter;
    const matchesSearch =
      bk.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bk.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bk.customerPhone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: EMERGENCY SCHEDULE ADJUSTMENTS */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-450" />
            Emergency Schedule Adjustments
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Disable calendar dates or times for holiday closures, emergencies, or team meetings.
          </p>
        </div>

        <form onSubmit={handleCreateBlock} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl items-end">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300 block font-bold">Select Date *</label>
            <input 
              type="date" 
              required
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-300 block font-bold">Time Slot (Optional)</label>
            <select
              value={blockTimeSlot}
              onChange={(e) => setBlockTimeSlot(e.target.value)}
              className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            >
              <option value="">Full Day Block (Closed All Day)</option>
              {baseTimeSlots.map(time => (
                <option key={time} value={time}>{formatTimeSlot(time)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-300 block font-bold">Reason for block *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Salon maintenance, Holiday, Training..."
              value={blockRemarks}
              onChange={(e) => setBlockRemarks(e.target.value)}
              className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loadingBlock}
              className="w-full h-8 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap self-stretch sm:self-auto font-sans"
            >
              {loadingBlock ? "Blocking..." : "Block Slot"}
            </button>
          </div>
        </form>

        {/* List of blocked entries */}
        {blockedSlots.length > 0 && (
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Blocked Days & Times</span>
            <div className="max-h-[150px] overflow-y-auto space-y-1.5 scrollbar-none">
              {blockedSlots.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-lg text-xs leading-none">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400">🚫</span>
                    <span className="font-bold text-white font-mono">{item.date}</span>
                    {item.timeSlot ? (
                      <span className="bg-indigo-650 text-white px-1.5 py-0.5 rounded text-[9px] font-mono">Slot: {formatTimeSlot(item.timeSlot)}</span>
                    ) : (
                      <span className="bg-rose-950/40 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider border border-rose-500/10">Full Day Closed</span>
                    )}
                    <span className="text-slate-400 italic">"{item.remarks}"</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteBlock(item.id)}
                    className="p-1 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    title="Remove blockout"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: CLIENT RESERVATION ROSTER LISTS */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              Appointment Roster
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              View guest bookings, manage approval status, or inspect detailed transaction profiles.
            </p>
          </div>
        </div>

        {/* Improved Aligned Roster Controls: Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl">
          <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs w-full md:w-auto">
            {(["all", "pending", "confirmed", "cancelled"] as FilterStatus[]).map((filter) => {
              const count = 
                filter === "all" ? bookings.length :
                bookings.filter(b => b.status === filter).length;
              
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${
                    activeFilter === filter
                      ? "bg-indigo-600 text-white shadow shadow-indigo-600/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Grid bookings list with Pagination slices */}
        <div className="space-y-3">
          {paginatedBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
              No appointments found matching your filters.
            </div>
          ) : (
            paginatedBookings.map((bk) => {
              const srv = services.find((s) => s.id === bk.serviceId);
              const stf = staff.find((s) => s.id === bk.staffId);

              const badgeColor = () => {
                if (bk.status === "confirmed") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10";
                if (bk.status === "cancelled") return "bg-rose-500/10 text-rose-400 border border-rose-500/10";
                return "bg-amber-500/10 text-amber-500 border border-amber-500/10";
              };

              return (
                <div
                  key={bk.id}
                  className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 hover:bg-white/[0.03] transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{bk.customerName}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] uppercase font-black tracking-wider ${badgeColor()}`}>
                        {bk.status}
                      </span>
                      {bk.paymentMethod === "gcash" && (
                        <span className="bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-mono border border-blue-500/10 uppercase tracking-tight">
                          GCash Paid (₱{bk.downpaymentPaid})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-350 leading-relaxed">
                      Service Offering: <span className="text-white font-medium">{srv?.name || "Bespoke Session"}</span> • Staff member:{" "}
                      <span className="text-slate-300 font-medium">{stf?.name || "Any Specialist"}</span>
                    </p>
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> {bk.customerEmail}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {bk.customerPhone || "No Mobile"}
                      </span>
                      <span className="font-bold text-indigo-400 font-mono">
                        📅 {bk.date} at {formatTimeSlot(bk.timeSlot)} (₱{bk.price})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full md:w-auto shrink-0 self-center">
                    <button
                      onClick={() => setActiveDetailBooking(bk)}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-white/5 transition-all text-center"
                    >
                      View Details
                    </button>

                    {cancellingId === bk.id ? (
                      <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 space-y-3 w-full md:w-[280px]">
                        <label className="text-[10px] font-bold text-rose-300 block uppercase">cancellation reason *</label>
                        <textarea
                          rows={2}
                          required
                          value={cancelRemarks}
                          onChange={(e) => setCancelRemarks(e.target.value)}
                          placeholder="e.g. Schedule issue / closed"
                          className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <div className="flex justify-end gap-2 text-[10px]">
                          <button
                            onClick={() => {
                              setCancellingId(null);
                              setCancelRemarks("");
                            }}
                            className="bg-white/5 text-slate-300 hover:text-white px-2 py-1 rounded border border-white/5 transition-colors"
                          >
                            Abort
                          </button>
                          <button
                            onClick={() => {
                              if (!cancelRemarks) {
                                alert("Remarks are required to cancel and notify.");
                                return;
                              }
                              handleUpdateBookingStatus(bk.id, "cancelled", cancelRemarks);
                              setCancellingId(null);
                              setCancelRemarks("");
                            }}
                            className="bg-rose-600 hover:bg-rose-550 text-white px-2.5 py-1 rounded font-bold transition-all"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {bk.status !== "confirmed" && bk.status !== "cancelled" && (
                          <button
                            id={`crm-confirm-${bk.id}`}
                            onClick={() => handleUpdateBookingStatus(bk.id, "confirmed")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {bk.status !== "cancelled" && (
                          <button
                            id={`crm-cancel-${bk.id}`}
                            onClick={() => {
                              setCancellingId(bk.id);
                              setCancelRemarks("");
                            }}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-650 text-rose-450 text-xs font-bold rounded-lg transition-all cursor-pointer text-center flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Beautiful Pagination Controls matched precisely */}
        {filteredBookings.length > pageSize && (
          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p className="font-mono">
              Showing <strong className="text-white">{startIndex + 1}</strong> to{" "}
              <strong className="text-white">
                {Math.min(startIndex + pageSize, filteredBookings.length)}
              </strong>{" "}
              of <strong className="text-white">{filteredBookings.length}</strong> total bookings
            </p>
            <div className="flex items-center gap-1.5">
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
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/10"
                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
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
          </div>
        )}
      </div>

      {/* FULL APPOINTMENT DETAIL INTERACTIVE MODAL */}
      {activeDetailBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in duration-200">
            
            {/* Top Close icon */}
            <button
              onClick={() => setActiveDetailBooking(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all flex items-center justify-center cursor-pointer"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] bg-indigo-600/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/10 font-bold uppercase tracking-wider font-mono">
                Appointment Information
              </span>
              <h3 className="text-xl font-bold text-white mt-2 leading-none">{activeDetailBooking.customerName}</h3>
              <p className="text-xs text-slate-400 mt-1">Full Reservation Event Log Details</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-y border-white/5 py-4">
              <div className="space-y-0.5">
                <span className="text-slate-450 block font-mono text-[10px] uppercase">Service Name:</span>
                <strong className="text-white">
                  {services.find(s => s.id === activeDetailBooking.serviceId)?.name || "Bespoke Session"}
                </strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-450 block font-mono text-[10px] uppercase">Staff Specialist:</span>
                <strong className="text-white">
                  {staff.find(st => st.id === activeDetailBooking.staffId)?.name || "Any Specialist"}
                </strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-450 block font-mono text-[10px] uppercase">Reservation Slot:</span>
                <strong className="text-indigo-400 font-bold font-mono">
                  {activeDetailBooking.date} at {formatTimeSlot(activeDetailBooking.timeSlot)}
                </strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-450 block font-mono text-[10px] uppercase">Treatment Price:</span>
                <strong className="text-white font-mono">₱{activeDetailBooking.price}.00</strong>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-450 block font-mono text-[10px] uppercase">Email Contact:</span>
                <span className="text-slate-300 font-mono select-all block break-words">{activeDetailBooking.customerEmail}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-450 block font-mono text-[10px] uppercase">Phone/Mobile Number:</span>
                <span className="text-slate-300 font-mono select-all block">{activeDetailBooking.customerPhone || "Unspecified"}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider font-mono">GCASH DEPOSIT / DOWNPAYMENT:</span>
                {activeDetailBooking.paymentMethod === "gcash" ? (
                  <div className="space-y-1 font-mono text-[11px] leading-relaxed pt-0.5">
                    <p className="text-slate-200">
                      Amount Paid: <strong className="text-emerald-400 font-bold">₱{activeDetailBooking.downpaymentPaid}.00</strong>
                    </p>
                    <p className="text-slate-350">
                      GCash Transaction Reference Code:
                    </p>
                    <code className="bg-white/10 px-2 py-0.5 rounded text-white font-black inline-block mt-0.5 select-all">
                      {activeDetailBooking.gcashTxnRef || "None Registered"}
                    </code>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Cash on Premise (No advance downpayment)</span>
                )}
              </div>

              {activeDetailBooking.notes && (
                <div className="space-y-1">
                  <span className="text-slate-450 block font-mono text-[9px] uppercase">Client Custom Preferences / Notes:</span>
                  <p className="bg-[#181820] border border-white/5 p-3 rounded-xl text-slate-300 italic font-mono leading-relaxed">
                    "{activeDetailBooking.notes}"
                  </p>
                </div>
              )}

              {activeDetailBooking.status === "cancelled" && activeDetailBooking.cancellationRemarks && (
                <div className="space-y-1">
                  <span className="text-rose-400 block font-mono text-[9px] uppercase">Cancellation Details:</span>
                  <p className="bg-rose-950/20 border border-rose-500/10 p-3 rounded-xl text-rose-300 font-mono leading-relaxed">
                    "{activeDetailBooking.cancellationRemarks}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 gap-3">
              <span className="text-[10px] text-slate-500 font-mono">
                Log Event: {activeDetailBooking.id}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveDetailBooking(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Ok, Close Details
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
