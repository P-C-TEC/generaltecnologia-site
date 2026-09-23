import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { EMAIL_CONTATO, PRODUTOS, SERVICOS, SOBRE, type Produto } from '../dados'
import { Surgir, Titulo } from './comum'
import { Formulario, useContato } from './Contato'

// ---------- Sobre ----------

// Telas reais dos produtos, trocando sozinhas no lugar do vídeo tingido da referência
const TELAS_SOBRE = [
  { src: '/telas/gtrestaurante-desk-1.webp', nome: 'GTRestaurante' },
  { src: '/telas/mordomo-desk-1.webp', nome: 'Mordomo Tec' },
  { src: '/telas/plantemo-site-desk-1.webp', nome: 'Plantemo' },
  { src: '/telas/gtrestaurante-desk-3.webp', nome: 'GTRestaurante' },
  { src: '/telas/mordomo-desk-2.webp', nome: 'Mordomo Tec' },
  { src: '/telas/plantemo-site-desk-5.webp', nome: 'Plantemo' },
]

export function Sobre() {
  return (
    <section id="sobre" className="sobre">
      <div className="sobre-texto">
        <Titulo className="sobre-titulo" linhas={[{ t: 'Sobre' }, { t: 'a P&C Tec', recuo: true, destaque: true }]} />
        <Surgir como="p" atraso={0.15}>
          {SOBRE}
        </Surgir>
        <Surgir atraso={0.3} className="sobre-recuo">
          <a href="#produtos" className="botao">
            Conhecer os produtos
          </a>
        </Surgir>
      </div>
      <motion.div
        className="sobre-midia"
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <TelasTingidas />
      </motion.div>
    </section>
  )
}

function TelasTingidas() {
  const [ativa, setAtiva] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setAtiva((i) => (i + 1) % TELAS_SOBRE.length), 3200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="telas">
      {TELAS_SOBRE.map((tela, i) => (
        <img
          key={tela.src}
          src={tela.src}
          alt={i === ativa ? `Tela do ${tela.nome}` : ''}
          className={i === ativa ? 'ativa' : ''}
          loading="lazy"
          decoding="async"
        />
      ))}
      <div className="telas-tinta" aria-hidden />
      <div className="telas-varredura" aria-hidden />
      <span className="telas-legenda" aria-hidden>
        {TELAS_SOBRE[ativa].nome}
      </span>
    </div>
  )
}

// ---------- Serviços ----------

export function Servicos() {
  const abrir = useContato()
  return (
    <section id="servicos" className="servicos">
      <Titulo className="secao-titulo" linhas={[{ t: 'O que' }, { t: 'fazemos', recuo: true, destaque: true }]} />
      <div className="servicos-grade">
        {SERVICOS.map((s, i) => (
          <Surgir key={s.nome} atraso={i * 0.12} className="servico">
            <span className="servico-num" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3>{s.nome}</h3>
            <p>{s.descricao}</p>
            <ul>
              {s.itens.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" className="botao botao-fantasma" onClick={() => abrir(`Serviços: ${s.nome}`, s.assunto)}>
              Pedir orçamento
            </button>
          </Surgir>
        ))}
      </div>
    </section>
  )
}

// ---------- Produtos ----------

// Rolagem horizontal: a seção fica presa na tela e, conforme a página desce, os produtos passam
// de lado, um por vez. A altura da seção (um "andar" por produto) é o caminho que a rolagem
// percorre para atravessar todos.
export function Produtos() {
  const ref = useRef<HTMLElement>(null)
  const total = PRODUTOS.length
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  // Uma pequena pausa no começo e no fim, para o primeiro e o último produto ficarem parados um instante
  const x = useTransform(scrollYProgress, [0.06, 0.94], ['0vw', `-${(total - 1) * 100}vw`])
  const [atual, setAtual] = useState(0)

  useEffect(
    () =>
      scrollYProgress.on('change', (v) => {
        const p = Math.min(1, Math.max(0, (v - 0.06) / 0.88))
        setAtual(Math.round(p * (total - 1)))
      }),
    [scrollYProgress, total],
  )

  return (
    <section id="produtos" ref={ref} className="produtos" style={{ height: `${total * 100}vh` }}>
      <div className="produtos-fixo">
        <div className="produtos-topo">
          <Titulo className="secao-titulo" linhas={[{ t: 'Nossos' }, { t: 'produtos', recuo: true, destaque: true }]} />
          <div className="produtos-indice" aria-hidden>
            <span>
              <b>{String(atual + 1).padStart(2, '0')}</b> / {String(total).padStart(2, '0')}
            </span>
            <BarraProgresso progresso={scrollYProgress} />
          </div>
        </div>
        <motion.div className="produtos-trilho" style={{ x, width: `${total * 100}vw` }}>
          {PRODUTOS.map((p, i) => (
            <CartaoProduto key={p.nome} produto={p} indice={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function BarraProgresso({ progresso }: { progresso: MotionValue<number> }) {
  const escala = useTransform(progresso, [0.06, 0.94], [0, 1])
  return (
    <span className="produtos-barra">
      <motion.i style={{ scaleX: escala }} />
    </span>
  )
}

function CartaoProduto({ produto: p, indice: i }: { produto: Produto; indice: number }) {
  return (
    <article className="produto">
      <motion.div className="produto-midia" initial="oculta" whileInView="visivel" viewport={{ once: true, amount: 0.3 }}>
        {/* Máscara que revela: a tela aparece de baixo para cima */}
        <motion.div
          className="produto-tela"
          variants={{ oculta: { clipPath: 'inset(100% 0 0 0)' }, visivel: { clipPath: 'inset(0% 0 0 0)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } } }}
        >
          <img src={p.imagens[1]} alt={`Página do ${p.nome}`} loading="lazy" decoding="async" />
        </motion.div>
        <motion.div
          className="produto-celular"
          variants={{ oculta: { opacity: 0, y: 60 }, visivel: { opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] } } }}
        >
          <img src={p.imagens[2]} alt={`${p.nome} no celular`} loading="lazy" decoding="async" />
        </motion.div>
      </motion.div>
      <div className="produto-texto">
        <span className="produto-status">
          <i style={{ background: p.cor }} aria-hidden />
          {p.status}
        </span>
        <h3>
          <span aria-hidden>{String(i + 1).padStart(2, '0')} </span>
          {p.nome}
        </h3>
        <p>{p.resumo}</p>
        <a href={p.href} className="botao botao-fantasma" {...(p.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          Conhecer o produto
        </a>
      </div>
    </article>
  )
}


// ---------- Contato ----------

export function SecaoContato() {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_CONTATO)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sem permissão de área de transferência: o e-mail continua visível para copiar à mão */
    }
  }

  return (
    <section id="contato" className="contato">
      <div className="contato-texto">
        <Titulo className="secao-titulo" linhas={[{ t: 'Vamos' }, { t: 'conversar', recuo: true, destaque: true }]} />
        <Surgir como="p" atraso={0.1}>
          Precisa de um sistema sob encomenda, de um site novo ou quer saber mais sobre nossos produtos? Conte o que você precisa: a mensagem chega direto na nossa caixa.
        </Surgir>
        <Surgir atraso={0.2} className="contato-email">
          <span>Prefere e-mail?</span>
          <b>{EMAIL_CONTATO}</b>
          <button type="button" onClick={copiar}>
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </Surgir>
      </div>
      <Surgir atraso={0.15} className="contato-form">
        <Formulario origem="Seção Contato" />
      </Surgir>
    </section>
  )
}

// ---------- Rodapé ----------

// Um grupo por produto, cada um com o próprio site, termos e privacidade
const PRODUTOS_RODAPE = [
  { nome: 'GTRestaurante', site: '/gtrestaurante', termos: '/gtrestaurante/termos', privacidade: '/gtrestaurante/privacidade' },
  {
    nome: 'Mordomo Tec',
    site: 'https://mordomotec.com.br',
    termos: 'https://mordomotec.com.br/termos-de-uso',
    privacidade: 'https://mordomotec.com.br/politica-de-privacidade',
  },
  { nome: 'Plantemo', site: '/plantemo', termos: '/plantemo/termos', privacidade: '/plantemo/privacidade' },
]

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="rodape-marca">
        <img className="rodape-logo" src="/brand/pc-tec-logo-registro-branca.svg" alt="P&C Tec" width={150} height={83} />
        <p>
          Perdigão &amp; Carneiro Tecnologias LTDA
          <br />
          CNPJ 68.508.547/0001-36
          <br />© {new Date().getFullYear()}. Todos os direitos reservados.
        </p>
        <a href="/privacidade" className="rodape-privacidade">
          Política de privacidade
        </a>
      </div>
      <nav aria-label="Produtos e documentos" className="rodape-produtos">
        {PRODUTOS_RODAPE.map((g) => (
          <div key={g.nome} className="rodape-grupo">
            <a href={g.site} className="rodape-grupo-titulo">
              {g.nome}
            </a>
            <a href={g.termos}>Termos de uso</a>
            <a href={g.privacidade}>Política de privacidade</a>
          </div>
        ))}
      </nav>
    </footer>
  )
}
