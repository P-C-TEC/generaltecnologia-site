import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Toda build é prévia (noindex) por padrão. Só sai indexável a publicação de produção do projeto
// dono do domínio pectecs.com.br (a Vercel informa isso nas variáveis de sistema do build), ou
// `vite build --mode producao`. Assim nenhuma prévia, de nenhum projeto, vai parar no Google.
function ehProducao(mode: string) {
  if (mode === 'producao') return true
  const dominio = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '').replace(/^www\./, '')
  return process.env.VERCEL_ENV === 'production' && dominio === 'pectecs.com.br'
}
function noindex(mode: string): Plugin {
  return {
    name: 'noindex-na-previa',
    transformIndexHtml(html) {
      if (ehProducao(mode)) return html
      return html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />')
    },
  }
}

// Em `npm run dev` a função da Vercel (api/contato.ts) não existe; este plugin a executa
// dentro do servidor do Vite. Sem SMTP no .env.local, a mensagem só aparece no terminal.
function apiLocal(mode: string): Plugin {
  return {
    name: 'api-local',
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), '')
      Object.assign(process.env, { CONTATO_MODO_TESTE: '1', ...env })
      // /api/<nome> executa api/<nome>.ts, chamando o GET ou o POST exportado, como na Vercel
      server.middlewares.use('/api', async (req, res, proximo) => {
        const nome = (req.url ?? '').split('?')[0].replace(/^\//, '')
        if (!/^[a-z]+$/.test(nome)) return proximo()
        const modulo = await server.ssrLoadModule(`/api/${nome}.ts`).catch(() => null)
        const funcao = modulo?.[req.method ?? '']
        if (typeof funcao !== 'function') {
          res.statusCode = modulo ? 405 : 404
          return res.end()
        }
        const partes: Buffer[] = []
        for await (const p of req) partes.push(p as Buffer)
        const cabecalhos = new Headers()
        for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') cabecalhos.set(k, v)
        const r: Response = await funcao(
          new Request(`http://${req.headers.host}/api/${nome}`, {
            method: req.method,
            headers: cabecalhos,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(partes),
          }),
        )
        res.statusCode = r.status
        res.setHeader('content-type', r.headers.get('content-type') ?? 'application/json')
        res.end(await r.text())
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), noindex(mode), apiLocal(mode)],
  build: {
    rollupOptions: {
      // Só a página principal vai para o ar. A opção A (a/index.html) continua acessível em
      // `npm run dev` em /a, para consulta, mas fica fora do pacote publicado.
      input: { principal: import.meta.dirname + '/index.html', privacidade: import.meta.dirname + '/privacidade.html' },
    },
  },
}))
