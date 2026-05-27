import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <Card className="overflow-hidden">
      <div className="md:hidden">
        <div className="space-y-3 p-3">
          {rows.map((row, index) => (
            <div key={index} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
              <div className="space-y-3">
                {row.map((cell, cellIndex) => (
                  <div key={cellIndex} className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{columns[cellIndex]}</p>
                    <div className="text-sm text-zinc-200">{cell}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-white/6 text-left text-sm">
          <thead className="bg-white/3 text-zinc-400">
            <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-white/[0.02]">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
