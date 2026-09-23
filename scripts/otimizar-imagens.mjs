// Converte as capturas usadas pelo site para WebP, no tamanho em que ele as mostra.
// Uso: node scripts/otimizar-imagens.mjs   (lê capturas/, grava em public/telas/)
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

await mkdir('public/telas', { recursive: true })

// Telas de computador: a seção Sobre e os cartões de produto
const DESK = ['gtrestaurante-desk-1', 'gtrestaurante-desk-3', 'mordomo-desk-1', 'mordomo-desk-2', 'plantemo-site-desk-1', 'plantemo-site-desk-5']
// Telas de celular: a moldura de celular nos cartões de produto
const CEL = ['gtrestaurante-cel-1', 'mordomo-cel-1', 'plantemo-site-cel-1']

for (const nome of DESK) {
  await sharp(`capturas/${nome}.png`).resize({ width: 960 }).webp({ quality: 78 }).toFile(`public/telas/${nome}.webp`)
}
for (const nome of CEL) {
  await sharp(`capturas/${nome}.png`).resize({ width: 640 }).webp({ quality: 80 }).toFile(`public/telas/${nome}.webp`)
}
console.log('ok')
