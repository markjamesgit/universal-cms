import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  clearable?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  id,
  clearable = false,
}: SearchInputProps) {
  return (
    <div className={`ui-search ${className}`}>
      <Search className="ui-search-icon" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`ui-search-input ${clearable && value ? "pr-16" : ""}`}
      />
      {clearable && value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}
