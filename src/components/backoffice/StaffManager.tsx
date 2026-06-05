import React, { useState } from "react";
import { Trash2, Users } from "lucide-react";
import { Staff, Booking, BusinessTenant } from "../../types";

interface StaffManagerProps {
  staff: Staff[];
  bookings: Booking[];
  activeBusiness: BusinessTenant;
  handleCreateStaff: (e: React.FormEvent, staffDetails: {
    name: string;
    photo: string;
    position: string;
    workingHours: { start: string; end: string };
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
    workingHours: { start: "09:00", end: "18:00" },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.position) {
      alert("Name and positioning details are mandatory.");
      return;
    }
    try {
      await handleCreateStaff(e, form);
      setForm({ name: "", photo: "", position: "", workingHours: { start: "09:00", end: "18:00" } });
      setFormOpen(false);
    } catch (err: any) {
      alert("Failed enrolling specialist: " + err.message);
    }
  };

  return (
    <div className="ui-card-pad space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="ui-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-600" />
            Manage Specialist Roster
          </h2>
          <p className="ui-subtext mt-1">
            Enroll specialists, edit shift timings, and monitor active booking workloads.
          </p>
        </div>
        <button onClick={() => setFormOpen(!formOpen)} className="ui-btn-primary text-xs self-start sm:self-center">
          {formOpen ? "Close Panel" : "Add Specialist"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="bg-zinc-50 p-6 border border-zinc-200 rounded-lg max-w-xl space-y-4">
          <h3 className="font-medium text-zinc-900 text-sm">Specialist Enrollment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="ui-label">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tiffany Vance"
                className="ui-input"
              />
            </div>
            <div className="space-y-1">
              <label className="ui-label">Title / Position *</label>
              <input
                type="text"
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Master Stylist"
                className="ui-input"
              />
            </div>
            <div className="space-y-1">
              <label className="ui-label">Shift Starts (HH:MM)</label>
              <input
                type="text"
                required
                value={form.workingHours.start}
                onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, start: e.target.value } })}
                className="ui-input"
              />
            </div>
            <div className="space-y-1">
              <label className="ui-label">Shift Ends (HH:MM)</label>
              <input
                type="text"
                required
                value={form.workingHours.end}
                onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, end: e.target.value } })}
                className="ui-input"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="ui-label">Profile Photo URL</label>
            <input
              type="url"
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
              placeholder="e.g. https://images.unsplash.com/photo-..."
              className="ui-input"
            />
          </div>
          <button type="submit" className="ui-btn-primary">
            Enlist Specialist
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
            Roster is empty. Tap "Add Specialist" to register team members.
          </div>
        ) : (
          staff.map((st) => {
            const activeApptsCount = bookings.filter(
              (b) => b.staffId === st.id && b.status !== "cancelled"
            ).length;
            return (
              <div
                key={st.id}
                className="p-5 bg-white border border-zinc-200 rounded-lg relative transition-colors hover:border-zinc-300"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={st.photo || undefined}
                    alt={st.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-zinc-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-zinc-900 truncate">{st.name}</h4>
                    <p className="text-sm text-zinc-500 truncate mt-0.5">{st.position}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-zinc-600">
                      <span>★</span>
                      <span>{st.rating.toFixed(2)} rating</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200 space-y-2 text-sm text-zinc-500">
                  <p className="flex justify-between">
                    <span>Shift Hours</span>
                    <strong className="text-zinc-900">{st.workingHours.start} - {st.workingHours.end}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Active Appointments</span>
                    <strong className="text-zinc-900">{activeApptsCount} sessions</strong>
                  </p>
                  <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-xs">Availability</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateStaffAvailability(st.id, true)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          st.available !== false ? "ui-badge ui-badge-success" : "ui-badge"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStaffAvailability(st.id, false)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          st.available === false ? "ui-badge ui-badge-danger" : "ui-badge"
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
                    className="ui-btn-ghost p-1 text-red-600"
                    title="Remove Specialist"
                  >
                    <Trash2 className="w-4 h-4" />
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
