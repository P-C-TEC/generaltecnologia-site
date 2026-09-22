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


## As páginas legais do Plantemo são geradas

Os mesmos textos existem em dois lugares por motivos diferentes: a Google Play exige um endereço
público, e o aplicativo precisa mostrar a política **sem internet**. Dois documentos escritos à
mão contando a mesma coisa é o arranjo que garante que, daqui a seis meses, eles contem coisas
diferentes — e num documento legal isso não é detalhe de manutenção.

Para atualizar:

```bash
# 1. copie os .md novos do repositório do Plantemo
cp ../PLANTEMO/docs/politica-de-privacidade.md plantemo/fonte/
cp ../PLANTEMO/docs/termos-de-uso.md plantemo/fonte/

# 2. gere
node plantemo/gerar-legais.mjs

# 3. confira o diff e faça o commit das duas coisas juntas
```

## O domínio plantemo.com.br fica FORA deste projeto

A página em `/plantemo` continua aqui, no portfólio, como a do GTRestaurante. Mas o domínio
próprio **não** aponta para este projeto: `plantemo.com.br` é um site de produto separado, mais
completo, que mora no repositório do Plantemo, em `site/`, e tem projeto próprio na Vercel.

É a mesma arquitetura do Mordomo Tec, que também tem domínio e site próprios e aparece aqui
apenas como card do portfólio.

Uma reescrita condicionada ao host chegou a existir neste arquivo, para `plantemo.com.br` servir
`/plantemo`. Ela foi removida quando a decisão mudou — deixá-la valendo faria o domínio próprio
servir a página curta em vez do site do produto, e o erro seria silencioso.
