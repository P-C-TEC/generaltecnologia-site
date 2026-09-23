// Testa a home no computador e no celular: fotografa a página descendo aos poucos e
// avisa se algum elemento cria rolagem lateral.
// Uso: node scripts/testar-telas.mjs [url] [prefixo]   (padrão http://localhost:5178; fotos em teste/)
import { chromium, devices } from 'playwright'
import { mkdir } from 'node:fs/promises'

const URL_ALVO = process.argv[2] ?? 'http://localhost:5178'
const PREFIXO = process.argv[3] ?? ''
await mkdir('teste', { recursive: true })

const APARELHOS = [
  { nome: 'notebook', opcoes: { viewport: { width: 1280, height: 720 } } },
  { nome: 'desk', opcoes: { viewport: { width: 1440, height: 900 } } },
  { nome: 'tablet', opcoes: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
  { nome: 'cel', opcoes: { ...devices['iPhone 13'] } },
  { nome: 'cel-pequeno', opcoes: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
]

const navegador = await chromium.launch()
let problemas = 0
for (const ap of APARELHOS) {
  const pagina = await navegador.newPage(ap.opcoes)
  const erros = []
  pagina.on('pageerror', (e) => erros.push(e.message))
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
  await pagina.goto(URL_ALVO, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(3600) // a hero da opção B só termina de se desenhar em ~3,3 s

  const altura = await pagina.evaluate(() => document.documentElement.scrollHeight)
  const tela = await pagina.evaluate(() => window.innerHeight)
  const larguras = new Set()
  let foto = 0
  for (let y = 0; y < altura; y += Math.round(tela * 0.8)) {
    await pagina.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y)
    await pagina.waitForTimeout(900)
    const r = await pagina.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      w: window.innerWidth,
      x: window.scrollX,
    }))
    larguras.add(r.doc > r.w ? `${r.doc}>${r.w}` : 'ok')
    if (r.doc > r.w || r.x !== 0) problemas++
    foto++
    await pagina.screenshot({ path: `teste/${PREFIXO}${ap.nome}-${String(foto).padStart(2, '0')}.png` })
  }
  console.log(`${ap.nome}: ${foto} fotos, altura ${altura}px, largura do documento: ${[...larguras].join(', ')}`)
  if (erros.length) console.log(`  erros no console: ${erros.slice(0, 3).join(' | ')}`)
  await pagina.close()
}
await navegador.close()
console.log(problemas ? `ROLAGEM LATERAL em ${problemas} posições` : 'sem rolagem lateral')
