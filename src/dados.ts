// Conteúdo do site. Os textos dos produtos e da empresa vêm do site atual (pectecs.com.br);
// as imagens são capturas das páginas públicas de cada produto (scripts/capturar-telas.mjs).

// E-mail mostrado no site para contato direto. As mensagens do formulário vão para
// vendaspectec@ (ver api/contato.ts).
export const EMAIL_CONTATO = 'contatopectec@generaltecnologia.com'

const tela = (nome: string) => `/telas/${nome}.webp`

export const SOBRE =
  'A P&C Tec é a marca de produtos digitais da Perdigão & Carneiro Tecnologias. Construímos software com inteligência artificial integrada para resolver problemas reais, com produtos enxutos, bem construídos e que ajudam de verdade quem usa no dia a dia.'

// Os dois serviços são as atividades do CNPJ da empresa, em linguagem de cliente:
// 62.01-5-01 (desenvolvimento de programas sob encomenda) e 62.01-5-02 (web design).
export const SERVICOS = [
  {
    nome: 'Sistemas sob encomenda',
    descricao:
      'Desenvolvemos o software que a sua empresa precisa, do jeito que ela trabalha: sistemas de gestão, aplicativos e automações feitos sob medida, com inteligência artificial onde ela faz diferença.',
    itens: [
      'Levantamento do processo junto com a sua equipe',
      'Sistemas web e aplicativos para celular',
      'Integração com os sistemas e planilhas que você já usa',
      'Inteligência artificial aplicada à rotina',
    ],
    assunto: 'Sistema sob encomenda',
  },
  {
    nome: 'Web design',
    descricao:
      'Criamos sites e páginas que apresentam bem o seu negócio e trazem clientes: visual alinhado à sua marca, rápidos, fáceis de usar no celular e prontos para aparecer no Google.',
    itens: [
      'Sites institucionais e páginas de produto',
      'Layout pensado primeiro para o celular',
      'Estrutura e textos preparados para as buscas',
      'Publicação com domínio e segurança configurados',
    ],
    assunto: 'Site / web design',
  },
]

export type Produto = {
  nome: string
  status: string
  resumo: string
  href: string
  externo?: boolean
  imagens: [string, string, string]
  cor: string
}

export const PRODUTOS: Produto[] = [
  {
    nome: 'GTRestaurante',
    status: 'Disponível agora',
    resumo:
      'Gestão completa para restaurantes: CMV, checklists, estoque, financeiro, equipe e relatórios com IA, em uma plataforma só.',
    href: '/gtrestaurante',
    imagens: [tela('gtrestaurante-desk-3'), tela('gtrestaurante-desk-1'), tela('gtrestaurante-cel-1')],
    cor: '#FF8A1F',
  },
  {
    nome: 'Mordomo Tec',
    status: 'Disponível agora',
    resumo:
      'Assistente pessoal para a vida de casa, direto no WhatsApp: finanças, compromissos, documentos, saúde e carro organizados só de conversar.',
    href: 'https://mordomotec.com.br',
    externo: true,
    imagens: [tela('mordomo-desk-2'), tela('mordomo-desk-1'), tela('mordomo-cel-1')],
    cor: '#D4AF5A',
  },
  {
    nome: 'Plantemo',
    status: 'Em teste',
    resumo:
      'Consultor de plantio de bolso para o pequeno produtor: época oficial, quanto a cidade costuma colher e o passo a passo da Embrapa, com a fonte na tela.',
    href: '/plantemo',
    imagens: [tela('plantemo-site-desk-5'), tela('plantemo-site-desk-1'), tela('plantemo-site-cel-1')],
    cor: '#6FCF8B',
  },
]
