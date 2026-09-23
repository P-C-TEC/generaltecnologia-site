import Lenis from 'lenis'
import { useEffect } from 'react'

// Rolagem com inércia: a página desliza e desacelera em vez de pular de uma posição para outra.
// É o que dá a sensação de um site contínuo. Com "reduzir movimento" ligado, fica a rolagem nativa.
export function RolagemSuave() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    let quadro = requestAnimationFrame(function loop(tempo) {
      lenis.raf(tempo)
      quadro = requestAnimationFrame(loop)
    })

    // Links internos (#produtos etc.) também deslizam em vez de saltar
    const clique = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!link) return
      const alvo = document.querySelector(link.getAttribute('href')!)
      if (!alvo) return
      e.preventDefault()
      // O desconto do menu fixo vem do scroll-padding-top do CSS, que o Lenis já respeita
      lenis.scrollTo(alvo as HTMLElement, { offset: 0 })
      history.replaceState(null, '', link.getAttribute('href'))
    }
    document.addEventListener('click', clique)

    // O formulário de contato pede para a página de trás parar enquanto está aberto
    const parar = () => lenis.stop()
    const continuar = () => lenis.start()
    window.addEventListener('rolagem:parar', parar)
    window.addEventListener('rolagem:continuar', continuar)

    return () => {
      cancelAnimationFrame(quadro)
      document.removeEventListener('click', clique)
      window.removeEventListener('rolagem:parar', parar)
      window.removeEventListener('rolagem:continuar', continuar)
      lenis.destroy()
    }
  }, [])
  return null
}
