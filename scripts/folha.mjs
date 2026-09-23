// Junta fotos numa folha de contato para revisão rápida.
// Uso: node scripts/folha.mjs <pasta> <prefixo> <largura-miniatura> <saida.png>
import { chromium } from 'playwright'
import { readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const [dir, prefixo, largura, saida] = process.argv.slice(2)
const arqs = readdirSync(dir).filter((f) => f.startsWith(prefixo + '-') && f.endsWith('.png')).sort()
const html = `<body style="margin:0;background:#333;font:11px sans-serif;color:#fff;display:flex;flex-wrap:wrap;gap:6px;padding:6px">` +
  arqs.map((f) => `<div><img src="${f}" style="width:${largura}px;display:block"><div>${f}</div></div>`).join('') + '</body>'
const tmp = resolve(dir, '_folha.html'); writeFileSync(tmp, html)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 800 } })
await p.goto(pathToFileURL(tmp).href); await p.waitForLoadState('networkidle')
await p.screenshot({ path: saida, fullPage: true }); await b.close(); unlinkSync(tmp)
