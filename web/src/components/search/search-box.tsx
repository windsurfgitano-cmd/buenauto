'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBoxProps {
  brands: string[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

export function SearchBox({ brands }: SearchBoxProps) {
  const router = useRouter();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model.trim()) params.set('model', model.trim());
    if (year) {
      params.set('minYear', year);
      params.set('maxYear', year);
    }
    const queryString = params.toString();
    router.push(`/autos${queryString ? '?' + queryString : ''}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className="mx-auto max-w-4xl rounded-lg bg-white p-4 shadow-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Marca"
          className="w-full rounded-lg border border-gray-200 p-3 text-gray-700"
        >
          <option value="">Marca</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Modelo (ej: Corolla)"
          aria-label="Modelo"
          className="w-full rounded-lg border border-gray-200 p-3 text-gray-700 placeholder:text-gray-400"
        />

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Año"
          className="w-full rounded-lg border border-gray-200 p-3 text-gray-700"
        >
          <option value="">Año</option>
          {YEARS.map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full cursor-pointer rounded-lg bg-[#c9a962] p-3 text-center font-semibold text-[#0f172a] transition hover:bg-[#d4af37]"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
