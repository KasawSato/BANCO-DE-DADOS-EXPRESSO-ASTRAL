@echo off
echo Gerando link publico... procure a linha com https://....trycloudflare.com
echo Envie esse link + usuario/senha do arquivo .env aos amigos.
echo Feche esta janela para derrubar o acesso.
echo.
cloudflared tunnel --url http://localhost:5173 --http-host-header localhost:5173
pause
