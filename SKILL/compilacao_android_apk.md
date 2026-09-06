---
name: compilacao-android-apk
description: Guia definitivo e otimizado para empacotar e compilar aplicativos Web (Vite/HTML/JS) em APK Android nativo com Capacitor e Gradle sem depender de Android Studio. Use em qualquer projeto que precise gerar APK de forma rápida, reproduzível e sem erros de JVM/SDK.
---

# Guia Definitivo: Compilação de APK Android (Capacitor + Vite/Web)

Use este fluxo validado para transformar qualquer aplicação web em APK Android instalável com o mínimo de ferramentas e zero desperdício de tempo.

---

## 1. O que Funciona vs. O que NÃO Funciona

### ✅ O que Funciona (Caminho Correto)
- **Web**: Vite (`npm run build` gerando pasta `dist/`).
- **Envelopamento**: Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).
- **SDK Android**: `cmdline-tools` mínimo instalado em `$env:LOCALAPPDATA\Android\Sdk` (dispensa Android Studio de centenas de GBs).
- **Compilação**: `./gradlew assembleDebug` via terminal usando JDK 17+.

### ❌ O que NÃO Funciona (Armadilhas Comuns)
- Rodar `npx cap add android` sem antes ter instalado `@capacitor/android` via npm (falha com erro `Could not find android platform`).
- Incompatibilidade de JVM Target no Capacitor 8: plugins (ex: filesystem) tentam compilar em Java 21, gerando `error: invalid source release: 21` ou `Inconsistent JVM-target compatibility (17 vs 21)` se a máquina tiver JDK 17.
- Caminho do SDK no `local.properties` com contra-barras `\` quebrando a leitura do Gradle no Windows.
- Aceitação manual de licenças travando o processo no PowerShell.

---

## 2. Preparação do Ambiente Android SDK (Uma única vez por máquina)

Se a máquina ainda não tiver o Android SDK configurado:

```powershell
# 1. Definir SDK Root
$SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = $SDK_ROOT
$env:ANDROID_SDK_ROOT = $SDK_ROOT
New-Item -ItemType Directory -Force -Path "$SDK_ROOT\cmdline-tools" | Out-Null

# 2. Baixar e extrair cmdline-tools
$url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$zip = "$env:TEMP\cmdline-tools.zip"
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath "$SDK_ROOT\cmdline-tools" -Force
Rename-Item "$SDK_ROOT\cmdline-tools\cmdline-tools" "$SDK_ROOT\cmdline-tools\latest" -ErrorAction SilentlyContinue

# 3. Aceitar todas as licenças automaticamente
$sdkmanager = "$SDK_ROOT\cmdline-tools\latest\bin\sdkmanager.bat"
$yeses = ("y`n" * 20)
$yeses | & $sdkmanager --licenses

# 4. Instalar ferramentas essenciais de build
& $sdkmanager "platform-tools" "build-tools;34.0.0" "platforms;android-34"
```

---

## 3. Setup do Projeto Web & Capacitor

Na raiz do projeto Web:

```powershell
# 1. Instalar dependências essenciais (SEMPRE incluir @capacitor/android)
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Configurar capacitor.config.json
# Exemplo básico:
# {
#   "appId": "com.exemplo.app",
#   "appName": "NomeDoApp",
#   "webDir": "dist",
#   "server": { "androidScheme": "https" }
# }

# 3. Build Web inicial
npm run build

# 4. Adicionar plataforma Android e sincronizar
npx cap add android
npx cap sync android
```

---

## 4. Correção Obrigatória: Compatibilidade JVM 17 / Kotlin

Para evitar falhas de compilação entre Java e Kotlin no Capacitor, **substitua o bloco `allprojects`** em `android/build.gradle`:

```groovy
allprojects {
    repositories {
        google()
        mavenCentral()
    }
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            project.android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
        project.tasks.matching { it.name.contains("Kotlin") }.configureEach {
            try {
                it.kotlinOptions.jvmTarget = "17"
            } catch (ignored) {}
        }
    }
}
```

E certifique-se de que `android/local.properties` aponta para o SDK com barras normais:
```powershell
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk" -replace '\\','/'
Set-Content -Path "android\local.properties" -Value "sdk.dir=$sdkPath"
```

---

## 5. Compilação do APK

Execute o Gradle Wrapper:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

cd android
.\gradlew.bat assembleDebug
```

O APK gerado e assinado em modo debug estará localizado em:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 6. Checklist Rápido de Verificação

- [ ] `npm run build` executado sem erros gerando `dist/`
- [ ] `npx cap sync android` sincronizado
- [ ] `android/build.gradle` contém o patch de Java 17 / Kotlin JVM Target
- [ ] `android/local.properties` contém o caminho `sdk.dir` formatado com `/`
- [ ] `.\gradlew.bat assembleDebug` finalizado com `BUILD SUCCESSFUL`
