"use client";

import { Check } from "lucide-react";
import { cardDark } from "./theme";

export type Task = { id: number; label: string; done: boolean };

export function TasksChecklist({
  tasks,
  onToggle,
}: {
  tasks: Task[];
  onToggle: (id: number) => void;
}) {
  return (
    <section className={cardDark}>
      <h2 className="font-bold text-white">Today&apos;s tasks</h2>
      <p className="mb-4 text-xs text-white/40">
        A checklist shared across warehouse operations
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onToggle(task.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] p-3 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                task.done
                  ? "border-[#C6FF3D] bg-[#C6FF3D] text-[#0E1211]"
                  : "border-white/20"
              }`}
            >
              {task.done && <Check size={13} />}
            </span>
            <span
              className={`text-sm font-medium ${
                task.done ? "text-white/30 line-through" : "text-white/80"
              }`}
            >
              {task.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
