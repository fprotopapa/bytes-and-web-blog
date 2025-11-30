---
title: "Emulacja urządzeń embedded Linux — Część 1: Docker i Buildx"
description: "W tej serii będziemy analizować różne sposoby uruchamiania, budowania, i debugowania aplikacji embedded bez dostępu do fizycznego sprzętu."
pubDate: 2025-11-30
author: pl/fabbio-protopapa
tags: ["arm64", "docker", "qemu", "kompilacja skrośna", "dewelopment"]
category: "narzędzia deweloperskie"
draft: false
canonicalUrl: "https://tuxownia.pl/blog/emulacja-urzadzen-embedded-linux-czesc_1_docker_i_buildx/"
externalSource: "tuxownia.pl"
isExternal: true
originalAuthor: "Fabbio Protopapa"
---

Jeśli  pracowałeś nad oprogramowaniem dla urządzeń wbudowanych to znasz ten ból: sprzęt stoi trzy biurka dalej poplątany kablami… albo trzy kontynenty dalej u klienta. A Ty wciąż musisz kompilować, testować, i debugować. Fajnie, prawda?

W tej serii artykułów spróbujemy ugryźć ten temat. Będziemy sprawdzać różne metody emulowania środowisk embedded Linux na typowym komputerze deweloperskim (jeszcze raczej x86-64, ale na ten temat później). Sprawdzimy rozwiązania takie jak Docker i QEMU, i jak się spiszą  przy debugowaniu, testowaniu, przy użyciu własnych rootfs-ach, no i do zastosowań CI/CD.

W tym wpisie omówimy Dockera, i skupimy się na ustawieniach i uruchomienia aplikacji.

# **Docker: najprostszy punkt startowy**

## Szybkie przypomnienie: czym właściwie jest Docker?

Docker pozwala pakować aplikacje oraz ich zależności w lekkie kontenery korzystające z jądra hosta. Nie ma tu wirtualizacji systemu, nie ma hiperwizora ani innych zabaw. Kontener to dla hosta jest proces (albo grupa procesów), wykorzystuje funkcjonalności jądra linuxowego takich jak namespace-y i cgroups [(dla ciekawych)](https://cloudhandbook.substack.com/p/how-containers-work-deep-dive-into).

W praktyce oznacza to, że kontener zbudowany dla ARMa nie zadziała na innej architekturze.

Dobra, no to możemy kończyć tutaj :). Chwilka, chwilka, mamy takie cudo jak buildx, ale później więcej o tym.

Najpierw zainstalujmy Dockera.

## Instalacja Dockera na Ubuntu 24.04
Instalacja raczej nie powinna być problematyczna, i jest dobrze opisana w oficjalnej dokumentacji [(dokumentacja)](https://docs.docker.com/engine/install/ubuntu/).

```bash
# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```

Jak się przyjrzymy to rozpoznamy tutaj powyżej wymieniony buildx. 

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Aby przetestować instalacje możemy użyć komendę:

```bash
$ docker run --rm hello-world
```

## Budujemy własny kontener

Napiszmy malutki program w C, na którym będziemy pracować:

```c
// hello.c
#include <stdio.h>

int main(void)
{
    #if defined(__x86_64__)
        printf("Hello from x86_64!\n");
    #elif defined(__aarch64__)
        printf("Hello from ARM64 (aarch64)!\n");
    #else
        printf("Hello from unknown architecture!\n");
    #endif

    return 0;
}
```

Stwórzmy prosty Dockerfile:

```dockerfile
FROM gcc:12

WORKDIR /usr/src/app

COPY hello.c .

# Compile the program with debug symbols and w/o optimization
RUN gcc -O0 -g -o hello hello.c

CMD ["./hello"]
```

I mamy to:

```bash
$ docker build -t hello-native . 
$ docker run --rm hello-native
Hello from x86_64!
```

I teraz najważniejsze pytanie, dlaczego bawimy się w to skoro chcieliśmy uruchomić aplikacje na architekturę ARM64?

I słusznie. Często nie potrzebujemy ani sprzętu, ani docelowego jądra, lub tej samej architektury systemu. Warstwa abstrakcji systemu operacyjnego pozwoli nam mimo wszystko uruchomić aplikacje. To znaczy że naszą aplikację, którą chcemy w prosty sposób rozwijać lub testować, możemy zapakować w kontener natywny do systemu naszego hosta. 

Oczywiście są sytuacje w których nie możemy zastosować powyższego rozwiązania, np. jeśli nasze oprogramowanie jest zależne od własnego sterownika kernela, lub nie wspiera architektury systemu hosta. Albo inne dziwności, które nie są tak rzadkie przy systemach wbudowanych :).

Czyli, natywny Docker świetnie się sprawdzi, jeśli chcemy:

- izolacje środowiska (np. nie instalujemy narzędzia do budowania na naszym hostu),
- szybkich iteracji przy rozwoju,
- testów logiki aplikacji.

Ale co jeśli nie chcemy utrzymywać dodatkowej architektury dla aplikacji której na dobrą sprawę nie potrzebujemy? I tu w grze pojawia się buildx.
## **Buildx: Kontener "with extra steps"**

Docker Buildx rozszerza standardowy builder o wsparcie multi-arch. W środku wykorzystuje **QEMU user-mode**, który przekłada wywołania systemowe z jednej architektury na drugą. Dzięki temu można „uruchamiać” binarkę skompilowaną na np. ARM64 na maszynie mającą x86. I to bez emulacji całego komputera. 

Buildx powinien być już dostępny dla nas, jak mamy w miarę nową instalację dockera. Jeśli nie, to można doinstalować buildx'a jak pokazano powyżej w sekcji instalacja. Sprawdźmy czy mamy buildx:

```
$ docker buildx version
github.com/docker/buildx v0.26.1 1a8287f
```

Nie jest polecane użycie domyślnego buildera, więc tworzymy nowego i włączamy go.

```
$ docker buildx create --name multiarch-builder --use
multiarch-builder

$ docker buildx inspect --bootstrap
[+] Building 8.3s (1/1) FINISHED                                                
 => [internal] booting buildkit                                            8.3s
 => => pulling image moby/buildkit:buildx-stable-1                         7.3s
 => => creating container buildx_buildkit_arch64-builder0                  0.9s
Name:          multiarch-builder
Driver:        docker-container
Last Activity: 2025-11-28 20:33:57 +0000 UTC

Nodes:
Name:                  multiarch-builder0
Endpoint:              unix:///var/run/docker.sock
Status:                running
BuildKit daemon flags: --allow-insecure-entitlement=network.host
BuildKit version:      v0.26.2
Platforms:             linux/amd64, linux/amd64/v2, linux/amd64/v3, linux/386
```

Przy braku innych architektur możemy użyć poniżą komendę. Ona instaluje emulatora cross-platform który jest zapakowany w kontener [(binfmt)](https://hub.docker.com/r/tonistiigi/binfmt). 

```
$ docker run --privileged --rm tonistiigi/binfmt --install all
Unable to find image 'tonistiigi/binfmt:latest' locally
latest: Pulling from tonistiigi/binfmt
f4700b809f99: Pull complete 
2adec5d296ac: Pull complete 
Digest: sha256:30cc9a4d03765acac9be2ed0afc23af1ad018aed2c28ea4be8c2eb9afe03fbd1
Status: Downloaded newer image for tonistiigi/binfmt:latest
installing: arm64 OK
installing: s390x OK
installing: ppc64le OK
installing: mips64le OK
installing: mips64 OK
installing: loong64 OK
installing: riscv64 OK
installing: arm OK
{
  "supported": [
    "linux/amd64",
    "linux/amd64/v2",
    "linux/amd64/v3",
    "linux/arm64",
    "linux/riscv64",
    "linux/ppc64le",
    "linux/s390x",
    "linux/386",
    "linux/mips64le",
    "linux/mips64",
    "linux/loong64",
    "linux/arm/v7",
    "linux/arm/v6"
  ],
  "emulators": [
    "llvm-18-runtime.binfmt",
    "python3.12",
    "qemu-aarch64",
    "qemu-arm",
    "qemu-loongarch64",
    "qemu-mips64",
    "qemu-mips64el",
    "qemu-ppc64le",
    "qemu-riscv64",
    "qemu-s390x"
  ]
}

$ docker buildx inspect --bootstrap 
...
Platforms:             linux/amd64, linux/amd64/v2, linux/amd64/v3, linux/386, linux/arm64, linux/riscv64, linux/ppc64le, linux/s390x, linux/mips64le, linux/mips64, linux/loong64, linux/arm/v7, linux/arm/v6
...
```


## Przebudujemy nasz przykład na ARM64

Dockerfile i plik aplikacji zostaje taki sam. Jedynie komenda budowania i starowania kontenera się zmienia. Wszystko inne docker załatwia za nas.

```bash
docker buildx build \
	--platform linux/arm64 \
	-t hello-simple:arm64 \
	--load .
```

Jak chcemy zbudować kontener na różne architektury w jednej komendzie, to jest to możliwe. Ale musimy w takim przypadku wykonać od razu push na rejestr kontenerów (lub export w archiw tar). Silnik dockera nie rozumie manifestu multi-arch, dlatego możemy załadować bezpośrednio  tylko pojedynczy obraz kontenera. 


```bash
$ docker run --platform linux/arm64 --rm hello-simple:arm64
Hello from ARM64 (aarch64)!
```

No i sukces :).

Co się wydarzyło:
- skompilowaliśmy binarkę ARM64,
- obraz gcc wspiera multi-arch, dlatego został pobrany prawidłowy obraz
- uruchomiliśmy kontener na x86,
- QEMU user-mode tłumaczył instrukcje „w locie”.

Jak to tak fajnie działa, to możemy tylko stosować takie rozwiązanie i mamy sprawę załatwioną! Tylko że ta sytuacja nie jest aż tak prosta. Poza problemami wymienionych dla normalnego dockera, builx ma też swoje specyficzne wady.

Kompilacja oprogramowania przez emulacje jest wolna. Przy takim małym przykładzie to nie jest odczuwalne, ale jak mamy rozbudowany projekt - to może to stanowić problem. Oficjalna [dokumentacja](https://docs.docker.com/build/building/multi-platform/) wspomina, że może być sporo wolniej (w różnych wątkach użytkownicy piszą o skali 4-10 razy wolnej). Są możliwości optymalizacji, jak używanie natywnego węzła (node), lub buforowanie wyników, albo cross-kompilacja (czemu się później przyjrzymy).

Także nie typowe syscall'e mogą nie działać. To będzie temat na następny wpis.

### Przyspieszenie buildów: cross-kompilacja

Musimy zmienić Dockerfile, i zbudować kontener w dwóch krokach. W pierwszym kompilujemy aplikacje w zależności od platformy budowania. A w drugim kopiujemy binarkę do docelowego obrazu, który wspiera też architekturę ARM64. 

```
FROM --platform=$BUILDPLATFORM gcc:12 AS builder

ARG TARGETPLATFORM

WORKDIR /usr/src/app

COPY hello.c .

RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
	apt-get update && apt-get install -y gcc-aarch64-linux-gnu && \
	aarch64-linux-gnu-gcc -O0 -g hello.c -o hello; \
	else \
	gcc -O0 -g hello.c -o hello; \
	fi

FROM debian:stable-slim

WORKDIR /usr/bin

COPY --from=builder /usr/src/app/hello hello

CMD ["./hello"]
```

Teraz możemy budować dla amd64:
```
docker buildx build \
	  --platform linux/amd64 \
	  -t hello:amd64 \
	  --load \
	  .
```

I dla ARMa:

```
docker buildx build \
	--platform linux/arm64 \
	-t hello:arm64 \
	--load \
	.
```

I ostatni test:

```
$ docker run --rm hello:amd64
Hello from AMD64 (amd64)!

$ docker run --platform linux/arm64 --rm hello:arm64
Hello from ARM64 (aarch64)!
```

To rozwiązanie potrzebuję bardziej rozbudowany Dockerfile, ale za to umożliwia nam w pełni wykorzystanie funkcjonalności hosta przy kompilacji.
## Podsumowanie

W tej części ogarnęliśmy budowanie z Dockerem i Buildxem. Byliśmy w stanie cross-kompilować aplikacje i uruchomić ją na obcej architekturze.

Kiedy używać tego podejścia?

Gdy:
- chcesz budować obrazy ARM w CI,
- testujesz aplikacje userland bez specjalnych wymagań sprzętowych,
- zależy Ci na powtarzalnych buildach i wygodzie.

Nie używać, gdy potrzebujesz:
- emulacji jądra,
- sterowników jądra,
- wiernego odwzorowania sprzętu,
- testów wydajności i niskopoziomowych.

## Co dalej?

W kolejnej części zajmiemy się możliwością debugowania aplikacji w kontenerze. Sprawdzimy możliwości i ograniczenia używania GDB.

Docker i Buildx to świetny punkt startowy, ale to dopiero początek zabawy z emulacją wbudowanego Linuxa :).