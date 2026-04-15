import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, CheckCircle2 } from "lucide-react";

interface RequirementItem {
  name: string;
  description: string;
  unit: string;
  tip: string;
}

interface EsgRequirementsGuideProps {
  title: string;
  items: RequirementItem[];
}

const EsgRequirementsGuide = ({ title, items }: EsgRequirementsGuideProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-primary">
          <Info className="h-4 w-4" />
          O que preencher em {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{item.name} <span className="text-muted-foreground font-normal">({item.unit})</span></p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <p className="text-xs text-primary/80 mt-0.5">💡 {item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EsgRequirementsGuide;

export const ambientalRequirements: RequirementItem[] = [
  { name: "Consumo de Energia", unit: "kWh", description: "Total de energia elétrica consumida no período", tip: "Consulte a fatura de energia da empresa" },
  { name: "Consumo de Água", unit: "m³", description: "Total de água consumida no período", tip: "Consulte a fatura de água ou hidrômetro" },
  { name: "Resíduos Gerados", unit: "kg", description: "Peso total de resíduos sólidos gerados", tip: "Registre via coleta ou pesagem dos resíduos. Marque 'menor é melhor'" },
  { name: "Reciclagem", unit: "%", description: "Percentual de resíduos reciclados sobre o total gerado", tip: "Calcule: (resíduos reciclados / total de resíduos) × 100" },
  { name: "Emissões CO₂", unit: "ton", description: "Total de emissões de gases de efeito estufa", tip: "Use calculadoras de carbono ou relatórios de transporte/energia. Marque 'menor é melhor'" },
  { name: "Energia Solar Gerada", unit: "kWh", description: "Total de energia gerada por painéis solares no período", tip: "Consulte o inversor solar ou app de monitoramento dos painéis" },
  { name: "% de Energia Renovável", unit: "%", description: "Percentual de energia renovável sobre o consumo total", tip: "Calcule: (energia renovável / consumo total) × 100. Inclua solar, eólica, hidrelétrica" },
];

export const socialRequirements: RequirementItem[] = [
  { name: "Treinamentos", unit: "horas", description: "Total de horas de treinamento oferecidas aos colaboradores", tip: "Some todas as horas de cursos, workshops e capacitações" },
  { name: "Diversidade", unit: "%", description: "Percentual de diversidade no quadro de colaboradores", tip: "Inclua gênero, etnia, PCD. Calcule: (colaboradores diversos / total) × 100" },
  { name: "Segurança do Trabalho", unit: "incidentes", description: "Número de acidentes ou incidentes de trabalho no período", tip: "Registre acidentes com e sem afastamento. Marque 'menor é melhor'" },
  { name: "Ações Sociais", unit: "projetos", description: "Quantidade de projetos ou ações sociais realizadas", tip: "Conte projetos comunitários, voluntariado, doações estruturadas" },
  { name: "Satisfação dos Colaboradores", unit: "%", description: "Índice de satisfação interna dos colaboradores", tip: "Aplique pesquisa de clima organizacional periódica" },
];

export const governancaRequirements: RequirementItem[] = [
  { name: "Compliance", unit: "%", description: "Percentual de conformidade com normas e regulamentos", tip: "Verifique certificações, licenças e auditorias de conformidade" },
  { name: "Políticas Internas", unit: "docs", description: "Quantidade de políticas internas documentadas e ativas", tip: "Inclua código de ética, política anticorrupção, de privacidade, etc." },
  { name: "Auditorias", unit: "realizadas", description: "Número de auditorias internas ou externas realizadas", tip: "Conte auditorias financeiras, de qualidade e de compliance" },
  { name: "Gestão de Riscos", unit: "%", description: "Percentual de riscos identificados com plano de mitigação", tip: "Calcule: (riscos com plano / total de riscos identificados) × 100" },
  { name: "Documentos Obrigatórios", unit: "docs", description: "Quantidade de documentos legais obrigatórios em dia", tip: "Alvarás, licenças ambientais, certificados, registros legais" },
];

export const dashboardRequirements: RequirementItem[] = [
  { name: "1. Cadastre a Empresa", unit: "Configurações", description: "Preencha nome, CNPJ, setor e porte da empresa", tip: "Vá em Configurações → Empresa" },
  { name: "2. Crie os Indicadores", unit: "Dados ESG", description: "Cadastre os indicadores ambientais, sociais e de governança", tip: "Vá em Dados ESG → Indicadores e crie ao menos 1 por categoria" },
  { name: "3. Registre Valores Mensais", unit: "Dados ESG", description: "Adicione os valores de cada indicador por período", tip: "Vá em Dados ESG → Registrar Valores, escolha indicador, valor e mês" },
  { name: "4. Defina Metas", unit: "Metas", description: "Crie metas com prazo e responsável para cada indicador", tip: "Vá em Metas → Nova Meta" },
  { name: "5. Anexe Evidências", unit: "Evidências", description: "Registre documentos comprobatórios para auditorias", tip: "Vá em Evidências → Nova Evidência" },
];

export const metasRequirements: RequirementItem[] = [
  { name: "Indicador", unit: "texto", description: "Nome do indicador ESG que a meta se refere", tip: "Ex: Consumo de Energia, Reciclagem, Compliance" },
  { name: "Meta", unit: "número", description: "Valor numérico a ser alcançado", tip: "Ex: reduzir para 3.500 kWh ou atingir 80% de reciclagem" },
  { name: "Prazo", unit: "data", description: "Data limite para atingir a meta", tip: "Defina prazos realistas: trimestral, semestral ou anual" },
  { name: "Responsável", unit: "texto", description: "Pessoa responsável pelo acompanhamento da meta", tip: "Indique o gestor ou líder da área correspondente" },
];

export const evidenciasRequirements: RequirementItem[] = [
  { name: "Nome do Arquivo", unit: "texto", description: "Nome descritivo do documento ou evidência", tip: "Ex: Relatório Energia Q1.pdf, Certificado Reciclagem.pdf" },
  { name: "Tipo", unit: "pdf/imagem/doc", description: "Formato do arquivo anexado", tip: "Escolha entre PDF, Imagem ou Documento" },
  { name: "Indicador Relacionado", unit: "texto", description: "A qual indicador ESG esta evidência se refere", tip: "Ex: Consumo de Energia, Auditorias, Treinamentos" },
  { name: "Tamanho", unit: "MB/KB", description: "Tamanho aproximado do arquivo", tip: "Ex: 2.4 MB" },
];

export const dadosRequirements: RequirementItem[] = [
  { name: "1. Crie Indicadores", unit: "aba Indicadores", description: "Cadastre os indicadores ESG que deseja acompanhar (ex: Consumo de Energia, Diversidade)", tip: "Clique em 'Novo Indicador', escolha categoria, unidade e meta. Marque 'menor é melhor' para indicadores como emissões e resíduos" },
  { name: "2. Registre Valores", unit: "aba Registrar Valores", description: "Após criar indicadores, registre os valores mensais de cada um", tip: "Clique em 'Registrar Valor', selecione o indicador, informe o valor e o período (ex: 2026-01)" },
  { name: "3. Acompanhe no Dashboard", unit: "Dashboard", description: "Os dados registrados alimentam automaticamente gráficos e scores ESG", tip: "Quanto mais meses registrar, mais rica será a análise de tendências" },
  { name: "4. Consulte os Guias por Pilar", unit: "Ambiental / Social / Governança", description: "Cada página de pilar tem um guia com indicadores recomendados", tip: "Use os guias para saber quais indicadores cadastrar e como coletá-los" },
];
