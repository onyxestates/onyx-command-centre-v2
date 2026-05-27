"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface TrendChartCardProps<T extends object> {
  title: string;
  data: T[];
  dataKey: keyof T & string;
}

export function TrendChartCard<T extends object>({ title, data, dataKey }: TrendChartCardProps<T>) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-zinc-500">Last 6 periods</span>
      </div>
      <div className="h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="onyxArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a45c" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#c9a45c" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#101010", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} />
            <Area dataKey={dataKey as string} type="monotone" stroke="#c9a45c" fill="url(#onyxArea)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
