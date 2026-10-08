import AppShell from "@/components/layout/AppShell";
import ReportHeader from "@/components/reports/ReportHeader";
import ReportSummary from "@/components/reports/ReportSummary";
import ReportFindings from "@/components/reports/ReportFindings";
import ExportActions from "@/components/reports/ExportActions";

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <ReportHeader />

        <ReportSummary />

        <ReportFindings />

        <ExportActions />
      </div>
    </AppShell>
  );
}