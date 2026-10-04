// Converte as telas capturadas do app (capturas/app/, ver capturar-app.mjs) para WebP no tamanho em
// que a página do GTRestaurante as mostra, e gera a imagem de compartilhamento e os ícones.
// Uso: node scripts/gtrestaurante/otimizar-telas.mjs   (grava em public/gtrestaurante/)
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'

const ORIGEM = 'capturas/app'
const DESTINO = 'public/gtrestaurante'
await mkdir(`${DESTINO}/telas`, { recursive: true })

// As capturas de computador têm 2880 px; os últimos 30 px são a barra de rolagem do app.
const recorteDesk = { left: 0, top: 0, width: 2850, height: 1782 }

const DESK = ['painel', 'estoque', 'checklists', 'checklists-modelos', 'equipe-presenca', 'ficha-tecnica', 'financeiro', 'caixa', 'documentos', 'ativos', 'eventos', 'relatorio-ia']
for (const nome of DESK) {
  const base = sharp(`${ORIGEM}/desk-${nome}.png`).extract(recorteDesk)
  await base.clone().resize({ width: 1440, height: 900 }).webp({ quality: 80 }).toFile(`${DESTINO}/telas/desk-${nome}-1440.webp`)
}
// Versões menores para as janelas do mosaico da hero.
for (const nome of ['painel', 'estoque']) {
  await sharp(`${ORIGEM}/desk-${nome}.png`).extract(recorteDesk).resize({ width: 960, height: 600 }).webp({ quality: 78 }).toFile(`${DESTINO}/telas/desk-${nome}-960.webp`)
}

// Celular (780 × 1688): mantém o cabeçalho e tira o cartão "Resumo do dia" logo abaixo dele.
async function celular(nome) {
  const arq = `${ORIGEM}/cel-${nome}.png`
  const topo = await sharp(arq).extract({ left: 0, top: 0, width: 750, height: 122 }).toBuffer()
  const resto = await sharp(arq).extract({ left: 0, top: 340, width: 750, height: 1348 }).toBuffer()
  await sharp({ create: { width: 750, height: 1470, channels: 3, background: '#000' } })
    .composite([{ input: topo, top: 0, left: 0 }, { input: resto, top: 122, left: 0 }])
    .webp({ quality: 80 })
    .toFile(`${DESTINO}/telas/cel-${nome}-750.webp`)
}
await celular('assistente')

// Imagem de compartilhamento (WhatsApp, redes): 1200 × 630.
const tela = await sharp(await sharp(`${ORIGEM}/desk-painel.png`).extract(recorteDesk).resize({ width: 1040 }).toBuffer()).extract({ left: 0, top: 0, width: 1040, height: 410 }).toBuffer()
const faixa = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><radialGradient id="g" cx="0.1" cy="0" r="0.9"><stop offset="0" stop-color="#ff6b00" stop-opacity="0.55"/><stop offset="1" stop-color="#ff6b00" stop-opacity="0"/></radialGradient></defs>
    <rect width="1200" height="630" fill="#08111e"/><rect width="1200" height="630" fill="url(#g)"/>
    <text x="80" y="118" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#ff6b00">GT<tspan fill="#ffffff">Restaurante</tspan></text>
    <text x="80" y="170" font-family="Arial, sans-serif" font-size="30" fill="#c9d2de">Gestão completa para restaurantes, com IA integrada.</text>
  </svg>`,
)
await sharp(faixa)
  .composite([{ input: tela, top: 220, left: 80 }])
  .jpeg({ quality: 82 })
  .toFile(`${DESTINO}/og-gtrestaurante.jpg`)

// Ícones a partir da logo do app (antes vinha do subdomínio do app, bloqueado pela CSP do site).
const resposta = await fetch('https://gtrestaurante.generaltecnologia.com/brand/logo-gtr.png')
const logo = Buffer.from(await resposta.arrayBuffer())
await writeFile('capturas/logo-gtr-original.png', logo)
for (const lado of [64, 180]) {
  await sharp(logo).resize(lado, lado).png().toFile(`${DESTINO}/logo-gtr-${lado}.png`)
}
console.log('ok')
