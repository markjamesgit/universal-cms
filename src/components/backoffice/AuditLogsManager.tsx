import React, { useState } from "react";
import { RefreshCw, ShieldAlert, History, Search } from "lucide-react";
import { AuditLog } from "../../types";

interface AuditLogsManagerProps {
  auditLogs: AuditLog[];
  fetchAuditLogs: () => void;
}

export default function AuditLogsManager({ auditLogs, fetchAuditLogs }: AuditLogsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filter logs by search query (checks Action, Details, and Actor)
  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset page relative to search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            System Activity History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            A secure record of updates, administrative changes, and actions performed within your system.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2 bg-[#121216] hover:bg-white/10 text-white hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/10 font-sans cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload History
        </button>
      </div>

      {/* Filter and Aligned Controls */}
      <div className="relative max-w-md bg-white/[0.02] p-1.5 border border-white/5 rounded-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search logs by activity name, details, or person..."
          className="w-full bg-transparent border-0 pl-11 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-0 font-sans"
        />
      </div>

      <div className="space-y-3">
        {paginatedLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs italic border border-dashed border-white/10 rounded-2xl">
            No activity log history found.
          </div>
        ) : (
          paginatedLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl text-xs space-y-2.5 transition-all"
            >
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="font-bold text-[#e0e7ff] bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-tight">
                  {log.action}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-205 font-medium leading-relaxed font-sans">{log.details}</p>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1 font-sans">
                <span>
                  Performed by: <strong className="text-slate-300 font-bold">{log.actor}</strong>
                </span>
                <span>•</span>
                <span>
                  Log ID: <span className="text-slate-400 font-mono">{log.id}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination control footer bar */}
      {filteredLogs.length > pageSize && (
        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="font-sans">
            Showing <strong className="text-white">{startIndex + 1}</strong> to{" "}
            <strong className="text-white">
              {Math.min(startIndex + pageSize, filteredLogs.length)}
            </strong>{" "}
            of <strong className="text-white">{filteredLogs.length}</strong> total history logs
          </p>
          <div className="flex items-center gap-1.5 font-sans">
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
