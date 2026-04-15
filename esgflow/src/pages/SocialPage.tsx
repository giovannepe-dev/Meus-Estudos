import IndicatorModule from "@/components/IndicatorModule";
import { useEsgData } from "@/hooks/useEsgData";
import EsgRequirementsGuide, { socialRequirements } from "@/components/EsgRequirementsGuide";

const SocialPage = () => {
  const { byCategory, loading } = useEsgData();
  return (
    <div className="space-y-6">
      <IndicatorModule
        title="Social"
        description="Indicadores sociais da empresa"
        indicators={byCategory("social")}
        color="hsl(210, 80%, 55%)"
        loading={loading}
      />
      <EsgRequirementsGuide title="Social" items={socialRequirements} />
    </div>
  );
};

export default SocialPage;
