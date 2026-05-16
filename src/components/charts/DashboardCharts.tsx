import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { CategoryData, DailyData } from '../../types';
import { formatCurrency, formatCompact } from '../../utils/currency';

const PIE_COLORS = ['#9b3f5a', '#146a5f', '#4d44e3', '#f97316', '#ec4899', '#eab308', '#3b82f6', '#14b8a6', '#a855f7'];

interface DashboardChartsProps {
  dailyData: DailyData[];
  topCategories: CategoryData[];
  savingsRate: number;
  onOpenReports: () => void;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-2xl p-3 shadow-lg border border-[#ffd9e0]/40 text-xs">
      <p className="font-semibold text-[#544245] mb-1">Ngày {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.dataKey === 'income' ? '↑ Thu' : '↓ Chi'}: {formatCompact(p.value)}
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({ dailyData, topCategories, savingsRate, onOpenReports }: DashboardChartsProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return <g><Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} /></g>;
  };

  return (
    <>
      <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Phân tích chi tiêu</h2>
          <div className="flex gap-3 text-[10px] text-[#877275]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#89d4c7' }} />Thu</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#ff8fab' }} />Chi</span>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} barGap={1} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#877275' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" fill="#89d4c7" radius={[4, 4, 0, 0]} maxBarSize={10} />
              <Bar dataKey="expense" fill="#ff8fab" radius={[4, 4, 0, 0]} maxBarSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pt-3 border-t border-[#f8f2f4] flex justify-between text-[10px] text-[#877275] mt-1">
          <span>Tổng danh mục: {topCategories.length}</span>
          <span className="flex items-center gap-1">
            {savingsRate >= 20 ? 'Chi tiêu lành mạnh' : 'Theo dõi chi tiêu'}
          </span>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Chi tiêu theo danh mục</h2>
            <button onClick={onOpenReports} className="text-xs text-[#9b3f5a] font-semibold">Báo cáo →</button>
          </div>

          <div className="lg:flex lg:gap-6 lg:items-center">
            <div className="h-52 lg:w-52 lg:flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    dataKey="amount" paddingAngle={3}
                    activeIndex={activePieIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActivePieIndex(i)}
                    onMouseLeave={() => setActivePieIndex(undefined)}
                  >
                    {topCategories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _: any, props: any) => [formatCurrency(value), props.payload.name]}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(155,63,90,0.12)', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <CategoryLegend topCategories={topCategories} />
          </div>
        </div>
      )}
    </>
  );
}

function CategoryLegend({ topCategories }: Pick<DashboardChartsProps, 'topCategories'>) {
  return (
    <div className="flex-1 space-y-2 mt-2 lg:mt-0">
      {topCategories.map((cat, i) => (
        <div key={cat.categoryId} className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
          <span className="w-6 text-center text-sm">{cat.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-0.5">
              <p className="text-xs font-semibold text-[#1d1b1d] truncate">{cat.name}</p>
              <p className="text-xs font-bold text-[#544245] ml-2 flex-shrink-0">{cat.percentage.toFixed(0)}%</p>
            </div>
            <div className="h-1.5 bg-[#f8f2f4] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-[#877275] flex-shrink-0 w-16 text-right">{formatCompact(cat.amount)}</p>
        </div>
      ))}
    </div>
  );
}
