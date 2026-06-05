import React, { useState } from "react";
import { Trash2, Users, Sparkles, UserCheck } from "lucide-react";
import { Staff, Booking, BusinessTenant } from "../../types";

interface StaffManagerProps {
  staff: Staff[];
  bookings: Booking[];
  activeBusiness: BusinessTenant;
  handleCreateStaff: (e: React.FormEvent, staffDetails: {
    name: string;
    photo: string;
    position: string;
    workingHours: {
      start: string;
      end: string;
    };
  }) => Promise<void>;
  handleDeleteStaff: (id: string) => void;
  handleUpdateStaffAvailability: (id: string, available: boolean) => void;
}

export default function StaffManager({
  staff,
  bookings,
  activeBusiness,
  handleCreateStaff,
  handleDeleteStaff,
  handleUpdateStaffAvailability,
}: StaffManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    photo: "",
    position: "",
    workingHours: {
      start: "09:00",
      end: "18:00",
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.position) {
      alert("Name and positioning details are mandatory.");
      return;
    }
    try {
      await handleCreateStaff(e, form);
      // Reset form
      setForm({
        name: "",
        photo: "",
        position: "",
        workingHours: {
          start: "09:00",
          end: "18:00",
        },
      });
      setFormOpen(false);
    } catch (err: any) {
      alert("Failed enrolling specialist: " + err.message);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Manage Specialist Roster
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enroll specialists, edit profile ratings, operational shift timings, and monitor active booking workloads.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center font-sans"
        >
          {formOpen ? "Close Panel" : "Enlist Specialist"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="bg-white/5 p-6 border border-white/10 rounded-2xl max-w-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono flex items-center gap-1.5">
            Specialist Enrollment Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Full Specialist Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tiffany Vance"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Title / Position *</label>
              <input
                type="text"
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Master Botanical Aromatherapist"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Shift Starts At (HH:MM)</label>
              <input
                type="text"
                required
                value={form.workingHours.start}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workingHours: { ...form.workingHours, start: e.target.value },
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Shift Ends At (HH:MM)</label>
              <input
                type="text"
                required
                value={form.workingHours.end}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workingHours: { ...form.workingHours, end: e.target.value },
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold">Profile Photo URL</label>
            <input
              type="url"
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
              placeholder="e.g. https://images.unsplash.com/photo-..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-mono focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            Enlist Specialist
          </button>
        </form>
      )}

      {/* Staff Cards Lists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
            Roster is empty. Tap the "Enlist Specialist" button above to register team members.
          </div>
        ) : (
          staff.map((st) => {
            const activeApptsCount = bookings.filter(
              (b) => b.staffId === st.id && b.status !== "cancelled"
            ).length;
            return (
              <div
                key={st.id}
                className="p-5 bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-2xl relative block transition-all"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={st.photo || undefined}
                    alt={st.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/20 shadow-md shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-white text-md tracking-tight leading-snug truncate">
                      {st.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-tight mt-1 truncate">{st.position}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-yellow-500 font-semibold font-mono">
                      <span>★</span>
                      <span>{st.rating.toFixed(2)} rating</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs text-slate-400 font-mono">
                  <p className="flex justify-between">
                    <span>Shift Hours:</span>{" "}
                    <strong className="text-slate-200">
                      {st.workingHours.start} - {st.workingHours.end}
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Active Appointments:</span>{" "}
                    <strong className="text-indigo-400">{activeApptsCount} sessions</strong>
                  </p>
                  <div className="flex justify-between items-center bg-white/[0.02] p-1.5 px-2 rounded-lg mt-1 border border-white/5">
                    <span>Availability Status:</span>{" "}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateStaffAvailability(st.id, true)}
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          st.available !== false
                            ? "bg-emerald-600 text-white border border-emerald-500 shadow-sm font-extrabold"
                            : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStaffAvailability(st.id, false)}
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          st.available === false
                            ? "bg-rose-600 text-white border border-rose-500 shadow-sm font-extrabold"
                            : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleDeleteStaff(st.id)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                    title="Remove Specialist"
                  >
                    <Trash2 className="w-4 h-4 text-rose-450" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
