import React, { useState } from "react";
import { Mail, Phone, Users } from "lucide-react";
import { Customer } from "../../types";
import SearchInput from "../ui/SearchInput";
import PaginationBar from "../ui/PaginationBar";

interface CrmGuestsProps {
  customers: Customer[];
}

export default function CrmGuests({ customers }: CrmGuestsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTagFilter]);

  const totalPages = Math.ceil(filteredGuests.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedGuests = filteredGuests.slice(startIndex, startIndex + pageSize);

  return (
    <div className="ui-card-pad space-y-6">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="ui-heading flex items-center gap-2">
          <Users className="w-5 h-5 text-zinc-600" />
          Client Directory
        </h2>
        <p className="ui-subtext mt-1">
          View guest details, contact information, lifetime spending, and treatment notes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-lg items-center">
        <div className="sm:col-span-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search clients by name, email, or phone..."
          />
        </div>
        <select
          value={selectedTagFilter}
          onChange={(e) => setSelectedTagFilter(e.target.value)}
          className="ui-input"
        >
          <option value="all">All Tags</option>
          {uniqueTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {paginatedGuests.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
            No customer profiles matched your search.
          </div>
        ) : (
          paginatedGuests.map((cust) => (
            <div
              key={cust.id}
              className="p-5 bg-white border border-zinc-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-zinc-50 transition-colors"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-zinc-900">{cust.name}</span>
                  <div className="flex gap-1">
                    {cust.tags.map((t) => (
                      <span key={t} className="ui-badge">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-zinc-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {cust.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {cust.phone || "No Mobile"}
                  </span>
                  <span>
                    Last visit: <strong className="text-zinc-900">{cust.lastAppointment || "None"}</strong>
                  </span>
                </div>
                {cust.notes && (
                  <div className="text-sm bg-zinc-50 text-zinc-600 p-3 rounded-lg mt-3 max-w-3xl border border-zinc-200">
                    <strong>Notes:</strong> "{cust.notes}"
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center md:flex-col justify-between md:justify-center w-full md:w-auto bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-lg min-w-[140px] text-right">
                <span className="ui-label">Lifetime Spend</span>
                <span className="text-xl font-semibold text-emerald-700 block mt-1">
                  ₱{cust.totalSpending}.00
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredGuests.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="clients"
      />
    </div>
  );
}
