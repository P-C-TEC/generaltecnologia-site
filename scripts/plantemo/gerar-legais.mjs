/**
 * Gera as páginas legais do Plantemo a partir do Markdown.
 *
 * POR QUE GERAR, E NÃO ESCREVER O HTML À MÃO.
 *
 * Os mesmos textos existem em dois lugares por motivos diferentes: a Google Play exige um
 * endereço público, e o aplicativo precisa mostrar a política sem internet. Dois documentos
 * escritos à mão contando a mesma coisa é o arranjo que garante que, daqui a seis meses, eles
 * contem coisas diferentes — e num documento legal isso não é um detalhe de manutenção.
 *
 * Então a fonte é uma só: os arquivos em `fonte/`, copiados do repositório do Plantemo, onde
 * moram os originais e onde há teste automatizado conferindo que o texto diz o que o sistema faz.
 *
 * COMO ATUALIZAR
 *
 *   1. copie os .md novos para scripts/plantemo/fonte/
 *   2. node scripts/plantemo/gerar-legais.mjs   (grava as páginas em public/plantemo/)
 *   3. confira o diff e faça o commit das duas coisas juntas
 *
 * O conversor cobre só o Markdown que estes documentos usam: título, parágrafo, lista, tabela,
 * citação, régua, negrito, itálico, código e link. Não é um conversor de uso geral, e não
 * precisa ser.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** Escapa o que viraria marcação HTML por acidente. */
const escapar = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Marcação de dentro da linha: negrito, itálico, código e link. */
function inline(t) {
  return escapar(t)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    // Link para outro documento .md vira link para a página irmã.
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, texto, destino) => {
      const alvo = destino
        .replace('politica-de-privacidade.md', '/plantemo/privacidade')
        .replace('termos-de-uso.md', '/plantemo/termos');
      return `<a href="${alvo}" class="text-brand underline underline-offset-4 hover:text-white">${texto}</a>`;
    });
}

function converter(md) {
  const linhas = md.split(/\r?\n/);
  const saida = [];

  let i = 0;
  let emLista = false;

  const fecharLista = () => {
    if (emLista) {
      saida.push('</ul>');
      emLista = false;
    }
  };

  while (i < linhas.length) {
    const linha = linhas[i];

    // Tabela: a linha seguinte é o separador |---|---|
    if (/^\s*\|/.test(linha) && /^\s*\|[\s:|-]+\|\s*$/.test(linhas[i + 1] ?? '')) {
      fecharLista();

      const celulas = (l) =>
        l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

      const cabecalho = celulas(linha);
      i += 2;

      const corpo = [];
      while (i < linhas.length && /^\s*\|/.test(linhas[i])) {
        corpo.push(celulas(linhas[i]));
        i += 1;
      }

      saida.push('<div class="my-6 overflow-x-auto"><table class="w-full border-collapse text-left text-sm">');
      saida.push(
        '<thead><tr>' +
          cabecalho
            .map(
              (c) =>
                `<th class="border-b border-white/15 px-3 py-2.5 font-semibold text-white">${inline(c)}</th>`,
            )
            .join('') +
          '</tr></thead><tbody>',
      );
      for (const l of corpo) {
        saida.push(
          '<tr>' +
            l
              .map(
                (c) =>
                  `<td class="border-b border-white/[0.06] px-3 py-2.5 align-top text-slate-400">${inline(c)}</td>`,
              )
              .join('') +
            '</tr>',
        );
      }
      saida.push('</tbody></table></div>');
      continue;
    }

    if (/^\s*$/.test(linha)) {
      fecharLista();
      i += 1;
      continue;
    }

    if (/^---+\s*$/.test(linha)) {
      fecharLista();
      saida.push('<hr class="my-10 border-white/10" />');
      i += 1;
      continue;
    }

    const titulo = linha.match(/^(#{1,4})\s+(.*)$/);
    if (titulo) {
      fecharLista();
      const nivel = titulo[1].length;
      const classe = {
        1: 'mb-4 text-4xl font-black leading-tight text-white md:text-5xl',
        2: 'mb-4 mt-12 text-2xl font-bold text-white',
        3: 'mb-3 mt-8 text-xl font-bold text-white',
        4: 'mb-2 mt-6 text-lg font-semibold text-white',
      }[nivel];
      saida.push(`<h${nivel} class="${classe}">${inline(titulo[2])}</h${nivel}>`);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(linha)) {
      fecharLista();
      const bloco = [];
      while (i < linhas.length && /^>\s?/.test(linhas[i])) {
        bloco.push(linhas[i].replace(/^>\s?/, ''));
        i += 1;
      }
      saida.push(
        '<blockquote class="my-6 rounded-r-xl border-l-4 border-terra/70 bg-white/[0.03] px-5 py-4 text-slate-300">' +
          `<p>${inline(bloco.join(' '))}</p></blockquote>`,
      );
      continue;
    }

    const item = linha.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      if (!emLista) {
        saida.push('<ul class="my-4 space-y-2 pl-5">');
        emLista = true;
      }
      // Continuação indentada do mesmo item.
      let texto = item[1];
      while (/^\s{2,}\S/.test(linhas[i + 1] ?? '')) {
        texto += ' ' + linhas[i + 1].trim();
        i += 1;
      }
      saida.push(`<li class="list-disc text-slate-400">${inline(texto)}</li>`);
      i += 1;
      continue;
    }

    // Parágrafo: junta as linhas até a próxima em branco.
    fecharLista();
    const paragrafo = [linha];
    i += 1;
    while (
      i < linhas.length &&
      !/^\s*$/.test(linhas[i]) &&
      !/^(#{1,4}\s|>|---+\s*$|\s*[-*]\s|\s*\|)/.test(linhas[i])
    ) {
      paragrafo.push(linhas[i]);
      i += 1;
    }
    saida.push(`<p class="my-4 leading-relaxed text-slate-400">${inline(paragrafo.join(' '))}</p>`);
  }

  fecharLista();
  return saida.join('\n');
}

function pagina({ titulo, descricao, corpo, outra, rotuloDaOutra }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Plantemo — ${titulo}</title>
  <meta name="description" content="${descricao}" />
  <meta property="og:title" content="Plantemo — ${titulo}" />
  <meta property="og:description" content="${descricao}" />
  <meta property="og:image" content="https://pectecs.com.br/plantemo/capa.png" />
  <link rel="icon" href="/plantemo/icon.png" type="image/png" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { brand: '#4E9A6E', 'brand-dark': '#1F4D36', terra: '#A34822' },
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    .gradient-bg { background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(78,154,110,0.18) 0%, transparent 60%), linear-gradient(180deg, #0A1710 0%, #050B08 100%); }
  </style>
</head>
<body class="gradient-bg font-sans text-white antialiased">

  <nav class="border-b border-white/[0.06] bg-[rgba(5,11,8,0.85)] backdrop-blur-2xl">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <a href="/plantemo" class="flex items-center gap-3">
        <img src="/plantemo/icon.png" alt="Plantemo" class="h-9 w-9 rounded-xl object-cover" />
        <div>
          <p class="text-sm font-bold text-white">Plantemo</p>
          <p class="text-xs text-slate-500">${titulo}</p>
        </div>
      </a>
      <div class="flex items-center gap-4 text-sm">
        <a href="/plantemo" class="text-slate-400 transition hover:text-white">Voltar ao site</a>
        <a href="${outra}" class="text-slate-400 transition hover:text-white">${rotuloDaOutra}</a>
      </div>
    </div>
  </nav>

  <main class="px-6 py-16">
    <article class="mx-auto max-w-3xl">
${corpo}
    </article>
  </main>

  <footer class="border-t border-white/[0.06] px-6 py-10">
    <div class="mx-auto max-w-3xl text-center">
      <p class="text-xs text-slate-600">
        Perdig&atilde;o &amp; Carneiro Tecnologias LTDA — CNPJ 68.508.547/0001-36 · Itabuna, Bahia
      </p>
      <div class="mt-4 flex justify-center gap-4">
        <a href="/" class="text-xs text-slate-500 transition hover:text-white">P&amp;C Tec</a>
        <a href="/plantemo" class="text-xs text-slate-500 transition hover:text-white">Plantemo</a>
        <a href="/plantemo/termos" class="text-xs text-slate-500 transition hover:text-white">Termos</a>
        <a href="/plantemo/privacidade" class="text-xs text-slate-500 transition hover:text-white">Privacidade</a>
      </div>
    </div>
  </footer>

</body>
</html>
`;
}

const pecas = [
  {
    fonte: 'politica-de-privacidade.md',
    saida: 'privacidade.html',
    titulo: 'Política de Privacidade',
    descricao:
      'O que o Plantemo guarda sobre você, com base em qual hipótese legal, por quanto tempo e com quem compartilha. Da P&C Tec.',
    outra: '/plantemo/termos',
    rotuloDaOutra: 'Termos de Uso',
  },
  {
    fonte: 'termos-de-uso.md',
    saida: 'termos.html',
    titulo: 'Termos de Uso',
    descricao:
      'As regras de uso do Plantemo, o que ele não faz e os seus direitos como consumidor. Da P&C Tec.',
    outra: '/plantemo/privacidade',
    rotuloDaOutra: 'Política de Privacidade',
  },
];

for (const peca of pecas) {
  const md = readFileSync(join(AQUI, 'fonte', peca.fonte), 'utf8');
  const corpo = converter(md)
    .split('\n')
    .map((l) => '      ' + l)
    .join('\n');

  // As páginas são publicadas a partir de public/plantemo; a fonte fica aqui, fora do ar
  writeFileSync(join(AQUI, '..', '..', 'public', 'plantemo', peca.saida), pagina({ ...peca, corpo }), 'utf8');
  console.log(`${peca.fonte} -> public/plantemo/${peca.saida}`);
}
