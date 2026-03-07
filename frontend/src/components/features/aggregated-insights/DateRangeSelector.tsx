import React from 'react';

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
    <div className="flex items-center space-x-4">
      <select
        value={value}
        onChange={handleRangeChange}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="last_7_days">Last 7 days</option>
        <option value="last_30_days">Last 30 days</option>
        <option value="last_90_days">Last 90 days</option>
        <option value="custom">Custom range</option>
      </select>
      {value === 'custom' && (
        <>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onChange('custom', e.target.value, endDate)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onChange('custom', startDate, e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </>
      )}
    </div>
  );
};