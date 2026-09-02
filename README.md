# generaltecnologia-site

Site institucional da **PERDIGAO & CARNEIRO TECNOLOGIAS LTDA** (marca "General Tecnologia"),
publicado em `generaltecnologia.com` / `www.generaltecnologia.com` via Vercel.

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
- `vercel.json` — `cleanUrls`/`trailingSlash` para servir `/gtrestaurante` sem barra final.

Ambas as páginas são estáticas (Tailwind via CDN), reconstruídas a partir do conteúdo em
produção em 15/08/2026.

## Deploy

Projeto Vercel: `general-tecnologia/generaltecnologia-landing`.
Após conectar este repositório ao projeto na Vercel (Git Integration), todo push em
`main` gera um deploy de produção automaticamente.
