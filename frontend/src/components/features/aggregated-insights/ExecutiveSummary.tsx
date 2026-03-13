import React from 'react';
import type { ExecutiveSummary } from '../../../types/insights';
import { Users, Smile, BarChart3 } from 'lucide-react';

interface Props {
  data: ExecutiveSummary;
}

export const ExecutiveSummaryCards: React.FC<Props> = ({ data }) => {
  const cards = [
    {
      title: 'Active Users',
      value: data.total_active_users,
      icon: <Users size={28} className="text-indigo-600" />,
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Average Mood',
      value: data.average_mood !== null ? data.average_mood.toFixed(2) : 'N/A',
      icon: <Smile size={28} className="text-amber-500" />,
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Total Interactions',
      value: data.total_interactions.toLocaleString(),
      icon: <BarChart3 size={28} className="text-rose-500" />,
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-border transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-5">
            <div className={`flex-shrink-0 p-3 rounded-2xl ${card.bgColor}`}>
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-2xl font-black text-foreground mt-0.5">
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};