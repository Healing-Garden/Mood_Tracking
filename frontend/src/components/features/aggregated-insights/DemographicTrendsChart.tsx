import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data?: Record<string, number>;
}

export const DemographicTrendsChart: React.FC<Props> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <div className="text-center text-gray-500">No demographic data available</div>;
  }

  const chartData = Object.entries(data).map(([age, mood]) => ({
    age,
    mood: Number(mood.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" />
        <YAxis domain={[-1, 1]} />
        <Tooltip />
        <Bar dataKey="mood" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};