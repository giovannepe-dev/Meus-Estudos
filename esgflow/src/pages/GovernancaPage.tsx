import IndicatorModule from "@/components/IndicatorModule";
import { useEsgData } from "@/hooks/useEsgData";
import EsgRequirementsGuide, { governancaRequirements } from "@/components/EsgRequirementsGuide";

const GovernancaPage = () => {
  const { byCategory, loading } = useEsgData();
  return (
    <div className="space-y-6">
      <IndicatorModule
        title="Governança"
        description="Indicadores de governança da empresa"
        indicators={byCategory("governanca")}
        color="hsl(38, 92%, 50%)"
        loading={loading}
      />
      <EsgRequirementsGuide title="Governança" items={governancaRequirements} />
    </div>
  );
};

export default GovernancaPage;
