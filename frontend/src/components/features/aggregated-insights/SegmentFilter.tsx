import React from 'react';
import { Users } from 'lucide-react';

interface SegmentFilterProps {
  ageGroup?: string;
  onChange: (ageGroup?: string) => void;
}

const ageGroups = [
  { value: '', label: 'All ages' },
  { value: '0-17', label: '0-17' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-49', label: '35-49' },
  { value: '50+', label: '50+' },
  { value: 'unknown', label: 'Unknown' },
];

export const SegmentFilter: React.FC<SegmentFilterProps> = ({ ageGroup, onChange }) => {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-bold text-slate-500 tracking-wider">Age group:</span>
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/10 rounded-lg border border-border transition-all focus-within:ring-2 focus-within:ring-primary/20">
        <Users size={16} className="text-primary" />
        <select
          value={ageGroup || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
        >
          {ageGroups.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};