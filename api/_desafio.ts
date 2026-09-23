// Proteção contra robôs por "prova de trabalho" (o mesmo esquema do ALTCHA, sem serviço externo).
// O prefixo _ faz a Vercel não publicar este arquivo como uma rota.
//
// 1. O servidor sorteia um número secreto, calcula sha256(salt + número) e assina o resultado.
// 2. O navegador testa números até achar o que gera aquele hash: leva cerca de um segundo, em
//    segundo plano, enquanto a pessoa preenche o formulário.
// 3. No envio, o servidor confere a assinatura, o hash, a validade e se o desafio já foi usado.
// Para uma pessoa é invisível; para quem quer mandar milhares de mensagens, cada uma custa
// processamento, e nenhum desafio vale duas vezes.
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

/** Maior número possível: define a dificuldade (em média, o navegador testa metade disso) */
export const DIFICULDADE = 60_000
const VALIDADE_S = 10 * 60

export type Desafio = { algoritmo: 'SHA-256'; desafio: string; maximo: number; salt: string; assinatura: string }
export type Solucao = { desafio: string; salt: string; numero: number; assinatura: string }

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex')

// A chave de assinatura é derivada da senha do SMTP, que já existe só no servidor: não há segredo
// novo para cadastrar. Sem ela (e fora do modo de teste local), não há desafio.
function chave(): Buffer | null {
  const base = process.env.SMTP_PASS || (process.env.CONTATO_MODO_TESTE === '1' ? 'modo-teste-local' : '')
  if (!base) return null
  return createHmac('sha256', base).update('pc-tec/desafio-contato/v1').digest()
}
const assinar = (k: Buffer, texto: string) => createHmac('sha256', k).update(texto).digest('hex')

export function criarDesafio(): Desafio | null {
  const k = chave()
  if (!k) return null
  const expira = Math.floor(Date.now() / 1000) + VALIDADE_S
  const salt = `${randomBytes(12).toString('hex')}?expira=${expira}`
  const numero = randomInt(0, DIFICULDADE + 1)
  const desafio = sha256(salt + numero)
  return { algoritmo: 'SHA-256', desafio, maximo: DIFICULDADE, salt, assinatura: assinar(k, desafio) }
}

// Desafios já usados, até expirarem (por instância da função)
const usados = new Map<string, number>()

export function conferirSolucao(bruto: unknown): boolean {
  const k = chave()
  if (!k || !bruto || typeof bruto !== 'object') return false
  const s = bruto as Partial<Solucao>
  if (typeof s.desafio !== 'string' || typeof s.salt !== 'string' || typeof s.assinatura !== 'string') return false
  if (typeof s.numero !== 'number' || !Number.isInteger(s.numero) || s.numero < 0 || s.numero > DIFICULDADE) return false
  if (s.salt.length > 100 || s.desafio.length !== 64 || s.assinatura.length !== 64) return false

  // Assinatura: o desafio foi emitido por este servidor
  const esperada = Buffer.from(assinar(k, s.desafio), 'hex')
  const recebida = Buffer.from(s.assinatura, 'hex')
  if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return false

  // Validade (o prazo está dentro do salt, que entra no hash assinado: não dá para alterar)
  const expira = Number(/[?&]expira=(\d+)/.exec(s.salt)?.[1])
  const agora = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(expira) || expira < agora) return false

  // Trabalho feito: o número encontrado gera o hash do desafio
  if (sha256(s.salt + s.numero) !== s.desafio) return false

  // Uso único
  for (const [d, exp] of usados) if (exp < agora) usados.delete(d)
  if (usados.has(s.desafio)) return false
  usados.set(s.desafio, expira)
  return true
}
