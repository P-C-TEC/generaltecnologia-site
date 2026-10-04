// Roda no <head>, antes da pintura: esconde os cartões do mosaico até a entrada começar.
// Se algo falhar, o tempo-limite devolve a página ao estado estático.
;(function () {
  var html = document.documentElement
  html.classList.add('js')
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  html.classList.add('motion-pending')
  window.__gtrFalha = setTimeout(function () {
    html.classList.remove('motion-pending')
  }, 2400)
})()
