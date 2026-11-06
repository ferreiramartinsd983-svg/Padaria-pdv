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

## APK Android

O fluxo do GitHub Actions compila a interface web e gera o APK de depuração.
