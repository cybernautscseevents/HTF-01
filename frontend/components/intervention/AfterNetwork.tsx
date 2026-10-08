import { LockKeyhole } from "lucide-react";

export default function AfterNetwork() {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-lg border border-slate-800 bg-[#071019]">

      <div className="absolute left-4 top-4">
        <p className="text-xs font-semibold text-white">
          After Intervention
        </p>

        <p className="mt-1 text-[9px] text-slate-600">
          Simulated result after freezing BX7821
        </p>
      </div>

      {/* Victims */}
      <Node
        label="V1"
        role="Victim"
        position="left-[8%] top-[42%]"
        type="victim"
      />

      <Node
        label="V2"
        role="Victim"
        position="left-[8%] top-[60%]"
        type="victim"
      />

      {/* Aggregator */}
      <Node
        label="A"
        role="Aggregator"
        position="left-[30%] top-[50%]"
        type="danger"
      />

      {/* Frozen account */}
      <div className="absolute left-[52%] top-[50%] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">

        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-500 bg-slate-800 text-slate-400">
          <LockKeyhole size={17} />
        </div>

        <span className="mt-1 text-[8px] text-slate-500">
          BX7821
        </span>

        <span className="mt-1 rounded bg-slate-700 px-1.5 py-0.5 text-[7px] text-slate-400">
          SIMULATED FREEZE
        </span>

      </div>

      {/* Disconnected downstream accounts */}
      <Node
        label="C"
        role="Downstream"
        position="left-[73%] top-[32%]"
        type="blocked"
      />

      <Node
        label="D"
        role="Downstream"
        position="left-[73%] top-[50%]"
        type="blocked"
      />

      <Node
        label="E"
        role="Downstream"
        position="left-[73%] top-[68%]"
        type="blocked"
      />

      {/* Active upstream connections */}
      <Line
        position="left-[14%] top-[48%] w-[16%]"
        active
      />

      <Line
        position="left-[14%] top-[65%] w-[16%]"
        active
      />

      <Line
        position="left-[36%] top-[53%] w-[16%]"
        active
      />

      {/* Blocked downstream connections */}
      <Line
        position="left-[58%] top-[36%] w-[16%]"
        blocked
      />

      <Line
        position="left-[58%] top-[53%] w-[16%]"
        blocked
      />

      <Line
        position="left-[58%] top-[70%] w-[16%]"
        blocked
      />

      <div className="absolute bottom-4 left-4 rounded bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-400">
        Downstream flow interrupted in simulation
      </div>
    </div>
  );
}

function Node({
  label,
  role,
  position,
  type,
}: {
  label: string;
  role: string;
  position: string;
  type: "victim" | "danger" | "blocked";
}) {
  const styles = {
    victim: "border-blue-500 bg-blue-500/10 text-blue-400",
    danger: "border-red-500 bg-red-500/10 text-red-400",
    blocked: "border-slate-700 bg-slate-800/80 text-slate-600",
  };

  return (
    <div
      className={`absolute ${position} z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold ${styles[type]}`}
      >
        {label}
      </div>

      <span className="mt-1 text-[8px] text-slate-600">
        {role}
      </span>
    </div>
  );
}

function Line({
  position,
  active = false,
  blocked = false,
}: {
  position: string;
  active?: boolean;
  blocked?: boolean;
}) {
  return (
    <div
      className={`absolute ${position} z-0 h-px origin-left ${
        blocked
          ? "border-t border-dashed border-slate-700 bg-transparent"
          : active
            ? "bg-slate-600"
            : "bg-slate-700"
      }`}
    />
  );
}