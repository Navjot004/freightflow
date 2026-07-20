import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';

interface LocationSearchInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function LocationSearchInput({ id, name, value, onChange, placeholder, required }: LocationSearchInputProps) {
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length < 3 || skipSearchRef.current) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`);
        const data = await res.json();
        if (!skipSearchRef.current) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Location search failed', err);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative" ref={ref}>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          skipSearchRef.current = false;
          onChange(e.target.value); 
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {results.map((r: any, idx: number) => (
            <li
              key={idx}
              className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => {
                skipSearchRef.current = true;
                onChange(r.display_name);
                setIsOpen(false);
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
