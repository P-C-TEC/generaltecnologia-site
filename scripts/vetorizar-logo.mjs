// Redesenha a logo registrada da P&C Tec (materiais/logo-registro/) em vetor limpo.
// Uso: node scripts/vetorizar-logo.mjs   (grava src/b/logoVetor.ts)
//
// A imagem de origem tem bordas levemente tremidas e, onde a cauda do "&" vira a diagonal de
// baixo do "C", as cores passam do azul ao marinho num degradê. Vetorizar pixel a pixel copiava
// esses defeitos. Aqui a logo é separada em peças e cada uma é tratada do jeito certo:
//   - P e C: só retas. Cada lado é travado em múltiplos de 45° e os cantos são recalculados como
//     o cruzamento exato das retas, então as linhas saem perfeitamente retas e paralelas;
//   - "&" e "Tec": curvas, contornadas com suavização;
//   - a cauda do "&" leva junto o trecho em que encontra o "C": no site ela recebe um degradê
//     azul → marinho, como na logo original, em vez de um recorte de cores picotado.
import sharp from 'sharp'
import potrace from 'potrace'
import { writeFile } from 'node:fs/promises'

const ORIGEM = '../materiais/logo-registro/pc-tec-logo-registro-2000.webp'
const AZUL = [8, 107, 165]
const MARINHO = [5, 38, 75]
const BRANCO = [255, 255, 255]

const { data, info } = await sharp(ORIGEM).flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: CH } = info
const N = W * H

// ---------- 1. Qual cor cada pixel mistura com o branco, e em que proporção ----------
function cobertura(px, cor) {
  const d = BRANCO.map((w, i) => w - cor[i])
  const p = BRANCO.map((w, i) => w - px[i])
  const alfa = Math.max(0, Math.min(1, (p[0] * d[0] + p[1] * d[1] + p[2] * d[2]) / (d[0] ** 2 + d[1] ** 2 + d[2] ** 2)))
  return { alfa, erro: Math.hypot(...BRANCO.map((w, i) => w - alfa * d[i] - px[i])) }
}
const classe = new Uint8Array(N) // 0 fundo, 1 azul, 2 marinho
for (let i = 0; i < N; i++) {
  const px = [data[i * CH], data[i * CH + 1], data[i * CH + 2]]
  const a = cobertura(px, AZUL)
  const m = cobertura(px, MARINHO)
  const g = a.erro <= m.erro ? a : m
  if (g.alfa >= 0.5) classe[i] = g === a ? 1 : 2
}

// ---------- 2. Peças conectadas de cada cor ----------
function componentes(cls) {
  const rot = new Int32Array(N).fill(-1)
  const lista = []
  const fila = new Int32Array(N)
  for (let s = 0; s < N; s++) {
    if (classe[s] !== cls || rot[s] >= 0) continue
    const id = lista.length
    let ini = 0, fim = 0, area = 0, sx = 0, sy = 0
    let x0 = W, y0 = H, x1 = 0, y1 = 0
    fila[fim++] = s
    rot[s] = id
    while (ini < fim) {
      const p = fila[ini++]
      const x = p % W, y = (p / W) | 0
      area++; sx += x; sy += y
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
          const q = ny * W + nx
          if (classe[q] === cls && rot[q] < 0) { rot[q] = id; fila[fim++] = q }
        }
    }
    lista.push({ id, area, cx: sx / area, cy: sy / area, x0, y0, x1, y1 })
  }
  return { rot, lista }
}
const azul = componentes(1)
const marinho = componentes(2)

// ---------- 3. Separa as peças ----------
// O "&" é a peça azul que passa pelo laço de baixo dele
const pontoE = [830, 1100]
const idE = azul.rot[pontoE[1] * W + pontoE[0]]
if (idE < 0) throw new Error('não achei o "&" no ponto de referência; confira pontoE')

// Faixa onde a cauda do "&" encontra o "C": tudo o que é tinta ali vai para a cauda
// (a cauda desce a 45°, com y ≈ x + 10; o limite y - x > -40 deixa de fora o pé da barra
// interna do "C", que fica logo acima dela)
const naCauda = (x, y) => x >= 1040 && x <= 1215 && y >= 1030 && y <= 1215 && y - x > -40

// "Tec": peças marinho inteiras dentro da área das letras
const ehTec = (c) => c.x0 >= 1200 && c.y0 >= 780 && c.y1 <= 1040
// Respingos: pedacinhos marinho soltos no meio do azul (e vice-versa) voltam para a cor certa
const respingoMarinho = (c) => c.area < 4000 && c.cx < 1120
const respingoAzul = (c) => c.area < 4000 && c.cx > 1180

const mascaras = { P: new Uint8Array(N), C: new Uint8Array(N), E: new Uint8Array(N), T: new Uint8Array(N), TEC: new Uint8Array(N) }
for (let i = 0; i < N; i++) {
  if (!classe[i]) continue
  const x = i % W, y = (i / W) | 0
  if (classe[i] === 1) {
    const c = azul.lista[azul.rot[i]]
    if (c.id === idE || naCauda(x, y)) mascaras.E[i] = 1
    else if (respingoAzul(c)) mascaras.C[i] = 1
    else mascaras.P[i] = 1
  } else {
    const c = marinho.lista[marinho.rot[i]]
    // O T de "Tec" é só retas e vai pelo mesmo caminho do P e do C; o "e" e o "c" são curvos
    if (ehTec(c)) mascaras[c.x0 < 1300 ? 'T' : 'TEC'][i] = 1
    else if (respingoMarinho(c)) mascaras.E[i] = 1
    else {
      mascaras.C[i] = 1
      // Só o trecho da cauda antes da barra de baixo do "C": a barra fica com o traçado reto
      // (até 1162: um pouco por baixo do "C", para não sobrar fresta entre os dois; ali o
      // degradê já está todo marinho, então a emenda não aparece)
      if (naCauda(x, y) && x <= 1162) mascaras.E[i] = 1
    }
  }
}

// ---------- 4. Contorno ----------
let bx0 = W, by0 = H, bx1 = 0, by1 = 0
for (let i = 0; i < N; i++)
  if (classe[i]) {
    const x = i % W, y = (i / W) | 0
    if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y
  }
const caixa = { left: bx0 - 2, top: by0 - 2, width: bx1 - bx0 + 5, height: by1 - by0 + 5 }

async function tracar(mascara, { suavizar = 0, ...opcoes }) {
  const buf = Buffer.alloc(N, 255)
  for (let i = 0; i < N; i++) if (mascara[i]) buf[i] = 0
  let img = sharp(buf, { raw: { width: W, height: H, channels: 1 } }).extract(caixa)
  // Filtro de mediana: tira rebarbas de poucos pixels da borda sem arredondar os cantos
  if (suavizar) img = sharp(await img.png().toBuffer()).median(suavizar)
  const png = await img.png().toBuffer()
  return new Promise((ok, erro) => potrace.trace(png, { threshold: 128, ...opcoes }, (e, svg) => (e ? erro(e) : ok(svg.match(/ d="([^"]+)"/)[1]))))
}

// ---------- 5. Retas limpas para o P e o C ----------
function subcaminhos(d) {
  return d
    .split('M')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = s.replace(/L/g, ' ').trim().split(/\s+/).map(Number)
      const pts = []
      for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]])
      return pts
    })
}

function douglasPeucker(pts, eps) {
  if (pts.length < 3) return pts
  const [a, b] = [pts[0], pts[pts.length - 1]]
  let max = 0, idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const dist = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / len
    if (dist > max) { max = dist; idx = i }
  }
  if (max <= eps) return [a, b]
  return [...douglasPeucker(pts.slice(0, idx + 1), eps).slice(0, -1), ...douglasPeucker(pts.slice(idx), eps)]
}

const PASSO = Math.PI / 4
function endireitar(pts) {
  // Simplifica o polígono fechado em duas metades, cortando no ponto mais distante do início
  // (com o começo e o fim no mesmo lugar, a simplificação direta apagaria tudo)
  let k = 0, max = -1
  pts.forEach(([x, y], i) => {
    const d = Math.hypot(x - pts[0][0], y - pts[0][1])
    if (d > max) { max = d; k = i }
  })
  const p = [...douglasPeucker(pts.slice(0, k + 1), 2.2).slice(0, -1), ...douglasPeucker([...pts.slice(k), pts[0]], 2.2).slice(0, -1)]
  if (p.length < 3) return p
  // Arestas com direção travada em múltiplos de 45°
  let arestas = p.map((a, i) => {
    const b = p[(i + 1) % p.length]
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
    const trav = Math.round(ang / PASSO) * PASSO
    const dir = Math.abs(ang - trav) < (10 * Math.PI) / 180 ? trav : ang
    return { a, b, dir, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })
  // Junta arestas vizinhas com a mesma direção (eram uma só, quebrada pelo ruído)
  const mesma = (u, v) => Math.abs(Math.atan2(Math.sin(u - v), Math.cos(u - v))) < 0.02
  const juntar = (u, v) => ({ a: u.a, b: v.b, dir: u.dir, len: u.len + v.len })
  let mudou = true
  while (mudou && arestas.length > 3) {
    mudou = false
    for (let i = 0; i < arestas.length && !mudou; i++) {
      const j = (i + 1) % arestas.length
      if (mesma(arestas[i].dir, arestas[j].dir)) {
        arestas[i] = juntar(arestas[i], arestas[j])
        arestas.splice(j, 1)
        mudou = true
        continue
      }
      // Aresta minúscula (degrau de ruído). Se as vizinhas seguem a mesma direção, as três
      // viram uma só; senão, ela só sai se o canto novo cair perto de onde ela estava (vizinhas
      // quase paralelas se cruzariam longe e inventariam uma diagonal que não existe).
      const e = arestas[i]
      if (e.len >= 16 || arestas.length <= 4) continue
      const ia = (i - 1 + arestas.length) % arestas.length
      const ib = (i + 1) % arestas.length
      const ant = arestas[ia], prox = arestas[ib]
      if (mesma(ant.dir, prox.dir)) {
        const unida = juntar(ant, prox)
        const fora = [i, ib].sort((x, y) => y - x)
        arestas[ia] = unida
        for (const f of fora) arestas.splice(f, 1)
        mudou = true
        continue
      }
      const canto = cruzamento(reta(ant), reta(prox))
      const meio = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2]
      if (canto && Math.hypot(canto[0] - meio[0], canto[1] - meio[1]) < 20) {
        arestas.splice(i, 1)
        mudou = true
      }
    }
  }
  // Cada aresta vira uma reta com a direção travada; os cantos novos são o cruzamento de cada
  // reta com a seguinte
  const retas = arestas.map(reta)
  return retas.map((r, i) => {
    const s = retas[(i + 1) % retas.length]
    return cruzamento(r, s) ?? [s.px, s.py]
  })
}

// Reta com a direção travada da aresta, passando pelo meio dos pontos originais
function reta(e) {
  return { px: (e.a[0] + e.b[0]) / 2, py: (e.a[1] + e.b[1]) / 2, dx: Math.cos(e.dir), dy: Math.sin(e.dir) }
}
function cruzamento(r, s) {
  const den = r.dx * s.dy - r.dy * s.dx
  if (Math.abs(den) < 1e-6) return null
  const t = ((s.px - r.px) * s.dy - (s.py - r.py) * s.dx) / den
  return [r.px + t * r.dx, r.py + t * r.dy]
}

const fmt = (n) => Math.round(n * 10) / 10
async function retas(mascara) {
  const d = await tracar(mascara, { alphaMax: 0, optCurve: false, turdSize: 60 })
  return subcaminhos(d)
    .map(endireitar)
    .filter((p) => p.length >= 3)
    .map((p) => 'M' + p.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + 'Z')
    .join('')
}

const LOGO_P = await retas(mascaras.P)
const LOGO_C = await retas(mascaras.C)
const LOGO_E = await tracar(mascaras.E, { suavizar: 7, turdSize: 60, alphaMax: 1, optTolerance: 0.3 })
// (sem suavização: a mediana arredondaria os cantos retos do T)
const LOGO_TEC = (await retas(mascaras.T)) + (await tracar(mascaras.TEC, { turdSize: 40, alphaMax: 1, optTolerance: 0.3 }))

// O degradê da cauda do "&" (em coordenadas do desenho) corre ao longo da própria cauda, a 45°:
// azul até ela se aproximar do "C", marinho quando o encontra. Na diagonal, a ponta de cima do
// "&" (que fica mais à direita, porém bem mais alta) continua toda azul.
const cauda = { x1: 1075 - caixa.left, y1: 1075 - caixa.top, x2: 1165 - caixa.left, y2: 1165 - caixa.top }

await writeFile(
  'src/b/logoVetor.ts',
  `// Gerado por scripts/vetorizar-logo.mjs a partir da logo registrada (materiais/logo-registro/). Não editar à mão.\n` +
    `// Coordenadas em pixels da imagem de origem (2000px), recortadas na caixa da logo.\n` +
    `export const LOGO_LARGURA = ${caixa.width}\nexport const LOGO_ALTURA = ${caixa.height}\n` +
    `/** Canto da caixa na imagem de origem: subtraia para converter uma medida da imagem */\n` +
    `export const LOGO_ORIGEM = { x: ${caixa.left}, y: ${caixa.top} }\n` +
    `/** Faixa horizontal do degradê da cauda do "&" (azul → marinho) */\n` +
    `export const LOGO_CAUDA = ${JSON.stringify(cauda)}\n` +
    `export const LOGO_P = ${JSON.stringify(LOGO_P)}\nexport const LOGO_C = ${JSON.stringify(LOGO_C)}\n` +
    `export const LOGO_E = ${JSON.stringify(LOGO_E)}\nexport const LOGO_TEC = ${JSON.stringify(LOGO_TEC)}\n`,
)
console.log('ok', caixa, { P: LOGO_P.length, C: LOGO_C.length, E: LOGO_E.length, TEC: LOGO_TEC.length })
