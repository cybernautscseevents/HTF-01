export default function BeforeNetwork() {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-lg border border-slate-800 bg-[#071019]">

      <div className="absolute left-4 top-4">
        <p className="text-xs font-semibold text-white">
          Before Intervention
        </p>

        <p className="mt-1 text-[9px] text-slate-600">
          Current simulated network
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

      {/* Selected relay */}
      <Node
        label="B"
        role="Relay"
        position="left-[52%] top-[50%]"
        type="selected"
      />

      {/* Mules */}
      <Node
        label="C"
        role="Mule"
        position="left-[73%] top-[32%]"
        type="mule"
      />

      <Node
        label="D"
        role="Mule"
        position="left-[73%] top-[50%]"
        type="mule"
      />

      <Node
        label="E"
        role="Mule"
        position="left-[73%] top-[68%]"
        type="mule"
      />

      {/* Connections */}
      <Line
        position="left-[14%] top-[48%] w-[16%]"
      />

      <Line
        position="left-[14%] top-[65%] w-[16%]"
      />

      <Line
        position="left-[36%] top-[53%] w-[16%]"
      />

      <Line
        position="left-[58%] top-[36%] w-[16%] rotate-[-20deg]"
      />

      <Line
        position="left-[58%] top-[53%] w-[16%]"
      />

      <Line
        position="left-[58%] top-[70%] w-[16%] rotate-[20deg]"
      />

      <div className="absolute bottom-4 left-4 rounded bg-red-500/10 px-2 py-1 text-[9px] text-red-400">
        BX7821 selected for simulation
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
  type: "victim" | "danger" | "selected" | "mule";
}) {
  const styles = {
    victim: "border-blue-500 bg-blue-500/10 text-blue-400",
    danger: "border-red-500 bg-red-500/10 text-red-400",
    selected:
      "border-red-400 bg-red-500/20 text-red-300 ring-2 ring-red-500/20",
    mule: "border-amber-500 bg-amber-500/10 text-amber-400",
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

      <span className="mt-1 text-[8px] text-slate-500">
        {role}
      </span>
    </div>
  );
}

function Line({
  position,
}: {
  position: string;
}) {
  return (
    <div
      className={`absolute ${position} z-0 h-px origin-left bg-slate-600`}
    />
  );
}