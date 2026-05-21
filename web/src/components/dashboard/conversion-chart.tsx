"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConversionChartProps {
  controlRate: number; // 0..1
  videoRate: number; // 0..1
}

export function ConversionChart({ controlRate, videoRate }: ConversionChartProps) {
  const data = [
    { name: 'Control', rate: Number((controlRate * 100).toFixed(1)) },
    { name: 'Video', rate: Number((videoRate * 100).toFixed(1)) },
  ];

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
            <Cell fill="#94a3b8" />
            <Cell fill="#10b981" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
