import { MotionConfig, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { RolagemSuave } from '../components/RolagemSuave'
import { SUBIR, Titulo } from './comum'
import { ContatoProvider, useContato } from './Contato'
import { LogoVivo } from './LogoVivo'
import { Produtos, Rodape, SecaoContato, Servicos, Sobre } from './Secoes'

const LINKS = [
  { rotulo: 'Sobre', href: '#sobre' },
  { rotulo: 'Serviços', href: '#servicos' },
  { rotulo: 'Produtos', href: '#produtos' },
  { rotulo: 'Contato', href: '#contato' },
]

export function AppB() {
  return (
    <MotionConfig reducedMotion="user">
      <ContatoProvider>
        <RolagemSuave />
        <main className="pagina">
          <Hero />
          <Sobre />
          <Servicos />
          <Produtos />
          <SecaoContato />
        </main>
        <Rodape />
      </ContatoProvider>
    </MotionConfig>
  )
}

function Hero() {
  const abrir = useContato()
  const [menuAberto, setMenuAberto] = useState(false)
  // O menu fica fixo no alto; depois que a página desce, ganha fundo e encolhe um pouco
  const [rolou, setRolou] = useState(false)
  useEffect(() => {
    const ver = () => setRolou(window.scrollY > 24)
    ver()
    window.addEventListener('scroll', ver, { passive: true })
    return () => window.removeEventListener('scroll', ver)
  }, [])

  return (
    <section id="inicio" className="hero">
      <div className="hero-visual">
        <LogoVivo />
      </div>
      <div className="hero-veu" aria-hidden />

      <motion.nav className={`nav${rolou || menuAberto ? ' rolou' : ''}`} aria-label="Principal" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <a href="#inicio" className="nav-marca" aria-label="P&C Tec, início">
          <img src="/brand/pc-tec-logo-registro.svg" alt="" width={76} height={42} />
        </a>
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </div>
        <button type="button" className="nav-contato" onClick={() => abrir('Menu: Fale com a gente')}>
          <svg width="17" height="13" viewBox="0 0 17 13" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <rect x="0.7" y="0.7" width="15.6" height="11.6" />
            <path d="M0.7 0.7 8.5 7.2 16.3 0.7" />
          </svg>
          Fale com a gente
        </button>
        <button
          type="button"
          className="nav-hamburguer"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        {menuAberto && (
          <div className="nav-menu-celular">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuAberto(false)}>
                {l.rotulo}
              </a>
            ))}
            <button
              type="button"
              className="nav-contato nav-contato-celular"
              onClick={() => {
                setMenuAberto(false)
                abrir('Menu do celular: Fale com a gente')
              }}
            >
              Fale com a gente
            </button>
          </div>
        )}
      </motion.nav>

      <div className="hero-texto">
        <Titulo
          como="h1"
          className="hero-titulo"
          rotulo="P&C Tec: criamos software que resolve problemas reais"
          linhas={[
            { t: 'Criamos' },
            { t: 'Software' },
            { t: 'Que' },
            { t: 'Resolve', recuo: true },
            { t: 'Problemas', recuo: true },
            { t: 'Reais', recuo: true, destaque: true },
          ]}
        />
        <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SUBIR, delay: 0.85 }}>
          <button type="button" className="botao" onClick={() => abrir('Hero: Começar um projeto')}>
            Começar um projeto
          </button>
        </motion.div>
      </div>
    </section>
  )
}
