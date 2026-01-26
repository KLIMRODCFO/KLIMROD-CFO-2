import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabaseClient";

interface FoodGodItem {
  id: string;
  item_name: string;
  variety: string;
  subcategory_id: string;
  purchase_uom_id: string;
  usage_uom_id: string;
  yield_percentage: number | null;
}

interface Props {
  onSelect: (item: FoodGodItem | null) => void;
  onInputChange?: (value: string) => void;
  activeBU?: string | null;
}

export const FoodGodAutocomplete: React.FC<Props> = ({ onSelect, activeBU }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodGodItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2 || !activeBU) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    console.log('[FoodGodAutocomplete] activeBU:', activeBU, 'query:', query);
    supabase
      .from("master_inventory_food")
      .select("id, item_name, variety, subcategory_id, purchase_uom_id, usage_uom_id, conversion_factor, specifications, created_at, yield_percentage, food_god_id, bu_id, category_id")
      .ilike("item_name", `%${query}%`)
      .eq("bu_id", activeBU)
      .then(({ data, error }) => {
        console.log('[FoodGodAutocomplete] supabase data:', data, 'error:', error);
        if (error) {
          setResults([]);
          setShowDropdown(false);
          setLoading(false);
          return;
        }
        // Mostrar solo un item_name único (primer registro de cada nombre)
        const uniqueMap = new Map();
        (data || []).forEach((item: any) => {
          if (!uniqueMap.has(item.item_name)) {
            uniqueMap.set(item.item_name, item);
          }
        });
        setResults(Array.from(uniqueMap.values()));
        setShowDropdown(true);
        setLoading(false);
      });
  }, [query, activeBU]);

  const handleSelect = (item: any) => {
    setQuery(item.item_name);
    setShowDropdown(false);
    setHighlightedIdx(-1);
    onSelect(item);
  };

  // Portal dropdown rendering
  const [dropdownPos, setDropdownPos] = useState<{left: number, top: number, width: number}>({left: 0, top: 0, width: 0});
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY,
        width: rect.width
      });
    }
  }, [showDropdown, results]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx(idx => Math.min(idx + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx(idx => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      if (highlightedIdx >= 0 && highlightedIdx < results.length) {
        handleSelect(results[highlightedIdx]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black h-12"
            className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black h-10"
          type="text"
          placeholder="Item name..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onSelect(null);
            if (typeof (props.onInputChange) === 'function') {
              props.onInputChange(e.target.value);
            }
          }}
          onFocus={() => setShowDropdown(results.length > 0)}
          onBlur={() => {
            setShowDropdown(false);
            // Si el valor escrito no es exactamente uno de los item_name válidos, limpia el campo
            const match = results.find(r => r.item_name.toLowerCase() === query.trim().toLowerCase());
            if (!match) {
              setQuery("");
              onSelect(null);
            } else {
              // Si el valor coincide, fuerza la selección
              handleSelect(match);
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showDropdown && createPortal(
        <div
          className="bg-white border rounded shadow z-[9999]"
          style={{
            position: 'absolute',
            left: dropdownPos.left,
            top: dropdownPos.top,
            width: dropdownPos.width,
            maxHeight: 'none',
            overflowY: 'visible',
          }}
        >
          {loading && <div className="p-2 text-neutral-400">Searching...</div>}
          {results.map((item, i) => (
            <div
              key={item.item_name}
              className={
                "p-2 cursor-pointer text-xs " +
                (highlightedIdx === i ? "bg-neutral-200" : "hover:bg-neutral-100")
              }
              onMouseDown={e => {
                e.preventDefault();
                setShowDropdown(false);
                handleSelect(item);
              }}
              onMouseEnter={() => setHighlightedIdx(i)}
            >
              {item.item_name.toUpperCase()}
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="p-2 text-neutral-400">No matches. Create new item?</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
