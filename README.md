# Padaria Master

Sistema de gestão de padaria com PDV, estoque, pedidos, caixa e tarefas.

## Rodar localmente

Requisitos: Node.js.

1. Instale as dependências: `npm install`
2. Inicie a interface: `npm run dev`
3. Para servir a versão compilada, use `npm run build` e depois `npm start`.

## Assistente local

O assistente funciona localmente, sem conexão com serviços de IA. Ele salva tarefas neste aparelho e oferece comandos simples:

- `criar tarefa: conferir validade amanhã`
- `listar tarefas`, `concluir tarefa 1`, `apagar tarefa 1`
- `vender 2 pão francês no Pix`
- `saída 1 bolo, motivo: avariado`

Vendas e saídas de estoque exigem confirmação antes de serem registradas. As vendas pelo assistente exigem o caixa aberto.

## Versão para computador

A versão para PC abre o mesmo sistema em uma janela própria e salva os dados localmente no perfil do aplicativo. Para gerar o instalador, tenha Node.js instalado, abra um terminal nesta pasta e execute:

1. Instale as dependências: `npm install`
2. Gere o instalador do sistema operacional atual: `npm run desktop:dist`
3. Abra o arquivo gerado na pasta `release` e conclua a instalação.

O Electron Builder gera instalador NSIS para Windows, DMG para macOS e AppImage/DEB para Linux. Gere cada instalador no sistema operacional correspondente. Faça exportações de backup dentro do app antes de trocar de computador; os dados locais não são transferidos automaticamente.

## APK Android

O fluxo do GitHub Actions compila a interface web e gera o APK de depuração.

## Compartilhar dados entre celulares

Na aba **Sincronização**, use um celular Android como servidor local e informe o mesmo código de grupo nos demais aparelhos. A sincronização automática ocorre a cada 20 segundos enquanto a aba estiver aberta. O código dá acesso aos dados do grupo; compartilhe-o somente com pessoas autorizadas.

## Usar um celular como servidor

No celular principal, abra **Sincronização** e toque em **Usar este celular como servidor**. O app inicia uma API local na porta 8787 e grava os grupos no armazenamento privado desse celular. Deixe o app aberto e conectado à rede Wi-Fi. Nos outros celulares, conectados à mesma rede, informe o endereço local mostrado no campo de servidor e use o mesmo código de grupo.

Se o roteador bloquear a comunicação entre aparelhos, ative a comunicação local nas configurações do Wi-Fi ou use uma rede que permita tráfego entre clientes. O servidor local fica disponível enquanto o processo do app estiver ativo.
