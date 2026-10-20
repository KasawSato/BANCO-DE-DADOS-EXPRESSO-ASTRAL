// Troca a credencial que libera a edição.
// Uso (PowerShell, use aspas SIMPLES):  node trocar-senha.mjs 'nova senha'
// Sem argumento, o programa pergunta a senha.
import crypto from 'node:crypto'
import fs from 'node:fs'
import readline from 'node:readline/promises'

const arq = new URL('./public/modo-leitura.js', import.meta.url)
let senha = process.argv[2]
if (!senha) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  senha = await rl.question('Nova credencial: ')
  rl.close()
}
if (!senha || senha.length < 8) {
  console.error('Use uma credencial com pelo menos 8 caracteres.')
  process.exit(1)
}

let src = fs.readFileSync(arq, 'utf8')
const iter = Number(src.match(/var ITER = (\d+);/)[1])
const salt = crypto.randomBytes(16)
const pw = Buffer.from(senha.normalize('NFC'), 'utf8')
const sha = (...p) => crypto.createHash('sha256').update(Buffer.concat(p)).digest()
let h = sha(salt, pw)
for (let i = 0; i < iter; i++) h = sha(h, salt, pw)

src = src
  .replace(/var SALT = '[^']*';/, `var SALT = '${salt.toString('hex')}';`)
  .replace(/var HASH = '[^']*';/, `var HASH = '${h.toString('hex')}';`)
fs.writeFileSync(arq, src)
console.log('Credencial atualizada em public/modo-leitura.js. Reinicie ou atualize a página.')
