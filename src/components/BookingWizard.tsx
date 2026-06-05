import React, { useState, useEffect, useRef } from "react";
import { X, Calendar as CalendarIcon, Clock, User as UserIcon, Check, CheckCircle, Sparkles, CreditCard, ChevronRight, ChevronLeft, AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { BusinessTenant, Service, ServiceVariant, Staff, Booking, BlockedSlot, formatTimeSlot } from "../types";
import { hasServiceVariants, getEffectivePrice, getBookingServiceLabel } from "../lib/serviceUtils";
import {
  EMAIL_PLACEHOLDER,
  GCASH_REF_PLACEHOLDER,
  PHONE_PLACEHOLDER,
  normalizeGcashRefInput,
  normalizePhoneInput,
  validateEmail,
  validateGcashRef,
  validatePhone,
} from "../lib/contactFormats";

interface BookingWizardProps {
  business: BusinessTenant;
  services: Service[];
  staffList: Staff[];
  preSelectedService?: Service;
  preSelectedVariant?: ServiceVariant;
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
    variantId?: string;
    variantName?: string;
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
  preSelectedVariant,
  bookings,
  onClose,
  onSubmit,
}: BookingWizardProps) {
  const canSkipServiceStep =
    preSelectedService &&
    (!hasServiceVariants(preSelectedService) || preSelectedVariant);
  const [step, setStep] = useState<number>(canSkipServiceStep ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(preSelectedService || null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(preSelectedVariant || null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(preSelectedService?.id || null);
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
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    phone?: string;
    gcashRef?: string;
    downpayment?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    phone?: boolean;
    gcashRef?: boolean;
    downpayment?: boolean;
  }>({});

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

  const unitPrice = selectedService ? getEffectivePrice(selectedService, selectedVariant) : 0;
  const serviceReady =
    selectedService &&
    (!hasServiceVariants(selectedService) || selectedVariant);

  const handleNext = () => {
    if (step === 1 && serviceReady) setStep(2);
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
    if (step === 1 || (step === 2 && canSkipServiceStep)) {
      onClose();
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const minDownpayment = 300 * selectedSlots.length;

  const runContactValidation = () => {
    const emailError = validateEmail(custEmail);
    const phoneError = validatePhone(custPhone);
    const gcashRefError = paymentMethod === "gcash" ? validateGcashRef(gcashTxnRef) : null;
    const downpaymentError =
      paymentMethod === "gcash" && downpaymentPaid < minDownpayment
        ? `Minimum downpayment is ₱${minDownpayment} (₱300 per slot).`
        : null;

    setFieldErrors({
      email: emailError || undefined,
      phone: phoneError || undefined,
      gcashRef: gcashRefError || undefined,
      downpayment: downpaymentError || undefined,
    });
    setTouched({ email: true, phone: true, gcashRef: true, downpayment: true });

    return !(emailError || phoneError || gcashRefError || downpaymentError);
  };

  const executeBooking = async () => {
    if (!selectedService || !selectedStaff || selectedSlots.length === 0 || !custName) {
      alert("Please select at least one calendar date & time slot and complete all requested customer contact details.");
      return;
    }

    if (!runContactValidation()) return;

    if (paymentMethod === "gcash" && timerCount === 0) {
      alert("The secure payment window has expired. Please click Retry to restart the 1-minute timer.");
      return;
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
          price: unitPrice,
          variantId: selectedVariant?.id,
          variantName: selectedVariant?.name,
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

  const gcashQrSrc = business.gcashQrImage?.trim() || "";

  return (
    <div id="booking-modal-overlay" className={`wizard-overlay ${step < 5 ? "wizard-overlay-scroll" : ""}`}>
      <div className={`wizard-panel ${step === 5 ? "wizard-panel-success" : ""}`}>
        
        {/* Modal Header */}
        <div className="wizard-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg">{business.logo}</div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Book an Appointment</h3>
              <p className="text-xs text-zinc-600">{business.name}</p>
            </div>
          </div>
          <button 
            id="close-wizard-btn"
            onClick={onClose} 
            className="ui-btn-ghost p-1.5 rounded-full text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Visual Progress */}
        {step < 5 && (
          <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-500 md:px-6">
            <span className={`${step >= 1 ? "text-zinc-900 font-medium" : ""}`}>1. Service</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`${step >= 2 ? "text-zinc-900 font-medium" : ""}`}>2. Specialist</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`${step >= 3 ? "text-zinc-900 font-medium" : ""}`}>3. Schedule</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`${step >= 4 ? "text-zinc-900 font-medium" : ""}`}>4. Confirmation</span>
          </div>
        )}

        {/* Modal Body with Flow Sections */}
        <div className={`wizard-body ${step === 5 ? "wizard-body-success" : ""}`}>

          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="ui-heading">Select Service</h4>
              <p className="ui-subtext">Choose a service and package if applicable:</p>

              <div className="space-y-3 mt-4">
                {services.filter((s) => s.isActive !== false).map((srv) => {
                  const withVariants = hasServiceVariants(srv);
                  const expanded = expandedServiceId === srv.id;
                  return (
                    <div
                      key={srv.id}
                      className={`rounded-lg border transition-all ${
                        selectedService?.id === srv.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full flex items-start justify-between p-4 text-left"
                        onClick={() => {
                          setSelectedService(srv);
                          setSelectedVariant(null);
                          setExpandedServiceId(withVariants ? srv.id : null);
                        }}
                      >
                        <div className="flex gap-3 min-w-0">
                          <input type="radio" readOnly checked={selectedService?.id === srv.id} className="mt-1" />
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-zinc-900 block">{srv.name}</span>
                            <span className="text-sm text-zinc-600 block mt-0.5 line-clamp-2">{srv.description}</span>
                            <span className="ui-badge mt-1">{srv.category}</span>
                            {withVariants && (
                              <span className="text-xs text-zinc-500 block mt-1">{srv.variants!.length} packages — select one below</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-sm font-bold text-zinc-900">
                            {withVariants ? `from ₱${getEffectivePrice(srv)}` : `₱${srv.price}`}
                          </span>
                          {!withVariants && <span className="text-xs text-zinc-600 block mt-1">{srv.duration} mins</span>}
                        </div>
                      </button>

                      {withVariants && (expanded || selectedService?.id === srv.id) && (
                        <div className="border-t border-zinc-200 px-4 pb-3 space-y-2">
                          {srv.variants!.map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => {
                                setSelectedService(srv);
                                setSelectedVariant(variant);
                              }}
                              className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                                selectedVariant?.id === variant.id
                                  ? "border-zinc-900 bg-white shadow-sm"
                                  : "border-zinc-200 hover:bg-zinc-50"
                              }`}
                            >
                              <div className="flex justify-between gap-2">
                                <span className="font-medium text-zinc-900">{variant.name}</span>
                                <span className="font-semibold shrink-0">₱{variant.price}</span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1">{variant.description}</p>
                              <p className="text-xs text-zinc-400 mt-1">{variant.duration} minutes</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT STAFF */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-2">
                <span className="text-xs text-zinc-600 uppercase font-bold tracking-wider">{selectedService?.name}</span>
                <h4 className="ui-heading mt-1">Select Professional</h4>
                <p className="ui-subtext">Choose a highly trained resident artist/therapist:</p>
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
                  className={`p-4 rounded-lg border flex items-center gap-4 cursor-pointer transition-all ${
                    selectedStaff?.id === "any"
                      ? "bg-zinc-50 border-zinc-900"
                      : "bg-white border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900">Any Professional</h5>
                    <p className="text-xs text-zinc-600">Fastest booking availability</p>
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
                      className={`p-4 rounded-lg border flex items-center gap-4 cursor-pointer transition-all ${
                        selectedStaff?.id === st.id
                          ? "bg-zinc-50 border-zinc-900"
                          : "bg-white border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <img src={st.photo || undefined} alt={st.name} className="w-12 h-12 rounded-full object-cover border border-zinc-200" />
                      <div>
                        <h5 className="text-sm font-bold text-zinc-900">{st.name}</h5>
                        <p className="text-xs text-zinc-600">{st.position}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
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
                <p className="text-xs text-zinc-600 uppercase font-extrabold tracking-wider">{selectedService?.name} • with {selectedStaff?.name}</p>
                <h4 className="ui-heading mt-1">Choose Appointed Time Slots</h4>
                <p className="ui-subtext">
                  Select premium time slots across any calendar days. Click multiple cells and hours.
                </p>
              </div>

              {/* MONTHLY CALENDAR GRID CONTAINER */}
              <div className="ui-card-pad space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-zinc-700" />
                    <span className="text-xs uppercase tracking-widest font-bold text-zinc-900">
                      {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="ui-btn py-1 px-2 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="ui-btn py-1 px-2 text-xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Labels */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase font-bold text-zinc-500 tracking-wider">
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
                        className={`p-2 rounded-lg border text-center relative flex flex-col items-center justify-center transition-all min-h-[48px] ${
                          !cell.isCurrentMonth
                            ? "bg-transparent border-transparent text-zinc-300 opacity-40 pointer-events-none"
                            : cell.disabled
                            ? "bg-zinc-50 border-transparent text-zinc-400 line-through cursor-not-allowed opacity-50"
                            : isAllDayBlocked
                            ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            : selectedDate === cell.dateStr
                            ? "bg-zinc-900 border-zinc-900 text-white font-bold scale-[1.03] shadow-sm"
                            : hasSlotsSelected
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                            : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        <span className="text-xs font-semibold">{cell.day}</span>
                        
                        {/* Status Indicator indicators */}
                        <div className="absolute bottom-1 flex items-center justify-center gap-0.5 mt-0.5">
                          {isTodayCell && !selectedDate && !hasSlotsSelected && (
                            <span className="w-1 h-1 rounded-full bg-zinc-900" />
                          )}
                          {hasSlotsSelected && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          )}
                          {isAllDayBlocked && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                        </div>

                        {/* Multi selection overlay pill bubble badge */}
                        {hasSlotsSelected && selectedDate !== cell.dateStr && (
                          <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow">
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
                      <div className="p-5 bg-red-50 border border-red-200 text-red-800 rounded-lg space-y-2 mt-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                          <span>🚫 Notice: Date is Disabled / Emergency Closed</span>
                        </div>
                        <p className="text-sm text-zinc-700 leading-relaxed">
                          This entire date is not accepting bookings. Please select an alternative calendar date above.
                        </p>
                        <div className="p-3 bg-white rounded-lg text-sm font-mono border border-red-200 text-zinc-800">
                          <strong>Reason:</strong> {dayFullRemarks}
                        </div>
                      </div>
                    );
                  }

                  const dayBlocks = blockedSlots.filter(bs => bs.date === selectedDate && bs.timeSlot);

                  return (
                    <div className="space-y-4 mt-4">
                      <div>
                        <p className="text-sm text-zinc-800 font-bold block mb-2">
                          Available Timeslots for <span className="text-zinc-900 font-mono underline font-extrabold">{selectedDate}</span>:
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
                                className={`py-2 px-1 text-xs rounded-lg border text-center font-semibold tracking-tight transition-all relative ${
                                  isSlotBlocked
                                    ? "bg-red-50 border-red-200 text-red-400 line-through cursor-not-allowed"
                                    : isBooked 
                                    ? "bg-zinc-100 border-zinc-200 text-zinc-400 line-through cursor-not-allowed" 
                                    : isSelected
                                    ? "bg-zinc-900 text-white font-bold border-zinc-900 shadow-sm scale-[1.02]"
                                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400"
                                }`}
                                title={isSlotBlocked ? `Management Blocked: ${slotBlockRemarks}` : isBooked ? "Slot Pre-booked" : "Available"}
                              >
                                {formatTimeSlot(slot)}
                                {isSelected && (
                                  <span className="absolute -top-1 -right-1 bg-white text-zinc-900 rounded-full w-3.5 h-3.5 flex items-center justify-center text-xs border border-zinc-900 shadow-sm">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {dayBlocks.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                          <p className="text-xs text-amber-800 font-bold uppercase tracking-wide flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Emergency Blocked Hours for this Date:
                          </p>
                          <div className="space-y-1">
                            {dayBlocks.map(db => (
                              <div key={db.id} className="text-zinc-700 text-sm font-mono flex items-start gap-1 pb-1 border-b border-zinc-200 last:border-0 last:pb-0">
                                <span className="font-bold text-amber-700 shrink-0">[{db.timeSlot ? formatTimeSlot(db.timeSlot) : ""}]:</span>
                                <span className="text-zinc-600">"{db.remarks}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 items-center justify-start text-xs text-zinc-600 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available (Toggle Multi-Select)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Emergency Blocked</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-300 border border-zinc-400"></span> Pre-booked</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 border border-zinc-200 rounded-lg border-dashed text-center text-zinc-500 text-sm">
                  Please tap a calendar cell day on the grid to display available specialist schedule hours.
                </div>
              )}

              {/* MULTIPLE RESERVATION SUMMARY SHOPPING LIST */}
              {selectedSlots.length > 0 && (
                <div className="ui-card-pad space-y-3 mt-4">
                  <div className="flex items-center justify-between text-xs font-extrabold text-zinc-600 uppercase tracking-widest border-b border-zinc-200 pb-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Appointments Chosen Cart ({selectedSlots.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSlots([])}
                      className="text-xs text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-all cursor-pointer font-bold"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedSlots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 p-2 px-3 rounded-lg text-sm gap-3 font-mono">
                        <div className="flex items-center gap-2 text-zinc-700">
                          <span className="text-emerald-700 font-mono text-xs">[{sIdx + 1}]</span>
                          <span className="text-zinc-700 font-mono">{slot.date}</span>
                          <span className="text-zinc-500">at</span>
                          <span className="text-zinc-900 font-bold">{formatTimeSlot(slot.timeSlot)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlots(prev => prev.filter(s => !(s.date === slot.date && s.timeSlot === slot.timeSlot)));
                          }}
                          className="text-zinc-500 hover:text-red-700 p-1 px-2.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs font-bold"
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
              <h4 className="ui-heading">Booking Confirmation Details</h4>
              <p className="ui-subtext">Provide your contact info to trigger real-time customized reminders & receipt dispatches:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="ui-label">Full Customer Name *</label>
                  <input 
                    type="text" 
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Alice Morgan"
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">Email Address *</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => {
                      setCustEmail(e.target.value);
                      if (touched.email) {
                        setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) || undefined }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, email: true }));
                      setFieldErrors((prev) => ({ ...prev, email: validateEmail(custEmail) || undefined }));
                    }}
                    placeholder={EMAIL_PLACEHOLDER}
                    className={`ui-input ${touched.email && fieldErrors.email ? "border-red-400" : ""}`}
                  />
                  {touched.email && fieldErrors.email && (
                    <p className="ui-field-error">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="ui-label">Mobile Phone Number</label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => {
                      const next = normalizePhoneInput(e.target.value);
                      setCustPhone(next);
                      if (touched.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: validatePhone(next) || undefined }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, phone: true }));
                      setFieldErrors((prev) => ({ ...prev, phone: validatePhone(custPhone) || undefined }));
                    }}
                    placeholder={PHONE_PLACEHOLDER}
                    className={`ui-input ${touched.phone && fieldErrors.phone ? "border-red-400" : ""}`}
                  />
                  {touched.phone && fieldErrors.phone && (
                    <p className="ui-field-error">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="ui-label">Important Notes / Service Customizations</label>
                  <input 
                    type="text" 
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="e.g. allergic to almond oil, prefer soft blow"
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="ui-card-pad mt-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                  <CreditCard className="w-5 h-5 text-zinc-600" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">How would you like to pay?</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Choose one option to complete your booking.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`payment-option ${paymentMethod === "cash" ? "payment-option-active" : "payment-option-inactive"}`}
                  >
                    <p className="text-sm font-semibold text-zinc-900">Pay on arrival</p>
                    <p className="text-xs text-zinc-500 mt-1">Pay in cash when you arrive for your appointment.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gcash")}
                    className={`payment-option ${paymentMethod === "gcash" ? "payment-option-active" : "payment-option-inactive"}`}
                  >
                    <p className="text-sm font-semibold text-zinc-900">GCash downpayment</p>
                    <p className="text-xs text-zinc-500 mt-1">Send ₱300 per slot via GCash to secure your booking.</p>
                  </button>
                </div>

                {/* GCash Scannable QR and Countdown */}
                {paymentMethod === "gcash" && (
                  <div className="gcash-payment-panel">
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-zinc-900">Scan to pay your downpayment</p>
                      <p className="text-xs text-zinc-500">
                        Minimum ₱{minDownpayment} required ({selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} × ₱300).
                      </p>
                    </div>

                    <div className="flex justify-center">
                      {gcashQrSrc ? (
                        <div className="gcash-qr-frame">
                          <img
                            src={gcashQrSrc}
                            alt="GCash payment QR code"
                            className="w-40 h-40 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="gcash-qr-frame w-40 h-40 text-center text-xs text-zinc-500 px-3">
                          GCash QR not set up yet. Ask the business to upload their QR in Website → Images.
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Payment window</p>
                          <p className="text-xs text-zinc-500">Complete payment within 1 minute.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-sm font-bold px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-900">
                            {Math.floor(timerCount / 60)}:{String(timerCount % 60).padStart(2, "0")}
                          </span>
                          {timerCount === 0 && (
                            <button type="button" onClick={resetTimer} className="ui-btn-primary py-1.5 px-3 text-xs">
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="ui-label">Downpayment paid (₱) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₱</span>
                          <input
                            type="number"
                            min={minDownpayment}
                            value={downpaymentPaid}
                            onChange={(e) => {
                              const next = Math.max(1, Number(e.target.value));
                              setDownpaymentPaid(next);
                              if (touched.downpayment) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  downpayment:
                                    next < minDownpayment
                                      ? `Minimum downpayment is ₱${minDownpayment} (₱300 per slot).`
                                      : undefined,
                                }));
                              }
                            }}
                            onBlur={() => {
                              setTouched((prev) => ({ ...prev, downpayment: true }));
                              setFieldErrors((prev) => ({
                                ...prev,
                                downpayment:
                                  downpaymentPaid < minDownpayment
                                    ? `Minimum downpayment is ₱${minDownpayment} (₱300 per slot).`
                                    : undefined,
                              }));
                            }}
                            disabled={timerCount === 0}
                            className={`ui-input pl-7 ${touched.downpayment && fieldErrors.downpayment ? "border-red-400" : ""}`}
                          />
                        </div>
                        {touched.downpayment && fieldErrors.downpayment && (
                          <p className="ui-field-error">{fieldErrors.downpayment}</p>
                        )}
                      </div>

                      <div>
                        <label className="ui-label">GCash reference code (13 digits) *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={13}
                          placeholder={GCASH_REF_PLACEHOLDER}
                          value={gcashTxnRef}
                          onChange={(e) => {
                            const next = normalizeGcashRefInput(e.target.value);
                            setGcashTxnRef(next);
                            if (touched.gcashRef) {
                              setFieldErrors((prev) => ({ ...prev, gcashRef: validateGcashRef(next) || undefined }));
                            }
                          }}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, gcashRef: true }));
                            setFieldErrors((prev) => ({ ...prev, gcashRef: validateGcashRef(gcashTxnRef) || undefined }));
                          }}
                          disabled={timerCount === 0}
                          className={`ui-input font-mono tracking-wider ${touched.gcashRef && fieldErrors.gcashRef ? "border-red-400" : ""}`}
                        />
                        {touched.gcashRef && fieldErrors.gcashRef && (
                          <p className="ui-field-error">{fieldErrors.gcashRef}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Review summary box before submit */}
              <div className="ui-card-pad space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Selected service:</span>
                  <span className="text-zinc-900 font-semibold">
                    {selectedService ? getBookingServiceLabel(selectedService, selectedVariant) : ""}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Schedules with:</span>
                  <span className="text-zinc-900 font-semibold">{selectedStaff?.name}</span>
                </div>
                <div className="flex flex-col text-zinc-600 gap-1">
                  <span>Appointed Time Slots ({selectedSlots.length}):</span>
                  <div className="pl-3 space-y-1 font-mono text-xs text-emerald-700">
                    {selectedSlots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex justify-between">
                        <span>• {slot.date} at {formatTimeSlot(slot.timeSlot)}</span>
                        <span>₱{unitPrice}.00</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-extrabold">
                  <span className="text-zinc-700">Total Treatment Price:</span>
                  <span className="text-zinc-900">₱{unitPrice * selectedSlots.length}.00</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BOOKING COMPLETED SUCCESS CARD */}
          {step === 5 && successBooking && (
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="wizard-success-icon">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="ui-heading text-lg">Booking logged safely</h4>
                  <p className="ui-subtext mt-1">
                    {Array.isArray(successBooking) && successBooking.length > 1
                      ? "Your appointments are registered with these codes:"
                      : "Your appointment is registered with this code:"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.isArray(successBooking) ? (
                    successBooking.map((res: any, idx: number) => (
                      <span key={idx} className="wizard-success-code">
                        {res?.booking?.id || "bk-registered"}
                      </span>
                    ))
                  ) : (
                    <span className="wizard-success-code">
                      {successBooking?.booking?.id || "bk-registered"}
                    </span>
                  )}
                </div>
              </div>

              <div className="ui-card-pad space-y-3 text-sm">
                <div className="flex items-start gap-3 pb-3 border-b border-zinc-200">
                  <Mail className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-zinc-900">Confirmation email</p>
                    <p className="text-zinc-600 mt-0.5">
                      Sent to <strong>{custEmail}</strong>.
                      {successBooking?.[0]?.notification?.previewUrl ? (
                        <>
                          {" "}Test preview:{" "}
                          <a
                            href={successBooking[0].notification.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-900 underline break-all"
                          >
                            open email
                          </a>
                        </>
                      ) : successBooking?.[0]?.notification?.success === false ? (
                        <> Delivery failed — contact the business.</>
                      ) : (
                        <> Check your inbox and spam folder.</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-zinc-600">
                  <p><span className="text-zinc-500">Customer:</span> {custName}</p>
                  <p><span className="text-zinc-500">Service:</span> {selectedService ? getBookingServiceLabel(selectedService, selectedVariant) : ""}</p>
                  <p><span className="text-zinc-500">Specialist:</span> {selectedStaff?.name}</p>
                  <p>
                    <span className="text-zinc-500">Payment:</span>{" "}
                    {paymentMethod === "gcash" ? `₱${downpaymentPaid} via GCash` : "Pay on arrival"}
                  </p>
                </div>
                {paymentMethod === "gcash" && (
                  <p className="text-zinc-600">
                    <span className="text-zinc-500">GCash ref:</span>{" "}
                    <span className="font-mono text-zinc-900">{gcashTxnRef}</span>
                  </p>
                )}
                <div className="pt-1 space-y-1 text-zinc-600">
                  <p className="text-zinc-500 font-medium">Reserved slots</p>
                  {selectedSlots.map((slot, sIdx) => (
                    <p key={sIdx} className="font-mono text-xs text-zinc-800">
                      {slot.date} · {formatTimeSlot(slot.timeSlot)} · ₱{unitPrice}
                    </p>
                  ))}
                </div>
              </div>

              <button id="celebrate-close-btn" onClick={onClose} className="ui-btn-primary w-full">
                Return to studio home
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer with Actions Toggle */}
        {step < 5 && (
          <div className="wizard-footer">
            <button
              id="prev-step-btn"
              onClick={handlePrev}
              className="ui-btn"
            >
              {step === 1 || (step === 2 && canSkipServiceStep) ? "Cancel" : "Back"}
            </button>

            {step < 4 ? (
              <button
                id="next-step-btn"
                onClick={handleNext}
                disabled={
                  (step === 1 && !serviceReady) ||
                  (step === 2 && !selectedStaff) ||
                  (step === 3 && selectedSlots.length === 0)
                }
                className={`ui-btn-primary ${
                  ((step === 1 && !serviceReady) ||
                   (step === 2 && !selectedStaff) ||
                   (step === 3 && selectedSlots.length === 0))
                    ? "opacity-50 cursor-not-allowed hover:bg-zinc-900"
                    : ""
                }`}
              >
                Continue
              </button>
            ) : (
              <button
                id="execute-booking-btn"
                onClick={executeBooking}
                disabled={loading}
                className={`ui-btn-primary ${
                  loading 
                    ? "opacity-50 cursor-not-allowed animate-pulse" 
                    : ""
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
