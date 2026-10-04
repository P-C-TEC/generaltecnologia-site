// Captura telas internas do GTRestaurante, logado numa conta de demonstração, para a página
// de vendas. Abre uma janela do Chromium; quem roda faz o login nela (o script nunca vê a senha).
// Na conta demo, sair apaga os dados: só sai com ZERAR=1, para recomeçar do zero.
// Uso: [ZERAR=1] [SEM_JANELA=1] node scripts/gtrestaurante/capturar-app.mjs [pasta-do-perfil]
// (saída em capturas/app/)
import { chromium } from 'playwright'
import { mkdir, readFile } from 'node:fs/promises'

const PERFIL = process.argv[2] ?? 'capturas/.perfil-app'
const SAIDA = 'capturas/app'
await mkdir(SAIDA, { recursive: true })

const ctx = await chromium.launchPersistentContext(PERFIL, {
  headless: process.env.SEM_JANELA === '1', // com SEM_JANELA=1 roda sem janela (perfil já logado)
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'pt-BR',
  reducedMotion: 'reduce',
  // Com o service worker do app ativo, toda recarga no Chromium do Playwright falha (ERR_FAILED
  // nos /assets) e a tela fica em branco.
  serviceWorkers: 'block',
  bypassCSP: true, // para injetar popular-demo.js
})
const pagina = ctx.pages()[0] ?? (await ctx.newPage())
await pagina.goto('https://gtrestaurante.generaltecnologia.com', { waitUntil: 'networkidle' })

const espera = (ms) => pagina.waitForTimeout(ms)
const logado = () =>
  pagina.evaluate(
    () =>
      [...document.querySelectorAll('nav button')].some((b) => b.innerText.trim() === 'Estoque') ||
      document.body.innerText.includes('Configure seu Restaurante'),
  )

// Com ZERAR=1, sai da conta antes (a conta demo apaga os dados ao deslogar) e espera um login novo.
await espera(3000)
if (process.env.ZERAR === '1' && (await logado())) {
  await pagina.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].find((x) => ['Sair', 'Sair / Cancelar'].includes(x.innerText.trim()))
    b?.click()
  })
  await espera(4000)
  console.log('Saiu da conta demo (dados zerados).')
}

console.log('Aguardando o login na janela aberta (até 15 min)...')
await pagina.waitForFunction(
  () =>
    [...document.querySelectorAll('nav button')].some((b) => b.innerText.trim() === 'Estoque') ||
    document.body.innerText.includes('Configure seu Restaurante'),
  null,
  { timeout: 15 * 60_000, polling: 1000 },
)
console.log('Logado.')

// O app volta à tela "Configure seu Restaurante" a cada carregamento, mas os cadastros ficam.
// Por isso a configuração roda sempre, e o resto só quando o estoque está vazio.
const codigo = await readFile(new URL('./popular-demo.js', import.meta.url), 'utf8')
await pagina.addScriptTag({ content: codigo })
console.log(await pagina.evaluate(() => window.__demo.configurar()))
await pagina.waitForFunction(() => [...document.querySelectorAll('nav button')].some((b) => b.innerText.trim() === 'Estoque'), null, { timeout: 60_000 })
const vazio = await pagina.evaluate(async () => {
  const nav = document.querySelector('nav')
  const achar = (t) => [...nav.querySelectorAll('button,a')].find((x) => x.innerText.trim() === t)
  achar('Estoque').click()
  await new Promise((r) => setTimeout(r, 400))
  ;(achar('Estoque de Insumos') ?? (achar('Estoque').click(), achar('Estoque de Insumos')))?.click()
  await new Promise((r) => setTimeout(r, 2500))
  return /\b0 insumo\(s\) cadastrado|estoque ainda está vazio/.test(document.body.innerText)
})
if (vazio) {
  for (const passo of ['insumos', 'equipe', 'escalaEPresenca', 'checklists', 'fichas', 'financeiro', 'ativos', 'documentos', 'reservas']) {
    try {
      const limite = new Promise((_, nao) => setTimeout(() => nao(new Error('passou de 4 min')), 4 * 60_000))
      console.log(await Promise.race([pagina.evaluate((p) => window.__demo[p](), passo), limite]))
    } catch (e) {
      console.log('FALHOU', passo, e.message.split('\n').slice(0, 2).join(' | '))
      await pagina.screenshot({ path: `${SAIDA}/falha-${passo}.png` })
      await pagina.keyboard.press('Escape')
    }
  }
  await espera(3000)
}
console.log('Capturando.')

// Tira da imagem o e-mail da conta, que aparece no cartão do usuário.
async function limpar() {
  await pagina.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (/[\w.+-]+@[\w.-]+\.\w+/.test(n.textContent)) n.textContent = n.textContent.replace(/[\w.+-]+@[\w.-]+\.\w+/g, '')
    }
  })
}

async function ir(grupo, sub) {
  await pagina.evaluate(async ([g, s]) => {
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
    const nav = document.querySelector('nav')
    const achar = (t) => [...nav.querySelectorAll('button,a')].find((x) => x.innerText.trim() === t)
    if (g === 'Dashboard') {
      const b = [...document.querySelectorAll('button,a')].find((x) => x.innerText.trim() === 'Dashboard')
      if (b) b.click()
      else [...document.querySelectorAll('nav button')].find((x) => x.innerText.trim() === 'Painel de Controle')?.click()
      return
    }
    achar(g).click()
    await dormir(400)
    if (s) {
      if (!achar(s)) { achar(g).click(); await dormir(400) }
      achar(s).click()
    }
  }, [grupo, sub])
  await espera(2500)
  await pagina.evaluate(() => (document.querySelector('main') ?? document.scrollingElement).scrollTo?.(0, 0))
  await pagina.evaluate(() => window.scrollTo(0, 0))
}

async function clicar(texto) {
  await pagina.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === t)
    b?.click()
  }, texto)
  await espera(1200)
}

async function foto(nome) {
  await limpar()
  await espera(300)
  await pagina.screenshot({ path: `${SAIDA}/${nome}.png` })
  console.log('ok', nome)
}

// Abre ou fecha o chat do assistente pelo botão flutuante.
async function chat(aberto) {
  const estaAberto = await pagina.getByPlaceholder('Pergunte algo...').isVisible().catch(() => false)
  if (estaAberto === aberto) return
  await pagina.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Abrir assistente de IA' || x.title === 'Abrir assistente de IA')
    b?.click()
  })
  await espera(1200)
}

async function perguntar(texto) {
  await chat(true)
  const campo = pagina.getByPlaceholder('Pergunte algo...')
  await campo.fill(texto)
  await campo.press('Enter')
  await espera(25_000)
}

const TELAS_DESK = [
  ['painel', async () => { await ir('Dashboard'); await clicar('Fechar') }],
  ['estoque', () => ir('Estoque', 'Estoque de Insumos')],
  ['checklists', () => ir('Checklists', 'Preencher hoje')],
  ['checklists-modelos', () => ir('Checklists', 'Modelos e rotinas')],
  ['equipe-presenca', () => ir('Equipe & RH', 'Escala e presença')],
  ['ficha-tecnica', () => ir('Cardápio & Fichas', 'Ficha Técnica')],
  ['financeiro', () => ir('Financeiro & Perdas', 'Entradas e saídas')],
  ['caixa', async () => { await ir('Financeiro & Perdas', 'Caixa e perdas'); await clicar('Fechamentos anteriores') }],
  ['documentos', () => ir('Documentos & Licenças')],
  ['ativos', () => ir('Ativos & Manutenção')],
  ['eventos', () => ir('Eventos & Reservas')],
  ['relatorio-ia', async () => { await ir('Painel de Controle', 'Relatórios IA'); await clicar('Esta semana'); await clicar('Gerar relatório'); await espera(25_000) }],
]

try {
  for (const [nome, abrir] of TELAS_DESK) {
    await abrir()
    await foto(`desk-${nome}`)
  }
  await ir('Dashboard')
  await perguntar('Quais insumos estão abaixo do mínimo e quanto preciso comprar?')
  await foto('desk-assistente')

  await pagina.setViewportSize({ width: 390, height: 844 })
  // Sem recarregar: a conta demo zera a cada carregamento da página.
  await espera(1500)
  await chat(false)
  await ir('Dashboard')
  await foto('cel-painel')
  await perguntar('Algum ativo precisa de manutenção?')
  await foto('cel-assistente')
} finally {
  console.log('Fim.')
  await ctx.close()
}
