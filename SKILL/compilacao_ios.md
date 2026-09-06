---
name: compilacao-ios
description: Guia definitivo e otimizado para preparar, sincronizar e compilar aplicativos Web (Vite/HTML/JS) em aplicativo nativo iOS (iPhone/iPad) com Capacitor, mesmo desenvolvendo a partir do Windows.
---

# Guia Definitivo: Suporte e Compilação iOS (Capacitor + Vite)

Este guia documenta o fluxo testado e validado para manter, sincronizar e compilar o **ConvertePRO+** para dispositivos Apple (iPhone e iPad).

---

## 1. O que Funciona vs. O que NÃO Funciona

### ✅ O que Funciona (Caminho Correto)
- **Web**: Vite gerando a pasta `dist/` com `npm run build`.
- **Envelopamento Nativo**: `@capacitor/core`, `@capacitor/cli` e `@capacitor/ios` (v8.5+ com Swift Package Manager nativo).
- **Safe Area**: Viewport configurado com `viewport-fit=cover` e variáveis CSS `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` para suporte nativo a Notch e Dynamic Island.
- **Integração com o App Arquivos**: Chaves `UIFileSharingEnabled` e `LSSupportsOpeningDocumentsInPlace` no `Info.plist`, permitindo que os PDFs salvos apareçam na pasta oficial *"No Meu iPhone"*.
- **Build a partir do Windows**: Utilizar **GitHub Actions** com runner `macos-latest` para compilar o projeto na nuvem gratuitamente, ou abrir o projeto no Xcode ao transferir a pasta para um Mac.

### ❌ O que NÃO Funciona (Armadilhas Comuns)
- Tentar rodar `xcodebuild` ou abrir o Xcode diretamente no Windows (é uma limitação do sistema operacional da Apple; compilação local de `.ipa` exige macOS).
- Esquecer o `viewport-fit=cover` na meta tag `viewport` (faz com que o Safari/Webview exiba barras brancas nas laterais e corte a barra de status).
- Omitir as descrições de privacidade no `Info.plist` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) — a Apple rejeita o app e fecha-o imediatamente ao tentar acessar fotos.

---

## 2. Comandos do Dia a Dia (No Windows)

Sempre que fizer alterações no código web (HTML, CSS ou JavaScript), atualize o pacote iOS com um único comando:

```powershell
# No diretório 'app':
npm run build:ios
```

Este comando executa:
1. `vite build`: compila os arquivos web otimizados para `dist/`.
2. `npx cap sync ios`: copia os arquivos web para `ios/App/App/public` e atualiza a configuração de plugins.

---

## 3. Como Compilar para iOS

### Opção A: Usando GitHub Actions (Nuvem / Sem precisar de Mac físico)

Você pode compilar o projeto na nuvem usando as máquinas macOS gratuitas do GitHub Actions.

Crie o arquivo `.github/workflows/build-ios.yml` no seu repositório:

```yaml
name: Build iOS (Capacitor)

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-ios:
    runs-on: macos-14
    steps:
      - name: Checkout do Repositório
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      - name: Instalar Dependências
        working-directory: ./app
        run: npm ci

      - name: Build Web e Sincronização Capacitor
        working-directory: ./app
        run: |
          npm run build
          npx cap sync ios

      - name: Compilar Projeto Xcode (.app / Simulator)
        working-directory: ./app/ios/App
        run: |
          xcodebuild -workspace App.xcworkspace \
                     -scheme App \
                     -configuration Release \
                     -destination 'generic/platform=iOS' \
                     CODE_SIGNING_ALLOWED=NO \
                     build

      - name: Upload Artefato de Build
        uses: actions/upload-artifact@v4
        with:
          name: ConvertePRO-iOS-Build
          path: app/ios/App/build/Release-iphoneos/
```

---

### Opção B: Compilando em um Mac (com Xcode instalado)

Se você tiver um Mac ou acessar um Mac remotamente:

1. Clone ou transfira o projeto para o Mac.
2. No terminal, acesse a pasta `app` e instale as dependências:
   ```bash
   npm install
   npm run build:ios
   ```
3. Abra o projeto no Xcode com o comando nativo do Capacitor:
   ```bash
   npx cap open ios
   ```
4. No Xcode:
   - Selecione o dispositivo (iPhone conectado via USB ou Simulador).
   - Clique no botão **Play / Run** (Cmd + R) para rodar o ConvertePRO+ no iPhone.
   - Para gerar o arquivo instalável para App Store ou TestFlight: Menu **Product > Archive**.

---

## 4. Estrutura de Arquivos Relevantes do iOS

```text
convertePRO+/
├── app/
│   ├── ios/
│   │   └── App/
│   │       ├── App.xcworkspace       <-- Projeto Xcode principal
│   │       └── App/
│   │           ├── Info.plist        <-- Permissões de Câmera, Galeria e App Arquivos
│   │           └── public/           <-- Arquivos web sincronizados do Vite
│   ├── capacitor.config.json         <-- Configurações globais e esquema iOS
│   ├── package.json                  <-- Dependência @capacitor/ios e script build:ios
│   ├── index.html                    <-- Viewport com viewport-fit=cover
│   └── src/
│       └── css/
│           ├── components.css        <-- Safe areas no top-bar, drawer e bottom-nav
│           └── theme.css             <-- Resets de toque e overscroll para WebKit
```
