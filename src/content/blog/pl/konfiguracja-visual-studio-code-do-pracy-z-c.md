---
title: "Konfiguracja Visual Studio Code do pracy z C"
description: Przejdziemy przez proces instalacji Visual Studio Code oraz niezbędnych narzedzi do pracy z C na platfomach Windows, Linux i MacOS
pubDate: 2025-11-25
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["vs-code"]
category: "environment-setup"
draft: false
---

Visual Studio Code (VS Code) to jeden z najpopularniejszych edytorów kodu – lekki, rozbudowany i wyposażony w ogromną liczbę rozszerzeń, które czynią z niego wygodne środowisko programistyczne. W tym wpisie pokażę, jak przygotować go do pracy z językiem C na trzech systemach: Windows, Linux i macOS.

## Instalacja Visual Studio Code

### Windows

1. Pobieramy instalator dla Windows z [code.visualstudio.com/download](https://code.visualstudio.com/download).
2. Uruchamiamy instalator, podczas instalacji warto zaznaczyć opcję "Add to PATH" - ustawia to prace z terminalem.
3. Przechodzimy przez pozostały proces instalacji i gotowe!

### Linux

1. Pobieramy paczkę .deb z [code.visualstudio.com/download](https://code.visualstudio.com/download).
2. Uruchamiamy terminal, przechodzimy do folderu z pobrana paczka i uruchamiamy komendę: 
```
sudo apt install ./<pobrany_plik>.deb
```
3. Jeśli chcemy możemy dodatkowo włączyć automatyczne aktualizacje: 
```
echo "code code/add-microsoft-repo boolean true" | sudo debconf-set-selections
```

### MacOS

1. Pobieramy instalator dla MacOS z [code.visualstudio.com/download](https://code.visualstudio.com/download).
2. Rozpakowujemy pobraną paczkę i przenosimy `Visual Studio Code.app` do folderu _Applications_.
3. Gotowe można teraz uruchomić VS code z folderu _Applications_.

## Instalacja kompilatora C

### Windows

1. Pobieramy MSYS2 z [msys2.org/](https://www.msys2.org/). MSYS emuluje środowisko POSIX w Windows, dzięki czemu zapewnia kompatybilność z narzędziami Unixowymi w tym GCC, zawierającym kompilator C.
2. Uruchamiamy instalator i przechodzimy przez proces instalacji.
3. Po zainstalowaniu uruchomi się terminal w którym uruchamiamy:
```
pacman -S --needed base-devel mingw-w64-ucrt-x86_64-toolchain
```
Zatwierdzamy instalacje `Y`.
4. Ostanim krokiem jest dodanie ścieżki gdzie został zainstalowany MSYS do PATH, domyślna ścieżka:
```
C:\msys64\ucrt64\bin
```

### Linux

Wystarczy uruchomić dwie poniższe komendy:
```
sudo apt update
sudo apt install build-essential
```

### MacOS

Uruchamiamy komendę:
```
xcode-select --install
```

## Konfiguracja VS code i pierwsza kompilacja

Po pierwszym uruchomieniu Visual Studio Code musimy jeszcze je skonfigurowac do pracy z C.
W tym celu przechodzimy do zakładki _Extensions_ i wyszukujemy wtyczki `C/C++` od Microsoft i ją instalujemy. 
Teraz warto sprawdzić czy cały proces się udał, żeby to zrobić tworzymy nowy plik `hello.c` i wklejamy do niego poniższy kod:
```
#include <stdio.h>

int main() {
    printf("Hello world!\n");
    return 0;
}
```
Po zapisaniu pliku klikamy na przycisk w ikonkę play z robaczkiem i z listy wybieramy `Run C/C++ file`, rozwinie się kolejna lista z kompilatorami dostępnymi w naszym systemie. Wybieramy _GCC_ i w tym momencie rozpoczęła się kompilacja, po przejsciu do zakładki terminala widoczny jest rezultat działania programu: 
```
Hello world!
```

Gotowe! Zainstowalismy Visual Studio Code, kompilator do języka C i skompilowaliśmy program.