import React from 'react';
import type { CorrelationInsight } from '../../../types/insights';

interface Props {
  insights: CorrelationInsight[];
}

export const CorrelationInsights: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">
        No correlation insights available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div key={index} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h4 className="text-md font-semibold text-blue-800">{insight.title}</h4>
          <p className="mt-1 text-sm text-blue-700">{insight.description}</p>
          {insight.correlation_coefficient !== undefined && (
            <div className="mt-2 flex space-x-4 text-xs text-blue-600">
              <span>r = {insight.correlation_coefficient.toFixed(3)}</span>
              <span>p = {insight.p_value?.toFixed(4)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};