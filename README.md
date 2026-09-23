# generaltecnologia-site

Site institucional da **Perdigão & Carneiro Tecnologias LTDA** (marca P&C Tec), publicado em
`pectecs.com.br` pela Vercel (projeto `general-tecnologia/generaltecnologia-landing`). Todo push na
`main` vira deploy de produção; os outros ramos geram prévias. `generaltecnologia.com` e `www`
redirecionam para `pectecs.com.br` (308). O subdomínio `gtrestaurante.generaltecnologia.com` não
muda: é onde o produto roda.

A home é um app React + Vite + Framer Motion, com CSS próprio em `src/b/`: fundo claro, fonte
Quantico nos títulos, títulos em escada, a logo registrada animada na hero e os produtos em rolagem
horizontal. As páginas de produto e as legais continuam estáticas em `public/`.

## Estrutura

- `index.html` + `src/` — a home.
- `privacidade.html` — política de privacidade do site (formulário de contato).
- `api/contato.ts` e `api/desafio.ts` — funções da Vercel do formulário de contato (ver abaixo).
- `public/gtrestaurante/` — página de vendas do GTRestaurante, termos e privacidade.
- `public/plantemo/` — página do Plantemo, termos e privacidade (as legais são geradas, ver abaixo).
- `public/brand/` — logos e os manuais de identidade (os manuais ficam fora da busca pelo
  `robots.txt`: não são segredo, mas não são linkados de lugar nenhum).
- `public/robots.txt` e `public/sitemap.xml` — busca.
- `vercel.json` — build, `cleanUrls` e os **cabeçalhos de segurança** (ver Segurança).
- `scripts/` — ferramentas locais (imagens, logo, ícones, testes de tela, páginas do Plantemo).

## Comandos

```bash
npm install
npm run dev                          # servidor local; o formulário roda em modo de teste
npm run build                        # build (sai com noindex; ver "Indexação")
node scripts/testar-telas.mjs [url] [prefixo]   # fotos em teste/ + checagem de rolagem lateral
node scripts/capturar-telas.mjs      # recaptura as telas dos produtos em capturas/
node scripts/otimizar-imagens.mjs    # converte as capturas usadas para WebP em public/telas/
node scripts/vetorizar-logo.mjs      # redesenha a logo em src/b/logoVetor.ts (ver "Marca")
node scripts/gerar-icones.mjs        # SVGs da logo e ícones quadrados (aba e tela inicial)
node scripts/plantemo/gerar-legais.mjs   # páginas legais do Plantemo a partir do Markdown
```

## Indexação

Nenhuma prévia pode ir parar no Google, e o domínio oficial precisa aparecer:

- o cabeçalho `X-Robots-Tag: noindex` vai em **qualquer endereço que não seja** `pectecs.com.br`
  (regra com `missing: host` no `vercel.json`);
- a meta `noindex` só sai do HTML na publicação de produção do projeto dono do domínio
  (`VERCEL_ENV=production` e `VERCEL_PROJECT_PRODUCTION_URL=pectecs.com.br`, no `vite.config.ts`),
  ou com `vite build --mode producao`.

## Formulário de contato

Todo botão de contato abre um formulário (nome, telefone, e-mail, assunto opcional e "descreva o
que você precisa"). O envio vai para `api/contato.ts`, que manda a mensagem pela conta Google
Workspace da empresa para `vendaspectec@generaltecnologia.com`. O "responder" do e-mail recebido vai
direto para quem escreveu, e o e-mail traz um link para responder pelo WhatsApp. O e-mail mostrado
no site é `contatopectec@generaltecnologia.com`.

Para funcionar, o projeto da Vercel precisa das variáveis (Settings → Environment Variables, em
Production e Preview):

1. `SMTP_USER`: a conta Google que envia (ex.: `vendaspectec@generaltecnologia.com`);
2. `SMTP_PASS`: uma **senha de app** dessa conta (myaccount.google.com/apppasswords; exige a
   verificação em duas etapas ligada);
3. opcional, `CONTATO_PARA`: outra caixa de destino.

Sem elas, o formulário avisa que o envio está indisponível e mostra o e-mail de contato. Em
`npm run dev` nada é enviado: a mensagem aparece no terminal.

### Proteção contra robôs

- **Prova de trabalho** (`api/_desafio.ts`, `src/b/provaDeTrabalho.ts`, o esquema do ALTCHA, sem
  serviço externo): `GET /api/desafio` entrega um desafio assinado; o navegador o resolve em segundo
  plano enquanto a pessoa preenche (cerca de 0,2–0,8 s no computador, até ~3 s num celular
  simples) e o envio só é aceito com a solução. Cada desafio expira em 10 minutos e vale uma vez. A
  chave da assinatura é derivada de `SMTP_PASS`: não há segredo a mais para cadastrar.
- Só aceita POST JSON vindo do próprio site (`Origin`), com até 16 KB.
- Campo-isca invisível, tempo mínimo de preenchimento e limite de 5 envios por IP a cada 10 minutos.
- Reforço recomendado (feito no painel da Vercel, pelo dono): uma regra de rate limit no Firewall
  para `/api/contato`.

## Segurança (auditoria de 23/09/2026)

- Dependências publicadas: `npm audit --omit=dev` sem vulnerabilidades. As 5 moderadas de
  `npm audit` estão no `phin`, usado só pelo `potrace` (ferramenta local de vetorizar a logo).
- Cabeçalhos no `vercel.json`: CSP rígida no site (`script-src 'self'`, sem script inline); CSP
  própria, mais aberta, só em `/gtrestaurante` e `/plantemo` (usam Tailwind por CDN); HSTS,
  X-Frame-Options, nosniff, COOP, Referrer-Policy, Permissions-Policy. Ao acrescentar recurso
  externo novo, a CSP precisa acompanhar, senão ele é bloqueado em silêncio.
- `api/contato.ts`: validação estrita (o e-mail vira o "responder para"), todo texto do visitante
  escapado no HTML do e-mail, e os logs não gravam dados do visitante.
- Pendência conhecida: as páginas de produto usam o Tailwind "Play CDN", que o próprio Tailwind
  não recomenda para produção; o ideal é compilar esse CSS.

## Marca

A logo é a do pedido de registro da marca (P&C com "Tec" dentro do C). A imagem de origem tem bordas
levemente tremidas e um degradê onde a cauda do "&" vira a diagonal de baixo do "C"; por isso
`scripts/vetorizar-logo.mjs` a **redesenha** em `src/b/logoVetor.ts`: P e C só com retas travadas em
múltiplos de 45°, "&" e "Tec" com curvas limpas e a cauda do "&" com degradê azul `#086BA5` →
marinho `#05264B`. O script lê a imagem original de `../materiais/logo-registro/` (fora do
repositório). É uma versão limpa para a web; para o registro no INPI, vale o arquivo original.

## As páginas legais do Plantemo são geradas

Os mesmos textos existem em dois lugares por motivos diferentes: a Google Play exige um endereço
público, e o aplicativo precisa mostrar a política **sem internet**. Dois documentos escritos à
mão contando a mesma coisa é o arranjo que garante que, daqui a seis meses, eles contem coisas
diferentes — e num documento legal isso não é detalhe de manutenção.

Para atualizar:

```bash
# 1. copie os .md novos do repositório do Plantemo
cp ../PLANTEMO/docs/politica-de-privacidade.md scripts/plantemo/fonte/
cp ../PLANTEMO/docs/termos-de-uso.md scripts/plantemo/fonte/

# 2. gere (grava em public/plantemo/)
node scripts/plantemo/gerar-legais.mjs

# 3. confira o diff e faça o commit das duas coisas juntas
```
