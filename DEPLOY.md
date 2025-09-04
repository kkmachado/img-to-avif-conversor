# Deploy no Easypanel

Este guia mostra como fazer o deploy da aplicação Conversor AVIF no Easypanel.

## Pré-requisitos

1. Conta no Easypanel
2. Workflow n8n configurado para conversão de imagens
3. Repositório Git com o código da aplicação

## Passos para Deploy

### 1. Configurar o Repositório

Certifique-se de que seu código está em um repositório Git (GitHub, GitLab, etc.).

### 2. Criar Aplicação no Easypanel

1. Acesse seu painel Easypanel
2. Clique em "Create Application"
3. Selecione "Node.js" como template
4. Configure os seguintes parâmetros:

#### Configurações Básicas
- **Name**: `conversor-avif`
- **Repository**: URL do seu repositório Git
- **Branch**: `main` (ou sua branch principal)
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run preview`
- **Internal Service Port**: `4173`
- **Protocol**: `HTTP`

#### Variáveis de Ambiente
Não são necessárias variáveis de ambiente específicas para esta aplicação, pois a URL do webhook é configurada pelo usuário na interface.

#### Port Configuration
- **Port**: `4173` (porta padrão do Vite preview)

### 3. Configurar Build

No arquivo `package.json`, certifique-se de que os scripts estão configurados:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0 --port 4173"
  }
}
```

### 4. Dockerfile (Opcional)

Se preferir usar Docker, crie um `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview"]
```

### 5. Configurações do n8n

O workflow n8n deve:

1. **Receber webhook POST** com arquivos de imagem
2. **Processar imagens** - converter para AVIF
3. **Retornar JSON** no formato:
```json
{
  "convertedFiles": [
    {
      "originalName": "image.jpg",
      "downloadUrl": "https://url-do-arquivo-convertido.avif"
    }
  ]
}
```

### 6. Deploy

1. No Easypanel, clique em "Deploy"
2. Aguarde o build e deploy completarem
3. Acesse a URL fornecida pelo Easypanel

### 7. Configurar Webhook

Após o deploy:

1. Configure seu workflow n8n
2. Copie a URL do webhook n8n
3. Acesse sua aplicação
4. Cole a URL na seção "Configuração do Webhook"
5. Salve a configuração

## Exemplo de Workflow n8n

### Nodes necessários:

1. **Webhook Trigger**
   - Method: POST
   - Path: `/convert-images`
   - Response Mode: "Respond to Webhook"

2. **Function Node** (processar arquivos)
```javascript
// Processar arquivos recebidos
const files = $input.all()[0].binary;
const convertedFiles = [];

for (const [key, file] of Object.entries(files)) {
  // Aqui você faria a conversão real para AVIF
  // Este é um exemplo simplificado
  convertedFiles.push({
    originalName: file.fileName,
    downloadUrl: `https://seu-storage.com/${file.fileName.replace(/\.(jpg|png)$/i, '.avif')}`
  });
}

return [{ json: { convertedFiles } }];
```

3. **Respond to Webhook Node**
   - Response Body: `{{ $json }}`

## Troubleshooting

### Build Errors
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` e `npm run build` localmente primeiro

### CORS Issues
- Configure seu n8n para aceitar requests de sua aplicação
- Adicione headers CORS apropriados no workflow

### File Upload Issues
- Verifique se o n8n está configurado para receber multipart/form-data
- Teste o webhook diretamente antes de integrar

## Monitoramento

- Use os logs do Easypanel para debug
- Configure monitoring no n8n para acompanhar conversões
- Monitore uso de storage para arquivos convertidos

## Segurança

- Configure rate limiting no n8n se necessário
- Implemente validação de tipos de arquivo no n8n
- Configure limites de tamanho de arquivo apropriados