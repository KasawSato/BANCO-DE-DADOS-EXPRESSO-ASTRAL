/* ============================================================================
   Validação da senha que libera o MODO EDITOR.
   A senha não está escrita em lugar nenhum: aqui fica só um hash
   (SHA-256 repetido, com sal). Para trocar a senha:
       npm run senha -- 'nova senha'
   Observação: roda no navegador, então é uma trava de uso (evita edição e
   exclusão acidental, ou por quem não tem a senha). Não protege contra alguém
   com conhecimento técnico mexendo no próprio navegador.
   ============================================================================ */
const SALT = 'd004028cfd5047ae31b312d3b254a6f3';
const ITER = 50000;
const HASH = 'a94c280d27b2120e4a272e75be51477f587b2e1667b75ac34dafad079d7fb9f4';

const K = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
]);

// SHA-256 em JavaScript puro (funciona também em http, onde crypto.subtle não existe)
function sha256(m) {
  const l = m.length, n = ((l + 9 + 63) >> 6) << 6;
  const b = new Uint8Array(n); b.set(m); b[l] = 0x80;
  const dv = new DataView(b.buffer);
  dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  dv.setUint32(n - 4, (l << 3) >>> 0);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const w = new Uint32Array(64);
  for (let i = 0; i < n; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const a = w[t - 15], c = w[t - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((c >>> 17) | (c << 15)) ^ ((c >>> 19) | (c << 13)) ^ (c >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let A = H[0], B = H[1], C = H[2], D = H[3], E = H[4], F = H[5], G = H[6], J = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = ((E >>> 6) | (E << 26)) ^ ((E >>> 11) | (E << 21)) ^ ((E >>> 25) | (E << 7));
      const ch = (E & F) ^ (~E & G);
      const t1 = (J + S1 + ch + K[t] + w[t]) | 0;
      const S0 = ((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10));
      const mj = (A & B) ^ (A & C) ^ (B & C);
      const t2 = (S0 + mj) | 0;
      J = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
    }
    H[0] += A; H[1] += B; H[2] += C; H[3] += D; H[4] += E; H[5] += F; H[6] += G; H[7] += J;
  }
  const out = new Uint8Array(32), o = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) o.setUint32(i * 4, H[i]);
  return out;
}

const hexParaBytes = h => Uint8Array.from(h.match(/../g), x => parseInt(x, 16));
const bytesParaHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
function juntar(...partes) {
  const r = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of partes) { r.set(p, pos); pos += p.length; }
  return r;
}
function derivar(senha) {
  const salt = hexParaBytes(SALT);
  const pw = new TextEncoder().encode(String(senha).normalize('NFC'));
  let h = sha256(juntar(salt, pw));
  for (let i = 0; i < ITER; i++) h = sha256(juntar(h, salt, pw));
  return bytesParaHex(h);
}
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

let falhas = 0;
/** Devolve Promise<boolean>. Cada erro seguido aumenta a espera da resposta seguinte. */
export function verificar(senha) {
  const espera = Math.min(falhas, 6) * 800;
  return new Promise(resolve => {
    setTimeout(() => {
      let ok = false;
      try { ok = !!senha && iguais(derivar(senha), HASH); } catch { ok = false; }
      falhas = ok ? 0 : falhas + 1;
      resolve(ok);
    }, espera + 30);
  });
}
