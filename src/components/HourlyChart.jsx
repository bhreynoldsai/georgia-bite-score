import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceDot } from 'recharts';

function colorFor(score) {
  if (score >= 76) return '#22c55e';
  if (score >= 56) return '#3b82f6';
  if (score >= 31) return '#f59e0b';
  return '#ef4444';
}

function hourLabel(h) {
  if (h === 0) return '12A';
  if (h === 12) return '12P';
  if (h < 12) return `${h}A`;
  return `${h - 12}P`;
}

export default function HourlyChart({ scores, currentHour, species }) {
  const data = scores.map((s, h) => ({
    hour: hourLabel(h),
    score: s ?? 0,
    h,
  }));

  // Find top 3 scoring hours for star labels.
  const topIndexes = scores
    .map((s, i) => ({ s: s ?? -1, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(d => d.i);

  return (
    <div className="bg-surface border border-edge rounded-xl p-4">
      <header className="flex items-center justify-between mb-2">
        <h4 className="text-heading font-semibold text-sm tracking-wide uppercase">24-Hour Outlook · {species}</h4>
        <span className="text-xs text-body/70">★ = top 3 windows</span>
      </header>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 18, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tick={{ fill: '#94afd4', fontSize: 10 }}
              interval={1}
              axisLine={{ stroke: '#1e3a5f' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#94afd4', fontSize: 10 }}
              axisLine={{ stroke: '#1e3a5f' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2eaf7', fontSize: 12 }}
              labelStyle={{ color: '#94afd4' }}
              cursor={{ fill: 'rgba(14,210,210,0.08)' }}
              formatter={(v) => [`${v}`, 'Score']}
            />
            <Bar dataKey="score" radius={[3, 3, 0, 0]}>
              {data.map((d) => {
                const isPast = d.h < currentHour;
                const isCurrent = d.h === currentHour;
                const fill = isCurrent ? '#ffffff' : colorFor(d.score);
                return (
                  <Cell
                    key={d.h}
                    fill={fill}
                    fillOpacity={isPast ? 0.45 : 1}
                  />
                );
              })}
            </Bar>
            {topIndexes.map(i => (
              <ReferenceDot
                key={i}
                x={data[i].hour}
                y={data[i].score + 6}
                r={0}
                label={{ value: '★', position: 'top', fill: '#facc15', fontSize: 12 }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
