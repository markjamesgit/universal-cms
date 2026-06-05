import React, { useState } from "react";
import { Mail, Phone, Search, Users, ShieldAlert, Star, DollarSign } from "lucide-react";
import { Customer } from "../../types";

interface CrmGuestsProps {
  customers: Customer[];
}

export default function CrmGuests({ customers }: CrmGuestsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Derive unique tags from all customers to build filter dropdown
  const uniqueTags = Array.from(
    new Set(customers.flatMap((c) => c.tags || []))
  );

  const filteredGuests = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag =
      selectedTagFilter === "all" ||
      c.tags.some(t => t.toLowerCase() === selectedTagFilter.toLowerCase());

    return matchesSearch && matchesTag;
  });

  // Reset page when filter triggers
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTagFilter]);

  // Pagination indexing
  const totalPages = Math.ceil(filteredGuests.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedGuests = filteredGuests.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-400" />
          Client Directory
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          View guest details, contact information, lifetime spending, and treatment notes.
        </p>
      </div>

      {/* Improved Aligned Search and Tag Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl items-center">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name, email, or phone number..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div className="space-y-1">
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-sans"
          >
            <option value="all">All Category Tags</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>
                Tag: {tag.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CRM Guest List Table/Cards */}
      <div className="space-y-4">
        {paginatedGuests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
            No customer profiles matched your current search parameters.
          </div>
        ) : (
          paginatedGuests.map((cust) => (
            <div
              key={cust.id}
              className="p-5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-md font-bold text-white leading-snug">{cust.name}</span>
                  <div className="flex gap-1">
                    {cust.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-indigo-500/15 text-indigo-400 text-[9px] uppercase font-black tracking-widest rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-405 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                  <span className="flex items-center gap-1.5 font-sans">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {cust.email}
                  </span>
                  <span className="flex items-center gap-1.5 font-sans">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {cust.phone || "No Mobile"}
                  </span>
                  <span>
                    Last visit: <strong className="text-white">{cust.lastAppointment || "None Logged"}</strong>
                  </span>
                </div>

                {cust.notes && (
                  <div className="text-xs bg-white/5 text-slate-350 p-3 rounded-lg mt-3 max-w-3xl font-light border border-white/5 leading-relaxed font-sans">
                    <strong>Guest Preference Notes:</strong> "{cust.notes}"
                  </div>
                )}
              </div>

              {/* Total Spending Badge */}
              <div className="shrink-0 flex items-center md:flex-col justify-between md:justify-center w-full md:w-auto bg-white/5 border border-white/5 px-4 py-3 rounded-xl min-w-[140px] text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold font-sans block">Lifetime Spend:</span>
                <span className="text-xl font-black text-emerald-400 block mt-1 font-mono shrink-0">
                  ₱{cust.totalSpending}.00
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination control footer bar */}
      {filteredGuests.length > pageSize && (
        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="font-sans">
            Showing <strong className="text-white">{startIndex + 1}</strong> to{" "}
            <strong className="text-white">
              {Math.min(startIndex + pageSize, filteredGuests.length)}
            </strong>{" "}
            of <strong className="text-white">{filteredGuests.length}</strong> total clients
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
        </div>
      )}

    </div>
  );
}
