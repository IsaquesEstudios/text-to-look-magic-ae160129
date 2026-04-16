

## Plano: Configurar build iOS com credenciais da Apple

### O que será feito

1. **Atualizar `capacitor.config.ts`** — trocar o `appId` de `app.lovable.discoveryinvestments` para `com.discovery.investments`

2. **Atualizar `codemagic.yaml`** — alinhar o `BUNDLE_ID` para `com.discovery.investments` e configurar o fluxo para usar a API Key do App Store Connect (ao invés de certificados manuais)

3. **Guia de configuração no Codemagic** — após as mudanças no código, você vai precisar adicionar no painel do Codemagic:
   - `APP_STORE_CONNECT_KEY_IDENTIFIER` = `NCUZ65B2W3`
   - `APP_STORE_CONNECT_ISSUER_ID` = `62d0cec2-715a-40c6-945c-3bc58e61d77f`
   - `APP_STORE_CONNECT_PRIVATE_KEY` = conteúdo do arquivo .p8

### Detalhes técnicos

```text
Arquivos alterados:
1. capacitor.config.ts
   - appId: "app.lovable.discoveryinvestments" → "com.discovery.investments"

2. codemagic.yaml
   - BUNDLE_ID: "app.lovable.49ba0e0710164b45a06f70056be9b8cc" → "com.discovery.investments"
   - Adicionar integração com App Store Connect API
   - Atualizar script de code signing para usar API key
```

