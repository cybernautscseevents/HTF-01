import { CheckCircle2, AlertTriangle } from "lucide-react";

const findings = [
  "20 unique accounts sent funds into the aggregation account.",
  "Approximately 92% of received funds were forwarded downstream.",
  "Median holding time was approximately 47 seconds.",
  "The network contains a relay account connected to three downstream mule accounts.",
];

export default function ReportFindings() {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
        Key Findings
      </h2>

      <div className="space-y-3">
        {findings.map((finding, index) => (
          <div
            key={index}
            className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4"
          >
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <p className="text-sm leading-6 text-slate-300">
              {finding}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p className="text-sm leading-6 text-amber-200">
          These findings indicate suspicious network characteristics and
          should support investigator review. They do not constitute a
          definitive determination of fraud.
        </p>
      </div>
    </section>
  );
}