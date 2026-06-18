"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/app/components/ui/input";

interface SuggestionInputProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function SuggestionInput({
  value,
  onChange,
  suggestions,
  disabled,
  placeholder,
  icon,
}: SuggestionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pencarian case-insensitive
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Ketik atau pilih..."}
          disabled={disabled}
          className={`border-emerald-200 focus:border-emerald-500 ${icon ? "pl-9 pr-10" : "pr-10"}`}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setIsOpen(true);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 w-full bg-white border border-emerald-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto"
          >
            {value.trim() &&
              !suggestions.some((s) => s.toLowerCase() === value.toLowerCase()) && (
                <div className="px-3 py-2 bg-emerald-50 text-emerald-700 text-sm border-b border-emerald-100 flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />
                  <span>Gunakan baru: <strong>&quot;{value}&quot;</strong></span>
                </div>
              )}
            {filtered.map((s) => (
              <div
                key={s}
                onMouseDown={(e) => {
                  // ✅ Jangan prevent default, tapi stop propagation
                  e.stopPropagation();
                }}
                onClick={() => {
                  onChange(s);
                  setIsOpen(false);
                }}
                className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm border-b border-emerald-50 last:border-0"
              >
                {s}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}