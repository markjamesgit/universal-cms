import React from "react";
import { getVisiblePages } from "../../lib/pagination";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
}: PaginationBarProps) {
  if (totalItems <= pageSize) return null;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="ui-pagination">
      <p className="ui-pagination-summary">
        Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of{" "}
        <strong>{totalItems}</strong> {itemLabel}
      </p>
      <div className="ui-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="ui-btn ui-pagination-btn"
        >
          Previous
        </button>
        {visiblePages.map((page, idx) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="ui-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`ui-btn ui-pagination-btn ${currentPage === page ? "ui-pagination-btn-active" : ""}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="ui-btn ui-pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
}
