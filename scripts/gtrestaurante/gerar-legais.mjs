/**
 * Gera /gtrestaurante/termos e /gtrestaurante/privacidade a partir do Markdown em fonte/.
 *
 * A fonte dos textos é o próprio app (gtrestaurante.generaltecnologia.com/?legal=terms e
 * ?legal=privacy, versão de 16/09/2026), copiada para fonte/ com os e-mails de contato do
 * GTRestaurante. Quando o app mudar os documentos, atualize os .md e rode de novo:
 *
 *   node scripts/gtrestaurante/gerar-legais.mjs   (grava em public/gtrestaurante/)
 *
 * O conversor cobre só o que estes documentos usam: título, parágrafo, lista e negrito.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inline(t) {
  return escapar(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+[a-z])/g, '<a href="mailto:$1">$1</a>')
}

function converter(md) {
  const saida = []
  let lista = false
  let titulo = ''
  let data = ''
  for (const linha of md.split(/\r?\n/)) {
    const h = linha.match(/^(#{1,3})\s+(.*)$/)
    if (lista && !/^- /.test(linha)) {
      saida.push('</ul>')
      lista = false
    }
    if (!linha.trim()) continue
    if (h) {
      if (h[1] === '#') titulo = h[2]
      else saida.push(`<h2>${inline(h[2])}</h2>`)
    } else if (/^Última atualização:/.test(linha)) {
      data = linha.replace('Última atualização:', '').trim()
    } else if (/^- /.test(linha)) {
      if (!lista) {
        saida.push('<ul>')
        lista = true
      }
      saida.push(`<li>${inline(linha.slice(2))}</li>`)
    } else {
      saida.push(`<p>${inline(linha)}</p>`)
    }
  }
  if (lista) saida.push('</ul>')
  return { titulo, data, corpo: saida.join('\n        ') }
}

function pagina({ arquivo, caminho, descricao, outro }) {
  const { titulo, data, corpo } = converter(readFileSync(join(AQUI, 'fonte', arquivo), 'utf8'))
  return `<!doctype html>
<!-- Gerado por scripts/gtrestaurante/gerar-legais.mjs a partir de scripts/gtrestaurante/fonte/${arquivo}. Não edite à mão. -->
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${titulo} — GTRestaurante</title>
  <meta name="description" content="${descricao}" />
  <meta name="theme-color" content="#F2F1F0" />
  <link rel="canonical" href="https://pectecs.com.br${caminho}" />
  <link rel="icon" type="image/png" href="/gtrestaurante/logo-gtr-64.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Quantico:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/gtrestaurante/gtr.css" />
</head>
<body>
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <header class="topo">
    <div class="topo__in">
      <a class="marca" href="/gtrestaurante" aria-label="GTRestaurante, início">
        <img src="/gtrestaurante/logo-gtr-64.png" width="34" height="34" alt="" />
        <span><b>GT</b>Restaurante</span>
      </a>
      <nav class="topo__menu" aria-label="Documentos">
        <a href="/gtrestaurante">Página do produto</a>
        <a href="${outro.caminho}">${outro.nome}</a>
      </nav>
      <a class="botao botao--peq" href="https://gtrestaurante.generaltecnologia.com" rel="noopener">Entrar no app</a>
    </div>
  </header>

  <main id="conteudo" class="legal">
    <header class="legal__cab">
      <p class="kicker">Documento do GTRestaurante</p>
      <h1>${titulo}</h1>
      <p class="legal__data">Última atualização: ${data}</p>
    </header>
    <article class="legal__texto">
        ${corpo}
    </article>
  </main>

  <footer class="rodape">
    <div class="rodape__in">
      <div class="rodape__marca">
        <img src="/gtrestaurante/logo-gtr-64.png" width="28" height="28" alt="" />
        <span><b>GT</b>Restaurante</span>
      </div>
      <p>Um produto <a href="/">P&amp;C Tec</a> · © 2026 Perdigão &amp; Carneiro Tecnologias LTDA · CNPJ 68.508.547/0001-36</p>
      <nav aria-label="Links do rodapé">
        <a href="/gtrestaurante">Produto</a>
        <a href="/gtrestaurante/termos">Termos</a>
        <a href="/gtrestaurante/privacidade">Privacidade</a>
      </nav>
    </div>
  </footer>
</body>
</html>
`
}

const DESTINO = join(AQUI, '..', '..', 'public', 'gtrestaurante')
writeFileSync(
  join(DESTINO, 'termos.html'),
  pagina({
    arquivo: 'termos-de-uso.md',
    caminho: '/gtrestaurante/termos',
    descricao: 'Termos de Uso do GTRestaurante, sistema de gestão para restaurantes da P&C Tec.',
    outro: { caminho: '/gtrestaurante/privacidade', nome: 'Política de Privacidade' },
  }),
)
writeFileSync(
  join(DESTINO, 'privacidade.html'),
  pagina({
    arquivo: 'politica-de-privacidade.md',
    caminho: '/gtrestaurante/privacidade',
    descricao: 'Como o GTRestaurante trata dados pessoais: o que guarda, por quê, com quem compartilha e como exercer seus direitos.',
    outro: { caminho: '/gtrestaurante/termos', nome: 'Termos de Uso' },
  }),
)
console.log('ok')
