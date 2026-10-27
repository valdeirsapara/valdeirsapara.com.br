/**
 * Conteúdo comercial da Sapará Dev.
 * Tudo que ainda falta está marcado com fill("...") nos templates
 * ou com o prefixo FILL: aqui — o build lista essas pendências no final.
 */

export const contact = {
  // Número no formato internacional, só dígitos (usado no link wa.me)
  whatsapp: "5595991452704",
  whatsappDisplay: "(95) 99145-2704",
  whatsappMessage: "Oi, Valdeir! Vim pelo site da Sapará Dev e quero conversar.",
  email: "contato@valdeirsapara.com.br",
  city: "Boa Vista - RR",
  cnpj: "FILL:CNPJ",
  instagram: "FILL:Instagram (@usuario e link)",
};

export function whatsappLink(message = contact.whatsappMessage): string {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const differentials = [
  {
    title: "Sou de Boa Vista, passo aí.",
    text: "A conversa é na sua empresa, olho no olho. Nada de call com vendedor de outro estado.",
  },
  {
    title: "Respondo no mesmo dia.",
    text: "Mensagem de cliente seu não fica sem resposta. A sua também não.",
  },
  {
    title: "Tech Lead na Defensoria Pública de RR, com sistemas críticos em produção.",
    text: "Cuido de sistemas que não podem parar. O seu recebe o mesmo padrão de cuidado.",
  },
];

export const packages = [
  {
    slug: "atendimento-whatsapp",
    name: "Atendimento Automático",
    audience: "Para quem recebe muita mensagem e perde cliente fora do horário.",
    setup: "R$ 2.500",
    monthly: "R$ 390/mês",
    deadline: "15 dias",
    includes: [
      "Assistente no WhatsApp treinado com as informações do seu negócio",
      "Agendamento, lembrete e confirmação automáticos",
      "Passa a conversa para alguém da equipe quando precisa",
      "Relatório mensal de atendimentos",
    ],
  },
  {
    slug: "site",
    name: "Site que Gera Cliente",
    audience: "Para quem ainda depende só do Instagram para ser encontrado.",
    setup: "R$ 3.200",
    monthly: "R$ 120/mês",
    deadline: "20 dias",
    includes: [
      "Site de alto padrão com até 5 páginas",
      "Google Meu Negócio otimizado",
      "Botão de WhatsApp e formulário de contato",
      "Hospedagem, domínio e ajustes inclusos",
    ],
  },
  {
    slug: "sistema",
    name: "Sistema Sob Medida",
    audience: "Para quem controla estoque, orçamento ou agenda em planilha e papel.",
    setup: "R$ 9.800",
    monthly: "R$ 490/mês",
    deadline: "60 dias",
    includes: [
      "Até 3 módulos: estoque, orçamentos, ordem de serviço ou agenda",
      "Integração com Asaas ou Conta Azul",
      "Acesso por perfil para cada pessoa da equipe",
      "Suporte e backup",
    ],
  },
];

export const steps = [
  {
    title: "Diagnóstico",
    text: "Conversamos na sua empresa e eu entendo onde hoje se perde tempo e cliente.",
  },
  {
    title: "Proposta com preço fechado",
    text: "Você recebe escopo, prazo e valor final. Sem surpresa no meio do caminho.",
  },
  {
    title: "Construção",
    text: "50% para começar. Você acompanha o andamento e testa antes da entrega.",
  },
  {
    title: "Entrega e treinamento",
    text: "50% na entrega. Treino sua equipe para usar no dia a dia.",
  },
  {
    title: "Manutenção mensal",
    text: "Suporte, ajustes e backup para tudo continuar funcionando.",
  },
];

export const cases = [
  {
    slug: "logisticaapp",
    name: "LogisticaApp",
    sector: "Logística",
    metric: "FILL:resultado principal",
    metricLabel: "Sistema de gestão logística para empresa de Boa Vista.",
    url: "/cases/logisticaapp/",
  },
  {
    slug: "atendimento-whatsapp",
    name: "Atendimento no WhatsApp",
    sector: "FILL:setor do cliente",
    metric: "FILL:atendimentos por mês / tempo de resposta",
    metricLabel: "Atendimento que responde, agenda e confirma sozinho.",
    url: "/cases/atendimento-whatsapp/",
  },
  {
    slug: "recapi",
    name: "RecAPI",
    sector: "Monitoramento",
    metric: "250+",
    metricLabel: "câmeras monitoradas ao mesmo tempo, em produção.",
    url: "/cases/recapi/",
  },
  {
    slug: "tela-134x",
    name: "Tela 134× mais rápida",
    sector: "Setor público",
    metric: "134×",
    metricLabel: "de 37 s para 0,28 s, sem trocar de sistema.",
    url: "/cases/tela-134x/",
  },
];

export const segments = [
  { name: "Clínicas e consultórios", text: "Agenda, confirmação de consulta e lembrete.", icon: "clinic" },
  { name: "Laboratórios", text: "Estoque, validade e controle de temperatura.", icon: "lab" },
  { name: "Veterinárias", text: "Agendamento, retorno e vacina no prazo.", icon: "vet" },
  { name: "Contabilidades", text: "Coleta de documentos e cobrança de pendências.", icon: "accounting" },
];

/** Faixa de números do topo. Só números reais — nada inventado. */
export const stats = [
  { value: "7", suffix: "+", label: "anos construindo sistemas que não podem parar" },
  { value: "250", suffix: "+", label: "câmeras monitoradas ao mesmo tempo, em produção" },
  { value: "134", suffix: "×", label: "mais rápida ficou uma tela crítica, sem trocar de sistema" },
  { value: "15", suffix: " dias", label: "para o atendimento automático começar a funcionar" },
];
