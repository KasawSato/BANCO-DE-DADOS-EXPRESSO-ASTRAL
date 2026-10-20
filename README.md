# Arquivo Modular — Expresso Astral

Arquivo de seções e publicações (registros de campanha) feito com [Vite](https://vite.dev).
Funciona no navegador, guarda os dados em IndexedDB e abre em **modo espectador**.

## Estrutura

```
index.html                  página
src/
  main.js                   lógica do arquivo (seções, publicações, editor, leitor)
  modo.js                   modo espectador / modo editor
  acesso.js                 validação da senha do modo editor (só o hash)
  conteudo.js               leitura do conteúdo inicial (arquivo.json)
  styles.css                estilos
public/conteudo/arquivo.json   registros que já aparecem para quem abrir
scripts/trocar-senha.mjs    troca a senha do modo editor
iniciar.bat / tunel.bat     atalhos do Windows (servidor e link público)
```

## Rodar no seu computador

Requisito: [Node.js](https://nodejs.org) 20.19 ou superior (no Windows: `winget install OpenJS.NodeJS.LTS`).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera a pasta dist/ (versão final)
npm run preview    # abre o dist/ para conferir
```

No Windows, o `iniciar.bat` faz o `npm install` (na primeira vez) e sobe o servidor.

## Modo espectador e modo editor

A página **sempre abre em modo espectador**: dá para ler tudo, filtrar e exportar, mas **não** dá para
criar, editar, excluir nem importar. Para editar, clique em **👁 Modo espectador** (topo), digite a senha
e a página passa para **✎ Modo editor**. A liberação vale para a aba atual (F5 mantém); ao fechar a aba
volta ao modo espectador.

A senha **não está escrita no código**: `src/acesso.js` guarda só um hash. Para trocar:

```bash
npm run senha -- 'nova senha'     # PowerShell: use aspas simples
```

> A validação roda no navegador. É uma trava de uso (evita edição ou exclusão acidental, ou por quem não
> tem a senha), não uma proteção contra alguém com conhecimento técnico mexendo no próprio navegador.

## Conteúdo inicial (registros que já aparecem)

Tudo o que estiver em `public/conteudo/arquivo.json` é carregado ao abrir a página. Para atualizá-lo:

1. `npm run dev`, abra `http://localhost:5173`, entre em modo editor e crie/edite as publicações.
2. Clique em **Exportar** (baixa `arquivo_modular_expresso.json`).
3. Renomeie para `arquivo.json` e substitua o de `public/conteudo/`.
4. Faça o commit e o push (veja abaixo). Quem abrir a página (ou atualizar com F5) recebe o conteúdo.

Como o carregamento funciona:

- Itens com o **mesmo id** passam a valer como estão no arquivo; o que o visitante criou por conta própria é mantido.
- Remover uma publicação do arquivo **não** a remove de quem já a recebeu.
- No **seu** computador (`localhost`), o arquivo só carrega se o seu navegador estiver vazio, para nunca
  sobrescrever o que você está editando. A página avisa quando o arquivo difere do seu; para aplicá-lo
  mesmo assim, abra `http://localhost:5173/?forcar=1`.
- O arquivo inicial que acompanha o projeto traz só as cinco seções padrão, sem publicações.

## Mostrar para amigos pelo seu computador

1. Copie `.env.example` para `.env` e troque a senha de acesso (é a senha de quem entra pelo link, diferente
   da senha do modo editor).
2. Abra o `iniciar.bat` e, em outra janela, o `tunel.bat` (precisa do cloudflared:
   `winget install --id Cloudflare.cloudflared`). Ele mostra um link `https://….trycloudflare.com`.
3. Envie o link, o usuário e a senha. Fechando as janelas, o acesso acaba.

Quem entra pelo link precisa do usuário e da senha do `.env`; você, em `localhost`, entra direto.

## Versionar no GitHub

```bash
git init -b main
git add .
git commit -m "Primeira versão do Arquivo Modular"
git remote add origin https://github.com/SEU-USUARIO/star-rail-docs.git
git push -u origin main
```

Atualizações do dia a dia: `git add .`, `git commit -m "o que mudou"`, `git push`.

Cuidados:

- **Repositório público = conteúdo público.** O `arquivo.json` e o hash da senha ficam visíveis para quem
  abrir o repositório. Se os registros não devem ser públicos, crie o repositório como **privado**.
- O arquivo `.env` (senha do link) **não** vai para o GitHub (está no `.gitignore`).
- O JSON exportado pode ficar grande se houver imagens embutidas; o GitHub avisa acima de 50 MB e bloqueia
  acima de 100 MB por arquivo.
