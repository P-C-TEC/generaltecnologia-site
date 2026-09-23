import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export const SUBIR = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }

export type Linha = { t: string; recuo?: boolean; destaque?: boolean }

// Título em escada: cada linha sobe de dentro de uma máscara. Quem observa a entrada na tela é o
// título inteiro; se fossem as palavras (que começam fora da máscara), o navegador nunca as veria.
export function Titulo({ linhas, como = 'h2', className = '', rotulo }: { linhas: Linha[]; como?: 'h1' | 'h2'; className?: string; rotulo?: string }) {
  const Tag = como === 'h1' ? motion.h1 : motion.h2
  return (
    <Tag
      className={`titulo ${className}`}
      aria-label={rotulo ?? linhas.map((l) => l.t).join(' ')}
      initial="oculta"
      {...(como === 'h1' ? { animate: 'visivel' } : { whileInView: 'visivel', viewport: { once: true, amount: 0.4 } })}
    >
      {linhas.map((l, i) => (
        <span key={l.t} aria-hidden className={`linha${l.recuo ? ' recuo' : ''}${l.destaque ? ' destaque' : ''}`}>
          <motion.span variants={{ oculta: { y: '105%' }, visivel: { y: '0%', transition: { ...SUBIR, delay: (como === 'h1' ? 0.2 : 0) + i * 0.08 } } }}>
            {l.t}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

// Surge de baixo quando entra na tela, uma vez só
export function Surgir({ children, atraso = 0, className, como = 'div', y = 30 }: { children: ReactNode; atraso?: number; className?: string; como?: 'div' | 'p'; y?: number }) {
  const M = como === 'p' ? motion.p : motion.div
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ ...SUBIR, delay: atraso }}>
      {children}
    </M>
  )
}
