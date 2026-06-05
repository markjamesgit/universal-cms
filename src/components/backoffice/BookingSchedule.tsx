import React, { useState, useEffect } from "react";
import { Mail, Phone, Calendar as CalendarIcon, Trash2, ShieldAlert, Check, X } from "lucide-react";
import { Booking, Service, Staff, BlockedSlot, formatTimeSlot } from "../../types";
import SearchInput from "../ui/SearchInput";
import PaginationBar from "../ui/PaginationBar";

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [activeDetailBooking, setActiveDetailBooking] = useState<Booking | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockDate, setBlockDate] = useState("");
  const [blockTimeSlot, setBlockTimeSlot] = useState("");
  const [blockRemarks, setBlockRemarks] = useState("");
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelRemarks, setCancelRemarks] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

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

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);

  const statusBadge = (status: Booking["status"]) => {
    if (status === "confirmed") return "ui-badge ui-badge-success";
    if (status === "cancelled") return "ui-badge ui-badge-danger";
    return "ui-badge ui-badge-pending";
  };

  return (
    <div className="space-y-6">

      <div className="ui-card-pad space-y-4">
        <div>
          <h2 className="ui-heading flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-zinc-600" />
            Emergency Schedule Adjustments
          </h2>
          <p className="ui-subtext mt-1">
            Disable calendar dates or times for holiday closures, emergencies, or team meetings.
          </p>
        </div>

        <form onSubmit={handleCreateBlock} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-lg items-end">
          <div className="space-y-1">
            <label className="ui-label">Select Date *</label>
            <input
              type="date"
              required
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="ui-input"
            />
          </div>
          <div className="space-y-1">
            <label className="ui-label">Time Slot (Optional)</label>
            <select
              value={blockTimeSlot}
              onChange={(e) => setBlockTimeSlot(e.target.value)}
              className="ui-input"
            >
              <option value="">Full Day Block (Closed All Day)</option>
              {baseTimeSlots.map(time => (
                <option key={time} value={time}>{formatTimeSlot(time)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="ui-label">Reason for block *</label>
            <input
              type="text"
              required
              placeholder="e.g. Salon maintenance, Holiday, Training..."
              value={blockRemarks}
              onChange={(e) => setBlockRemarks(e.target.value)}
              className="ui-input"
            />
          </div>
          <div>
            <button type="submit" disabled={loadingBlock} className="ui-btn-primary w-full">
              {loadingBlock ? "Blocking..." : "Block Slot"}
            </button>
          </div>
        </form>

        {blockedSlots.length > 0 && (
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2">
            <span className="ui-label">Blocked Days & Times</span>
            <div className="max-h-[150px] overflow-y-auto space-y-1.5">
              {blockedSlots.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-900">{item.date}</span>
                    {item.timeSlot ? (
                      <span className="ui-badge">Slot: {formatTimeSlot(item.timeSlot)}</span>
                    ) : (
                      <span className="ui-badge ui-badge-danger">Full Day Closed</span>
                    )}
                    <span className="text-zinc-500 italic">"{item.remarks}"</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(item.id)}
                    className="ui-btn-ghost p-1 text-red-600"
                    title="Remove blockout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ui-card-pad space-y-6">
        <div className="border-b border-zinc-200 pb-4">
          <h2 className="ui-heading flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-zinc-600" />
            Appointment Roster
          </h2>
          <p className="ui-subtext mt-1">
            View guest bookings, manage approval status, or inspect detailed transaction profiles.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
          <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border border-zinc-200 w-full md:w-auto">
            {(["all", "pending", "confirmed", "cancelled"] as FilterStatus[]).map((filter) => {
              const count =
                filter === "all" ? bookings.length :
                bookings.filter(b => b.status === filter).length;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg text-sm font-medium transition-colors capitalize inline-flex items-center justify-center ${
                    activeFilter === filter
                      ? "bg-zinc-900 text-white tab-filter-active"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {filter}
                  <span className="tab-count-badge">{count}</span>
                </button>
              );
            })}
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, or phone..."
            className="w-full md:max-w-sm"
          />
        </div>

        <div className="space-y-3">
          {paginatedBookings.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
              No appointments found matching your filters.
            </div>
          ) : (
            paginatedBookings.map((bk) => {
              const srv = services.find((s) => s.id === bk.serviceId);
              const stf = staff.find((s) => s.id === bk.staffId);
              return (
                <div
                  key={bk.id}
                  className="p-4 bg-white border border-zinc-200 rounded-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900 text-sm">{bk.customerName}</span>
                      <span className={statusBadge(bk.status)}>{bk.status}</span>
                      {bk.paymentMethod === "gcash" && (
                        <span className="ui-badge">GCash Paid (₱{bk.downpaymentPaid})</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600">
                      Service: <span className="text-zinc-900 font-medium">{srv?.name || "Bespoke Session"}</span> · Staff:{" "}
                      <span className="font-medium">{stf?.name || "Any Specialist"}</span>
                    </p>
                    <div className="text-sm text-zinc-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {bk.customerEmail}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {bk.customerPhone || "No Mobile"}
                      </span>
                      <span className="font-medium text-zinc-900">
                        {bk.date} at {formatTimeSlot(bk.timeSlot)} (₱{bk.price})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setActiveDetailBooking(bk)}
                      className="ui-btn text-xs"
                    >
                      View Details
                    </button>

                    {cancellingId === bk.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3 w-full md:w-[280px]">
                        <label className="ui-label text-red-700">Cancellation reason *</label>
                        <textarea
                          rows={2}
                          required
                          value={cancelRemarks}
                          onChange={(e) => setCancelRemarks(e.target.value)}
                          placeholder="e.g. Schedule issue / closed"
                          className="ui-input"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setCancellingId(null); setCancelRemarks(""); }}
                            className="ui-btn text-xs"
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
                            className="ui-btn text-xs text-red-600 border-red-200"
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
                            className="ui-btn-primary text-xs px-3 py-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {bk.status !== "cancelled" && (
                          <button
                            id={`crm-cancel-${bk.id}`}
                            onClick={() => { setCancellingId(bk.id); setCancelRemarks(""); }}
                            className="ui-btn text-xs text-red-600 border-red-200 px-3 py-1.5"
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

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="bookings"
        />
      </div>

      {activeDetailBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="ui-card-pad w-full max-w-lg space-y-6 relative">
            <button
              onClick={() => setActiveDetailBooking(null)}
              className="absolute top-4 right-4 ui-btn-ghost p-2"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="ui-badge">Appointment Information</span>
              <h3 className="ui-heading mt-2">{activeDetailBooking.customerName}</h3>
              <p className="ui-subtext mt-1">Full reservation details</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-y border-zinc-200 py-4">
              <div className="space-y-0.5">
                <span className="ui-label">Service Name</span>
                <strong className="text-zinc-900 block">
                  {services.find(s => s.id === activeDetailBooking.serviceId)?.name || "Bespoke Session"}
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="ui-label">Staff Specialist</span>
                <strong className="text-zinc-900 block">
                  {staff.find(st => st.id === activeDetailBooking.staffId)?.name || "Any Specialist"}
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="ui-label">Reservation Slot</span>
                <strong className="text-zinc-900 block">
                  {activeDetailBooking.date} at {formatTimeSlot(activeDetailBooking.timeSlot)}
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="ui-label">Treatment Price</span>
                <strong className="text-zinc-900 block">₱{activeDetailBooking.price}.00</strong>
              </div>
              <div className="space-y-0.5">
                <span className="ui-label">Email Contact</span>
                <span className="text-zinc-600 select-all block break-words">{activeDetailBooking.customerEmail}</span>
              </div>
              <div className="space-y-0.5">
                <span className="ui-label">Phone Number</span>
                <span className="text-zinc-600 select-all block">{activeDetailBooking.customerPhone || "Unspecified"}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="ui-label">GCash Deposit / Downpayment</span>
                {activeDetailBooking.paymentMethod === "gcash" ? (
                  <div className="space-y-1 pt-1">
                    <p className="text-zinc-600">
                      Amount Paid: <strong className="text-emerald-700">₱{activeDetailBooking.downpaymentPaid}.00</strong>
                    </p>
                    <p className="text-zinc-500">GCash Transaction Reference:</p>
                    <code className="bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-900 inline-block mt-0.5 select-all text-sm">
                      {activeDetailBooking.gcashTxnRef || "None Registered"}
                    </code>
                  </div>
                ) : (
                  <span className="text-zinc-500 italic">Cash on Premise (No advance downpayment)</span>
                )}
              </div>

              {activeDetailBooking.notes && (
                <div className="space-y-1">
                  <span className="ui-label">Client Notes</span>
                  <p className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-zinc-600 italic">
                    "{activeDetailBooking.notes}"
                  </p>
                </div>
              )}

              {activeDetailBooking.status === "cancelled" && activeDetailBooking.cancellationRemarks && (
                <div className="space-y-1">
                  <span className="ui-label text-red-600">Cancellation Details</span>
                  <p className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700">
                    "{activeDetailBooking.cancellationRemarks}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 gap-3">
              <span className="text-xs text-zinc-500">Log: {activeDetailBooking.id}</span>
              <button onClick={() => setActiveDetailBooking(null)} className="ui-btn-primary">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
