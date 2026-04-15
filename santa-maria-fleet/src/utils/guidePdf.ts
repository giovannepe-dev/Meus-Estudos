import jsPDF from "jspdf";

export function generateGuidePdf() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkPage = (needed: number) => {
    if (y + needed > 275) addPage();
  };

  const title = (text: string) => {
    checkPage(14);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95); // navy
    doc.text(text, margin, y);
    y += 3;
    doc.setDrawColor(45, 212, 191); // teal
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;
  };

  const subtitle = (text: string) => {
    checkPage(10);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(text, margin, y);
    y += 6;
  };

  const body = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPage(lines.length * 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  };

  const bullet = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth - 6);
    checkPage(lines.length * 5);
    doc.setFillColor(45, 212, 191);
    doc.circle(margin + 1.5, y - 1.2, 1, "F");
    doc.text(lines, margin + 6, y);
    y += lines.length * 5 + 1;
  };

  const spacer = (s = 4) => { y += s; };

  // ===== CAPA =====
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 100, "F");
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SmartFrota", pageWidth / 2, 40, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Guia Completo do Sistema", pageWidth / 2, 52, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(45, 212, 191);
  doc.text("Manual de uso para gestores e motoristas", pageWidth / 2, 62, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 80, { align: "center" });

  // Indice
  y = 110;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("Indice", margin, y);
  y += 8;

  const chapters = [
    "1. Cadastro da Empresa",
    "2. Cadastro de Motoristas",
    "3. Ativacao de Usuarios",
    "4. Gestao de Veiculos",
    "5. Checkout (Retirada / Devolucao)",
    "6. Abastecimentos",
    "7. Avarias e Ocorrencias",
    "8. Multas de Transito",
    "9. Manutencoes",
    "10. Agendamentos",
    "11. Rastreamento em Tempo Real",
    "12. Relatorios",
    "13. Configuracoes",
    "14. Perfis de Acesso",
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  chapters.forEach((ch) => {
    doc.text(ch, margin + 4, y);
    y += 5.5;
  });

  // ===== CAPITULOS =====
  addPage();

  // 1. Cadastro da Empresa
  title("1. Cadastro da Empresa (Super Admin)");
  body("O Super Admin e responsavel por criar novas empresas no sistema atraves do Painel Master.");
  subtitle("Passo a passo:");
  bullet("Acesse o Painel Master (/master)");
  bullet("Clique em 'Nova Empresa'");
  bullet("Preencha: Nome, CNPJ, Slug (ex: minha-empresa), Telefone");
  bullet("A empresa sera criada e um link de cadastro sera gerado");
  bullet("Envie o link para o administrador da empresa: seusite.com/c/slug");
  spacer(6);

  // 2. Cadastro de Motoristas
  title("2. Cadastro de Motoristas e Usuarios");
  subtitle("Para o Administrador:");
  bullet("Acesse o link de cadastro recebido (ex: /c/minha-empresa)");
  bullet("Preencha: Nome, E-mail, Telefone, Senha");
  bullet("Confirme o e-mail recebido na caixa de entrada");
  bullet("Aguarde a ativacao pelo Super Admin");
  spacer(3);
  subtitle("Para Motoristas:");
  bullet("Receba o link de cadastro do administrador");
  bullet("Preencha os dados e confirme o e-mail");
  bullet("Aguarde a ativacao pelo Admin da empresa");
  bullet("Apos ativado, faca login normalmente");
  spacer(2);
  body("IMPORTANTE: Todo novo cadastro fica inativo por padrao. O acesso so e liberado quando um Admin ativa o perfil.");
  spacer(6);

  // 3. Ativacao
  title("3. Ativacao de Usuarios (Admin)");
  bullet("Acesse Configuracoes > Usuarios");
  bullet("Veja a lista de usuarios pendentes");
  bullet("Clique no usuario desejado");
  bullet("Defina o perfil: Admin (acesso total), Frota (gestao operacional), Motorista (registros pessoais)");
  bullet("Clique em 'Ativar'");
  spacer(6);

  // 4. Veiculos
  title("4. Gestao de Veiculos");
  bullet("Acesse 'Veiculos' no menu");
  bullet("Clique em 'Novo Veiculo'");
  bullet("Preencha: Placa, Prefixo, Marca, Modelo, Ano");
  bullet("Defina: Tipo de combustivel padrao e Km atual");
  bullet("Configure o intervalo de revisao (km)");
  bullet("Salve o veiculo");
  spacer(2);
  body("No detalhe do veiculo, voce pode ver: historico de checkouts, abastecimentos, avarias e manutencoes.");
  spacer(6);

  // 5. Checkout
  title("5. Checkout - Retirada e Devolucao");
  subtitle("Retirar Veiculo:");
  bullet("Acesse 'Checkout' no menu");
  bullet("Selecione o veiculo (somente disponiveis)");
  bullet("Selecione o motorista");
  bullet("Escolha o motivo de uso (lista pre-definida)");
  bullet("Informe o Km e tire foto do hodometro");
  bullet("Assine na tela com o dedo (assinatura digital)");
  bullet("Confirme a retirada - o veiculo muda para 'Em uso'");
  spacer(3);
  subtitle("Devolver Veiculo:");
  bullet("Selecione o checkout aberto");
  bullet("Informe o Km de devolucao + foto do hodometro");
  bullet("Assine a devolucao");
  bullet("Registre avaria se houver");
  bullet("Confirme - o sistema calcula o Km rodado automaticamente");
  bullet("Um resumo e gerado para WhatsApp do admin");
  spacer(6);

  // 6. Abastecimentos
  title("6. Abastecimentos");
  bullet("Acesse 'Abastecimentos' no menu");
  bullet("Clique em 'Novo Abastecimento'");
  bullet("Preencha: Veiculo, Motorista, Data, Tipo combustivel");
  bullet("Informe: Litros, Valor total, Km no momento");
  bullet("Opcional: Nome do posto e foto do comprovante");
  bullet("Salve e acompanhe o total gasto no periodo com filtros");
  spacer(6);

  // 7. Avarias
  title("7. Avarias e Ocorrencias");
  bullet("Acesse 'Avarias' no menu");
  bullet("Clique em 'Nova Avaria'");
  bullet("Selecione: Veiculo e Motorista");
  bullet("Defina: Tipo (arranhao, amassado, pneu, mecanica, etc.)");
  bullet("Defina: Gravidade (leve, media, grave)");
  bullet("Adicione fotos (minimo 1)");
  bullet("Informe custo estimado e se o veiculo ficou imobilizado");
  bullet("Acompanhe: Aberta > Em andamento > Resolvida");
  spacer(6);

  // 8. Multas
  title("8. Multas de Transito");
  bullet("Acesse 'Multas' no menu");
  bullet("Clique em 'Nova Multa'");
  bullet("Preencha: Veiculo, Data, Descricao, Valor, Pontos, Local");
  bullet("Salve a multa");
  bullet("Clique em 'Sincronizar Motoristas'");
  body("O sistema identifica automaticamente o motorista responsavel cruzando a data/hora da infracao com os checkouts registrados.");
  bullet("Notificacao automatica via WhatsApp para o admin");
  spacer(6);

  // 9. Manutencoes
  title("9. Manutencoes");
  bullet("Acesse 'Manutencoes' no menu");
  bullet("Clique em 'Nova Manutencao'");
  bullet("Preencha: Veiculo, Tipo de servico, Data agendada");
  bullet("Salve como 'Agendada'");
  spacer(2);
  subtitle("Quando realizada, atualize com:");
  bullet("Data realizada, Km na manutencao, Custo e Comprovante");
  spacer(2);
  body("O sistema emite alertas automaticos quando um veiculo esta proximo ou ultrapassou o intervalo de km para revisao. Veiculos com revisao vencida sao bloqueados automaticamente.");
  spacer(6);

  // 10. Agendamentos
  title("10. Agendamentos");
  bullet("Acesse 'Agendamentos' no menu");
  bullet("Clique em 'Novo Agendamento'");
  bullet("Selecione: Veiculo, Motorista, Data inicio/fim, Motivo");
  bullet("Salve a reserva");
  body("O motorista recebe lembretes automaticos na vespera e no dia do agendamento.");
  spacer(6);

  // 11. Rastreamento
  title("11. Rastreamento em Tempo Real");
  body("Pre-requisito: Ative o rastreamento em Configuracoes > Empresa.");
  bullet("Acesse 'Rastreamento' no menu");
  bullet("Veja no mapa todos os motoristas em rota");
  bullet("O trajeto percorrido aparece como linha tracejada");
  bullet("Use o filtro de motorista para ver apenas um especifico");
  bullet("Clique em 'Atualizar' ou aguarde atualizacao em tempo real");
  spacer(6);

  // 12. Relatorios
  title("12. Relatorios");
  bullet("Acesse 'Relatorios' no menu");
  bullet("Selecione o periodo desejado");
  subtitle("Dados disponiveis:");
  bullet("Km rodado por veiculo e por motorista");
  bullet("Gastos de combustivel por veiculo/mes");
  bullet("Consumo medio estimado (km/litro)");
  bullet("Avarias: quantidade e custo por veiculo/motorista");
  bullet("Exportacao CSV dos dados filtrados");
  spacer(6);

  // 13. Configuracoes
  title("13. Configuracoes (Admin)");
  body("Acesse 'Configuracoes' no menu para gerenciar:");
  bullet("Intervalo km padrao para revisao");
  bullet("Motivos de uso (adicionar/remover da lista)");
  bullet("WhatsApp do admin para notificacoes");
  bullet("Gestao de usuarios (ativar, editar perfil, desativar)");
  bullet("Rastreamento (ativar/desativar)");
  spacer(6);

  // 14. Perfis
  title("14. Perfis de Acesso");
  spacer(2);

  // Table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(30, 58, 95);
  doc.setTextColor(255, 255, 255);
  checkPage(40);
  doc.rect(margin, y - 4, contentWidth, 8, "F");
  doc.text("Perfil", margin + 3, y);
  doc.text("Permissoes", margin + 45, y);
  y += 6;

  const roles = [
    ["Super Admin", "Criar empresas, gerenciar todo o sistema"],
    ["Admin", "Gestao completa da empresa"],
    ["Frota", "Gestao operacional da frota"],
    ["Motorista", "Ver e registrar seus proprios checkouts"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  roles.forEach(([role, perm], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, contentWidth, 7, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.text(role, margin + 3, y);
    doc.setFont("helvetica", "normal");
    doc.text(perm, margin + 45, y);
    y += 7;
  });

  spacer(10);
  body("Dica: Instale o app na tela inicial do celular para acesso rapido. O sistema funciona como um aplicativo nativo (PWA).");

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("SmartFrota - Guia do Sistema", margin, 290);
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, 290, { align: "right" });
  }

  doc.save("SmartFrota_Guia_Completo.pdf");
}
