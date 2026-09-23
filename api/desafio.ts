// Entrega um desafio novo de prova de trabalho para o formulário de contato (ver _desafio.ts).
import { criarDesafio } from './_desafio.js'

export function GET() {
  const desafio = criarDesafio()
  return new Response(JSON.stringify(desafio ?? { erro: 'indisponível' }), {
    status: desafio ? 200 : 503,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
