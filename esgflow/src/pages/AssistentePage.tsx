import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Como melhorar meu score ESG?",
  "Quais indicadores estão abaixo da meta?",
  "Sugira ações para reduzir emissões de CO₂",
];

const mockResponses: Record<string, string> = {
  "Como melhorar meu score ESG?":
    "Para melhorar seu score ESG, recomendo focar nos seguintes pontos:\n\n1. **Ambiental**: Reduzir consumo de energia e água, aumentar taxa de reciclagem\n2. **Social**: Aumentar horas de treinamento e ações sociais\n3. **Governança**: Completar auditorias pendentes e melhorar gestão de riscos\n\nSeu score atual está em 74 pontos (Bom). Com essas ações, você pode alcançar 80+ (Excelente).",
  "Quais indicadores estão abaixo da meta?":
    "Os seguintes indicadores estão abaixo da meta:\n\n- **Consumo de Energia**: 4.200 kWh (meta: 3.500 kWh)\n- **Consumo de Água**: 120 m³ (meta: 100 m³)\n- **Resíduos Gerados**: 800 kg (meta: 500 kg)\n- **Emissões CO₂**: 12 ton (meta: 8 ton)\n- **Segurança do Trabalho**: 2 incidentes (meta: 0)\n\nRecomendo priorizar a redução de resíduos e emissões.",
  "Sugira ações para reduzir emissões de CO₂":
    "Ações recomendadas para reduzir emissões de CO₂:\n\n1. **Eficiência energética**: Substituir equipamentos antigos por modelos eficientes\n2. **Energia renovável**: Instalar painéis solares ou contratar energia verde\n3. **Transporte**: Incentivar home office e caronas compartilhadas\n4. **Monitoramento**: Implementar sistema de medição contínua\n5. **Compensação**: Investir em projetos de crédito de carbono",
};

const AssistentePage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou o assistente ESG com IA. Como posso ajudar a melhorar seus indicadores ESG hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = mockResponses[text] ||
        `Analisando seus dados ESG sobre "${text}"...\n\nBaseado nos indicadores atuais, recomendo revisar as metas e implementar ações corretivas nos pontos com menor desempenho. Consulte o dashboard para uma visão detalhada.`;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">Assistente ESG com IA</h1>
        <p className="text-muted-foreground text-sm">Receba recomendações inteligentes</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-line ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="p-1.5 rounded-full bg-secondary h-fit">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                <Brain className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-secondary p-3 rounded-lg text-sm text-muted-foreground">Analisando...</div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => sendMessage(s)}>{s}</Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Faça uma pergunta sobre seus indicadores ESG..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              className="min-h-[44px] max-h-[100px] resize-none"
              rows={1}
            />
            <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssistentePage;
