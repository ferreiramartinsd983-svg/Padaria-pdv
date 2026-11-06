<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ed360589-1b73-4539-a4aa-9b189b24f7ee

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure `GEMINI_API_KEY` em `.env` no servidor (mantenha a chave fora do código e do GitHub)
3. Rode a interface e o serviço da IA:
   `npm run dev:all`


## Assistente de voz com Gemini

O assistente pode preparar anotações, vendas, ajustes de estoque e fichas técnicas. Ações que alteram dados só são gravadas após confirmação na tela. A chave Gemini é lida apenas pelo servidor e não deve ser colocada no APK nem em variáveis Vite.

### Desenvolvimento

1. Defina `GEMINI_API_KEY` em `.env` local (não envie esse arquivo ao GitHub).
2. Rode `npm run dev:all` para abrir a interface e o endpoint local.

### Hospedagem e Android

1. Gere o frontend com `npm run build` e rode o serviço Node com `npm start`.
2. Configure `GEMINI_API_KEY` como segredo do serviço e, para o APK, permita a origem `https://appassets.androidplatform.net` em `ASSISTANT_ALLOWED_ORIGINS`.
3. Na aba **Assistente IA** do APK, informe a URL HTTPS do serviço hospedado. A chave da API fica somente no servidor.

A interpretação por IA requer internet. O reconhecimento do microfone depende do navegador e pode processar o áudio por um serviço externo.
