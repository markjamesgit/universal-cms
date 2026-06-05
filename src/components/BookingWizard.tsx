import React, { useState, useEffect, useRef } from "react";
import { X, Calendar as CalendarIcon, Clock, User as UserIcon, Check, CheckCircle, Sparkles, CreditCard, ChevronRight, ChevronLeft, AlertTriangle, RefreshCw } from "lucide-react";
import { BusinessTenant, Service, Staff, Booking, BlockedSlot, formatTimeSlot } from "../types";

interface BookingWizardProps {
  business: BusinessTenant;
  services: Service[];
  staffList: Staff[];
  preSelectedService?: Service;
  bookings: Booking[];
  onClose: () => void;
  onSubmit: (bookingDetails: {
    serviceId: string;
    staffId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    timeSlot: string;
    notes: string;
    price: number;
    paymentMethod?: "cash" | "gcash";
    downpaymentPaid?: number;
    gcashTxnRef?: string;
  }) => Promise<any>;
}

export default function BookingWizard({
  business,
  services,
  staffList,
  preSelectedService,
  bookings,
  onClose,
  onSubmit,
}: BookingWizardProps) {
  const [step, setStep] = useState<number>(preSelectedService ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(preSelectedService || null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  
  // Monthly calendar & Multiple scheduling slot states
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Default to June 2026 as per our database local simulation dates or active day
    return new Date(2026, 5, 4); // Index 5 is June
  });
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; timeSlot: string }[]>([]);

  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custNotes, setCustNotes] = useState("");
  
  // Custom Cash vs. GCash payment state integrations
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
  const [gcashTxnRef, setGcashTxnRef] = useState("");
  const [downpaymentPaid, setDownpaymentPaid] = useState<number>(300);
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  // States to persist retrieved disabled dates/emergencies
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  
  // 1-minute countdown timer states for GCash Downpayments
  const [timerCount, setTimerCount] = useState<number>(60);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch emergency blocked slots on mount
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await fetch(`/api/blocked-slots?businessId=${business.id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setBlockedSlots(data);
        }
      } catch (e) {
        console.error("Failed to load blocked dates", e);
      }
    };
    fetchBlocks();
  }, [business.id]);

  // Handle countdown logic when payment shifts to GCash
  useEffect(() => {
    if (paymentMethod === "gcash" && step === 4) {
      setTimerCount(60);
      setTimerActive(true);
    } else {
      setTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentMethod, step]);

  // Standard interval clock ticking down
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerCount((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerCount(60);
    setTimerActive(true);
  };

  // Computed next 10 days for calendar view select
  const getBookingDays = () => {
    const days = [];
    const today = new Date();
    // Start calendar from tomorrow or today
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const weekdayStr = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNumStr = d.toLocaleDateString("en-US", { day: "numeric" });
      const monthStr = d.toLocaleDateString("en-US", { month: "short" });
      
      days.push({ dateStr, weekdayStr, dayNumStr, monthStr });
    }
    return days;
  };

  const bookingDays = getBookingDays();

  // Standard time slots mapping (Available from 3:00 AM until 12:00 Midnight)
  const baseTimeSlots = [
    "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"
  ];

  // Get remarks explaining emergency blocks
  const getBlockedSlotRemarks = (date: string, slot?: string) => {
    const allDayBlock = blockedSlots.find(bs => bs.date === date && !bs.timeSlot);
    if (allDayBlock) return allDayBlock.remarks;
    
    if (slot) {
      const slotBlock = blockedSlots.find(bs => bs.date === date && bs.timeSlot === slot);
      if (slotBlock) return slotBlock.remarks;
    }
    return null;
  };

  // Real-time slot conflict checker with ultra-precision logic matching system defaults
  const isSlotBooked = (date: string, slot: string, staffId: string) => {
    if (!date) return false;
    
    // Find active bookings in this time slot
    const slotBookings = bookings.filter(b => b.date === date && b.timeSlot === slot && b.status !== "cancelled");
    
    // Filter eligible specialists for the currently active service
    const eligibleStaff = staffList.filter(st => {
      if (st.available === false) return false;
      return !selectedService || selectedService.staffIds.length === 0 || selectedService.staffIds.includes(st.id);
    });
    
    if (staffId === "any") {
      // For "Any Available Professional", the slot is booked ONLY if the number of current active bookings
      // in this slot is greater than or equal to the number of eligible staff members!
      return slotBookings.length >= eligibleStaff.length;
    } else {
      // For a specific staff member:
      const isDirectlyBooked = slotBookings.some(b => b.staffId === staffId);
      if (isDirectlyBooked) return true;
      
      const isEligible = eligibleStaff.some(st => st.id === staffId);
      if (!isEligible) return true;
      
      // A specific professional is locked if all available staff slots are filled
      return slotBookings.length >= eligibleStaff.length;
    }
  };

  // Calendar Monthly navigation helper functions
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); 
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const cells = [];
    
    // Prev month padding cells
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        disabled: true,
      });
    }
    
    // Current month cells
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;
      
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        disabled: isPast,
      });
    }
    
    // Next month padding cells to make standard 6 weeks (42 cells)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        disabled: true,
      });
    }
    
    return cells;
  };

  const isSlotSelected = (date: string, slot: string) => {
    return selectedSlots.some(s => s.date === date && s.timeSlot === slot);
  };

  const toggleSlotSelection = (date: string, slot: string) => {
    const exists = selectedSlots.some(s => s.date === date && s.timeSlot === slot);
    if (exists) {
      setSelectedSlots(prev => prev.filter(s => !(s.date === date && s.timeSlot === slot)));
    } else {
      setSelectedSlots(prev => [...prev, { date, timeSlot: slot }]);
    }
  };

  // Synchronize GCash downpayment automatically to meet the ₱300 minimum per selected slot
  useEffect(() => {
    if (selectedSlots.length > 0) {
      setDownpaymentPaid(300 * selectedSlots.length);
    }
  }, [selectedSlots.length]);

  const handleNext = () => {
    if (step === 1 && selectedService) setStep(2);
    else if (step === 2 && selectedStaff) {
      setStep(3);
      // Auto-set selectedDate to today if not selected yet
      if (!selectedDate) {
        const todayStr = "2026-06-04"; // Lock to current seed date or today's date
        setSelectedDate(todayStr);
      }
    }
    else if (step === 3 && selectedSlots.length > 0) setStep(4);
  };

  const handlePrev = () => {
    if (step === 1 || (step === 2 && preSelectedService)) {
      onClose();
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const executeBooking = async () => {
    if (!selectedService || !selectedStaff || selectedSlots.length === 0 || !custName || !custEmail) {
      alert("Please select at least one calendar date & time slot and complete all requested customer contact details.");
      return;
    }

    if (paymentMethod === "gcash") {
      if (!gcashTxnRef) {
        alert("Please input your GCash Transaction Reference Code to verify your downpayment.");
        return;
      }
      if (gcashTxnRef.length < 8) {
        alert("Please enter a valid 13-digit or standard GCash Reference Code.");
        return;
      }
      const minRequired = 300 * selectedSlots.length;
      if (downpaymentPaid < minRequired) {
        alert(`A minimum of ₱${minRequired} downpayment (₱300 per slot) is required via GCash to reserve these appointments.`);
        return;
      }
      if (timerCount === 0) {
        alert("The secure payment window has expired. Please click 'Refresh Code' to restart the 1-minute timer.");
        return;
      }
    }

    setLoading(true);
    try {
      const bookedResults = [];
      for (const slot of selectedSlots) {
        const result = await onSubmit({
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          customerName: custName,
          customerEmail: custEmail,
          customerPhone: custPhone,
          date: slot.date,
          timeSlot: slot.timeSlot,
          notes: custNotes,
          price: selectedService.price,
          paymentMethod: paymentMethod,
          downpaymentPaid: paymentMethod === "gcash" ? Math.floor(downpaymentPaid / selectedSlots.length) : 0,
          gcashTxnRef: paymentMethod === "gcash" ? gcashTxnRef : ""
        });
        bookedResults.push(result);
      }
      setSuccessBooking(bookedResults);
      setStep(5);
    } catch (e: any) {
      alert("Error booking slot: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getThemeColorClass = () => {
    switch (business.theme.primaryPalette) {
      case "emerald": return "emerald";
      case "amber": return "amber";
      case "rose": return "rose";
      case "violet": return "violet";
      case "retro-slate": return "sky";
      default: return "indigo";
    }
  };

  const themeColor = getThemeColorClass();

  // Helper styles based on dynamic active palette
  const pBtnClass = `bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white`;
  const pTextClass = `text-${themeColor}-400`;
  const pBorderClass = `border-${themeColor}-500/30`;
  const pBgClass = `bg-${themeColor}-500/20`;

  return (
    <div id="booking-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#121216]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col my-8">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-lg">{business.logo}</div>
            <div>
              <h3 className="text-md font-semibold text-white">Book an Appointment</h3>
              <p className="text-xs text-slate-400">{business.name}</p>
            </div>
          </div>
          <button 
            id="close-wizard-btn"
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Visual Progress */}
        {step < 5 && (
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs text-slate-400 md:px-8">
            <span className={`${step >= 1 ? "text-white font-medium" : ""}`}>1. Service</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
            <span className={`${step >= 2 ? "text-white font-medium" : ""}`}>2. Specialist</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
            <span className={`${step >= 3 ? "text-white font-medium text-indigo-400" : ""}`}>3. Schedule</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
            <span className={`${step >= 4 ? "text-white font-medium" : ""}`}>4. Confirmation</span>
          </div>
        )}

        {/* Modal Body with Flow Sections */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[500px]">

          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white tracking-tight">Select Service</h4>
              <p className="text-xs text-slate-400">Choose from our premium menu options below:</p>
              
              <div className="space-y-3 mt-4">
                {services.map(srv => (
                  <label 
                    key={srv.id}
                    className={`flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedService?.id === srv.id 
                        ? `bg-[#1a1b23] border-${themeColor}-500/50 shadow-lg` 
                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]"
                    }`}
                    onClick={() => setSelectedService(srv)}
                  >
                    <div className="flex gap-3">
                      <input 
                        type="radio" 
                        name="service-select"
                        checked={selectedService?.id === srv.id} 
                        onChange={() => {}} 
                        className="mt-1"
                      />
                      <div>
                        <span className="text-sm font-semibold text-white block">{srv.name}</span>
                        <span className="text-xs text-slate-400 block mt-0.5 line-clamp-2">{srv.description}</span>
                        <span className="inline-block px-2 py-0.5 bg-white/5 rounded text-[10px] text-slate-450 mt-1">{srv.category}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between h-full min-w-[70px]">
                      <span className="text-sm font-bold text-white">₱{srv.price}</span>
                      <span className="text-[11px] text-slate-400 mt-1">{srv.duration} mins</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT STAFF */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-2">
                <span className="text-xs text-indigo-400 uppercase font-bold tracking-wider">{selectedService?.name}</span>
                <h4 className="text-lg font-bold text-white tracking-tight mt-1">Select Professional</h4>
                <p className="text-xs text-slate-400">Choose a highly trained resident artist/therapist:</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {/* Any Staff option */}
                <div 
                  onClick={() => setSelectedStaff({
                    id: "any",
                    businessId: business.id,
                    name: "Any Available Professional",
                    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
                    position: "Maximizes available scheduling timeslots",
                    rating: 5.0,
                    workingHours: { start: "09:00", end: "20:00" }
                  })}
                  className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${
                    selectedStaff?.id === "any"
                      ? `bg-indigo-950/20 border-indigo-500/50`
                      : "bg-white/[0.01] border-white/5 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Any Professional</h5>
                    <p className="text-[11px] text-indigo-300">Fastest booking availability</p>
                  </div>
                </div>

                {staffList.map(st => {
                  // Only allow active specialists for bookings
                  if (st.available === false) return null;
                  // Make sure staff supports this service if service maps specific staff
                  const isEligible = selectedService?.staffIds.length === 0 || selectedService?.staffIds.includes(st.id);
                  if (!isEligible) return null;

                  return (
                    <div 
                      key={st.id}
                      onClick={() => setSelectedStaff(st)}
                      className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${
                        selectedStaff?.id === st.id
                          ? `bg-${themeColor}-500/10 border-${themeColor}-500/50`
                          : "bg-white/[0.01] border-white/5 hover:bg-white/[0.04]"
                      }`}
                    >
                      <img src={st.photo || undefined} alt={st.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                      <div>
                        <h5 className="text-sm font-bold text-white">{st.name}</h5>
                        <p className="text-[11px] text-slate-400">{st.position}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-400">
                          <span>★</span>
                          <span>{st.rating.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME SLOT SELECT */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-2">
                <p className="text-[11px] text-indigo-400 uppercase font-extrabold tracking-wider">{selectedService?.name} • with {selectedStaff?.name}</p>
                <h4 className="text-lg font-bold text-white tracking-tight mt-1 animate-pulse">Choose Appointed Time Slots</h4>
                <p className="text-xs text-slate-400">
                  Select premium time slots across any calendar days. Click multiple cells and hours.
                </p>
              </div>

              {/* MONTHLY CALENDAR GRID CONTAINER */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs uppercase tracking-widest font-bold text-white">
                      {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 px-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all bg-white/5 cursor-pointer text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 px-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all bg-white/5 cursor-pointer text-xs flex items-center gap-1"
                    >
                      <span className="text-[10px]">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Labels */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Grid cells */}
                <div className="grid grid-cols-7 gap-1.5">
                  {getDaysInMonthGrid(currentMonth).map((cell, idx) => {
                    const allDayBlockedRemarks = getBlockedSlotRemarks(cell.dateStr);
                    const isAllDayBlocked = !!allDayBlockedRemarks;
                    
                    const numSlotsSelectedOnDay = selectedSlots.filter(s => s.date === cell.dateStr).length;
                    const hasSlotsSelected = numSlotsSelectedOnDay > 0;
                    
                    const isTodayCell = cell.dateStr === "2026-06-04"; // Simulate lock seed day
                    
                    return (
                      <button
                        key={`${cell.dateStr}-${idx}`}
                        type="button"
                        disabled={cell.disabled && cell.isCurrentMonth}
                        onClick={() => {
                          if (cell.isCurrentMonth && !cell.disabled) {
                            setSelectedDate(cell.dateStr);
                          }
                        }}
                        className={`p-2 rounded-xl border text-center relative flex flex-col items-center justify-center transition-all min-h-[48px] ${
                          !cell.isCurrentMonth
                            ? "bg-transparent border-transparent text-slate-650 opacity-20 pointer-events-none"
                            : cell.disabled
                            ? "bg-white/[0.01] border-transparent text-slate-600 line-through cursor-not-allowed opacity-30"
                            : isAllDayBlocked
                            ? "bg-rose-950/20 border-rose-500/30 text-rose-350 hover:bg-rose-950/35"
                            : selectedDate === cell.dateStr
                            ? `bg-${themeColor}-600 border-${themeColor}-400 text-white font-bold scale-[1.03] shadow-md shadow-${themeColor}-600/30`
                            : hasSlotsSelected
                            ? `bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold`
                            : "bg-white/[0.02] border-white/5 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-semibold">{cell.day}</span>
                        
                        {/* Status Indicator indicators */}
                        <div className="absolute bottom-1 flex items-center justify-center gap-0.5 mt-0.5">
                          {isTodayCell && !selectedDate && !hasSlotsSelected && (
                            <span className={`w-1 h-1 rounded-full bg-${themeColor}-500`} />
                          )}
                          {hasSlotsSelected && (
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          )}
                          {isAllDayBlocked && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          )}
                        </div>

                        {/* Multi selection overlay pill bubble badge */}
                        {hasSlotsSelected && selectedDate !== cell.dateStr && (
                          <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#121216] shadow">
                            {numSlotsSelectedOnDay}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE DATE DETAILS & TIME WINDOW PICKER */}
              {selectedDate ? (
                (() => {
                  const dayFullRemarks = getBlockedSlotRemarks(selectedDate);
                  if (dayFullRemarks) {
                    return (
                      <div className="p-5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl space-y-2 mt-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                          <span>🚫 Notice: Date is Disabled / Emergency Closed</span>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed">
                          This entire date is not accepting bookings. Please select an alternative calendar date above.
                        </p>
                        <div className="p-3 bg-rose-950/40 rounded-lg text-xs font-mono border border-rose-500/20">
                          <strong>Reason:</strong> {dayFullRemarks}
                        </div>
                      </div>
                    );
                  }

                  const dayBlocks = blockedSlots.filter(bs => bs.date === selectedDate && bs.timeSlot);

                  return (
                    <div className="space-y-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-300 font-bold block mb-2">
                          Available Timeslots for <span className="text-indigo-400 font-mono underline font-extrabold">{selectedDate}</span>:
                        </p>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {baseTimeSlots.map(slot => {
                            const slotBlockRemarks = getBlockedSlotRemarks(selectedDate, slot);
                            const isSlotBlocked = !!slotBlockRemarks;
                            const isBooked = isSlotBooked(selectedDate, slot, selectedStaff?.id || "any");
                            const isDisabled = isBooked || isSlotBlocked;

                            const isSelected = isSlotSelected(selectedDate, slot);

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => toggleSlotSelection(selectedDate, slot)}
                                className={`py-2 px-1 text-xs rounded-xl border text-center font-semibold tracking-tight transition-all relative ${
                                  isSlotBlocked
                                    ? "bg-rose-950/20 border-rose-900/30 text-rose-455/40 line-through cursor-not-allowed"
                                    : isBooked 
                                    ? "bg-red-950/15 border-red-950/20 text-red-400/30 line-through cursor-not-allowed" 
                                    : isSelected
                                    ? `bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-md shadow-emerald-500/10 scale-[1.02]`
                                    : `bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:border-white/20`
                                }`}
                                title={isSlotBlocked ? `Management Blocked: ${slotBlockRemarks}` : isBooked ? "Slot Pre-booked" : "Available"}
                              >
                                {formatTimeSlot(slot)}
                                {isSelected && (
                                  <span className="absolute -top-1 -right-1 bg-white text-emerald-600 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] border border-emerald-500 shadow-sm">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {dayBlocks.length > 0 && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl space-y-1.5">
                          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Emergency Blocked Hours for this Date:
                          </p>
                          <div className="space-y-1">
                            {dayBlocks.map(db => (
                              <div key={db.id} className="text-slate-300 text-xs font-mono flex items-start gap-1 pb-1 border-b border-white/5 last:border-0 last:pb-0">
                                <span className="font-bold text-amber-300 shrink-0">[{db.timeSlot ? formatTimeSlot(db.timeSlot) : ""}]:</span>
                                <span className="text-slate-400">"{db.remarks}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 items-center justify-start text-[10px] text-slate-400 p-2 bg-white/[0.02] rounded-lg">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Available (Toggle Multi-Select)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> Emergency Blocked</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-950/40 border border-red-500/25"></span> Pre-booked</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 border border-white/5 rounded-xl border-dashed text-center text-slate-450 text-xs">
                  Please tap a calendar cell day on the grid to display available specialist schedule hours.
                </div>
              )}

              {/* MULTIPLE RESERVATION SUMMARY SHOPPING LIST */}
              {selectedSlots.length > 0 && (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 mt-4 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Appointments Chosen Cart ({selectedSlots.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSlots([])}
                      className="text-[9px] text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded transition-all cursor-pointer font-bold font-sans"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedSlots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-2 px-3 rounded-xl text-xs gap-3 font-mono">
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-emerald-405 font-mono text-[11px]">[{sIdx + 1}]</span>
                          <span className="text-slate-300 font-mono">{slot.date}</span>
                          <span className="text-slate-500">at</span>
                          <span className="text-white font-bold">{formatTimeSlot(slot.timeSlot)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlots(prev => prev.filter(s => !(s.date === slot.date && s.timeSlot === slot.timeSlot)));
                          }}
                          className="text-slate-400 hover:text-rose-400 p-1 px-2.5 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer font-sans text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: GUEST DETAILS & CHECKOUT INTEGRATION */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white tracking-tight">Booking Confirmation Details</h4>
              <p className="text-xs text-slate-400">Provide your contact info to trigger real-time customized reminders & receipt dispatches:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 block">Full Customer Name *</label>
                  <input 
                    type="text" 
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Alice Morgan"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 block">Email Address *</label>
                  <input 
                    type="email" 
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="e.g. alice@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 block">Mobile Phone Number</label>
                  <input 
                    type="tel" 
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 909-1223"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 block">Important Notes / Service Customizations</label>
                  <input 
                    type="text" 
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="e.g. allergic to almond oil, prefer soft blow"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Secure Checkout Simulation Toggle: Cash and GCash Payment options */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mt-6 space-y-3">
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4.5 h-4.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">Payment Method Options</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest bg-emerald-950/30 text-emerald-400 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Direct PG Link
                  </span>
                </div>
                <div className="flex gap-6 text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input 
                      type="radio" 
                      name="payment-choice" 
                      checked={paymentMethod === "cash"} 
                      onChange={() => setPaymentMethod("cash")} 
                      className="border-white/10"
                    />
                    <span>💵 Pay Cash on Premise</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input 
                      type="radio" 
                      name="payment-choice" 
                      checked={paymentMethod === "gcash"} 
                      onChange={() => setPaymentMethod("gcash")} 
                      className="border-white/10"
                    />
                    <span>🔵 Pay via GCash (E-Wallet)</span>
                  </label>
                </div>

                {/* GCash Scannable QR and Countdown */}
                {paymentMethod === "gcash" && (
                  <div className="p-4 bg-indigo-950/15 border border-indigo-500/20 rounded-xl space-y-4 flex flex-col items-center mt-3 animate-fadeIn">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-white font-bold flex items-center justify-center gap-1.5">
                        <span className="text-indigo-400 font-mono">🔵</span> Scan QR to pay ₱300 Downpayment
                      </p>
                      <p className="text-[10px] text-slate-400">At least ₱300 PHP is required to lock dates secure from cancellation.</p>
                    </div>

                    <div className="p-2 bg-white rounded-lg shadow-lg border border-indigo-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0055ff&data=GCASH_MERCHANT_${business.id}_DOWNPAYMENT_300`} 
                        alt="GCash Downpayment scan code" 
                        className="w-[150px] h-[150px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 p-3 rounded-lg border border-white/5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 animate-pulse text-sm">⏳</span>
                        <div>
                          <p className="font-semibold text-white">QR Code Expiry Window</p>
                          <p className="text-[10px] text-slate-400">GCash downpayment session locks in 1 minute.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-sm font-black px-3 py-1 bg-neutral-900 border border-white/10 rounded-lg">
                          {Math.floor(timerCount / 60)}:{String(timerCount % 60).padStart(2, "0")}
                        </span>
                        {timerCount === 0 && (
                          <button 
                            type="button" 
                            onClick={resetTimer} 
                            className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Fields Capture */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 block font-bold">Downpayment Paid (₱) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₱</span>
                          <input 
                            type="number" 
                            min="300" 
                            value={downpaymentPaid}
                            onChange={(e) => setDownpaymentPaid(Math.max(1, Number(e.target.value)))}
                            disabled={timerCount === 0}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        {downpaymentPaid < 300 && (
                          <p className="text-[9px] text-rose-400 mt-0.5">⚠️ Below minimum deposit requirement of ₱300</p>
                        )}
                      </div>

                      <div className="space-y-1 font-mono">
                        <label className="text-[11px] text-slate-300 block font-bold font-sans">GCash Reference Code (13 Digits) *</label>
                        <input 
                          type="text" 
                          maxLength={13}
                          placeholder="e.g. 5092003318223"
                          value={gcashTxnRef}
                          onChange={(e) => setGcashTxnRef(e.target.value.replace(/[^0-9]/g, ""))}
                          disabled={timerCount === 0}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Review summary box before submit */}
              <div className="bg-gradient-to-r from-indigo-950/10 to-indigo-500/5 border border-indigo-500/15 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Selected service:</span>
                  <span className="text-white font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Schedules with:</span>
                  <span className="text-white font-semibold">{selectedStaff?.name}</span>
                </div>
                <div className="flex flex-col text-slate-400 gap-1">
                  <span>Appointed Time Slots ({selectedSlots.length}):</span>
                  <div className="pl-3 space-y-1 font-mono text-[11px] text-emerald-400">
                    {selectedSlots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex justify-between">
                        <span>• {slot.date} at {formatTimeSlot(slot.timeSlot)}</span>
                        <span>₱{selectedService?.price}.00</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-extrabold">
                  <span className="text-indigo-300">Total Treatment Price:</span>
                  <span className="text-white">₱{(selectedService?.price || 0) * selectedSlots.length}.00</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BOOKING COMPLETED SUCCESS CARD */}
          {step === 5 && successBooking && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-2xl font-black tracking-tight text-white mb-2 font-sans">Booking Logged Safely!</h4>
                <p className="text-xs text-slate-355">
                  {Array.isArray(successBooking) && successBooking.length > 1
                    ? "Your scheduling requests have been registered under Appointment codes:"
                    : "Your scheduling request has been registered under Appointment code:"}
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {Array.isArray(successBooking) ? (
                    successBooking.map((res: any, idx: number) => (
                      <code key={idx} className="text-xs bg-white/10 px-3 py-1 rounded inline-block text-indigo-350 font-mono font-bold">
                        {res?.booking?.id || "bk-registered"}
                      </code>
                    ))
                  ) : (
                    <code className="text-xs bg-white/10 px-3 py-1 rounded inline-block text-indigo-350 font-mono font-bold">
                      {successBooking?.booking?.id || "bk-registered"}
                    </code>
                  )}
                </div>
              </div>

              {/* Confetti simulator details */}
              <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl max-w-md mx-auto space-y-4 text-xs text-left font-sans">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 text-xs mt-0.5">📨</div>
                  <div>
                    <h5 className="font-bold text-white">Dynamic Inbox Dispatch</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Personalized HTML template receipts have been compiled and emailed to <strong>{custEmail}</strong>. You can review the actual sent logs inside the backoffice "Email Logs" tab.
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <h6 className="font-semibold text-slate-300 mb-1">Receipt Summary:</h6>
                  <p className="text-[11px] text-slate-400">• Customer Name: {custName}</p>
                  <p className="text-[11px] text-slate-400">• Service Selected: {selectedService?.name} (₱{selectedService?.price} each)</p>
                  <p className="text-[11px] text-slate-400">• Reserved Slots:</p>
                  <div className="pl-3 text-[11px] text-slate-300 font-mono">
                    {selectedSlots.map((slot, sIdx) => (
                      <div key={sIdx}>• {slot.date} at {formatTimeSlot(slot.timeSlot)}</div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    • Downpayment Paid: {paymentMethod === "gcash" ? `₱${downpaymentPaid} via GCash` : "Cash on Premise"}
                  </p>
                  {paymentMethod === "gcash" && (
                    <p className="text-[11px] text-slate-400">• GCash Reference: {gcashTxnRef}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="celebrate-close-btn"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  Return to Studio Home
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Actions Toggle */}
        {step < 5 && (
          <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
            <button
              id="prev-step-btn"
              onClick={handlePrev}
              className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/5 transition-colors"
            >
              {step === 1 || (step === 2 && preSelectedService) ? "Cancel" : "Back"}
            </button>

            {step < 4 ? (
              <button
                id="next-step-btn"
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedService) || 
                  (step === 2 && !selectedStaff) || 
                  (step === 3 && selectedSlots.length === 0)
                }
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  ((step === 1 && !selectedService) || 
                   (step === 2 && !selectedStaff) || 
                   (step === 3 && selectedSlots.length === 0))
                    ? "bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed"
                    : pBtnClass
                }`}
              >
                Continue
              </button>
            ) : (
              <button
                id="execute-booking-btn"
                onClick={executeBooking}
                disabled={loading}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all shadow-lg text-white ${
                  loading 
                    ? "bg-indigo-900/50 cursor-not-allowed animate-pulse" 
                    : `bg-${themeColor}-600 hover:bg-${themeColor}-500 shadow-${themeColor}-600/20`
                }`}
              >
                {loading ? "Registering Appt..." : "Confirm & Send Email"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
