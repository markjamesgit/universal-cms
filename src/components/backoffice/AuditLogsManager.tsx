import React, { useState } from "react";

import { RefreshCw, History } from "lucide-react";

import { AuditLog } from "../../types";

import SearchInput from "../ui/SearchInput";

import PaginationBar from "../ui/PaginationBar";



interface AuditLogsManagerProps {

  auditLogs: AuditLog[];

  fetchAuditLogs: () => void;

}



export default function AuditLogsManager({ auditLogs, fetchAuditLogs }: AuditLogsManagerProps) {

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;



  const filteredLogs = auditLogs.filter(

    (log) =>

      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||

      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||

      log.actor.toLowerCase().includes(searchQuery.toLowerCase())

  );



  React.useEffect(() => {

    setCurrentPage(1);

  }, [searchQuery]);



  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);



  return (

    <div className="ui-card-pad space-y-6">

      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-200 pb-4 gap-3">

        <div>

          <h2 className="ui-heading flex items-center gap-2">

            <History className="w-5 h-5 text-zinc-600" />

            Activity History

          </h2>

          <p className="ui-subtext mt-1">

            A record of updates, administrative changes, and actions in your system.

          </p>

        </div>

        <button type="button" onClick={fetchAuditLogs} className="ui-btn text-xs self-start">

          <RefreshCw className="w-3.5 h-3.5" /> Reload

        </button>

      </div>



      <SearchInput

        value={searchQuery}

        onChange={setSearchQuery}

        placeholder="Search by activity, details, or person..."

        className="max-w-md"

      />



      <div className="space-y-3">

        {paginatedLogs.length === 0 ? (

          <div className="p-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg">

            No activity logs found.

          </div>

        ) : (

          paginatedLogs.map((log) => (

            <div

              key={log.id}

              className="p-4 bg-white border border-zinc-200 rounded-lg text-sm space-y-2 hover:bg-zinc-50 transition-colors"

            >

              <div className="flex justify-between items-center flex-wrap gap-2">

                <span className="ui-badge">{log.action}</span>

                <span className="text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</span>

              </div>

              <p className="text-zinc-700 leading-relaxed">{log.details}</p>

              <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-200 flex flex-wrap gap-x-4 gap-y-1">

                <span>

                  By: <strong className="text-zinc-700">{log.actor}</strong>

                </span>

                <span>ID: <span className="text-zinc-600">{log.id}</span></span>

              </div>

            </div>

          ))

        )}

      </div>



      <PaginationBar

        currentPage={currentPage}

        totalPages={totalPages}

        totalItems={filteredLogs.length}

        pageSize={pageSize}

        onPageChange={setCurrentPage}

        itemLabel="logs"

      />

    </div>

  );

}


