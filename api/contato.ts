// Recebe o formulário de contato do site e manda a mensagem para a caixa da P&C Tec.
//
// O envio sai pela própria conta Google Workspace da empresa (SMTP do Gmail), então não há
// serviço extra para contratar. Variáveis de ambiente, configuradas pelo dono na Vercel:
//   SMTP_USER      conta Google que envia (ex.: vendaspectec@generaltecnologia.com)
//   SMTP_PASS      "senha de app" dessa conta, gerada em myaccount.google.com/apppasswords
//   CONTATO_PARA   quem recebe (opcional; padrão: vendaspectec@generaltecnologia.com)
// Sem SMTP_USER/SMTP_PASS a função responde 503 e o site mostra o e-mail para contato direto.
// Em desenvolvimento local (CONTATO_MODO_TESTE=1) a mensagem só aparece no terminal.
import nodemailer from 'nodemailer'
import { conferirSolucao } from './_desafio.js'
import { limpar, validar, type Dados } from './_formulario.js'

const PARA_PADRAO = 'vendaspectec@generaltecnologia.com'

// Proteção simples contra rajadas: no máximo 5 envios por IP a cada 10 minutos. Vale por
// instância da função (a Vercel pode abrir várias), então segura abuso casual, não um ataque
// distribuído; para isso existe o Firewall da Vercel.
const JANELA_MS = 10 * 60 * 1000
const envios = new Map<string, number[]>()
function limiteAtingido(ip: string) {
  const agora = Date.now()
  // Faxina: IPs sem envio recente saem do mapa, para ele não crescer sem fim
  if (envios.size > 500) for (const [k, v] of envios) if (v.every((t) => agora - t >= JANELA_MS)) envios.delete(k)
  const recentes = (envios.get(ip) ?? []).filter((t) => agora - t < JANELA_MS)
  recentes.push(agora)
  envios.set(ip, recentes)
  return recentes.length > 5
}

// Lê o corpo em pedaços e desiste assim que passar do limite (não confia no content-length,
// que pode faltar ou mentir)
async function lerCorpo(request: Request, limite: number): Promise<string | null> {
  if (!request.body) return ''
  const leitor = request.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    total += value.byteLength
    if (total > limite) {
      await leitor.cancel()
      return null
    }
    partes.push(value)
  }
  return Buffer.concat(partes).toString('utf8')
}

const resposta = (status: number, corpo: object) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function montarEmail(d: Dados) {
  const digitos = d.telefone.replace(/\D/g, '')
  const whatsapp = `https://wa.me/${digitos.length <= 11 ? '55' : ''}${digitos}`
  const linhas: [string, string][] = [
    ['Nome', d.nome],
    ['Telefone', d.telefone],
    ['E-mail', d.email],
    ['Assunto', d.assunto || '(não informado)'],
    ['Enviado pelo botão', d.origem || '(não informado)'],
  ]
  const texto =
    linhas.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\nWhatsApp: ${whatsapp}\n\nO que precisa:\n${d.mensagem}\n\n— Formulário do site pectecs.com.br. Responder este e-mail responde direto para ${d.email}.`
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0B1F3A">
  <h2 style="margin:0 0 12px">Novo contato pelo site</h2>
  <table style="border-collapse:collapse">${linhas
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#64748B">${k}</td><td style="padding:4px 0"><b>${escapar(v)}</b></td></tr>`)
    .join('')}
  <tr><td style="padding:4px 16px 4px 0;color:#64748B">WhatsApp</td><td><a href="${whatsapp}">${escapar(whatsapp)}</a></td></tr></table>
  <p style="margin:16px 0 4px;color:#64748B">O que precisa:</p>
  <p style="margin:0;white-space:pre-wrap">${escapar(d.mensagem)}</p>
  <p style="margin:20px 0 0;font-size:12px;color:#94A3B8">Formulário do site pectecs.com.br. Responder este e-mail responde direto para ${escapar(d.email)}.</p>
</div>`
  return { texto, html }
}

// Maior corpo aceito: o formulário inteiro cabe com folga em 16 KB
const LIMITE_BYTES = 16 * 1024

export async function POST(request: Request) {
  // Só aceita envios feitos pelas páginas do próprio site. O navegador sempre manda o cabeçalho
  // Origin num POST; sem ele, ou vindo de outro domínio, não é o nosso formulário, e sim alguém
  // tentando usar a função para disparar e-mails.
  const origem = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  let origemOk = false
  try {
    origemOk = !!origem && !!host && new URL(origem).host === host
  } catch {
    origemOk = false
  }
  if (!origemOk) return resposta(403, { erro: 'Envio não permitido.' })

  // Tipo exato: "text/plain; application/json" (que o navegador manda sem pedir permissão) não passa
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return resposta(415, { erro: 'Formato não aceito.' })
  }
  if (Number(request.headers.get('content-length') ?? 0) > LIMITE_BYTES) {
    return resposta(413, { erro: 'Mensagem grande demais.' })
  }

  let bruto: Record<string, unknown>
  try {
    const texto = await lerCorpo(request, LIMITE_BYTES)
    if (texto === null) return resposta(413, { erro: 'Mensagem grande demais.' })
    const lido: unknown = JSON.parse(texto)
    if (!lido || typeof lido !== 'object' || Array.isArray(lido)) throw new Error('não é um objeto')
    bruto = lido as Record<string, unknown>
  } catch {
    return resposta(400, { erro: 'Não conseguimos ler o formulário.' })
  }

  // Robôs preenchem o campo escondido ou enviam rápido demais: fingimos sucesso e descartamos
  const tempo = Number(bruto.tempo)
  if (limpar(bruto.site, 200) || !Number.isFinite(tempo) || tempo < 2500) return resposta(200, { ok: true })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'desconhecido'
  if (limiteAtingido(ip)) return resposta(429, { erro: 'Muitos envios seguidos. Tente de novo em alguns minutos.' })

  // Prova de trabalho: o navegador precisa ter resolvido um desafio emitido por este servidor
  if (!conferirSolucao(bruto.prova)) {
    return resposta(400, { erro: 'Não conseguimos confirmar o envio. Recarregue a página e tente de novo.' })
  }

  const { dados, erro } = validar(bruto)
  if (!dados) return resposta(400, { erro })

  const { texto, html } = montarEmail(dados)
  const assunto = `Contato pelo site: ${dados.assunto || 'mensagem'} — ${dados.nome}`
  const { SMTP_USER, SMTP_PASS, CONTATO_PARA, CONTATO_MODO_TESTE } = process.env

  if (!SMTP_USER || !SMTP_PASS) {
    if (CONTATO_MODO_TESTE === '1') {
      console.log(`\n[contato · modo teste] ${assunto}\n${texto}\n`)
      return resposta(200, { ok: true, teste: true })
    }
    console.error('[contato] SMTP_USER/SMTP_PASS não configurados')
    return resposta(503, { erro: 'O envio pelo site está indisponível no momento.' })
  }

  // O Google mostra a senha de app em grupos de 4 separados por espaço ("abcd efgh ..."), mas ela
  // não tem espaços; e colar no painel às vezes traz espaço ou quebra de linha junto
  const usuario = SMTP_USER.trim()
  const senha = SMTP_PASS.replace(/\s+/g, '')
  const para = (CONTATO_PARA || PARA_PADRAO).trim()

  try {
    const transporte = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: usuario, pass: senha },
    })
    await transporte.sendMail({
      from: { name: 'Site P&C Tec', address: usuario },
      to: para,
      replyTo: { name: dados.nome, address: dados.email },
      subject: assunto,
      text: texto,
      html,
    })
    return resposta(200, { ok: true })
  } catch (e) {
    // Só o código e a mensagem: o objeto de erro inteiro pode trazer detalhes da conexão SMTP
    const { code, message } = (e ?? {}) as { code?: string; message?: string }
    console.error('[contato] falha no envio:', code ?? '', message ?? '')
    return resposta(502, { erro: 'Não conseguimos enviar agora.' })
  }
}
