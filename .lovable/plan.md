

## Plano: Configurar App Nativo com Capacitor

O app nativo vai apontar para o site já publicado, funcionando a partir da tela de autenticação (`/auth`). O site continua funcionando normalmente no navegador.

### O que será feito

1. **Instalar dependências Capacitor**
   - `@capacitor/core` e `@capacitor/cli`

2. **Criar `capacitor.config.ts`**
   - `appId`: `app.lovable.49ba0e0710164b45a06f70056be9b8cc`
   - `appName`: `Discovery Investments`
   - `webDir`: `dist`
   - `server.url`: apontando para o preview do projeto com `?forceHideBadge=true`

### Passos manuais (após implementação)

Para rodar no dispositivo, você precisará:

1. Exportar o projeto para o GitHub (botão "Export to Github")
2. Clonar e rodar `npm install`
3. Adicionar plataformas: `npx cap add ios` e/ou `npx cap add android`
4. `npx cap update ios` ou `npx cap update android`
5. `npm run build`
6. `npx cap sync`
7. `npx cap run android` ou `npx cap run ios` (requer Android Studio ou Xcode)

### Detalhes técnicos

- O Capacitor carrega o site remoto via `server.url`, então qualquer mudança publicada reflete automaticamente no app
- A navegação do app começa em `/auth` — o usuário faz login e acessa o painel normalmente
- Nenhuma mudança no código existente é necessária nesta fase

