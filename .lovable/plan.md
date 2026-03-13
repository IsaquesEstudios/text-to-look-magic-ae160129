

# PWA exclusivo para iPhone (sem afetar site desktop ou app Android)

## Conceito

Sim, é totalmente possível. A ideia é registrar o Service Worker e exibir o prompt de instalação **apenas quando o dispositivo for um iPhone/iPad acessando via Safari**, sem afetar nada no site desktop nem no app Android nativo (Capacitor).

## Como funciona

1. **Detecção de plataforma** — Verificamos se é iOS Safari (não Capacitor nativo) antes de ativar qualquer comportamento PWA.

2. **Arquivos necessários:**
   - `public/manifest.json` — Manifesto PWA com ícones, cores, nome do app
   - `public/sw.js` — Service Worker simples para cache offline
   - Metatags Apple no `index.html` (apple-mobile-web-app-capable, apple-touch-icon, etc.)
   - Componente `InstallPWABanner` — Banner "Adicionar à Tela Inicial" que aparece **só no iOS Safari**

3. **Registro condicional do Service Worker:**
   ```
   // Só registra no iOS Safari (não no Capacitor nativo)
   const isIOS = /iPhone|iPad/.test(navigator.userAgent)
   const isCapacitor = window.Capacitor?.isNativePlatform()
   const isStandalone = window.navigator.standalone
   
   if (isIOS && !isCapacitor && !isStandalone) {
     navigator.serviceWorker.register('/sw.js')
     // Mostrar banner de instalação
   }
   ```

4. **Zero impacto no site/Android:**
   - Desktop: Service Worker nunca registrado, banner nunca aparece
   - Android nativo (Capacitor): Detectado e ignorado
   - iPhone Safari: PWA ativado com banner de instrução

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `public/manifest.json` | Criar — manifesto PWA |
| `public/sw.js` | Criar — Service Worker básico (cache offline) |
| `index.html` | Editar — adicionar metatags Apple + link manifest |
| `src/components/InstallPWABanner.tsx` | Criar — banner iOS-only "Adicionar à Tela Inicial" |
| `src/App.tsx` | Editar — importar banner + registro condicional do SW |

## Resultado

- Usuários de iPhone no Safari verão um banner elegante explicando como instalar o app
- O app funcionará em tela cheia com ícone próprio, splash screen e suporte offline
- Nenhuma mudança visível no desktop ou no app Android

