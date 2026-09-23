// Gera, a partir da logo registrada já vetorizada (src/b/logoVetor.ts):
// - public/brand/pc-tec-logo-registro.svg        colorida, para fundo claro
// - public/brand/pc-tec-logo-registro-branca.svg branca, para fundo escuro
// - os ícones quadrados (aba do navegador e "adicionar à tela inicial"), com a logo branca sobre
//   o navy da marca. Sem ícone quadrado o celular recorta a logo retangular e sobra só o "P".
// Uso: node scripts/gerar-icones.mjs   (rode depois de scripts/vetorizar-logo.mjs)
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { LOGO_ALTURA as H, LOGO_C, LOGO_CAUDA as K, LOGO_E, LOGO_LARGURA as W, LOGO_P, LOGO_TEC } from '../src/b/logoVetor.ts'

// A cauda do "&" leva o degradê azul → marinho onde encontra o "C", como na logo original
const svgLogo = (azul, marinho) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs><linearGradient id="cauda" gradientUnits="userSpaceOnUse" x1="${K.x1}" y1="${K.y1}" x2="${K.x2}" y2="${K.y2}">` +
  `<stop offset="0" stop-color="${azul}"/><stop offset="1" stop-color="${marinho}"/></linearGradient></defs>` +
  `<path fill-rule="evenodd" fill="${azul}" d="${LOGO_P}"/><path fill-rule="evenodd" fill="${marinho}" d="${LOGO_C}"/>` +
  `<path fill-rule="evenodd" fill="${marinho}" d="${LOGO_TEC}"/><path fill-rule="evenodd" fill="url(#cauda)" d="${LOGO_E}"/></svg>`

const colorida = svgLogo('#086BA5', '#05264B')
const branca = svgLogo('#FFFFFF', '#FFFFFF')
await writeFile('public/brand/pc-tec-logo-registro.svg', colorida)
await writeFile('public/brand/pc-tec-logo-registro-branca.svg', branca)

async function icone(tamanho, arquivo, ocupacao) {
  const logo = await sharp(Buffer.from(branca)).resize({ width: Math.round(tamanho * ocupacao) }).png().toBuffer()
  const fundo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#123363"/><stop offset="1" stop-color="#0B1F3A"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  )
  await sharp(fundo).composite([{ input: logo, gravity: 'center' }]).png().toFile(`public/icones/${arquivo}`)
}

// O iOS e o Android arredondam o ícone por conta própria: a logo fica com folga nas bordas
await icone(180, 'apple-touch-icon.png', 0.7)
await icone(192, 'icone-192.png', 0.7)
await icone(512, 'icone-512.png', 0.7)
// "maskable": o Android pode cortar em círculo, então a logo encolhe para caber na zona segura
await icone(512, 'icone-512-maskable.png', 0.56)
// Aba do navegador: pouco espaço, a logo ocupa quase tudo
await icone(32, 'favicon-32.png', 0.9)
await icone(48, 'favicon-48.png', 0.9)
console.log('ok')
