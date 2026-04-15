import IndicatorModule from "@/components/IndicatorModule";
import { useEsgData } from "@/hooks/useEsgData";
import EsgRequirementsGuide, { ambientalRequirements } from "@/components/EsgRequirementsGuide";
import Co2AvoidedCard from "@/components/Co2AvoidedCard";
import EnergyMatrixChart from "@/components/EnergyMatrixChart";

const AmbientalPage = () => {
  const { indicators, byCategory, loading } = useEsgData();
  return (
    <div className="space-y-6">
      <IndicatorModule
        title="Ambiental"
        description="Indicadores ambientais da empresa"
        indicators={byCategory("ambiental")}
        color="hsl(145, 78%, 40%)"
        loading={loading}
      />
      <Co2AvoidedCard indicators={indicators} />
      <EnergyMatrixChart indicators={indicators} />
      <EsgRequirementsGuide title="Ambiental" items={ambientalRequirements} />
    </div>
  );
};

export default AmbientalPage;
