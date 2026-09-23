// Regras do formulário de contato, usadas pela função (api/contato.ts) e pelo site.
// O prefixo _ faz a Vercel não publicar este arquivo como uma rota.

export const ASSUNTOS = ['Sistema sob encomenda', 'Site / web design', 'Nossos produtos', 'Outro assunto']

export type Dados = {
  nome: string
  telefone: string
  email: string
  mensagem: string
  assunto: string
  origem: string
}

export const limpar = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const umaLinha = (v: string) => v.replace(/[\r\n]+/g, ' ')

export function validar(bruto: Record<string, unknown>): { dados?: Dados; erro?: string } {
  const dados: Dados = {
    nome: umaLinha(limpar(bruto.nome, 100)),
    telefone: umaLinha(limpar(bruto.telefone, 30)),
    email: umaLinha(limpar(bruto.email, 200)),
    mensagem: limpar(bruto.mensagem, 4000),
    assunto: ASSUNTOS.includes(bruto.assunto as string) ? (bruto.assunto as string) : '',
    origem: umaLinha(limpar(bruto.origem, 60)),
  }
  if (dados.nome.length < 2) return { erro: 'Informe seu nome.' }
  const digitos = dados.telefone.replace(/\D/g, '')
  if (digitos.length < 10 || digitos.length > 13) return { erro: 'Informe um telefone com DDD.' }
  // Estrito de propósito: o e-mail vira o "responder para" da mensagem, então vírgulas, espaços e
  // <> (que poderiam virar um segundo endereço) ficam de fora
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(dados.email)) return { erro: 'Informe um e-mail válido.' }
  if (dados.mensagem.length < 10) return { erro: 'Conte um pouco mais sobre o que você precisa.' }
  return { dados }
}
