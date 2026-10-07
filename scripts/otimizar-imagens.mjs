// Converte as capturas usadas pelo site para WebP, no tamanho em que ele as mostra.
// Uso: node scripts/otimizar-imagens.mjs   (lê capturas/, grava em public/telas/)
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

await mkdir('public/telas', { recursive: true })

// Telas de computador: a seção Sobre e os cartões de produto
const DESK = ['gtrestaurante-desk-1', 'gtrestaurante-desk-3', 'mordomo-desk-1', 'mordomo-desk-2', 'plantemo-site-desk-1', 'plantemo-site-desk-5', 'ctma-site-desk-2', 'ctma-site-desk-3']
// Telas de celular: a moldura de celular nos cartões de produto
const CEL = ['gtrestaurante-cel-1', 'mordomo-cel-1', 'plantemo-site-cel-1', 'ctma-site-cel-1']

// Captura que nao esta na pasta e pulada, e nao derruba o resto. Quase nunca
// se recaptura o site inteiro: o normal e refazer as telas de um produto so, e
// antes disso o script parava no primeiro arquivo ausente -- deixando as
// imagens novas sem converter.
import { existsSync } from 'node:fs'

let feitas = 0
const puladas = []

for (const [lista, largura, qualidade] of [
  [DESK, 960, 78],
  [CEL, 640, 80],
]) {
  for (const nome of lista) {
    const origem = `capturas/${nome}.png`
    if (!existsSync(origem)) {
      puladas.push(nome)
      continue
    }
    await sharp(origem).resize({ width: largura }).webp({ quality: qualidade }).toFile(`public/telas/${nome}.webp`)
    feitas++
  }
}

console.log(`ok  ${feitas} imagens convertidas`)
if (puladas.length) console.log(`     sem captura em capturas/: ${puladas.join(', ')}`)
