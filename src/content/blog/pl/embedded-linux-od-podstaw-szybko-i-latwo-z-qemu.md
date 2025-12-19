---
title: "Embedded Linux od podstaw — szybko i łatwo z QEMU"
description: "Skompiluj system Linux i jego narzędzia budowania od zera..."
pubDate: 2023-06-20
author: pl/fabbio-protopapa
tags: ["system-budowania", "embedded-linux"]
category: "Linux"
draft: false
canonicalUrl: "https://tuxownia.pl/blog/embedded-linux-od-podstaw-szybko-i-latwo-z-qemu"
externalSource: "tuxownia.pl"
isExternal: true
originalAuthor: "Fabbio Protopapa"
---

W tym artykule stworzymy od zera system embedded Linux, wyemulujemy płytkę opartą na *ARM* i uruchomimy na niej nasz system.

## Czego potrzebujemy?

Żeby pomyślnie uruchomić embedded Linux na wybranej platformie, potrzebujemy pięciu głównych elementów:

- Toolchain
- Bootloader
- Kernel
- Główny system plików
- Przydatna aplikacja 😉

Skoro będziemy emulować płytkę w QEMU, możemy pominąć bootloader.

Proste 😃. Przejdźmy do toolchaina.

## Czym jest toolchain i po co nam?

Toolchain pozwala kompilować kod źródłowy do plików wykonywalnych. Składa się z kilku narzędzi: linkera, asemblera, kompilatora i bibliotek. Więcej szczegółów znajdziesz [tutaj](https://crosstool-ng.github.io/docs/toolchain-construction/). Gdy plik wykonywalny uruchamiamy na tym samym typie systemu co host, mamy do czynienia z natywnym toolchainem. Nasz procesor płytki to ARM, a host działa na x86\_64. Musimy więc wykonać cross-kompilację kodu źródłowego - do tego potrzebujemy cross-toolchaina.

Okej, świetnie. Ale jak go zdobyć?

Mamy dwie opcje. Pierwsza - ściągnij gotowy, na przykład:

- Z [Bootlin](https://toolchains.bootlin.com/)
- Lub [Linaro](https://www.linaro.org/downloads/)
- Nawet Twoja ulubiona dystrybucja Linux może mieć gotowe pakiety

Krótko mówiąc: poszukaj i pobierz 😃.

Druga opcja - zbuduj własny. Użyjemy *crosstool-NG*. Najpierw musimy zbudować sam crosstool-NG. Wymagania dla różnych dystrybucji znajdziesz [tutaj](https://github.com/crosstool-ng/crosstool-ng/tree/crosstool-ng-1.25.0/testing/docker). Używam **Ubuntu 22.04** i uruchamiam:

```bash
$ sudo apt-get update
$ sudo apt-get install -y gcc g++ gperf bison flex texinfo help2man make libncurses5-dev \
python3-dev autoconf automake libtool libtool-bin gawk wget bzip2 xz-utils unzip \
patch libstdc++6 rsync git meson ninja-build dos2unix

$ git clone https://github.com/crosstool-ng/crosstool-ng.git $ cd crosstool-ng
$ git checkout tags/crosstool-ng-1.25.0 -b ct-ng
$ # Clean files from \r
$ find . -type f -exec dos2unix {} \;

$ ./bootstrap
$ ./configure --prefix=$(pwd)/bin
$ make
$ make install

$ PATH="$PATH:$(pwd)/bin/bin"
```

Super, teraz możemy wywołać narzędzie komendą *ct-ng*. Zobaczmy dostępne przykłady.

```bash
$ ct-ng list-samples
...
Status  Sample name

[L...]   aarch64-ol7u9-linux-gnu
[L...]   aarch64-rpi3-linux-gnu
[L...]   aarch64-rpi4-linux-gnu
[L..X]   aarch64-unknown-linux-android
[L...]   aarch64-unknown-linux-gnu
[L...]   aarch64-unknown-linux-uclibc
[L...]   alphaev56-unknown-linux-gnu
[L...]   alphaev67-unknown-linux-gnu
[L...]   arc-arc700-linux-uclibc
[L...]   arc-archs-linux-gnu
[L...]   arc-multilib-elf32
[L...]   arc-multilib-linux-gnu
[L...]   arc-multilib-linux-uclibc
[L...]   arm-bare_newlib_cortex_m3_nommu-eabi
[L...]   arm-cortex_a15-linux-gnueabihf
[L..X]   arm-cortexa5-linux-uclibcgnueabihf
[L...]   arm-cortex_a8-linux-gnueabi
[L..X]   arm-cortexa9_neon-linux-gnueabihf
[L..X]   x86_64-w64-mingw32,arm-cortexa9_neon-linux-gnueabihf
[L...]   armeb-unknown-eabi
[L...]   armeb-unknown-linux-gnueabi
[L...]   armeb-unknown-linux-uclibcgnueabi
[L...]   arm-multilib-linux-uclibcgnueabi
[L...]   arm-nano-eabi
[L...]   arm-ol7u9-linux-gnueabi
...
```

Wow! Tego jest sporo. Co to wszystko oznacza?

Konwencja nazewnictwa wygląda tak:

*&lt;Architektura CPU&gt;-&lt;Dostawca&gt;-&lt;System Operacyjny&gt;-&lt;ABI / Biblioteki&gt;*

**Architektura CPU**: ARM (arm/aarch64), x86\_64, MIPS itd. plus informacja o kolejności bajtów (\_eb/\_el)

**Dostawca:** Twórca toolchaina, np. buildroot, minGW. Często nieznany lub pominięty.

**System Operacyjny:** Specyfikacja API, np. linux, win32.

**ABI (Application Binary Interface) / Biblioteki:** Przestrzeń użytkownika (gnu, musle) oraz ABI takie jak EABI czy EABIHF (Extended Application Binary Interface Hard-Float).

Wybierzmy *arm-unknown-linux-gnueabi* z przykładów. Żeby zobaczyć więcej informacji, wywołujemy:

```bash
$ ct-ng show-arm-unknown-linux-gnueabi
[L...]   arm-unknown-linux-gnueabi
    Languages       : C,C++
    OS              : linux-5.16.9
    Binutils        : binutils-2.38
    Compiler        : gcc-11.2.0
    C library       : glibc-2.35
    Debug tools     : duma-2_5_15 gdb-11.2 ltrace-0.7.3 strace-5.16
    Companion libs  : expat-2.4.1 gettext-0.21 gmp-6.2.1 isl-0.24 libelf-0.8.13 libiconv-1.16 mpc-1.2.1 mpfr-4.1.0 ncurses-6.2 zlib-1.2.12
    Companion tools :
```

Sprawdźmy, czy ten cross-toolchain spełnia nasze wymagania. Moim zdaniem tak 😃. Jeśli chcemy go skonfigurować, możemy użyć *arm-unknown-linux-gnueabi* jako punktu wyjścia. Do dalszych dostosowań przyda się *menuconfig*.

```bash
$  ct-ng arm-unknown-linux-gnueabi
[L...]   arm-unknown-linux-gnueabi
    Languages       : C,C++
    OS              : linux-5.16.9
    Binutils        : binutils-2.38
    Compiler        : gcc-11.2.0
    C library       : glibc-2.35
    Debug tools     : duma-2_5_15 gdb-11.2 ltrace-0.7.3 strace-5.16
    Companion libs  : expat-2.4.1 gettext-0.21 gmp-6.2.1 isl-0.24 libelf-0.8.13 libiconv-1.16 mpc-1.2.1 mpfr-4.1.0 ncurses-6
    Companion tools :
$ ct-ng menuconfig
```

![okno terminała menuconfig](/images/imported/posts/embedded-linux-od-podstaw-szybko-i-latwo-z-qemu/menuconfig.webp)

Czas go zbudować.

```bash
$ ct-ng build
...
[INFO ]  Retrieving needed toolchain components tarballs
[EXTRA]    Retrieving 'linux-5.16.9'
[EXTRA]    Verifying SHA512 checksum for 'linux-5.16.9.tar.xz'
[EXTRA]    Retrieving 'zlib-1.2.12'
[ERROR]    zlib: download failed
[ERROR]
...
```

O nie!

![muppet stoi w ogniu](/images/imported/posts/embedded-linux-od-podstaw-szybko-i-latwo-z-qemu/hell.webp)

Spokojnie. Crosstool-NG nie może pobrać *zlib-1.2.12*. Archiwa są zapisywane w ~/src. Umieścimy je tam ręcznie.

```bash
$ mkdir ~/src && cd ~/src/
$ wget https://zlib.net/fossils/zlib-1.2.12.tar.gz
$ cd -
# I jeszcze raz...
$ ct-ng build
[INFO ]  Finalizing the toolchain s directory: done in 2.53s (at 33:03)
[INFO ]  Build completed at 20230119.174924
[INFO ]  (elapsed: 33:02.82)
[INFO ]  Finishing installation (may take a few seconds)...$
$ cd ~
$ PATH="$PATH:$(pwd)/x-tools/arm-unknown-linux-gnueabi/bin"
```

Udało się! Teraz obowiązkowe "hello world"! Zapisz plik *helloworld.c* z zawartością:

```c
#include <stdio.h>

int main (void)
{
  printf ("Hello, world!\n");
  return 0;
}
```

Skompiluj go naszym cross-toolchainem:

```bash
$ arm-unknown-linux-gnueabi-gcc helloworld.c -o helloworld
$ file helloworld
helloworld: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV),
dynamically linked, interpreter /lib/ld-linux.so.3, for GNU/Linux 5.16.9,
with debug_info, not stripped
```

Działa! Mamy plik wykonywalny dla ARM.

Nasuwa się pytanie. Czemu nie po prostu pobrać gotowego toolchaina? Odpowiedź jest prosta: możesz 😃. O ile znajdziesz taki, który Ci pasuje.

## Potrzebuję kernela!

Najpierw pobierz pliki źródłowe kernela.

```bash
$ wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.16.9.tar.xz
$ tar xf linux-5.16.9.tar.xz
$ rm linux-5.16.9.tar.xz
$ cd linux-5.16.9
```

Wersja kernela musi być większa lub równa wersji określonej w toolchainie.

```bash
$ ct-ng show-arm-unknown-linux-gnueabi
[L...]   arm-unknown-linux-gnueabi
    Languages       : C,C++
    OS              : linux-5.16.9
    Binutils        : binutils-2.38
    Compiler        : gcc-11.2.0
    C library       : glibc-2.35
    Debug tools     : duma-2_5_15 gdb-11.2 ltrace-0.7.3 strace-5.16
    Companion libs  : expat-2.4.1 gettext-0.21 gmp-6.2.1 isl-0.24 libelf-0.8.13 libiconv-1.16 mpc-1.2.1 mpfr-4.1.0 ncurses-6.2 zlib-1.2.12
    Companion tools :
```

Ustaw świeżo zbudowany toolchain i skonfiguruj kernel. W */arch/arm/configs/* znajdziesz gotowe pliki konfiguracyjne. Użyjemy płytek Arm Versatile Express, które są również dostępne w QEMU.

```bash
$ export ARCH=arm
$ export CROSS_COMPILE=arm-unknown-linux-gnueabi-
$ make vexpress_defconfig
#
# configuration written to .config
#
```

Teraz skompilujmy...

```bash
$ make zImage -j$(nproc)
...
fatal error: mpc.h: No such file or directory
...
...
```

Nie! Spokojnie. Taki błąd oznacza tylko, że musimy zainstalować kilka pakietów. Szybkie wyszukiwanie w Google pomoże. W moim przypadku musiałem zainstalować *libmpc-dev* i *libgmp3-dev*.

```bash
$ sudo apt install -y libmpc-dev libgmp3-dev
$ make zImage -j$(nproc)
  ...
  CC      arch/arm/boot/compressed/fdt_wip.o
  CC      arch/arm/boot/compressed/fdt.o
  CC      arch/arm/boot/compressed/fdt_check_mem_start.o
  SHIPPED arch/arm/boot/compressed/lib1funcs.S
  SHIPPED arch/arm/boot/compressed/ashldi3.S
  SHIPPED arch/arm/boot/compressed/bswapsdi2.S
  AS      arch/arm/boot/compressed/hyp-stub.o
  AS      arch/arm/boot/compressed/lib1funcs.o
  AS      arch/arm/boot/compressed/ashldi3.o
  AS      arch/arm/boot/compressed/bswapsdi2.o
  AS      arch/arm/boot/compressed/piggy.o
  LD      arch/arm/boot/compressed/vmlinux
  OBJCOPY arch/arm/boot/zImage
  Kernel: arch/arm/boot/zImage is ready
$ make modules -j$(nproc)
  CALL    scripts/atomic/check-atomics.sh
  CALL    scripts/checksyscalls.sh
  LDS     scripts/module.lds
  MODPOST modules-only.symvers
  GEN     Module.symvers
$ make dtbs -j$(nproc)
  DTC     arch/arm/boot/dts/vexpress-v2p-ca5s.dtb
  DTC     arch/arm/boot/dts/vexpress-v2p-ca9.dtb
  DTC     arch/arm/boot/dts/vexpress-v2p-ca15-tc1.dtb
  DTC     arch/arm/boot/dts/vexpress-v2p-ca15_a7.dtb
```

Mamy zImage i skompilowany Device Tree w */arch/arm/boot*.

## Ale płytki nie ma!?

Żeby ułatwić sobie życie, użyjemy emulatora QEMU. Krótko o QEMU:

> QEMU to darmowy emulator o otwartym kodzie (Quick EMUlator). Emuluje procesor maszyny przez dynamiczną translację binarną i udostępnia różne modele sprzętowe dla maszyny, pozwalając uruchamiać różne systemy operacyjne gości. Współpracuje z Kernel-based Virtual Machine (KVM), dzięki czemu maszyny wirtualne działają z prędkością zbliżoną do natywnej. QEMU potrafi też emulować procesy na poziomie użytkownika, pozwalając aplikacjom skompilowanym dla jednej architektury działać na innej.
>
>  — Źródło:<https://en.wikipedia.org/wiki/QEMU>

Pobieranie i instalacja QEMU są proste. Zróbmy to!

```bash
$ sudo apt install -y pkg-config libglib2.0-dev libpixman-1-dev
$ mkdir tools && cd $_
$ wget https://download.qemu.org/qemu-7.2.0.tar.xz
$ tar xvJf qemu-7.2.0.tar.xz
$ cd qemu-7.2.0
$ ./configure --target-list=arm-softmmu
$ make
$ PATH="$PATH:$(pwd)/build/arm-softmmu"
```

Teraz możemy wywołać QEMU przez *qemu-system-arm*. Sprawdźmy!

Mówimy QEMU, że nasza płytka to *vexpress-a9* z 256 MB RAM, wskazujemy na obraz kernela i skompilowany Device Tree, przekazujemy terminal szeregowy.

```bash
$ cd ~/linux-5.16.9
$ qemu-system-arm -M help
...
versatileab          ARM Versatile/AB (ARM926EJ-S)
versatilepb          ARM Versatile/PB (ARM926EJ-S)
vexpress-a15         ARM Versatile Express for Cortex-A15
vexpress-a9          ARM Versatile Express for Cortex-A9
virt-2.10            QEMU 2.10 ARM Virtual Machine
virt-2.11            QEMU 2.11 ARM Virtual Machine
virt-2.12            QEMU 2.12 ARM Virtual Machine
...
$ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \
  -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \
  -append "console=ttyAMA0,115200" -nographic
Please append a correct "root=" boot option; here are the available partitions:
1f00          131072 mtdblock0
 (driver?)
1f01           32768 mtdblock1
 (driver?)
Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)
CPU: 0 PID: 1 Comm: swapper/0 Not tainted 5.16.9 #1
Hardware name: ARM-Versatile Express
```

Znowu! Czemu dostajemy kernel panic? Bo nie stworzyliśmy głównego systemu plików i nie można go było zamontować.

Żeby zakończyć QEMU: *STRG + a x (najpierw: STRG + a, potem: x)*

## Potrzebujemy głównego systemu plików!

Krótkie przypomnienie o głównych systemach plików:

> Główny system plików to szczyt hierarchicznego drzewa plików. Zawiera pliki i katalogi krytyczne dla działania systemu, między innymi katalog urządzeń i programy startowe. Zawiera też punkty montowania, gdzie inne systemy plików mogą być montowane do hierarchii głównego systemu plików.
>
>  — Źródło:<https://www.ibm.com/docs/pl/aix/7.1?topic=tree-root-file-system>

Główny system plików wymaga struktury katalogów, jak poniżej:

```bash
/
├── bin
├── dev
├── etc
├── lib
├── proc
├── sbin
├── sys
├── tmp
├── usr
└── var
```

Oprócz struktury katalogów potrzebuje programu init, powłoki, węzłów urządzeń, bibliotek, pseudo systemów plików i kilku podstawowych programów.

Zacznijmy od struktury katalogów.

```bash
$ mkdir ~/rootfs && cd $_
$ mkdir bin dev etc home lib proc sbin sys tmp usr var
$ mkdir -p usr/bin usr/lib usr/sbin var/log
```

Teraz potrzebujemy *BusyBox*. BusyBox dostarcza wszystkich niezbędnych programów do uruchomienia Linuxa. Krótko o BusyBox:

> BusyBox to pakiet oprogramowania dostarczający kilka narzędzi uniksowych w jednym pliku wykonywalnym. Działa w różnych środowiskach POSIX jak Linux, Android i FreeBSD, choć wiele dostarczanych narzędzi jest zaprojektowanych do pracy z interfejsami kernela Linuxa. Został stworzony specjalnie dla systemów wbudowanych o bardzo ograniczonych zasobach. Autorzy nazwali go „szwajcarskim scyzorykiem Embedded Linuxa", bo pojedynczy plik wykonywalny zastępuje podstawowe funkcje ponad 300 popularnych komend.
>
>  — Źródło:<https://en.wikipedia.org/wiki/BusyBox>

Zbudujmy BusyBox dla naszego głównego systemu plików.

```bash
$ cd ~
$ git clone git://busybox.net/busybox.git
$ cd busybox
$ git checkout tags/1_36_0 -b bb
# Musimy wyeksportować ARCH i CROSS_COMPILE
# (Wyeksportuj zmienne i ścieżkę ponownie po zamknięciu terminala)
# PATH="$PATH:~/x-tools/arm-unknown-linux-gnueabi/bin"
# export ARCH=arm
# export CROSS_COMPILE=arm-unkown-linux-gnueabi-
$ make defconfig
$ make menuconfig
# Settings -> Installation Options -> Destination path for 'make install'
# Wpisz ../rootfs
$ make
$ make install
```

![Ustaw ścieżke rootfsa w menuconfig](/images/imported/posts/embedded-linux-od-podstaw-szybko-i-latwo-z-qemu/rootfs.webp)

Co to zrobiło? Jak wygląda główny system plików?

```bash
$ cd ~/rootfs
$ tree
.
├── bin
│   ├── arch -> busybox
│   ├── ash -> busybox
│   ├── base32 -> busybox
│   ├── base64 -> busybox
│   ├── busybox
│   ├── cat -> busybox
|   ...
├── dev
├── etc
├── home
├── lib
├── linuxrc -> bin/busybox
├── proc
├── sbin
│   ├── acpid -> ../bin/busybox
│   ├── adjtimex -> ../bin/busybox
│   ├── arp -> ../bin/busybox
│   ├── blkid -> ../bin/busybox
│   ├── blockdev -> ../bin/busybox
|   ...
├── sys
├── tmp
├── usr
│   ├── bin
│   │   ├── [ -> ../../bin/busybox
│   │   ├── [[ -> ../../bin/busybox
│   │   ├── ascii -> ../../bin/busybox
│   │   ├── awk -> ../../bin/busybox
│   │   ├── basename -> ../../bin/busybox
│   │   ├── bc -> ../../bin/busybox
│   │   ├── beep -> ../../bin/busybox
|   |   ...
│   ├── lib
│   └── sbin
│       ├── addgroup -> ../../bin/busybox
│       ├── add-shell -> ../../bin/busybox
│       ├── adduser -> ../../bin/busybox
│       ├── arping -> ../../bin/busybox
│       ├── brctl -> ../../bin/busybox
│       ├── chat -> ../../bin/busybox
|        ...
└── var
    └── log
```

Teraz musimy sprawdzić, których bibliotek używa. Inaczej możemy zbudować BusyBox statycznie - wtedy nie musimy się martwić o współdzielone biblioteki, ale zwiększa to rozmiar pliku binarnego.

```bash
$ arm-unknown-linux-gnueabi-readelf -a bin/busybox | grep "program interpreter"
      [Requesting program interpreter: /lib/ld-linux.so.3]
$ arm-unknown-linux-gnueabi-readelf -a bin/busybox | grep "Shared library"
 0x00000001 (NEEDED)                     Shared library: [libm.so.6]
 0x00000001 (NEEDED)                     Shared library: [libresolv.so.2]
 0x00000001 (NEEDED)                     Shared library: [libc.so.6]
```

Te biblioteki są w *sysroot*. Sprawdźmy jeszcze, czy są dowiązania symboliczne (w tym przypadku nie ma) i skopiujmy wszystko do *rootfs/lib*.

```bash
$ arm-unknown-linux-gnueabi-gcc -print-sysroot
/home/op/x-tools/arm-unknown-linux-gnueabi/arm-unknown-linux-gnueabi/sysroot
$ export SYSROOT=$(arm-unknown-linux-gnueabi-gcc -print-sysroot)
# Sprawdź dowiązania symboliczne
$ ls -l $SYSROOT/lib
-r-xr-xr-x 1 op op  1232784 Jan 19 17:33 ld-linux.so.3
-r-xr-xr-x 1 op op 12380024 Jan 19 17:33 libc.so.6
-r-xr-xr-x 1 op op  1804408 Jan 19 17:33 libm.so.6
-r-xr-xr-x 1 op op   239892 Jan 19 17:33 libresolv.so.2
...
$ cp $SYSROOT/lib/ld-linux.so.3 lib
$ cp $SYSROOT/lib/libm.so.6 lib
$ cp $SYSROOT/lib/libresolv.so.2 lib
$ cp $SYSROOT/lib/libc.so.6 lib
```

To wszystko, czego potrzebujemy na start. Stwórzmy *initramfs* - system plików ładowany do RAM. Tworzymy archiwum *cpio* i kompresujemy gzipem (ostatni krok jest opcjonalny).

```bash
$ find . | cpio -H newc -ov --owner root:root > ../initramfs.cpio
$ cd .. && gzip initramfs.cpio
```

Uruchommy znowu QEMU! Tym razem przekażemy dodatkowo *initrd* (wskazujący na główny system plików) i argument rdinit=/bin/sh (uruchamiający interaktywną powłokę).

```bash
$ cd linux-5.16.9
$ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \
  -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \
  -append "console=ttyAMA0 rdinit=/bin/sh" -nographic \
  -initrd ../initramfs.cpio.gz
```

Po udanym starcie naciśnięcie *Enter* przenosi nas do powłoki.

```bash
...
ALSA device list:
  #0: ARM AC'97 Interface PL041 rev0 at 0x10004000, irq 32
Freeing unused kernel image (initmem) memory: 1024K
Run /bin/sh as init process
/bin/sh: can\'t access tty; job control turned off
~ # input: ImExPS/2 Generic Explorer Mouse as /devices/platform/bus@40000000/bus@40000000:motherboard-bus@40000000/bus@40000000:motherboard-bus@40000000:iofpga@7,00000000/10007000.kmi/serio1/input/input2
random: fast init done

~ # ls
bin      etc      lib      proc     sbin     tmp      var
dev      home     linuxrc  root     sys      usr
```

Sukces 😎!

## Stwórzmy aplikację!

Możemy wymyślić coś takiego, ulepszając program *helloworld*.

```c
#include <stdio.h>

int main()
{
  while(1) {
    char name[30];
    printf("Enter name: \n");
    scanf("%s", name);
    printf("Hello %s.\n", name);
  }
    return 0;
}
```

Skompiluj i przenieś do głównego systemu plików.

```bash
$ arm-unknown-linux-gnueabi-gcc helloworld.c -o helloworld
$ file helloworld
helloworld: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV),
dynamically linked, interpreter /lib/ld-linux.so.3, for GNU/Linux 5.16.9,
with debug_info, not stripped
$ mv helloworld rootfs/usr/bin/
$ chmod +x rootfs/usr/bin/helloworld
# Utwórz ponownie archiwum
$ cd rootfs
$ find . | cpio -H newc -ov --owner root:root > ../initramfs.cpio
$ cd .. && gzip initramfs.cpio
```

Warto sprawdzić potrzebne biblioteki. W tym przypadku już je mamy.

```bash
$ arm-unknown-linux-gnueabi-readelf -a rootfs/usr/bin/helloworld | grep "program interpreter"
      [Requesting program interpreter: /lib/ld-linux.so.3]
$ arm-unknown-linux-gnueabi-readelf -a rootfs/usr/bin/helloworld | grep "Shared library"
 0x00000001 (NEEDED)                     Shared library: [libc.so.6]
```

Super, przetestujmy aplikację!

```bash
$ cd linux-5.16.9
$ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \
  -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \
  -append "console=ttyAMA0 rdinit=/bin/sh" -nographic \
  -initrd ../initramfs.cpio.gz
...
~ # helloworld
Enter name:
World
Hello World.
Enter name:
```

Działa! Ale szkoda, że musimy ręcznie uruchamiać program. To w końcu urządzenie wbudowane 😉. Przekazanie *helloworld* do *rdinit* rozwiąże problem.

```bash
$ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \
  -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \
  -append "console=ttyAMA0 rdinit=/usr/bin/helloworld" -nographic \
  -initrd ../initramfs.cpio.gz
...
Freeing unused kernel image (initmem) memory: 1024K
Run /usr/bin/helloworld as init process
Enter name:
World
Hello World.
...
```

Wciąż tu jesteś? Świetnie!

## Podsumowanie

W tym artykule stworzyliśmy cross-toolchain dla procesora ARM, skompilowaliśmy kernel Linuxa dla płytki Arm Versatile Express i skonfigurowaliśmy QEMU do uruchomienia kernela i emulacji płytki. Potem stworzyliśmy główny system plików i wypełniliśmy go naszą aplikacją.

Stworzyliśmy więc system embedded Linux od zera! 😎

Zazwyczaj to podejście nie jest odpowiednie - zaleca się używanie systemów budowania jak Yocto czy Buildroot. Ale to świetna zabawa i dobra wiedza do lepszego zrozumienia, jak rozwijać systemy embedded Linux.

Mam nadzieję, że się podobało. Dzięki za przeczytanie!
