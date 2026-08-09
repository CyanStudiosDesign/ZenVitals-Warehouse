
"use client";

import { STATUS_CLASS, STATUS_LABEL } from "../config";
import type { OrderStatus } from "../types/order";
import { cardDark } from "./theme";

export function FulfillmentProgress({
  statuses,
  counts,
  max,
}: {
  statuses: readonly OrderStatus[];
  counts: Record<OrderStatus, number>;
  max: number;
}) {
  return (
    <section className={cardDark}>
      <h2 className="font-bold text-white">Fulfillment progress</h2>
      <p className="mb-6 text-xs text-white/40">
        Live distribution across the warehouse pipeline
      </p>
      <div className="space-y-4">
        {statuses.map((status) => {
          const count = counts[status] ?? 0;
          return (
            <div key={status} className="grid grid-cols-[90px_1fr_36px] items-center gap-3">
              <span
                className={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#C6FF3D] transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="text-right text-sm font-bold text-white">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
