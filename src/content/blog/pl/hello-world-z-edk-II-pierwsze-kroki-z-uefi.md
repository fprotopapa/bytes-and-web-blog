---
title: "Hello World z EDK II - Pierwsze kroki z UEFI"
description: "Naucz się budować aplikacje UEFI z EDK II. Praktyczny tutorial Hello World z QEMU."
pubDate: 2026-01-16
author: pl/fabbio-protopapa
tags: ["edk2", "uefi", "firmware", "qemu"]
category: "UEFI"
draft: false
canonicalUrl: "https://tuxownia.pl/blog/hello-world-z-edk-ii-pierwsze-kroki-z-uefi"
externalSource: "tuxownia.pl"
isExternal: true
translationId: "edk2-hello-world"
---
UEFI (Unified Extensible Firmware Interface) zastąpiło stary BIOS i stało się standardem firmware w dzisiejszych komputerach. 

Ale jak stworzyć własną aplikację UEFI? 😃

Zaczynajmy!

## Czym jest EDK II?

EDK II (EFI Development Kit II) to oficjalna implementacja referencyjna UEFI od projektu TianoCore. Jest to open source'owy projekt, w którym główną rolę odgrywają Intel, HP i Microsoft. EDK II dostarcza kompletne środowisko do tworzenia firmware UEFI - od prostych aplikacji po złożone bootloadery i sterowniki.

EDK II stał się de facto standardem do rozwoju firmware UEFI - jeśli chcesz tworzyć oprogramowanie na poziomie firmware, to właśnie od tego powinieneś zacząć.

**Komponenty EDK II:**
- **BaseTools** - narzędzia do budowania (kompilator, linker)
- **MdeModulePkg** - podstawowe moduły i przykłady (w tym HelloWorld)
- **OvmfPkg** - Open Virtual Machine Firmware dla QEMU
- **UEFI Shell** - powłoka do testowania aplikacji

## Moje środowisko

Buduję na systemie x86_64 i używam Fedora 43.

## Pobieranie EDK II i przygotowanie środowiska

Mamy kilka opcji, jak korzystać z EDK II. Tutaj użyjemy kontenera przygotowanego przez TianoCore.

- https://github.com/tianocore/tianocore.github.io/wiki/How-to-Develop-With-Containers

```bash
docker pull ghcr.io/tianocore/containers/ubuntu-22-dev:34f8c50

docker run -it \
       -v "${HOME}":"${HOME}" -e EDK2_DOCKER_USER_HOME="${HOME}" \
       ghcr.io/tianocore/containers/ubuntu-22-dev:34f8c50 /bin/bash
```
W kontenerze pobierzemy projekt i przygotujemy sobie środowisko do pracy. Musisz uruchamiać `. ./edksetup.sh` w każdym nowym terminalu! Skrypt ustawia zmienne środowiskowe i dodaje narzędzia do `PATH`.

```bash
cd ${HOME}/path/to/project

git clone https://github.com/tianocore/edk2

cd edk2
git checkout edk2-stable202511
git submodule update --init

make -C BaseTools
. edksetup.sh
```

Najpierw zbudujemy OVMF. Będziemy ją potrzebować do uruchomienia naszej aplikacji UEFI w QEMU. 
OVMF (Open Virtual Machine Firmware) to implementacja UEFI specjalnie dla QEMU. Pozwala testować aplikacje i firmware UEFI bez potrzeby prawdziwego sprzętu. 
Alternatywnie możemy pobrać `ovmf` przez menadżera paczek na hoście. Praktycznie wszystkie dystrybucje Linuxowe udostępniają tę paczkę (`ovmf` lub `edk2-ovmf`). 

Możemy budować za pomocą komendy `build` lub `stuart_*`. `stuart` jest wyższej poziomową komendą i polecany do budowy platform i puszczania testów. Warto wspomnieć, że kod na inne platformy jest przechowywany oddzielnie [(edk2-platforms)](https://github.com/tianocore/edk2-platforms). Jedynie wirtualne platformy są w repozytorium `edk2`.

- https://github.com/tianocore/tianocore.github.io/wiki/How-to-Build-With-Stuart

```bash
$ stuart_setup -c OvmfPkg/PlatformCI/PlatformBuild.py TOOL_CHAIN_TAG=GCC5
SECTION - Init Self Describing Environment
SECTION - Loading Plugins
SECTION - Start Invocable Tool
PROGRESS - ## Resolving Git Submodule: CryptoPkg/Library/OpensslLib/openssl
PROGRESS - ## Done.
...
SECTION - Summary
PROGRESS - Success

$ stuart_update -c OvmfPkg/PlatformCI/PlatformBuild.py TOOL_CHAIN_TAG=GCC5
SECTION - Init Self Describing Environment
SECTION - Loading Plugins
SECTION - Start Invocable Tool
SECTION - Initial update of environment
Updating.. Done
SECTION -       Updated/Verified 2 dependencies
SECTION - Second pass update of environment
Updating. Done
SECTION -       Updated/Verified 2 dependencies
SECTION - Summary
PROGRESS - Success

$ stuart_build -c OvmfPkg/PlatformCI/PlatformBuild.py TOOL_CHAIN_TAG=GCC5
...
INFO - ------------------------------------------------
INFO - --------------Cmd Output Finished---------------
INFO - --------- Running Time (mm:ss): 04:13 ----------
INFO - ----------- Return Code: 0x00000000 ------------
INFO - ------------------------------------------------
PROGRESS - Running Post Build
INFO - Writing BuildToolsReports to /home/fabbio/devel/uefi/hello_world/edk2/Build/OvmfX64/DEBUG_GCC5/BUILD_TOOLS_REPORT
DEBUG - Plugin Success: Build Tools Report Generator
DEBUG - Plugin Success: Debug Macro Check Plugin
DEBUG - Plugin Success: Linux GCC Tool Chain Support
PROGRESS - End time: 2026-01-17 18:38:22.612291  Total time Elapsed: 0:04:13
SECTION - Log file is located at: /home/fabbio/devel/uefi/hello_world/edk2/Build/BUILDLOG_OvmfPkg.txt
SECTION - Summary
PROGRESS - Success
```

Plik będzie dostępny pod `Build/OvmfX64/DEBUG_GCC5/FV/OVMF.fd`.

Następnie przygotujemy aplikację UEFI.

Do tego edytujemy plik `MdeModulePkg/Application/HelloWorld/HelloWorld.c` i wprowadzamy trzy zmiany.

```diff
diff --git a/MdeModulePkg/Application/HelloWorld/HelloWorld.c b/MdeModulePkg/Application/HelloWorld/HelloWorld.c
index ab581c040c..fdb5121f00 100644
--- a/MdeModulePkg/Application/HelloWorld/HelloWorld.c
+++ b/MdeModulePkg/Application/HelloWorld/HelloWorld.c
@@ -10,6 +10,7 @@
 #include <Uefi.h>
 #include <Library/PcdLib.h>
 #include <Library/UefiLib.h>
+#include <Library/UefiBootServicesTableLib.h>
 #include <Library/UefiApplicationEntryPoint.h>
 
 //
@@ -43,7 +44,7 @@ UefiMain (
   UINT32  Index;
 
   Index = 0;
-
+  Print(L"My custom UEFI message!\n");
   //
   // Three PCD type (FeatureFlag, UINT32 and String) are used as the sample.
   //
@@ -55,6 +56,7 @@ UefiMain (
       Print ((CHAR16 *)PcdGetPtr (PcdHelloWorldPrintString));
     }
   }
+  gBS->Stall(5000000); // 5s
 
   return EFI_SUCCESS;
 } 
```

**Wyjaśnienie:**
- **UefiMain**: to entry point aplikacji UEFI (odpowiednik `main()` w standardowym C)
- **Print()**: funkcja do wyświetlania tekstu (prefiks `L""` oznacza wide string)
- **EFI_SUCCESS**: kod zwrotny oznaczający sukces w UEFI
- **ImageHandle** i **SystemTable**: parametry przekazywane przez UEFI do każdej aplikacji



Aby skompilować jedną paczkę z modułu `MdeModulePkg`, nie możemy wykorzystać komendy `stuart`. Tutaj zastosujemy `build`.

```bash
$ build -a X64 -t GCC5 \
  -p MdeModulePkg/MdeModulePkg.dsc \
  -m MdeModulePkg/Application/HelloWorld/HelloWorld.inf
...
- Done -
Build end time: 18:39:38, Jan.17 2026
Build total time: 00:00:11
```

Plik `efi` będzie pod `Build/MdeModule/DEBUG_GCC5/X64/HelloWorld.efi`.

Teraz przejdziemy na hosta i przygotujemy system plików. UEFI szuka domyślnego bootloadera w ścieżce `EFI/BOOT/BOOTX64.EFI` (dla architektury x64). Kopiujemy naszą aplikację pod tą nazwą, żeby UEFI automatycznie ją uruchomiło przy starcie.
Aby nie tworzyć i formatować partycje FAT32, użyjemy funkcjonalności Qemu, żeby emulować partycje.

```bash
cd ${HOME}/<path/to/project>/edk2
mkdir -p /tmp/efi-boot/EFI/BOOT

# Copy your EFI app as the default boot application
cp Build/MdeModule/DEBUG_GCC5/X64/HelloWorld.efi \
   /tmp/efi-boot/EFI/BOOT/BOOTX64.EFI
```

Jeśli nie mamy zainstalowanego QEMU, to możemy pobrać paczkę `qemu-system-x86` lub podobną. Podajemy ścieżkę do pliku `OVMF.fd`, własnoręcznie zbudowanego lub zainstalowanego 😃, i do systemu plików. Plik `OVMF.fd` z menadżera paczek znajdziemy pod `/usr/share/edk2/ovmf/` lub `/usr/share/OVMF/`.

```
qemu-system-x86_64 \
  -bios Build/OvmfX64/DEBUG_GCC5/FV/OVMF.fd \
  -drive file=fat:rw:/tmp/efi-boot,format=raw \
  -net none 
```

Jeśli wszystko się udało, to zobaczymy naszą wiadomość, podobnie jak na zdjęciu.

![Screen startowy UEFI skompilowanego z projektu tianocore-edk2](/images/imported/posts/edk2-hello-world-pierwsze-kroki-z-uefi/screen-uefi.webp)

## Alternatywnie: Ręczne uruchomienie przez UEFI Shell

Możesz też uruchomić UEFI Shell (wybierz `EFI Internal Shell`) i załadować aplikację ręcznie:

```bash
# W QEMU, w UEFI Shell:
Shell> fs0:
FS0:\> ls
...
FS0:\> EFI\BOOT\BOOTX64.EFI
My custom UEFI message!
...
```

## Podsumowanie

W tym artykule zbudowaliśmy pierwszą aplikację UEFI z EDK II! 😎

Najważniejsze punkty:
- EDK II to oficjalny development kit dla UEFI od TianoCore
- OVMF pozwala testować aplikacje UEFI w QEMU bez prawdziwego sprzętu
- Aplikacja Hello World pokazuje podstawową strukturę programu UEFI
- UEFI szuka domyślnego bootloadera w ścieżce EFI/BOOT/BOOTX64.EFI

Teraz znasz podstawy rozwoju firmware UEFI. 

Mam nadzieję, że się podobało. Dzięki za przeczytanie!
