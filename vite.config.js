import { defineConfig } from 'vite'
import fs from 'node:fs'

// Lê usuário e senha direto do .env, sem interpretar "#" e "$" como especiais
// (o leitor padrão do Vite cortaria uma senha como "abc#123" para "abc").
function lerAcesso() {
  const cfg = { usuario: process.env.ACESSO_USUARIO, senha: process.env.ACESSO_SENHA }
  try {
    for (const linha of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = linha.match(/^\s*(ACESSO_USUARIO|ACESSO_SENHA)\s*=(.*)$/)
      if (!m) continue
      let v = m[2].trim()
      if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1)
      if (m[1] === 'ACESSO_USUARIO') cfg.usuario = v
      else cfg.senha = v
    }
  } catch {}
  return { usuario: cfg.usuario || 'amigo', senha: cfg.senha || '' }
}

// Pede usuário e senha (HTTP Basic) apenas para quem chega pelo túnel.
// Quem acessa por http://localhost:5173 (você) entra direto.
function protecaoPorSenha({ usuario, senha }) {
  return {
    name: 'protecao-por-senha',
    configureServer(server) {
      if (!senha) {
        console.log('\n[acesso] SEM senha: qualquer pessoa com o link entra. Defina ACESSO_SENHA no .env.\n')
        return
      }
      console.log(`\n[acesso] Proteção ATIVA - usuário: "${usuario}" | senha com ${senha.length} caracteres\n`)
      // Aceita a senha codificada em UTF-8 ou Latin-1 (navegadores variam com acentos)
      const aceitos = new Set([
        Buffer.from(`${usuario}:${senha}`, 'utf8').toString('base64'),
        Buffer.from(`${usuario}:${senha}`, 'latin1').toString('base64'),
      ])
      server.middlewares.use((req, res, next) => {
        // O cloudflared adiciona estes cabeçalhos às requisições vindas da internet
        const viaTunel = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']
        if (!viaTunel) return next()
        const auth = req.headers.authorization || ''
        if (auth.startsWith('Basic ') && aceitos.has(auth.slice(6).trim())) return next()
        console.log('[acesso] tentativa recusada (usuário ou senha não conferem com o .env)')
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="Arquivo Modular Expresso Astral", charset="UTF-8"')
        res.end('Acesso restrito.')
      })
    },
  }
}

export default defineConfig({
  base: './',        // o build funciona em qualquer endereço ou subpasta
  plugins: [protecaoPorSenha(lerAcesso())],
  server: {
    host: true,        // escuta em 0.0.0.0 (rede local e túnel)
    port: 5173,
    strictPort: true,  // não troca de porta sem avisar
    // allowedHosts fica no padrão (restrito). O túnel reescreve o Host para
    // "localhost" (veja tunel.bat), então não é preciso liberar domínios.
  },
})
