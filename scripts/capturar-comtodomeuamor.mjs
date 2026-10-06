// Captura a página do "Com todo meu amor…" para alimentar os cartões da home.
//
// Diferente de capturar-telas.mjs, este aponta para o servidor local: a página
// ainda não está publicada quando as imagens precisam existir, porque é a home
// que leva o visitante até ela.
//
// Uso: npm run dev em outro terminal, depois
//      node scripts/capturar-comtodomeuamor.mjs
// Saída em capturas/; depois rode otimizar-imagens.mjs.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const ENDERECO =
  process.env.ENDERECO ?? 'http://localhost:5173/comtodomeuamor/index.html'
const SAIDA = new URL('../capturas/', import.meta.url)
await mkdir(SAIDA, { recursive: true })

const TELAS = [
  { sufixo: 'desk', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false },
  { sufixo: 'cel', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
]

const navegador = await chromium.launch()
for (const tela of TELAS) {
  // reducedMotion liga o atalho que a própria página respeita: tudo já nasce
  // visível, sem esperar a rolagem acender. Sem isso, metade das capturas
  // sairia em branco.
  const ctx = await navegador.newContext({ ...tela, reducedMotion: 'reduce', locale: 'pt-BR' })
  const pagina = await ctx.newPage()
  await pagina.goto(ENDERECO, { waitUntil: 'networkidle', timeout: 45000 })
  await pagina.waitForTimeout(1200)

  const altura = await pagina.evaluate(() => document.documentElement.scrollHeight)
  const passos = Math.min(6, Math.ceil(altura / tela.viewport.height))
  for (let i = 0; i < passos; i++) {
    await pagina.evaluate((y) => window.scrollTo(0, y), i * tela.viewport.height)
    await pagina.waitForTimeout(600)
    const arquivo = new URL(`ctma-site-${tela.sufixo}-${i + 1}.png`, SAIDA)
    await pagina.screenshot({ path: fileURLToPath(arquivo) })
  }
  console.log(`ok  ${tela.sufixo}: ${passos} telas`)
  await ctx.close()
}
await navegador.close()
