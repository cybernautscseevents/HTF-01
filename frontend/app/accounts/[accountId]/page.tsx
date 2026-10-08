import AppShell from "@/components/layout/AppShell";
import AccountHeader from "@/components/accounts/AccountHeader";
import RiskOverview from "@/components/accounts/RiskOverview";
import AccountTabs from "@/components/accounts/AccountTabs";
import RiskFactors from "@/components/accounts/RiskFactors";
import LinkedCases from "@/components/accounts/LinkedCases";

interface AccountPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

export default async function AccountPage({
  params,
}: AccountPageProps) {
  const { accountId } = await params;

  return (
    <AppShell>
      <div className="space-y-5">

        <AccountHeader accountId={accountId} />

        <RiskOverview />

        <AccountTabs />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RiskFactors />
          <LinkedCases />
        </div>

      </div>
    </AppShell>
  );
}