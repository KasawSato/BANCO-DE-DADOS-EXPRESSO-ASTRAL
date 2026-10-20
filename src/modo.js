// Modo espectador (padrão) e modo editor. A senha é validada por ./acesso.js.
import { verificar } from './acesso.js';

const CHAVE = 'modo-editor';

export function criarModo({ toast }) {
  const $ = id => document.getElementById(id);
  let espectador = true;
  try { espectador = sessionStorage.getItem(CHAVE) !== '1'; } catch {}

  function aplicar() {
    document.body.classList.toggle('espectador', espectador);
    const b = $('lockBtn');
    b.textContent = espectador ? '👁 Modo espectador' : '✎ Modo editor';
    b.title = espectador ? 'Clique para entrar em modo editor' : 'Clique para voltar ao modo espectador';
  }

  /** Use no início de toda ação que altera conteúdo: devolve true se estiver bloqueada. */
  function bloquear() {
    if (!espectador) return false;
    toast('Modo espectador: criar, editar e excluir estão bloqueados.', 2600);
    return true;
  }

  function alternar(aoVoltar) {
    if (!espectador) {
      espectador = true;
      try { sessionStorage.removeItem(CHAVE); } catch {}
      aplicar();
      if (aoVoltar) aoVoltar();
      toast('Modo espectador ativado.');
      return;
    }
    $('unlockErr').textContent = '';
    const i = $('unlockPwd');
    i.value = '';
    $('unlock').classList.add('show');
    setTimeout(() => i.focus(), 50);
  }

  function fechar() { $('unlock').classList.remove('show'); }

  async function tentar() {
    const i = $('unlockPwd'), err = $('unlockErr'), b = $('unlockOk');
    b.disabled = true;
    err.textContent = 'Verificando…';
    let ok = false;
    try { ok = await verificar(i.value); } catch {}
    b.disabled = false;
    if (ok) {
      espectador = false;
      try { sessionStorage.setItem(CHAVE, '1'); } catch {}
      i.value = '';
      fechar();
      aplicar();
      toast('Modo editor liberado.');
    } else {
      err.textContent = 'Senha incorreta.';
      i.select();
    }
  }

  $('unlockPwd').addEventListener('keydown', e => { if (e.key === 'Enter') tentar(); });
  aplicar();

  return { bloquear, alternar, fechar, tentar, get espectador() { return espectador; } };
}
