import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  value: string;
  onChange: (range: string, start?: string, end?: string) => void;
  startDate?: string;
  endDate?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  startDate,
  endDate,
}) => {
  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    onChange(newRange, startDate, endDate);
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/10 rounded-lg border border-border">
        <Calendar size={16} className="text-primary" />
        <select
          value={value}
          onChange={handleRangeChange}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="last_7_days">Last 7 days</option>
          <option value="last_30_days">Last 30 days</option>
          <option value="last_90_days">Last 90 days</option>
          <option value="custom">Custom range</option>
        </select>
      </div>
      
      {value === 'custom' && (
        <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onChange('custom', e.target.value, endDate)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <span className="text-slate-400 font-bold">→</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onChange('custom', startDate, e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      )}
    </div>
  );
};