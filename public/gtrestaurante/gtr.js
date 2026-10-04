// GTRestaurante — animações da página.
// Referências: o prompt do mosaico (entrada da hero) e os efeitos de naocodei.com/free-code
// (cartões que empilham, galeria horizontal, texto que se preenche, revelar palavras, palavras
// que trocam, odômetro, linha do tempo, luz que segue o mouse e botão elástico).
;(function () {
  'use strict'
  var html = document.documentElement
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var $$ = function (sel, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(sel))
  }
  var limitar = function (v, a, b) {
    return Math.min(b, Math.max(a, v))
  }

  /* ---------- 1. Entrada do mosaico ---------- */
  ;(function entrada() {
    if (reduzido || window.__entrancePlayed) {
      clearTimeout(window.__gtrFalha)
      html.classList.remove('motion-pending', 'entrance-run')
      return
    }
    window.__entrancePlayed = true
    var prazo = new Promise(function (r) {
      setTimeout(r, 700)
    })
    var fontes = document.fonts && document.fonts.ready ? document.fonts.ready : prazo
    Promise.race([fontes, prazo]).then(function () {
      clearTimeout(window.__gtrFalha)
      html.classList.remove('motion-pending')
      html.classList.add('entrance-run')
      setTimeout(function () {
        html.classList.remove('entrance-run')
      }, 1850)
    })
  })()

  /* ---------- 2. Revelar palavras dos títulos ---------- */
  function quebrarPalavras(el, classe) {
    var partes = []
    var i = 0
    el.childNodes.forEach(function (no) {
      if (no.nodeType === 3) {
        no.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return
          if (/^\s+$/.test(p)) partes.push(document.createTextNode(p))
          else {
            var envolve = document.createElement('span')
            envolve.className = classe
            var dentro = document.createElement('span')
            dentro.textContent = p
            dentro.style.setProperty('--i', i++)
            envolve.appendChild(dentro)
            partes.push(envolve)
          }
        })
      } else partes.push(no)
    })
    el.textContent = ''
    partes.forEach(function (p) {
      el.appendChild(p)
    })
  }
  var titulos = $$('.revelar')
  if (!reduzido && 'IntersectionObserver' in window) {
    titulos.forEach(function (t) {
      quebrarPalavras(t, 'palavra')
    })
    var obsTitulos = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visto')
            obsTitulos.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    titulos.forEach(function (t) {
      obsTitulos.observe(t)
    })
  }

  /* ---------- 3. Texto que se preenche ---------- */
  var preencher = document.querySelector('.preencher')
  var palavrasManifesto = []
  if (preencher) {
    var quentes = /^(lugar|só|avisa)/i
    var texto = preencher.textContent.trim().split(/\s+/)
    preencher.textContent = ''
    texto.forEach(function (p, i) {
      var s = document.createElement('span')
      s.className = 'w' + (quentes.test(p) ? ' quente' : '') + (reduzido ? ' on' : '')
      s.textContent = p
      preencher.appendChild(s)
      if (i < texto.length - 1) preencher.appendChild(document.createTextNode(' '))
      palavrasManifesto.push(s)
    })
  }

  /* ---------- 4. Cartões que empilham ---------- */
  var folhas = $$('.folha')
  folhas.forEach(function (f, i) {
    f.style.setProperty('--n', i)
  })

  /* ---------- 5. Galeria horizontal ---------- */
  var horizontal = document.querySelector('.horizontal')
  var trilho = horizontal && horizontal.querySelector('.trilho')
  var largo = window.matchMedia('(min-width: 801px) and (min-aspect-ratio: 1/1)')
  var distancia = 0
  function montarHorizontal() {
    if (!horizontal) return
    var nativo = reduzido || !largo.matches
    horizontal.classList.toggle('nativo', nativo)
    if (nativo) {
      horizontal.style.height = ''
      trilho.style.transform = ''
      distancia = 0
      return
    }
    distancia = Math.max(0, trilho.scrollWidth - window.innerWidth)
    horizontal.style.height = 'calc(100svh + ' + distancia + 'px)'
  }

  /* ---------- 6. Linha do tempo ---------- */
  var linha = document.querySelector('.linha')
  var marcos = $$('.marco')

  /* ---------- 7. Fundo que escurece nas seções escuras ---------- */
  var escuras = $$('.horizontal, .ia, .contas, .final')

  /* Um único laço de rolagem para tudo que depende da posição. */
  var pedido = false
  function aoRolar() {
    if (pedido) return
    pedido = true
    requestAnimationFrame(quadro)
  }
  function quadro() {
    pedido = false
    var alt = window.innerHeight
    var meio = alt / 2

    // Tema: a seção que cruza o meio da tela define o fundo.
    var escuro = escuras.some(function (s) {
      var r = s.getBoundingClientRect()
      return r.top < meio && r.bottom > meio
    })
    html.classList.toggle('tema-escuro', escuro)

    // Manifesto
    if (preencher && !reduzido) {
      var r = preencher.getBoundingClientRect()
      var p = limitar((alt * 0.85 - r.top) / (r.height + alt * 0.35), 0, 1)
      var acesas = Math.round(p * palavrasManifesto.length)
      palavrasManifesto.forEach(function (w, i) {
        w.classList.toggle('on', i < acesas)
      })
    }

    // Pilha: cada folha encolhe e escurece conforme a seguinte a cobre.
    if (!reduzido) {
      for (var i = 0; i < folhas.length - 1; i++) {
        var atual = folhas[i].getBoundingClientRect()
        var prox = folhas[i + 1].getBoundingClientRect()
        var k = limitar((atual.bottom - prox.top) / atual.height, 0, 1)
        folhas[i].style.setProperty('--k', k.toFixed(3))
      }
    }

    // Galeria horizontal presa
    if (distancia > 0) {
      var rh = horizontal.getBoundingClientRect()
      var ph = limitar(-rh.top / (rh.height - alt), 0, 1)
      trilho.style.transform = 'translate3d(' + (-ph * distancia).toFixed(1) + 'px,0,0)'
    }

    // Linha do tempo
    if (linha) {
      var rl = linha.getBoundingClientRect()
      var pl = reduzido ? 1 : limitar((meio - rl.top) / rl.height, 0, 1)
      linha.style.setProperty('--progresso', pl.toFixed(3))
      marcos.forEach(function (m) {
        m.classList.toggle('aceso', reduzido || m.getBoundingClientRect().top < meio)
      })
    }
  }
  montarHorizontal()
  quadro()
  window.addEventListener('scroll', aoRolar, { passive: true })
  window.addEventListener('resize', function () {
    montarHorizontal()
    aoRolar()
  })
  window.addEventListener('load', function () {
    montarHorizontal()
    aoRolar()
  })

  /* ---------- 8. Odômetro ---------- */
  var odometros = $$('.odometro')
  if (!reduzido && 'IntersectionObserver' in window) {
    odometros.forEach(function (o) {
      var valor = o.getAttribute('data-valor')
      o.setAttribute('aria-label', valor)
      o.textContent = ''
      valor.split('').forEach(function (d, i) {
        var dig = document.createElement('span')
        dig.className = 'dig'
        dig.setAttribute('aria-hidden', 'true')
        var fita = document.createElement('span')
        fita.className = 'fita'
        fita.style.setProperty('--i', i)
        for (var n = 0; n <= 9; n++) {
          var s = document.createElement('span')
          s.textContent = n
          fita.appendChild(s)
        }
        fita.dataset.alvo = d
        dig.appendChild(fita)
        o.appendChild(dig)
      })
    })
    var obsOdo = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return
          $$('.fita', e.target).forEach(function (f) {
            f.style.transform = 'translateY(' + -Number(f.dataset.alvo) + 'em)'
          })
          obsOdo.unobserve(e.target)
        })
      },
      { threshold: 0.6 },
    )
    odometros.forEach(function (o) {
      obsOdo.observe(o)
    })
  }

  /* ---------- 9. Luz que segue o mouse ---------- */
  $$('.luz').forEach(function (el) {
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect()
      el.style.setProperty('--x', ev.clientX - r.left + 'px')
      el.style.setProperty('--y', ev.clientY - r.top + 'px')
    })
  })

  /* ---------- 10. Botão elástico (mola com velocidade e amortecimento) ---------- */
  if (!reduzido && window.matchMedia('(hover: hover)').matches) {
    $$('.elastico').forEach(function (b) {
      var alvo = { x: 0, y: 0 }
      var pos = { x: 0, y: 0 }
      var vel = { x: 0, y: 0 }
      var rodando = false
      function passo() {
        var rigidez = 0.12
        var amortecimento = 0.78
        vel.x = (vel.x + (alvo.x - pos.x) * rigidez) * amortecimento
        vel.y = (vel.y + (alvo.y - pos.y) * rigidez) * amortecimento
        pos.x += vel.x
        pos.y += vel.y
        b.style.transform = 'translate(' + pos.x.toFixed(2) + 'px,' + pos.y.toFixed(2) + 'px)'
        var parado = Math.abs(vel.x) + Math.abs(vel.y) < 0.02 && Math.abs(alvo.x - pos.x) + Math.abs(alvo.y - pos.y) < 0.05
        if (parado) {
          rodando = false
          return
        }
        requestAnimationFrame(passo)
      }
      function mexer() {
        if (!rodando) {
          rodando = true
          requestAnimationFrame(passo)
        }
      }
      b.addEventListener('pointermove', function (ev) {
        var r = b.getBoundingClientRect()
        alvo.x = (ev.clientX - (r.left + r.width / 2)) * 0.28
        alvo.y = (ev.clientY - (r.top + r.height / 2)) * 0.4
        mexer()
      })
      b.addEventListener('pointerleave', function () {
        alvo.x = 0
        alvo.y = 0
        mexer()
      })
    })
  }

  /* ---------- 11. Palavras que trocam ---------- */
  var troca = document.querySelector('.troca')
  if (troca) {
    var lista = troca.querySelector('.troca__lista')
    var itens = $$('span', lista)
    var atual = 0
    var medir = function () {
      troca.style.width = itens[atual].offsetWidth + 'px'
    }
    medir()
    window.addEventListener('resize', medir)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir)
    if (!reduzido) {
      setInterval(function () {
        atual++
        lista.style.transform = 'translateY(' + -atual * 1.35 + 'em)'
        medir()
        // O último item repete o primeiro: ao chegar nele, volta ao início sem animação.
        if (atual === itens.length - 1) {
          setTimeout(function () {
            lista.classList.add('sem-transicao')
            atual = 0
            lista.style.transform = 'translateY(0)'
            medir()
            void lista.offsetHeight
            lista.classList.remove('sem-transicao')
          }, 650)
        }
      }, 2300)
    }
  }

  /* ---------- 12. Perguntas ao assistente, digitadas ---------- */
  var campo = document.querySelector('.pergunta__txt')
  if (campo && !reduzido) {
    var perguntas = [
      'Quais insumos estão abaixo do mínimo?',
      'Algum ativo precisa de manutenção?',
      'Qual o CMV do mês?',
      'Quais as pendências de checklist?',
    ]
    var q = 0
    function digitar(txt, cb) {
      var i = 0
      campo.classList.add('digitando')
      ;(function letra() {
        campo.textContent = txt.slice(0, ++i)
        if (i < txt.length) setTimeout(letra, 34)
        else setTimeout(cb, 2400)
      })()
    }
    function apagar(cb) {
      ;(function letra() {
        var t = campo.textContent
        if (t.length) {
          campo.textContent = t.slice(0, -1)
          setTimeout(letra, 14)
        } else cb()
      })()
    }
    function ciclo() {
      apagar(function () {
        q = (q + 1) % perguntas.length
        digitar(perguntas[q], ciclo)
      })
    }
    setTimeout(ciclo, 3600)
  }
})()
