const characteristics = [
  ["Network Depth", "4 hops"],
  ["Accounts", "10"],
  ["Transactions", "29"],
  ["Unique Senders", "20"],
  ["Unique Receivers", "4"],
  ["Total Value", "₹20,000"],
  ["Forwarded Value", "₹18,400"],
  ["Median Hold Time", "47 sec"],
];

export default function NetworkCharacteristics() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Network Characteristics
        </h3>

        <p className="mt-1 text-[10px] text-slate-500">
          Structural properties of the detected network
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">

        {characteristics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-slate-800 bg-[#071019] p-3"
          >
            <p className="text-[9px] text-slate-600">
              {label}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-200">
              {value}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}