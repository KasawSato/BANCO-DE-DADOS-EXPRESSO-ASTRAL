// Troca a senha do modo editor (regrava o hash em src/acesso.js).
// Uso:  npm run senha -- 'nova senha'      (PowerShell: aspas SIMPLES)
// Sem argumento, o programa pergunta a senha.
import crypto from 'node:crypto'
import fs from 'node:fs'
import readline from 'node:readline/promises'

const arq = new URL('../src/acesso.js', import.meta.url)
let senha = process.argv[2]
if (!senha) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  senha = await rl.question('Nova senha: ')
  rl.close()
}
if (!senha || senha.length < 8) {
  console.error('Use uma senha com pelo menos 8 caracteres.')
  process.exit(1)
}

let src = fs.readFileSync(arq, 'utf8')
const iter = Number(src.match(/const ITER = (\d+);/)[1])
const salt = crypto.randomBytes(16)
const pw = Buffer.from(senha.normalize('NFC'), 'utf8')
const sha = (...p) => crypto.createHash('sha256').update(Buffer.concat(p)).digest()
let h = sha(salt, pw)
for (let i = 0; i < iter; i++) h = sha(h, salt, pw)

src = src
  .replace(/const SALT = '[^']*';/, `const SALT = '${salt.toString('hex')}';`)
  .replace(/const HASH = '[^']*';/, `const HASH = '${h.toString('hex')}';`)
fs.writeFileSync(arq, src)
console.log('Senha atualizada em src/acesso.js. Faça o commit dessa mudança.')
