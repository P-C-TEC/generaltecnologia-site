import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { LOGO_ALTURA, LOGO_C, LOGO_CAUDA, LOGO_E, LOGO_LARGURA, LOGO_ORIGEM, LOGO_P, LOGO_TEC } from './logoVetor'

// A logo registrada da P&C Tec ganhando vida no lugar do vídeo da referência:
// 1. o contorno se desenha; 2. as cores da logo enchem o traço; 3. pulsos de energia correm
// pelas trilhas de circuito até ela; 4. um feixe de luz varre a logo de tempos em tempos;
// 5. no computador ela inclina em 3D acompanhando o mouse.
// As trilhas usam o mesmo desenho da logo: retas com cantos cortados a 45 graus.

const COR_AZUL = '#086BA5'
const COR_MARINHO = '#05264B'

// Medidas em unidades do desenho (quadrado de 1000), com a logo centrada
const ESCALA = 0.42
const LX = 500 - (LOGO_LARGURA * ESCALA) / 2
const LY = 500 - (LOGO_ALTURA * ESCALA) / 2
const L_DIR = 500 + (LOGO_LARGURA * ESCALA) / 2
const L_BAIXO = 500 + (LOGO_ALTURA * ESCALA) / 2

// No computador a área ocupa a coluna direita da hero, e o enquadramento começa 150 unidades
// abaixo do topo: a logo sobe para o lado das linhas curtas do título ("Criamos / Software /
// Que") e não encosta em "Problemas". Abaixo de 1280px vira uma faixa larga no topo e o
// enquadramento aproxima a logo.
const VIEWBOX = '0 150 1000 1000'
const VIEWBOX_FAIXA = '110 230 780 540'

// Ponto da imagem original da logo (pixels, 2000px) convertido para o desenho
const na = (x: number, y: number): [number, number] => [LX + (x - LOGO_ORIGEM.x) * ESCALA, LY + (y - LOGO_ORIGEM.y) * ESCALA]

// Cada trilha sai de uma borda e termina encostada num traço da logo (a borda de fora do P, o
// topo do C, a ponta do "c" de Tec...), nunca no vazio nem numa ponta. O desvio a 45° no meio
// imita os cantos cortados da logo. Duração e atraso variam para os pulsos nunca chegarem juntos.
type Lado = 'esq' | 'dir' | 'cima' | 'baixo'
function trilha(lado: Lado, [x, y]: [number, number], desvio: number, dur: number, atraso: number) {
  const j = Math.abs(desvio)
  const d = {
    esq: `M0 ${y + desvio} H${x - 80 - j} L${x - 80} ${y} H${x}`,
    dir: `M1000 ${y + desvio} H${x + 80 + j} L${x + 80} ${y} H${x}`,
    cima: `M${x + desvio} 0 V${y - 80 - j} L${x} ${y - 80} V${y}`,
    baixo: `M${x + desvio} 1000 V${y + 80 + j} L${x} ${y + 80} V${y}`,
  }[lado]
  return { d, fim: [x, y] as [number, number], dur, atraso }
}
const TRILHAS = [
  trilha('esq', na(356, 620), 50, 3.2, 0.2), // borda de fora do P
  trilha('esq', na(356, 800), 0, 3.8, 1.6),
  trilha('esq', na(356, 1150), -60, 4.4, 0.9),
  trilha('cima', na(520, 541), -50, 2.9, 2.2), // topo do P
  trilha('cima', na(1100, 598), 0, 3.5, 0.5), // diagonal de cima do C
  trilha('cima', na(1300, 540), 60, 4.1, 2.8), // topo do C
  trilha('dir', na(1531, 700), -50, 3.3, 1.2), // lado direito do C
  trilha('dir', na(1686, 885), 0, 3.9, 0), // ponta do "c" de Tec
  trilha('dir', na(1509, 1100), 60, 4.6, 2), // diagonal de baixo do C
  trilha('baixo', na(420, 1235), -40, 3.1, 1.4), // diagonal de baixo do P
  trilha('baixo', na(1250, 1207), 0, 2.7, 3), // base do C
  trilha('baixo', na(1380, 1207), 50, 3.6, 0.7),
]

export function LogoVivo() {
  const ref = useRef<HTMLDivElement>(null)
  const [viewBox, setViewBox] = useState(VIEWBOX)
  const [comMouse, setComMouse] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')
    const aplicar = () => setViewBox(mq.matches ? VIEWBOX_FAIXA : VIEWBOX)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  // Inclinação 3D seguindo o mouse, com mola para não ficar travado
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 })
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 18 })

  useEffect(() => {
    const ok =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setComMouse(ok)
    if (!ok) return
    const mover = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      mx.set(Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5)))
      my.set(Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5)))
    }
    const sair = () => {
      mx.set(0)
      my.set(0)
    }
    window.addEventListener('pointermove', mover, { passive: true })
    document.documentElement.addEventListener('pointerleave', sair)
    return () => {
      window.removeEventListener('pointermove', mover)
      document.documentElement.removeEventListener('pointerleave', sair)
    }
  }, [mx, my])

  const transformLogo = `translate(${LX} ${LY}) scale(${ESCALA})`

  return (
    <div ref={ref} className="logo-vivo" aria-hidden>
      {/* Circuito e logo inclinam e flutuam juntos, como uma peça só: assim os terminais das
          trilhas continuam encostados nos traços da logo o tempo todo */}
      <motion.div className="logo-vivo-camada logo-vivo-3d" style={comMouse ? { rotateX: rotX, rotateY: rotY } : undefined}>
        <div className="logo-vivo-camada logo-vivo-flutua">
          {/* Camada 1: placa de circuito */}
          <svg className="logo-vivo-camada" viewBox={viewBox} preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="pontos" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.1" fill="#0B1F3A" opacity="0.13" />
              </pattern>
              <filter id="brilho" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="1000" height="1000" fill="url(#pontos)" />
            {TRILHAS.map((t, i) => (
              <g key={i}>
                <path d={t.d} fill="none" stroke="#0B1F3A" strokeOpacity="0.16" strokeWidth="1.2" />
                <path
                  d={t.d}
                  pathLength={100}
                  className="pulso"
                  style={{ animationDuration: `${t.dur}s`, animationDelay: `${2.4 + t.atraso}s` }}
                  filter="url(#brilho)"
                />
                <circle cx={t.fim[0]} cy={t.fim[1]} r="3.4" fill="#F2F1F0" stroke="#1C6DD0" strokeWidth="1.4" />
              </g>
            ))}
          </svg>

          {/* Camada 2: a logo */}
          <svg className="logo-vivo-camada" viewBox={viewBox} preserveAspectRatio="xMidYMid slice">
            <defs>
              {/* Degradê da cauda do "&", que vira a diagonal de baixo do "C", como na logo original */}
              <linearGradient id="grad-cauda" gradientUnits="userSpaceOnUse" x1={LOGO_CAUDA.x1} y1={LOGO_CAUDA.y1} x2={LOGO_CAUDA.x2} y2={LOGO_CAUDA.y2}>
                <stop offset="0" stopColor={COR_AZUL} />
                <stop offset="1" stopColor={COR_MARINHO} />
              </linearGradient>
              <linearGradient id="grad-feixe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <clipPath id="recorte-logo" clipPathUnits="userSpaceOnUse">
                {[LOGO_P, LOGO_C, LOGO_E, LOGO_TEC].map((d, i) => (
                  <path key={i} d={d} clipRule="evenodd" transform={transformLogo} />
                ))}
              </clipPath>
            </defs>

            {/* Moldura técnica em volta da logo */}
            <g className="moldura" stroke="#1C6DD0" strokeWidth="1.5" fill="none">
              <path d={`M${LX - 40} ${LY - 10} V${LY - 40} H${LX - 10}`} />
              <path d={`M${L_DIR + 10} ${LY - 40} H${L_DIR + 40} V${LY - 10}`} />
              <path d={`M${LX - 40} ${L_BAIXO + 10} V${L_BAIXO + 40} H${LX - 10}`} />
              <path d={`M${L_DIR + 10} ${L_BAIXO + 40} H${L_DIR + 40} V${L_BAIXO + 10}`} />
            </g>
            <text x={LX - 40} y={L_BAIXO + 66} className="rotulo">
              P&amp;C TEC · SOFTWARE COM IA
            </text>
            <g className="rotulo-status">
              <circle cx={L_DIR - 48} cy={L_BAIXO + 61} r="4" fill="#2E8FFF" className="pisca" />
              <text x={L_DIR + 40} y={L_BAIXO + 66} textAnchor="end" className="rotulo">
                ONLINE
              </text>
            </g>

            <g transform={transformLogo}>
              <path d={LOGO_P} fillRule="evenodd" className="traco" pathLength={1} style={{ stroke: COR_AZUL, fill: COR_AZUL }} />
              <path d={LOGO_C} fillRule="evenodd" className="traco traco-2" pathLength={1} style={{ stroke: COR_MARINHO, fill: COR_MARINHO }} />
              <path d={LOGO_TEC} fillRule="evenodd" className="traco traco-2" pathLength={1} style={{ stroke: COR_MARINHO, fill: COR_MARINHO }} />
              <path d={LOGO_E} fillRule="evenodd" className="traco" pathLength={1} style={{ stroke: 'url(#grad-cauda)', fill: 'url(#grad-cauda)' }} />
            </g>

            {/* Feixe de luz que varre a logo, recortado no formato dela */}
            <g clipPath="url(#recorte-logo)">
              <g transform="skewX(-20)">
                <rect className="feixe" x={LX - 60} y={0} width={200} height={1000} fill="url(#grad-feixe)" />
              </g>
            </g>
          </svg>
        </div>
      </motion.div>
    </div>
  )
}
