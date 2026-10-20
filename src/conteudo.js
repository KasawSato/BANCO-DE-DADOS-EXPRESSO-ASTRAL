// Conteúdo inicial: lê conteudo/arquivo.json (o mesmo arquivo gerado pelo botão "Exportar").
const ARQUIVO = 'conteudo/arquivo.json';

/** No seu PC (localhost) o conteúdo inicial nunca sobrescreve o que você está editando. */
export const ehAutor = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
/** Abrir com ?forcar=1 aplica o arquivo mesmo no seu PC. */
export const forcado = () => new URLSearchParams(location.search).has('forcar');

/** Busca o arquivo. Devolve { status: 'ok' | 'ausente' | 'invalido' | 'erro', dados?, erro? } */
export async function buscarConteudo() {
  try {
    const r = await fetch(ARQUIVO, { cache: 'no-cache' });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return { status: 'ausente' };
    const dados = await r.json();
    if (!dados || !Array.isArray(dados.sessions) || !Array.isArray(dados.posts)) return { status: 'invalido' };
    return { status: 'ok', dados };
  } catch (erro) {
    return { status: 'erro', erro };
  }
}

const mudou = (a, b) => {
  const m = new Map(a.map(x => [x.id, JSON.stringify(x)]));
  return b.some(x => m.get(x.id) !== JSON.stringify(x));
};
/** O arquivo traz algo que o navegador ainda não tem (ou com versão diferente)? */
export const difere = (db, seed) => mudou(db.sessions, seed.sessions) || mudou(db.posts, seed.posts);

const unir = (a, b) => {
  const m = new Map(a.map(x => [x.id, x]));
  b.forEach(x => m.set(x.id, x));
  return [...m.values()];
};
/** Itens com o mesmo id passam a valer como estão no arquivo; o que só existe local é mantido. */
export const mesclar = (db, seed) => ({ ...db, sessions: unir(db.sessions, seed.sessions), posts: unir(db.posts, seed.posts) });
