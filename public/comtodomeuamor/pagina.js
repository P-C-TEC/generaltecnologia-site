/* As animações da página do "Com todo meu amor…".
 *
 * Tudo em JavaScript próprio, sem biblioteca: a política de segurança do site
 * só aceita script do mesmo domínio, e uma página de produto não deveria
 * carregar meio megabyte de framework para fazer texto aparecer.
 *
 * Três movimentos, e nenhum deles é enfeite solto:
 *
 * 1. As palavras do título sobem uma a uma, como quem diz uma frase devagar.
 * 2. O parágrafo do "o que é" acende palavra por palavra conforme a pessoa
 *    rola — a leitura acompanha o scroll em vez de disputar com ele.
 * 3. Cartões e telas entram escalonados quando chegam à vista.
 *
 * Quem pede menos movimento ao sistema não recebe nenhum: a verificação está
 * logo abaixo, e ela desliga tudo de uma vez. */

(() => {
  'use strict'

  const paradoDeProposito = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  // ---------------------------------------------------------------- título

  // Cada palavra vira um pedaço próprio para poder subir sozinha. O texto
  // visível não muda, e quem usa leitor de tela continua ouvindo a frase
  // inteira, porque os pedaços são inline e sem rótulo.
  function fatiarEmPalavras(elemento) {
    const partes = []
    for (const no of Array.from(elemento.childNodes)) {
      if (no.nodeType === Node.TEXT_NODE) {
        const palavras = no.textContent.split(/(\s+)/)
        const fragmento = document.createDocumentFragment()
        for (const palavra of palavras) {
          if (palavra === '') continue
          if (/^\s+$/.test(palavra)) {
            fragmento.appendChild(document.createTextNode(palavra))
            continue
          }
          const span = document.createElement('span')
          span.className = 'palavra'
          span.textContent = palavra
          fragmento.appendChild(span)
          partes.push(span)
        }
        no.replaceWith(fragmento)
      } else if (no.nodeType === Node.ELEMENT_NODE) {
        partes.push(...fatiarEmPalavras(no))
      }
    }
    return partes
  }

  // ---------------------------------------------------------------- entradas

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        const alvo = entrada.target
        observador.unobserve(alvo)

        const atraso = Number(alvo.dataset.atraso ?? 0)

        if (alvo.hasAttribute('data-palavras')) {
          const palavras = alvo._palavras ?? []
          palavras.forEach((palavra, i) => {
            palavra.style.animationDelay = `${atraso + i * 70}ms`
            palavra.classList.add('subiu')
          })
          continue
        }

        alvo.style.animationDelay = `${atraso}ms`
        alvo.classList.add(
          alvo.hasAttribute('data-cartao') ? 'cartao-entrou' : 'surgiu',
        )
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  )

  for (const alvo of document.querySelectorAll('[data-palavras]')) {
    alvo._palavras = fatiarEmPalavras(alvo)
    observador.observe(alvo)
  }
  for (const alvo of document.querySelectorAll('[data-surge], [data-cartao]')) {
    observador.observe(alvo)
  }

  // ------------------------------------------------- o texto que se revela

  const revelados = Array.from(document.querySelectorAll('[data-revelar]')).map(
    (bloco) => {
      const palavras = []
      for (const no of Array.from(bloco.childNodes)) {
        if (no.nodeType !== Node.TEXT_NODE) continue
        const fragmento = document.createDocumentFragment()
        for (const parte of no.textContent.split(/(\s+)/)) {
          if (parte === '') continue
          if (/^\s+$/.test(parte)) {
            fragmento.appendChild(document.createTextNode(parte))
            continue
          }
          const span = document.createElement('span')
          span.className = 'p'
          span.textContent = parte
          fragmento.appendChild(span)
          palavras.push(span)
        }
        no.replaceWith(fragmento)
      }
      return { bloco, palavras }
    },
  )

  function acenderLeitura() {
    const altura = window.innerHeight
    for (const { bloco, palavras } of revelados) {
      const caixa = bloco.getBoundingClientRect()
      // 0 quando o bloco acaba de entrar pela base; 1 quando já subiu bem.
      const andamento =
        (altura * 0.85 - caixa.top) / (caixa.height + altura * 0.45)
      const ate = Math.round(
        Math.min(Math.max(andamento, 0), 1) * palavras.length,
      )
      palavras.forEach((palavra, i) =>
        palavra.classList.toggle('acesa', i < ate),
      )
    }
  }

  // ----------------------------------------------------------------- o céu

  const ceu = document.getElementById('ceu')
  const pincel = ceu?.getContext('2d')

  // As mesmas regras do aplicativo: estrelas paradas, poucas e fracas. Elas
  // não piscam — um fundo que pisca atrás de um texto sobre luto fica
  // inquieto, e a tela precisa ser o contrário disso.
  function desenharCeu() {
    if (!ceu || !pincel) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const largura = window.innerWidth
    const altura = window.innerHeight
    ceu.width = largura * dpr
    ceu.height = altura * dpr
    ceu.style.width = `${largura}px`
    ceu.style.height = `${altura}px`
    pincel.setTransform(dpr, 0, 0, dpr, 0, 0)
    pincel.clearRect(0, 0, largura, altura)

    // Sorteio com semente fixa: o mesmo céu em toda visita e em todo aparelho.
    let semente = 20260923
    const sorteio = () => {
      semente = (semente * 1664525 + 1013904223) % 4294967296
      return semente / 4294967296
    }

    const quantidade = Math.round((largura * altura) / 16000)
    for (let i = 0; i < quantidade; i++) {
      const x = sorteio() * largura
      const y = sorteio() * altura
      const raio = 0.5 + sorteio() * 1.3
      const brilho = 0.1 + sorteio() * 0.5

      if (raio > 1.2) {
        pincel.fillStyle = `rgba(237, 237, 237, ${brilho * 0.1})`
        pincel.beginPath()
        pincel.arc(x, y, raio * 3.4, 0, Math.PI * 2)
        pincel.fill()
      }
      pincel.fillStyle = `rgba(237, 237, 237, ${brilho})`
      pincel.beginPath()
      pincel.arc(x, y, raio, 0, Math.PI * 2)
      pincel.fill()
    }
  }

  // ------------------------------------------------------------- amarração

  if (paradoDeProposito) {
    desenharCeu()
    for (const { palavras } of revelados) {
      palavras.forEach((p) => p.classList.add('acesa'))
    }
    return
  }

  let agendado = false
  function aoRolar() {
    if (agendado) return
    agendado = true
    requestAnimationFrame(() => {
      acenderLeitura()
      agendado = false
    })
  }

  let redesenho
  window.addEventListener('resize', () => {
    clearTimeout(redesenho)
    redesenho = setTimeout(desenharCeu, 150)
  })
  window.addEventListener('scroll', aoRolar, { passive: true })

  desenharCeu()
  acenderLeitura()
})()
