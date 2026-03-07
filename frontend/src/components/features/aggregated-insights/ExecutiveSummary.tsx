import React from 'react';
import type { ExecutiveSummary } from '../../../types/insights';

interface Props {
  data: ExecutiveSummary;
}

export const ExecutiveSummaryCards: React.FC<Props> = ({ data }) => {
  const cards = [
    {
      title: 'Active Users',
      value: data.total_active_users,
      icon: '👥',
    },
    {
      title: 'Average Mood',
      value: data.average_mood !== null ? data.average_mood.toFixed(2) : 'N/A',
      icon: '😊',
    },
    {
      title: 'Total Interactions',
      value: data.total_interactions.toLocaleString(),
      icon: '📊',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="overflow-hidden rounded-lg bg-white shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">{card.icon}</div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};