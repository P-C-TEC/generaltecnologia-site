// Captura telas dos produtos da P&C Tec direto das páginas públicas deles.
// As imagens alimentam a galeria e os cartões de produto da home.
// Uso: node scripts/capturar-telas.mjs   (saída em capturas/; depois rode otimizar-imagens.mjs)
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const SAIDA = new URL('../capturas/', import.meta.url)
await mkdir(SAIDA, { recursive: true })

const ALVOS = [
  { nome: 'gtrestaurante', url: 'https://pectecs.com.br/gtrestaurante' },
  { nome: 'gtrestaurante-app', url: 'https://gtrestaurante.generaltecnologia.com' },
  { nome: 'mordomo', url: 'https://mordomotec.com.br' },
  { nome: 'plantemo', url: 'https://pectecs.com.br/plantemo' },
  { nome: 'plantemo-site', url: 'https://plantemo.vercel.app' },
]

const TELAS = [
  { sufixo: 'desk', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false },
  { sufixo: 'cel', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
]

const navegador = await chromium.launch()
for (const tela of TELAS) {
  const ctx = await navegador.newContext({ ...tela, reducedMotion: 'reduce', locale: 'pt-BR' })
  for (const alvo of ALVOS) {
    const pagina = await ctx.newPage()
    try {
      await pagina.goto(alvo.url, { waitUntil: 'networkidle', timeout: 45000 })
      await pagina.waitForTimeout(1500)
      const altura = await pagina.evaluate(() => document.documentElement.scrollHeight)
      const passos = Math.min(6, Math.ceil(altura / tela.viewport.height))
      for (let i = 0; i < passos; i++) {
        await pagina.evaluate((y) => window.scrollTo(0, y), i * tela.viewport.height)
        await pagina.waitForTimeout(700)
        const arquivo = new URL(`${alvo.nome}-${tela.sufixo}-${i + 1}.png`, SAIDA)
        await pagina.screenshot({ path: fileURLToPath(arquivo) })
      }
      console.log(`ok  ${alvo.nome} ${tela.sufixo}: ${passos} telas (${pagina.url()})`)
    } catch (erro) {
      console.log(`ERRO ${alvo.nome} ${tela.sufixo}: ${erro.message.split('\n')[0]}`)
    }
    await pagina.close()
  }
  await ctx.close()
}
await navegador.close()
