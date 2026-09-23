import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ASSUNTOS, validar } from '../../api/_formulario'
import { EMAIL_CONTATO } from '../dados'
import { prepararProva, type Prova } from './provaDeTrabalho'

// Todo botão de contato do site abre este formulário, em vez de um link de e-mail. A mensagem
// vai para a função /api/contato, que entrega na caixa da empresa.

type Abrir = (origem: string, assunto?: string) => void
const ContatoContexto = createContext<Abrir>(() => {})
export const useContato = () => useContext(ContatoContexto)

export function ContatoProvider({ children }: { children: ReactNode }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [pedido, setPedido] = useState<{ origem: string; assunto?: string; chave: number } | null>(null)

  const abrir = useCallback<Abrir>((origem, assunto) => {
    setPedido({ origem, assunto, chave: Date.now() })
    dialogo.current?.showModal()
    // A página atrás para de rolar enquanto o formulário está aberto
    window.dispatchEvent(new Event('rolagem:parar'))
  }, [])

  const fechar = () => dialogo.current?.close()

  useEffect(() => {
    const d = dialogo.current
    const aoFechar = () => window.dispatchEvent(new Event('rolagem:continuar'))
    d?.addEventListener('close', aoFechar)
    return () => d?.removeEventListener('close', aoFechar)
  }, [])

  return (
    <ContatoContexto.Provider value={abrir}>
      {children}
      <dialog
        ref={dialogo}
        className="modal"
        aria-labelledby="modal-titulo"
        data-lenis-prevent
        // Clique no fundo escurecido fecha
        onClick={(e) => e.target === e.currentTarget && fechar()}
      >
        <div className="modal-caixa">
          <button type="button" className="modal-fechar" onClick={fechar} aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M2 2 16 16M16 2 2 16" />
            </svg>
          </button>
          <h2 id="modal-titulo" className="titulo modal-titulo">
            Fale com a <span className="destaque">gente</span>
          </h2>
          <p className="modal-sub">Conte o que você precisa. A mensagem chega direto na nossa caixa e respondemos pelo e-mail ou telefone que você informar.</p>
          {pedido && <Formulario key={pedido.chave} origem={pedido.origem} assunto={pedido.assunto} focarAoAbrir />}
        </div>
      </dialog>
    </ContatoContexto.Provider>
  )
}

type Estado = { tipo: 'ocioso' } | { tipo: 'enviando' } | { tipo: 'enviado'; teste: boolean } | { tipo: 'erro'; mensagem: string }

// Máscara brasileira: (11) 98765-4321 ou (11) 3456-7890
function mascararTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function Formulario({ origem, assunto: assuntoInicial, focarAoAbrir }: { origem: string; assunto?: string; focarAoAbrir?: boolean }) {
  const inicio = useRef(Date.now())
  const primeiro = useRef<HTMLInputElement>(null)
  // Proteção contra robôs: o navegador resolve o desafio enquanto a pessoa preenche
  const prova = useRef<Promise<Prova | null> | null>(null)
  useEffect(() => {
    prova.current = prepararProva()
  }, [])
  const [campos, setCampos] = useState({ nome: '', telefone: '', email: '', mensagem: '', assunto: assuntoInicial ?? '', site: '' })
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' })

  useEffect(() => {
    if (focarAoAbrir) primeiro.current?.focus()
  }, [focarAoAbrir])

  const mudar = (campo: keyof typeof campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [campo]: campo === 'telefone' ? mascararTelefone(e.target.value) : e.target.value }))

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const corpo = { ...campos, origem, tempo: Date.now() - inicio.current }
    const { erro } = validar(corpo)
    if (erro) return setEstado({ tipo: 'erro', mensagem: erro })
    setEstado({ tipo: 'enviando' })
    try {
      const resolvida = await (prova.current ?? prepararProva())
      const r = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...corpo, prova: resolvida }),
      })
      const json = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(json.erro || 'Não conseguimos enviar agora.')
      setEstado({ tipo: 'enviado', teste: Boolean(json.teste) })
    } catch (err) {
      // Cada desafio vale uma vez só: prepara outro para a próxima tentativa
      prova.current = prepararProva()
      setEstado({ tipo: 'erro', mensagem: err instanceof Error ? err.message : 'Não conseguimos enviar agora.' })
    }
  }

  if (estado.tipo === 'enviado') {
    return (
      <div className="form-sucesso" role="status">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M8 0H44V36L36 44H0V8Z" strokeWidth="1.4" />
          <path d="M13 22.5 19.5 29 31 16" />
        </svg>
        <p className="form-sucesso-titulo">Mensagem enviada!</p>
        <p>Obrigado, {campos.nome.split(' ')[0]}. Vamos responder em breve pelo e-mail ou telefone que você informou.</p>
        {estado.teste && <p className="form-aviso">Modo de teste: nada foi enviado de verdade.</p>}
      </div>
    )
  }

  const id = (c: string) => `${c}-${origem.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="form-grade">
        <label className="campo">
          <span>Nome</span>
          <input ref={primeiro} id={id('nome')} name="nome" autoComplete="name" required value={campos.nome} onChange={mudar('nome')} />
        </label>
        <label className="campo">
          <span>Telefone / WhatsApp</span>
          <input
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            required
            value={campos.telefone}
            onChange={mudar('telefone')}
          />
        </label>
        <label className="campo campo-largo">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" inputMode="email" required value={campos.email} onChange={mudar('email')} />
        </label>
      </div>

      <fieldset className="assuntos">
        <legend>Sobre o quê? (opcional)</legend>
        {ASSUNTOS.map((a) => (
          <label key={a} className={`chip${campos.assunto === a ? ' ativo' : ''}`}>
            <input
              type="radio"
              name={id('assunto')}
              value={a}
              checked={campos.assunto === a}
              onChange={() => setCampos((c) => ({ ...c, assunto: a }))}
            />
            {a}
          </label>
        ))}
      </fieldset>

      <label className="campo">
        <span>Descreva o que você precisa</span>
        <textarea name="mensagem" rows={4} required value={campos.mensagem} onChange={mudar('mensagem')} />
      </label>

      {/* Campo-isca: invisível para pessoas, robôs costumam preencher */}
      <div className="isca" aria-hidden>
        <label>
          Site
          <input tabIndex={-1} autoComplete="off" name="site" value={campos.site} onChange={mudar('site')} />
        </label>
      </div>

      {estado.tipo === 'erro' && (
        <p className="form-erro" role="alert">
          {estado.mensagem} Se preferir, escreva para <b>{EMAIL_CONTATO}</b>.
        </p>
      )}

      <div className="form-rodape">
        <button type="submit" className="botao" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Enviando…' : 'Enviar mensagem'}
        </button>
        <p className="form-lgpd">
          Usamos seus dados só para responder a este contato. Veja a{' '}
          <a href="/privacidade" target="_blank" rel="noopener">
            política de privacidade
          </a>
          .
        </p>
      </div>
    </form>
  )
}
