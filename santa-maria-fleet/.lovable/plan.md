
# Santa Maria Frotas & Operações

## Visão Geral
App web responsivo (mobile-first) para a clínica Santa Maria controlar frota de veículos, gastos de combustível, quilometragem e manutenções. A logo da marca (tons de verde-água e azul-marinho) será usada em todo o app, definindo a paleta de cores.

**Paleta de cores**: Verde-água (#2DD4BF / teal) e Azul-marinho (#1E3A5F / navy) conforme a logo.

---

## Backend (Lovable Cloud / Supabase)

### Banco de Dados — 7 tabelas principais:
1. **Usuários** — nome, email, telefone, perfil (admin/frota/motorista), ativo
2. **Veículos** — placa, prefixo, marca, modelo, ano, tipo, status, km_atual, dados de revisão/manutenção, combustível padrão
3. **Checkouts** — retirada/devolução com km, fotos do hodômetro, assinatura digital, motivo, status (aberto/fechado)
4. **Abastecimentos** — veículo, motorista, litros, valor, tipo combustível, comprovante
5. **Avarias** — tipo, gravidade, fotos, custo, status, vínculo com checkout
6. **Manutenções** — tipo serviço, data agendada/realizada, custo, status
7. **Configurações** — intervalo km revisão, motivos padrão, política de uso

### Autenticação e RBAC:
- Login por email/senha via Supabase Auth
- 3 perfis: **Admin** (tudo), **Frota** (gestão operacional), **Motorista** (apenas seus checkouts)
- RLS policies para isolar dados por perfil

### Storage:
- Bucket para fotos de hodômetro, assinaturas, comprovantes e fotos de avarias
- Limite de upload: JPG/PNG/WebP, max 5MB

### Dados Seed:
- 4 usuários de exemplo, 3 veículos, 6 motivos padrão de uso

---

## Telas do App

### 1. Login
- Tela com logo Santa Maria, campos email/senha
- Redirecionamento por perfil após login

### 2. Dashboard (Home)
- Cards resumo: veículos disponíveis/em uso/manutenção, gastos do mês, km rodados, avarias abertas
- Lista de alertas de revisão (por km)
- Ação rápida: "Retirar Veículo" e "Devolver Veículo"

### 3. Veículos
- Lista com busca por placa, modelo ou status
- Formulário criar/editar veículo
- Página de detalhe: histórico de checkouts, abastecimentos, avarias, manutenções e indicadores

### 4. Retirada / Devolução (fluxo guiado mobile-first)
**Retirar:**
- Passo 1: Selecionar veículo (só disponíveis) e motorista
- Passo 2: Motivo de uso (lista predefinida + "outro"), destino opcional
- Passo 3: Informar km, tirar foto do hodômetro (câmera do celular), nível combustível opcional
- Passo 4: Assinatura digital na tela (canvas touch)
- Confirmar → checkout aberto, veículo muda para "em uso"

**Devolver:**
- Selecionar checkout aberto
- Informar km devolução (validação ≥ km retirada), foto hodômetro, assinatura
- Pergunta: houve avaria? Se sim, abre formulário rápido de avaria
- Confirmar → calcula km rodado, atualiza veículo, fecha checkout
- Se avaria grave/imobilizado → veículo vai para "manutenção"

**Após devolução:** Gera link wa.me para enviar resumo em texto ao WhatsApp do admin (número cadastrado nas configurações)

### 5. Abastecimentos
- Formulário: veículo, motorista, data, tipo combustível, litros, valor, km, posto, comprovante (foto opcional)
- Lista com filtros por período, veículo e motorista
- Total gasto no período

### 6. Avarias / Ocorrências
- Formulário com tipo, gravidade, descrição, fotos (mínimo 1), custo estimado, veículo imobilizado?
- Lista por status (aberta/em andamento/resolvida) e gravidade
- Detalhe com timeline de atualizações

### 7. Manutenções
- Criar manutenção agendada (tipo serviço, data, veículo)
- Marcar como realizada (data, km, custo, comprovante)
- Lista por veículo e status

### 8. Relatórios
- Km rodado por veículo e por motorista (período)
- Gastos combustível por veículo/mês e por motorista
- Consumo médio estimado (km/litro)
- Avarias: quantidade e custo por veículo/motorista
- Exportação CSV dos dados filtrados

### 9. Configurações (Admin)
- Intervalo km padrão para revisão
- Motivos de uso padrão (CRUD da lista)
- Número WhatsApp do admin para notificações
- Gestão de usuários (criar, editar, ativar/desativar)

---

## Funcionalidades Especiais

### Alertas de Manutenção
- Cálculo automático: se km_atual ≥ km_última_revisão + intervalo → alerta "Revisão vencida"
- Se faltam ≤500 km → alerta "Revisão próxima"
- Exibidos no Dashboard e na página do veículo

### Captura de Foto (Hodômetro/Comprovantes)
- Input com acesso direto à câmera do celular (capture="environment")
- Preview da foto antes de confirmar

### Assinatura Digital
- Canvas touch para assinar com o dedo na tela do celular
- Salva como imagem no storage

### Notificação WhatsApp (wa.me)
- Após devolução, gera link wa.me com resumo do checkout (veículo, motorista, km rodado, data/hora)
- Abre WhatsApp do admin com mensagem pré-formatada

---

## Navegação
- **Mobile**: Menu bottom tab bar (Dashboard, Veículos, Checkout, Mais)
- **Desktop**: Sidebar lateral com todas as seções
- Logo Santa Maria no topo da navegação
