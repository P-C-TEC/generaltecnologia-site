// Fotografa o Cara de Pau (mesa com robôs) para a página /caradepau.
// Uso: node scripts/caradepau/capturar-jogo.mjs [url-do-jogo]   (padrão http://localhost:3004)
// Salva PNGs em capturas/caradepau-*.png; scripts/caradepau/otimizar.py converte para WebP em public/caradepau/telas/.
import { chromium, devices } from 'playwright'
import { mkdir } from 'node:fs/promises'

const JOGO = process.argv[2] ?? 'http://localhost:3004'
await mkdir('capturas', { recursive: true })
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function partida(pagina, tema, robos) {
  await pagina.goto(JOGO, { waitUntil: 'networkidle' })
  await espera(1500)
  await pagina.evaluate(async ({ tema, robos }) => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms))
    const b = () => [...document.querySelectorAll('button')]
    const inp = document.querySelector('input[type=text],input:not([type])')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, 'Você')
    inp.dispatchEvent(new Event('input', { bubbles: true }))
    b().find((x) => x.textContent.startsWith(tema))?.click(); await w(300)
    b().find((x) => x.textContent.startsWith('Criar sala ' + tema.split(' ')[0]))?.click(); await w(1500)
    for (let i = 0; i < robos; i++) { b().find((x) => x.textContent.includes('Adicionar rob'))?.click(); await w(400) }
    b().find((x) => x.textContent.includes('Começar partida'))?.click()
  }, { tema, robos })
}

// espera um momento da partida: 'anuncio' (jogada no meio da mesa, com alvo) ou 'vez' (sua vez, menu de ações)
async function momento(pagina, tipo, max = 90) {
  for (let i = 0; i < max; i++) {
    const ok = await pagina.evaluate((tipo) => {
      if (tipo === 'vez') return !!document.querySelector('.bar.actions') && !document.querySelector('.overlay, .modal-back')
      const a = document.querySelector('.announce.on'); return !!(a && a.querySelector('.tgt') && a.querySelector('.an-card') && !document.querySelector('.overlay, .modal-back'))
    }, tipo)
    if (ok) return true
    if (tipo === 'anuncio') await pagina.evaluate(() => { const r = [...document.querySelectorAll('.bar.actions button:not([disabled])')].find((x) => /RENDA|Renda/.test(x.textContent)); r?.click() })
    if (tipo === 'vez') await pagina.evaluate(() => { const p = [...document.querySelectorAll('.bar.react button')].find((x) => /Passar/.test(x.textContent)); p?.click() })
    await espera(500)
  }
  return false
}

const navegador = await chromium.launch()
const FOTOS = [
  { nome: 'cel-anuncio', ap: devices['iPhone 13'], tema: 'Máfia 1920', robos: 4, tipo: 'anuncio', atraso: 1100 },
  { nome: 'cel-vez', ap: devices['iPhone 13'], tema: 'Brasil Império', robos: 3, tipo: 'vez', atraso: 900 },
  { nome: 'desk-anuncio', ap: { viewport: { width: 1440, height: 900 } }, tema: 'Máfia 1920', robos: 5, tipo: 'anuncio', atraso: 1100 },
  { nome: 'desk-cyber', ap: { viewport: { width: 1440, height: 900 } }, tema: 'Cyberpunk', robos: 4, tipo: 'anuncio', atraso: 1100 },
  { nome: 'desk-medieval', ap: { viewport: { width: 1440, height: 900 } }, tema: 'Reino Medieval', robos: 3, tipo: 'vez', atraso: 900 },
]
for (const f of FOTOS) {
  const ctx = await navegador.newContext(f.ap)
  const pagina = await ctx.newPage()
  await partida(pagina, f.tema, f.robos)
  await espera(4000)
  // fecha o chat (computador) para a mesa aparecer inteira
  await pagina.evaluate(() => { document.querySelector('.chat-panel .x, .chat .close, [title="Fechar"]')?.click(); const c = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '✕' && x.closest('.chat, .chat-panel, aside')); c?.click() })
  const ok = await momento(pagina, f.tipo)
  await espera(f.atraso)
  await pagina.screenshot({ path: `capturas/caradepau-${f.nome}.png` })
  console.log(f.nome, ok ? 'ok' : 'sem o momento pedido (foto mesmo assim)')
  await ctx.close()
}
await navegador.close()
