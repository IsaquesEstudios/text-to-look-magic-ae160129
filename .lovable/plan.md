

## Atualizar Edge Function `upload-blog-image`

### Problema
O n8n envia imagens como binary data (raw body), mas a edge function atualmente so aceita `multipart/form-data`. Isso causa o erro `Body can not be decoded as form data`.

### Solucao

Modificar `supabase/functions/upload-blog-image/index.ts` para detectar o formato da requisicao e tratar ambos os casos:

1. **Detectar o Content-Type** do request
2. **Se `multipart/form-data`**: manter o fluxo atual (extrair file do formData)
3. **Se binary/octet-stream ou image/***: ler o body como ArrayBuffer diretamente, extrair extensao e content-type dos headers
4. **Aceitar tambem JSON com base64**: para flexibilidade extra, aceitar `{ image: "base64...", filename: "foto.jpg", contentType: "image/png" }`

### Detalhes tecnicos

O fluxo atualizado:

```text
Request recebido
    |
    +-- Content-Type contem "multipart/form-data"?
    |       SIM -> formData.get("file") (fluxo atual)
    |
    +-- Content-Type e "application/json"?
    |       SIM -> parse JSON, decodificar base64
    |
    +-- Outro (binary, image/*, octet-stream)?
            SIM -> req.arrayBuffer() direto
                   usar Content-Type do header como tipo
                   gerar nome com extensao baseada no tipo
```

### Arquivo alterado
- `supabase/functions/upload-blog-image/index.ts` -- reescrever o handler para suportar os 3 formatos

### Validacoes mantidas
- Tipos permitidos: jpeg, png, webp, gif, avif
- Tamanho maximo: 5MB
- Upload para bucket `blog-images` no path `posts/`

