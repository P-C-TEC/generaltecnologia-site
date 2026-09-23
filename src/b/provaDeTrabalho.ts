// Lado do navegador da proteção contra robôs (ver api/_desafio.ts): busca um desafio e testa
// números até achar o que gera o hash pedido. Roda em lotes, cedendo a vez entre eles, para a
// página não travar enquanto a pessoa digita.

type Desafio = { algoritmo: string; desafio: string; maximo: number; salt: string; assinatura: string }
export type Prova = { desafio: string; salt: string; numero: number; assinatura: string }

const LOTE = 400
const codificador = new TextEncoder()

async function hex(texto: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', codificador.encode(texto)))
  let s = ''
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return s
}

async function resolver(d: Desafio): Promise<Prova | null> {
  for (let inicio = 0; inicio <= d.maximo; inicio += LOTE) {
    const fim = Math.min(d.maximo, inicio + LOTE - 1)
    const tentativas = []
    for (let n = inicio; n <= fim; n++) tentativas.push(hex(d.salt + n).then((h) => (h === d.desafio ? n : -1)))
    const achado = (await Promise.all(tentativas)).find((n) => n >= 0)
    if (achado !== undefined) return { desafio: d.desafio, salt: d.salt, numero: achado, assinatura: d.assinatura }
    await new Promise((ok) => setTimeout(ok, 0))
  }
  return null
}

/** Começa a resolver já; a promessa entrega a prova (ou null, se o servidor não emitir desafio) */
export function prepararProva(): Promise<Prova | null> {
  return fetch('/api/desafio', { cache: 'no-store' })
    .then((r) => (r.ok ? (r.json() as Promise<Desafio>) : null))
    .then((d) => (d ? resolver(d) : null))
    .catch(() => null)
}
