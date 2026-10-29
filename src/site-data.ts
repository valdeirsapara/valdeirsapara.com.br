/**
 * Conteúdo comercial da Sapará Dev.
 *
 * PENDÊNCIAS: campo vazio ("") ou com "[[...]]" NÃO aparece no site — o card,
 * a linha ou o item some até você preencher. Procure por "PREENCHER" neste
 * arquivo. O build lista no terminal tudo que ainda está oculto.
 */

export const contact = {
  // Número no formato internacional, só dígitos (usado no link wa.me)
  whatsapp: "5595991452704",
  whatsappDisplay: "(95) 99145-2704",
  whatsappMessage: "Oi, Valdeir! Vim pelo site da Sapará Dev e quero conversar.",
  email: "contato@valdeirsapara.com.br",
  city: "Boa Vista - RR",
  // PREENCHER: CNPJ (ex.: "12.345.678/0001-90"). Oculto enquanto vazio.
  cnpj: "",
  // PREENCHER: @ do Instagram e link. Ocultos enquanto vazios.
  instagram: "",
  instagramUrl: "",
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
    title: "Sistemas críticos em produção, todos os dias.",
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
    deadline: "Prazo combinado na proposta",
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
    deadline: "Pronto em 20 dias",
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
    deadline: "Pronto em 60 dias",
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

/**
 * Cases: cada card mostra setor, número (quando houver) e uma linha de contexto.
 * Com `metric` vazio o card aparece sem o número.
 */
export const cases = [
  {
    slug: "logisticaapp",
    name: "LogisticaApp",
    sector: "Logística",
    // PREENCHER: número do resultado (ex.: "3×", "-40%"). Sem número, o card aparece sem ele.
    metric: "",
    metricLabel: "Sistema de gestão logística para cliente de Boa Vista.",
    origin: "",
    url: "/cases/logisticaapp/",
  },
  {
    slug: "atendimento-whatsapp",
    name: "Atendimento no WhatsApp com IA",
    sector: "Atendimento",
    // PREENCHER: número (atendimentos por mês ou tempo de resposta). Sem número, o card aparece sem ele.
    metric: "",
    metricLabel: "Robô que responde, agenda e confirma pelo WhatsApp.",
    origin: "",
    url: "/cases/atendimento-whatsapp/",
  },
  {
    slug: "recapi",
    name: "RecAPI",
    sector: "Monitoramento e segurança",
    metric: "250+",
    metricLabel: "câmeras monitoradas ao mesmo tempo, em produção.",
    origin: "Projeto desenvolvido para a SensorEng",
    url: "/cases/recapi/",
  },
  {
    slug: "robo-juridico",
    name: "Robô jurídico",
    sector: "Jurídico",
    // PREENCHER: número (ex.: processos acompanhados por dia). Sem número, o card aparece sem ele.
    metric: "",
    metricLabel: "Robô que consulta e acompanha processos no e-SAJ e no eproc do TJSP automaticamente.",
    origin: "",
    url: "/cases/robo-juridico/",
  },
];

export const segments = [
  { name: "Clínicas e consultórios", pitch: "Tenho uma clínica/consultório", text: "Agenda, confirmação de consulta e lembrete.", icon: "clinic" },
  { name: "Laboratórios", pitch: "Tenho um laboratório", text: "Estoque, validade e controle de temperatura.", icon: "lab" },
  { name: "Veterinárias", pitch: "Tenho uma veterinária", text: "Agendamento, retorno e vacina no prazo.", icon: "vet" },
  { name: "Contabilidades", pitch: "Tenho uma contabilidade", text: "Coleta de documentos e cobrança de pendências.", icon: "accounting" },
];

/**
 * Linha de números abaixo do hero. Só números reais.
 * Item com "[[...]]" fica oculto até ser preenchido.
 */
export const stats = [
  // PREENCHER: troque [[ANOS]] pelo número real (ex.: "8").
  { value: "[[ANOS]]", suffix: "+", label: "anos construindo sistemas" },
  { value: "250", suffix: "+", label: "câmeras monitoradas em produção" },
];

/**
 * Posts que não aparecem na seção "Do blog" da home (continuam em /blog/).
 * Use o slug, que é o nome do arquivo em content/ sem ".md".
 */
export const homeHiddenPosts = [
  "de-37-segundos-para-028-como-deixei-uma-tela-134-mais-rapida-sem-trocar-de-framework",
];

/**
 * Seção "Quem faz" da home.
 * FOTO: coloque a foto em static/img/ (vertical 4:5, ~960×1200, JPG ou WebP)
 * e preencha `photo` com o caminho público, ex.: "/img/valdeir.jpg".
 * Enquanto estiver vazio, a home mostra o espaço reservado.
 */
export const maker = {
  photo: "/img/valdeir.webp",
  photoAlt: "Valdeir Sapará",
};
