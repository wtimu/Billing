import { useState } from 'react';
import { Package } from '../lib/api';
import { formatCurrency } from '../lib/format';

interface PackageDropdownProps {
  packages: Package[];
  selected: Package | null;
  onSelect: (pkg: Package) => void;
  loading?: boolean;
}

export function PackageDropdown({ packages, selected, onSelect, loading }: PackageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-500">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
          </div>
          <div className="text-left">
            {selected ? (
              <>
                <div className="font-semibold text-gray-900">{selected.name}</div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(selected.priceUgx)} • {selected.durationMinutes ? `${selected.durationMinutes} min` : 'Unlimited'}
                </div>
              </>
            ) : (
              <div className="text-gray-500">Select a package...</div>
            )}
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => {
                onSelect(pkg);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selected?.id === pkg.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-green-400">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{pkg.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(pkg.priceUgx)}
                    {pkg.durationMinutes && ` • ${pkg.durationMinutes} minutes`}
                    {pkg.dataMb && ` • ${pkg.dataMb}MB`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}