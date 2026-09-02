# generaltecnologia-site

Site institucional da **PERDIGAO & CARNEIRO TECNOLOGIAS LTDA** (marca "General Tecnologia"),
publicado em `pectecs.com.br` via Vercel. `generaltecnologia.com` e `www` redirecionam para la
(308) -- o dominio alcancou a marca, que ja era P&C Tec no manual de identidade, nos logos e no
proprio site. O subdominio `gtrestaurante.generaltecnologia.com` NAO muda: e onde o produto roda.

Este repositório passou a versionar o código deste site, que antes era publicado apenas
via `vercel deploy` direto da CLI, sem repositório Git associado.

## Estrutura

- `index.html` — home institucional da General Tecnologia (empresa, produtos, contato).
  A secao de produtos lista GTRestaurante e Mordomo Tec. O card do Mordomo aponta direto
  para `mordomotec.com.br`, e nao para uma pagina de vendas aqui dentro: a raiz daquele app JA
  e a landing do produto, e manter duas paginas do mesmo produto garante que uma das duas fique
  desatualizada.
- `gtrestaurante/index.html` — página de vendas do produto GTRestaurante (antigo `index.html`
  da raiz, movido para cá quando o site passou a ser institucional).
- `gtrestaurante/termos.html` — Termos de Uso estáticos do produto.
- `gtrestaurante/privacidade.html` — Política de Privacidade estática do produto.
- `vercel.json` — `cleanUrls`/`trailingSlash` para servir `/gtrestaurante` sem barra final, e os
  CABECALHOS DE SEGURANCA (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy). A CSP permite exatamente o que as paginas usam: Tailwind por CDN, fontes
  do Google e imagens de `gtrestaurante.generaltecnologia.com` e `mordomotec.com.br`. Ao
  acrescentar recurso externo novo, a CSP precisa acompanhar -- senao ele e bloqueado em
  silencio no navegador do visitante.
- `robots.txt` / `sitemap.xml` — as duas paginas sao de VENDA e dependem de busca. O robots tira
  os manuais de `/brand/` do indice: eles nao sao segredo, mas tambem nao sao linkados de lugar
  nenhum, entao estavam publicos por acidente e nao por decisao.

Ambas as páginas são estáticas (Tailwind via CDN), reconstruídas a partir do conteúdo em
produção em 15/08/2026.

## Deploy

Projeto Vercel: `general-tecnologia/generaltecnologia-landing`.
Após conectar este repositório ao projeto na Vercel (Git Integration), todo push em
`main` gera um deploy de produção automaticamente.
