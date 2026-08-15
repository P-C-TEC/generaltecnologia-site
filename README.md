# generaltecnologia-site

Site institucional da **PERDIGAO & CARNEIRO TECNOLOGIAS LTDA** (marca "General Tecnologia"),
publicado em `generaltecnologia.com` / `www.generaltecnologia.com` via Vercel.

Este repositório passou a versionar o código deste site, que antes era publicado apenas
via `vercel deploy` direto da CLI, sem repositório Git associado.

## Estrutura

- `index.html` — home institucional da General Tecnologia (empresa, produtos, contato).
- `gtrestaurante/index.html` — página de vendas do produto GTRestaurante (antigo `index.html`
  da raiz, movido para cá quando o site passou a ser institucional).
- `vercel.json` — `cleanUrls`/`trailingSlash` para servir `/gtrestaurante` sem barra final.

Ambas as páginas são estáticas (Tailwind via CDN), reconstruídas a partir do conteúdo em
produção em 15/08/2026.

## Deploy

Projeto Vercel: `general-tecnologia/generaltecnologia-landing`.
Após conectar este repositório ao projeto na Vercel (Git Integration), todo push em
`main` gera um deploy de produção automaticamente.
