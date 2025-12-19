---
title: "TFTP i NFS w rozwoju Embedded Linux"
description: "Wykorzystaj TFTP i NFS, by przyspieszyć uruchamianie Embedded Linux..."
pubDate: 2023-05-15
author: pl/fabbio-protopapa
tags: ["narzędzia-do-budowania", "embedded-linux"]
category: "narzędzia do budowania"
draft: false
canonicalUrl: "https://tuxownia.pl/blog/tftp-i-nfs-w-rozwoju-embedded-linux"
externalSource: "tuxownia.pl"
isExternal: true
originalAuthor: "Fabbio Protopapa"
---

W tym artykule skonfigurujemy serwer TFTP (Trivial File Transfer Protocol) i NFS (Network File System), a następnie użyjemy go do uruchomienia Raspberry Pi 4 (RPI). Żeby ułatwić sobie życie, użyjemy U-Boot jako bootloadera.

Po co nam to?

W początkowych (i późniejszych) fazach rozwoju często musimy zmieniać, edytować i przekompilowywać projekty. Płytki rozwojowe zazwyczaj startują z karty SD. Żeby skrócić czas iteracji, możemy pominąć wyjmowanie, montowanie, kopiowanie itd. Jest to możliwe dzięki protokołom sieciowym - pliki pozostają na komputerze hosta.

## Czego potrzebujemy?

Komputer hosta z Ubuntu 22.04 (przynajmniej tego używam), konwerter USB-UART, karta SD, czytnik kart i Raspberry Pi 4 (lub cokolwiek masz pod ręką 😃).

To właściwie wszystko. Zaczynajmy!

## Trivial File Transfer Protocol

Dlaczego w ogóle używać TFTP?

>  Trivial File Transfer Protocol (TFTP) to prosty protokół przesyłania plików w trybie lock-step, który pozwala klientowi pobierać lub wysyłać pliki na zdalny host. Jedno z głównych zastosowań to wczesne fazy uruchamiania węzłów z sieci lokalnej. TFTP jest używany do tego celu, bo jest bardzo prosty w implementacji.
>
>  Ze względu na prostą konstrukcję, TFTP można łatwo zaimplementować w kodzie o małym śladzie pamięciowym. Jest więc protokołem z wyboru w początkowych fazach każdej strategii uruchamiania sieciowego.
>
>  Źródło: [Wikipedia](https://pl.wikipedia.org/wiki/Trivial_File_Transfer_Protocol)

Najpierw zainstalujmy serwer TFTP i stwórzmy folder na pliki.

```bash
$ mkdir -p /home/${USER}/tftp
$ sudo apt-get install tftpd-hpa
```

Teraz zmienimy uprawnienia. Daemon TFTP musi mieć dostęp do folderu, a nasz użytkownik musi móc w nim zapisywać pliki.

```bash
# Powinniśmy mieć użytkownika tftp
$ cat /etc/passwd
...
tftp:x:133:139:tftp daemon,,,:/srv/tftp:/usr/sbin/nologin
...
$ sudo chown tftp:tftp /home/${USER}/tftp
$ sudo chmod -R 777 /home/${USER}/tftp
```

Teraz zmienimy konfigurację. Powinna wyglądać tak:

```bash
$ sudo vim /etc/default/tftpd-hpa
TFTP_USERNAME="tftp"
TFTP_DIRECTORY="/home/<user>/tftp"
TFTP_ADDRESS="0.0.0.0:6900"
TFTP_OPTIONS="--create --secure"
```

Ważna uwaga: standardowy port dla TFTP to 69. To może prowadzić do konfliktów z innymi usługami. U-Boot pozwala użyć innego portu. Możesz sprawdzić swoje porty, np. przez:

```bash
$ sudo netstat -lnp | grep 69
udp6       0      0 :::69                   :::*                                1246
```

Jak widać wyżej, mój port 69 jest już zajęty. Dlatego przydaje się możliwość użycia innego 😃.

Teraz możemy uruchomić daemon TFTP.

```bash
$ sudo systemctl start tftpd-hpa
# Sprawdź status, powinno wyglądać tak
$ sudo systemctl status tftpd-hpa
● tftpd-hpa.service - LSB: HPA's tftp server
     Loaded: loaded (/etc/init.d/tftpd-hpa; generated)
     Active: active (running) since Thu 2023-05-11 20:45:29 CEST; 12s ago
       Docs: man:systemd-sysv-generator(8)
    Process: 3502 ExecStart=/etc/init.d/tftpd-hpa start (code=exited, status=0/SUCCESS)
      Tasks: 1 (limit: 18571)
     Memory: 412.0K
        CPU: 47ms
     CGroup: /system.slice/tftpd-hpa.service
             └─3510 /usr/sbin/in.tftpd --listen --user tftp --address 0.0.0.0:6900 --create>
May 11 20:45:29 build systemd[1]: Starting LSB: HPA's tftp server...
May 11 20:45:29 build tftpd-hpa[3502]:  * Starting HPA's tftpd in.tftpd
May 11 20:45:29 build tftpd-hpa[3502]:    ...done.
May 11 20:45:29 build systemd[1]: Started LSB: HPA's tftp server.
```

Warto szybko przetestować. Stwórzmy plik w folderze TFTP i prześlijmy go.

```bash
$ cd ~
$ echo "Test transfer" > ./tftp/test.txt
$ tftp
tftp> connect localhost 6900
tftp> get test.txt
Received 15 bytes in 0.0 seconds
tftp> quit
$ cat test.txt
Test transfer
```

Sukces!!! Przejdźmy do serwera NFS.

## Network File System

Czym jest NFS?

>  NFS to rozproszony protokół systemu plików, który pozwala użytkownikowi na komputerze klienckim uzyskać dostęp do plików przez sieć komputerową tak, jak do lokalnej pamięci masowej. NFS, jak wiele innych protokołów, bazuje na systemie Open Network Computing Remote Procedure Call (ONC RPC).
>
>  Źródło: [Wikipedia](https://en.wikipedia.org/wiki/Network_File_System)

Linux obsługuje NFS i pozwala nam uruchomić główny system plików przez NFS.

Konfiguracja serwera NFS jest jeszcze prostsza niż TFTP. Zainstalujmy serwer NFS, stwórzmy współdzielony folder i ustaw uprawnienia.

```bash
$ sudo apt-get install nfs-kernel-server
$ sudo mkdir /home/${USER}/nfs
$ sudo chmod 777 /home/${USER}/nfs
```

Teraz musimy udostępnić folder serwerowi NFS i ustawić uprawnienia.

```bash
$ sudo vim /etc/exports
/home/<user>/nfs *(rw,sync,no_root_squash,no_subtree_check)
```

- **\***: Zezwól na wszystkie IP
- **rw**: Eksportuj folder jako odczyt i zapis
- **sync**: Wybierz wersję synchroniczną
- **no_root_squash**: Żądania od użytkownika ID 0 są przetwarzane bez zmiany na inny ID
- **no_subtree_check**: Wyłącza sprawdzanie poddrzewa (może poprawić niezawodność)

Na koniec zrestartujmy usługę.

```bash
$ sudo service nfs-kernel-server restart
```

Jeśli wszystko poszło dobrze, możemy teraz uruchomić się przez NFS.

## Stwórz obraz, bootloader itd.

Żeby ułatwić sobie życie, użyjemy Buildroot do stworzenia wszystkiego, czego potrzebujemy.

```bash
$ mkdir rpi4 && cd $_
$ git clone https://github.com/buildroot/buildroot.git
$ cd buildroot
$ git checkout tags/2022.02.12
```

Zobaczmy, jakie defconfigi są obsługiwane.

```bash
$ make list-defconfigs | grep "raspberrypi*"
  raspberrypi0_defconfig              - Build for raspberrypi0
  raspberrypi0w_defconfig             - Build for raspberrypi0w
  raspberrypi2_defconfig              - Build for raspberrypi2
  raspberrypi3_64_defconfig           - Build for raspberrypi3_64
  raspberrypi3_defconfig              - Build for raspberrypi3
  raspberrypi3_qt5we_defconfig        - Build for raspberrypi3_qt5we
  raspberrypi4_64_defconfig           - Build for raspberrypi4_64
  raspberrypi4_defconfig              - Build for raspberrypi4
  raspberrypicm4io_64_defconfig       - Build for raspberrypicm4io_64
  raspberrypicm4io_defconfig          - Build for raspberrypicm4io
  raspberrypi_defconfig               - Build for raspberrypi
  raspberrypizero2w_defconfig         - Build for raspberrypizero2w
```

Budujemy dla Raspberry Pi 4, więc wybierzmy raspberrypi4\_64\_defconfig.

```bash
$ make O=/home/${USER}/rpi4/build raspberrypi4_64_defconfig
$ cd ../build
```

Teraz skonfigurujmy Buildroot. Wybierzemy nowszą wersję U-Boot, bo pozwoli nam zmienić port TFTP.

```bash
$ make menuconfig
Filesystem images -> tar the root filesystem
Bootloaders -> U-Boot
Bootloaders -> U-Boot -> U-Boot version: Custom version
Bootloaders -> U-Boot -> U-Boot version: 2023.04
Bootloaders -> U-Boot -> Build system: Kconfig
Bootloaders -> U-Boot -> Board defconfig: rpi_arm64
```

Sprawdźmy, czy Linux jest przygotowany na NFS.

```bash
$  make linux-menuconfig
# Jeśli napotkamy problemy, możemy wyłączyć initial RAM FS
General setup -> Initial RAM filesystem and RAM disk (initramfs/initrd) support: Disable
# NFS jest zazwyczaj już włączony, ale powinniśmy wyłączyć wersję 2
File systems -> Network File Systems -> ...
```

![ustawienia NFS w menuconfigu](/images/imported/posts/tftp-i-nfs-w-rozwoju-embedded-linux/nfs.webp)

Usuńmy obsługę NFS wersji 2.

Teraz musimy włączyć w U-Boot możliwość wyboru innego portu TFTP.

```bash
$ make uboot-menuconfig
Networking support -> Set TFTP UDP source/destination ports via the environment
```

Czas budować...

```bash
$ make
```

Jeśli dostajesz błędy, sprawdź wymagania i pakiety deweloperskie do budowania Linuxa 😉. Jeśli nie, kontynuuj!

## Formatowanie karty SD

Teraz przygotujmy kartę SD.

Po podłączeniu karty SD musimy znaleźć jej nazwę. Możemy użyć dmesg lub lsblk. Ważne, żeby na pewno zidentyfikować kartę, z którą chcemy pracować!!!

```bash
$ sudo dmesg | tail
[sudo] password for op:
[10416.824858] sd 6:0:0:0: Attached scsi generic sg2 type 0
[10416.825236] scsi 6:0:0:1: Attached scsi generic sg3 type 0
[10417.054587] sd 6:0:0:0: [sdb] 62357504 512-byte logical blocks: (31.9 GB/29.7 GiB)
[10417.055601] sd 6:0:0:0: [sdb] Write Protect is off
[10417.055606] sd 6:0:0:0: [sdb] Mode Sense: 21 00 00 00
[10417.056370] sd 6:0:0:0: [sdb] Write cache: disabled, read cache: enabled, doesn\'t support DPO or FUA
[10417.057339] sd 6:0:0:1: [sdc] Media removed, stopped polling
[10417.058474] sd 6:0:0:1: [sdc] Attached SCSI removable disk
[10417.066080]  sdb: sdb1
[10417.068324] sd 6:0:0:0: [sdb] Attached SCSI removable disk

$ lsblk
NAME                      MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
...
sdb                         8:16   1  29.1G  0 disk
├─sdb1                      8:17   1    32M  0 part
└─sdb2                      8:18   1   512M  0 part
...
```

Do formatowania karty SD możemy użyć np. fdisk lub GParted. Tutaj użyję fdisk. Najpierw musimy usunąć istniejące partycje (musimy też odmontować kartę).

```bash
$ sudo umount ...
$ sudo fdisk /dev/sdb

Welcome to fdisk (util-linux 2.37.2).
Changes will remain in memory only, until you decide to write them.
Be careful before using the write command.


Command (m for help): p
Disk /dev/sdb: 29.12 GiB, 31267487744 bytes, 61069312 sectors
Disk model: STORAGE DEVICE
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x00000000

Device     Boot Start     End Sectors  Size Id Type
/dev/sdb1  *        1   65536   65536   32M  c W95 FAT32 (LBA)
/dev/sdb2       65537 1114112 1048576  512M 83 Linux

Command (m for help): d
Partition number (1,2, default 2): 1

Partition 1 has been deleted.

Command (m for help): d
Selected partition 2
Partition 2 has been deleted.
```

Teraz stwórzmy nowe partycje.

```bash
Command (m for help): n
Partition type
   p   primary (0 primary, 0 extended, 4 free)
   e   extended (container for logical partitions)
Select (default p):

Using default response p.
Partition number (1-4, default 1):
First sector (2048-61069311, default 2048):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-61069311, default 61069311): +1G

Created a new partition 1 of type 'Linux' and of size 1 GiB.

Command (m for help): n
Partition type
   p   primary (1 primary, 0 extended, 3 free)
   e   extended (container for logical partitions)
Select (default p):

Using default response p.
Partition number (2-4, default 2):
First sector (2099200-61069311, default 2099200):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2099200-61069311, default 61069311):

Created a new partition 2 of type 'Linux' and of size 28.1 GiB.
```

Teraz utwórzmy partycję startową.

```bash
Command (m for help): a
Partition number (1,2, default 2): 1

The bootable flag on partition 1 is enabled now.
```

Następnie musimy ustawić formaty partycji. Partycja startowa powinna być FAT32, a rootfs w formacie ext.

```bash
Command (m for help): t
Partition number (1,2, default 2): 1
Hex code or alias (type L to list all): L

00 Empty            24 NEC DOS          81 Minix / old Lin  bf Solaris
01 FAT12            27 Hidden NTFS Win  82 Linux swap / So  c1 DRDOS/sec (FAT-
02 XENIX root       39 Plan 9           83 Linux            c4 DRDOS/sec (FAT-
03 XENIX usr        3c PartitionMagic   84 OS/2 hidden or   c6 DRDOS/sec (FAT-
04 FAT16 <32M       40 Venix 80286      85 Linux extended   c7 Syrinx
05 Extended         41 PPC PReP Boot    86 NTFS volume set  da Non-FS data
06 FAT16            42 SFS              87 NTFS volume set  db CP/M / CTOS / .
07 HPFS/NTFS/exFAT  4d QNX4.x           88 Linux plaintext  de Dell Utility
08 AIX              4e QNX4.x 2nd part  8e Linux LVM        df BootIt
09 AIX bootable     4f QNX4.x 3rd part  93 Amoeba           e1 DOS access
0a OS/2 Boot Manag  50 OnTrack DM       94 Amoeba BBT       e3 DOS R/O
0b W95 FAT32        51 OnTrack DM6 Aux  9f BSD/OS           e4 SpeedStor
0c W95 FAT32 (LBA)  52 CP/M             a0 IBM Thinkpad hi  ea Linux extended
0e W95 FAT16 (LBA)  53 OnTrack DM6 Aux  a5 FreeBSD          eb BeOS fs
0f W95 Ext'd (LBA)  54 OnTrackDM6       a6 OpenBSD          ee GPT
10 OPUS             55 EZ-Drive         a7 NeXTSTEP         ef EFI (FAT-12/16/
11 Hidden FAT12     56 Golden Bow       a8 Darwin UFS       f0 Linux/PA-RISC b
12 Compaq diagnost  5c Priam Edisk      a9 NetBSD           f1 SpeedStor
14 Hidden FAT16 <3  61 SpeedStor        ab Darwin boot      f4 SpeedStor
16 Hidden FAT16     63 GNU HURD or Sys  af HFS / HFS+       f2 DOS secondary
17 Hidden HPFS/NTF  64 Novell Netware   b7 BSDI fs          fb VMware VMFS
18 AST SmartSleep   65 Novell Netware   b8 BSDI swap        fc VMware VMKCORE
1b Hidden W95 FAT3  70 DiskSecure Mult  bb Boot Wizard hid  fd Linux raid auto
1c Hidden W95 FAT3  75 PC/IX            bc Acronis FAT32 L  fe LANstep
1e Hidden W95 FAT1  80 Old Minix        be Solaris boot     ff BBT

Aliases:
   linux          - 83
   swap           - 82
   extended       - 05
   uefi           - EF
   raid           - FD
   lvm            - 8E
   linuxex        - 85
Hex code or alias (type L to list all): b

Changed type of partition 'Linux' to 'W95 FAT32'.

Command (m for help): t
Partition number (1,2, default 2):
Hex code or alias (type L to list all): 83

Changed type of partition 'Linux' to 'Linux'.

Command (m for help): p
Disk /dev/sdb: 29.12 GiB, 31267487744 bytes, 61069312 sectors
Disk model: STORAGE DEVICE
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x00000000

Device     Boot   Start      End  Sectors  Size Id Type
/dev/sdb1  *       2048  2099199  2097152    1G  b W95 FAT32
/dev/sdb2       2099200 61069311 58970112 28.1G 83 Linux
```

I musimy zapisać zmiany.

```bash
Command (m for help): w
The partition table has been altered.
Calling ioctl() to re-read partition table.
Syncing disks.
```

Na koniec sformatujmy partycje.

```bash
$ sudo mkfs.vfat -n "BOOT" /dev/sdb1
mkfs.fat 4.2 (2021-01-31)
$ sudo mkfs.ext4 -L "ROOTFS" /dev/sdb2
mke2fs 1.46.5 (30-Dec-2021)
Creating filesystem with 7371264 4k blocks and 1843200 inodes
Filesystem UUID: 14b83a0a-5ef2-493a-bcd0-a089cbec1570
Superblock backups stored on blocks:
        32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632, 2654208,
        4096000

Allocating group tables: done
Writing inode tables: done
Creating journal (32768 blocks): done
Writing superblocks and filesystem accounting information:
done
```

Jeśli napotkasz problemy z uruchamianiem, sprawdź rozmiar karty SD. Czasami platformy potrzebują mniejszych kart (16 GB/32 GB powinno definitywnie działać).

Łatwiejszym sposobem jest użycie skryptu dostarczonego przez [Chris Simmonds](https://github.com/csimmonds/embedded-linux-quick-start-files/blob/master/format-sdcard.sh?source=post_page-----8194fa4c59c3--------------------------------).

## Przygotowanie skryptów U-Boot

Żeby skonfigurować uruchamianie TFTP na naszej platformie docelowej, użyjemy skryptów U-Boot. Pierwszy nazwiemy boot.scr. Będzie odpowiedzialny za konfigurację klienta TFTP i pobranie następnego skryptu.

Stwórzmy nowy folder i plik o nazwie boot.source.

```bash
$ mkdir bootscripts && cd $_
$ vim boot.source
setenv fileaddr 0xc00000
fatload mmc 0:1 ${fileaddr} uEnv.txt
setenv autoload no
dhcp
env import -t ${fileaddr}
tftpb ${fileaddr} tftp.scr
source ${fileaddr}
```

Ten skrypt załaduje plik uEnv.txt, pobierze adres IP przez DHCP i pobierze tftp.scr z naszego serwera TFTP.

Plik uEnv.txt tylko dostarcza IP naszego serwera, port TFTP i ścieżkę NFS.

```bash
$ vim uEnv.txt
serverip=192.168.0.241
tftpdstp=6900
nfspath=/home/<user>/nfs/
```

Następnie skrypt tftp.scr załaduje nasz obraz i ustawi argumenty startowe dla uruchomienia przez NFS.

```bash
$ vim tftp.source
tftpb ${kernel_addr_r} Image
setenv bootargs root=/dev/nfs rw rootwait console=tty1 console=ttyAMA0,115200 nfsroot=${serverip}:${nfspath},tcp,v3 ip=${ipaddr}
booti ${kernel_addr_r} - ${fdt_addr}
```

Ważne do zapamiętania:

Device tree (DT) można też załadować przez TFTP, ale bootloader Raspberry Pi modyfikuje DT podczas aplikowania nakładek. To prowadzi do problemów z U-Boot. Dlatego pozwolimy bootloaderowi RPI się tym zająć 😅. Więcej można znaleźć [tutaj](https://forums.raspberrypi.com/viewtopic.php?t=314502).

DT znajduje się pod fdt\_addr, więc użyjemy go do uruchomienia.

Żeby włączyć uruchamianie przez NFS, powinniśmy podać ',tcp,v3'. Bez tego możemy napotkać problemy (opisane [tutaj](https://raspberrypi.stackexchange.com/questions/48350/nfsroot-boot-fails-nfs-server-reports-the-request)). Gdy wyłączymy NFS wersji 2, działa tak czy siak.

Na koniec skompilujmy skrypty. Jeśli nie mamy jeszcze narzędzi U-Boot, zainstalujmy je szybko:

```bash
$ sudo apt install u-boot-tools
```

Następnie uruchom:

```bash
$ mkimage -T script -A arm64 -C none -a 0x2400000 -e 0x2400000 -d boot.source boot.scr
Image Name:
Created:      Sat May 13 20:19:55 2023
Image Type:   AArch64 Linux Script (uncompressed)
Data Size:    166 Bytes = 0.16 KiB = 0.00 MiB
Load Address: 02400000
Entry Point:  02400000
Contents:
   Image 0: 158 Bytes = 0.15 KiB = 0.00 MiB
$ mkimage -A arm64 -T script -C none -a 0xC00000 -e 0xC00000 -d tftp.source tftp.scr
Image Name:
Created:      Sat May 13 17:48:39 2023
Image Type:   AArch64 Linux Script (uncompressed)
Data Size:    203 Bytes = 0.20 KiB = 0.00 MiB
Load Address: 00c00000
Entry Point:  00c00000
Contents:
   Image 0: 195 Bytes = 0.19 KiB = 0.00 MiB
```

Łatwym sposobem na poznanie adresów RAM, których możemy użyć, jest skopiowanie sdcard.img przez 'dd' i przerwanie startu. Wtedy możemy użyć

```
U-Boot> printenv
```

żeby wypisać środowisko i przejrzeć adresy ładowania.

## Przygotowanie karty SD

Zamontujmy kartę SD.

```bash
$ sudo mount /dev/sdb1 /mnt/boot
```

Teraz możemy skopiować pliki na kartę.

```bash
$ sudo cp ~/rpi4/buildroot/images/u-boot.bin /mnt/boot/
$ sudo cp ~/rpi4/buildroot/images/bcm2711-rpi-4-b.dtb /mnt/boot/
$ sudo cp -R ~/rpi4/buildroot/images/rpi-firmware/* /mnt/boot/
$ sudo rm /mnt/boot/cmdline.txt
$ sudo cp ~/rpi4/bootscripts/boot.scr ~/rpi4/bootscripts/uEnv.txt /mnt/boot/
```

Następnie edytujemy plik config.txt i odmontowujemy kartę SD.

```bash
$ sudo vim /mnt/boot/config.txt
kernel=u-boot.bin
enable_uart=1
# Jeśli nie jest już ustawione
arm_64bit=1
$ sudo umount /mnt/boot
```

## Przygotowanie katalogu NFS

Rozpakujmy główny system plików do współdzielonego folderu.

```bash
sudo tar -C /home/${USER}/nfs -xf ~/rpi4/build/images/rootfs.tar
```

Żeby zapobiec problemom z własnością, zmienimy ją na root.

```bash
$ sudo chown -R 0:0 ~/nfs/*
```

## Przygotowanie katalogu TFTP

Żeby zmniejszyć ilość kopiowania do folderu TFTP, możemy użyć twardych dowiązań do plików. W ten sposób możemy zmieniać pliki, a przy następnym uruchomieniu użyta będzie nowa wersja. Ważne: dowiązania symboliczne nie są obsługiwane.

```bash
$ cd ~/tftp
$ cp ../rpi4/build/images/Image .
$ cp ../rpi4/bootscripts/tftp.scr .
$ ln ../rpi4/bootscripts/uEnv.txt .
```

Jedna wada - twarde dowiązanie jest usuwane, gdy dowiązanie lub źródło zostanie usunięte. Dzieje się tak również, gdy podczas edycji lub regeneracji stary plik źródłowy jest usuwany. W takim przypadku mogą wystąpić nieprzyjemne niespodzianki. Szybki przykład:

```bash
$ touch source.txt
# Komenda ls -l pokazuje liczbę twardych dowiązań (tutaj 1 lub 2)
$ ls -l
-rw-rw-r-- 1 fp fp        0 May 15 14:10 source.txt
# Teraz tworzymy twarde dowiązanie
$ ln source.txt link.txt
# I licznik jest zwiększony
$ ls -l
-rw-rw-r-- 2 fp fp        0 May 15 14:10 link.txt
-rw-rw-r-- 2 fp fp        0 May 15 14:10 source.txt
# Edycja pliku zmienia też zawartość dowiązania
$ echo "Text" > source.txt
$ cat link.txt
Text
# Nawet gdy źródło jest usunięte, mamy wciąż dostęp do zawartości
$ rm source.txt
# Np. skrypt usuwający i odtwarzający plik może sprawić, że uwierzymy, iż dowiązanie wciąż istnieje
$ touch source.txt
$ cat link.txt
Text
# Ale licznik twardych dowiązań jest zmniejszony
$ ls -l
-rw-rw-r-- 1 fp fp        5 May 15 14:13 link.txt
```

Dlatego sprawdź swoje pliki i jeśli to nie pasuje, po prostu skopiuj.

## Podłączenie RPI

Piny UART to GPIO (14/15) 8/10 i 6 dla masy. Podłączając konwerter USB-UART, musimy skrzyżować TX i RX. Musimy też podłączyć Ethernet i zasilanie.

![Konektor GPIO dla RPIa](/images/imported/posts/tftp-i-nfs-w-rozwoju-embedded-linux/rpi_gpio.webp)

Jedna rzecz, która nie jest uwzględniona w tym artykule, to separacja między platformą docelową a ogólną siecią. Można to osiągnąć osobnym interfejsem sieciowym lub siecią wirtualną.

## Uruchamianie...

Następnie nawiąż połączenie szeregowe przez program taki jak picocom:

```bash
$ picocom -b 115200 /dev/ttyUSB0
```

Po włączeniu Raspberry Pi powinniśmy zobaczyć poniższe logi.

```bash
...
TFTP from server 192.168.0.241; our IP address is 192.168.0.66
Filename 'tftp.scr'.
Load address: 0xc00000
Loading: ##################################################  267 Bytes
         51.8 KiB/s
done
Bytes transferred = 267 (10b hex)
## Executing script at 00c00000
Using ethernet@7d580000 device
TFTP from server 192.168.0.241; our IP address is 192.168.0.66
Filename 'Image'.
Load address: 0x80000
Loading: ################################T T ##################  20.7 MiB
         1.7 MiB/s
done
Bytes transferred = 21658112 (14a7a00 hex)
Moving Image from 0x80000 to 0x200000, end=17f0000
## Flattened Device Tree blob at 2eff2e00
   Booting using the fdt blob at 0x2eff2e00
Working FDT set to 2eff2e00
   Using Device Tree in place at 000000002eff2e00, end 000000002f002fa1
Working FDT set to 2eff2e00

Starting kernel ...
...
[    7.037589]      device=eth0, hwaddr=e4:5f:01:7a:84:ae, ipaddr=192.168.0.66, mask=255.255.255.0, gw=255.255.255.255
[    7.048053]      host=192.168.0.66, domain=, nis-domain=(none)
[    7.053911]      bootserver=255.255.255.255, rootserver=192.168.0.241, rootpath=
[    7.054985] uart-pl011 fe201000.serial: no DMA platform data
[    7.077101] VFS: Mounted root (nfs filesystem) on device 0:17.
[    7.083500] devtmpfs: mounted
[    7.093540] Freeing unused kernel memory: 3648K
[    7.121371] Run /sbin/init as init process
Starting syslogd: OK
Starting klogd: OK
Running sysctl: OK
Seeding 2048 bits without crediting
Saving 2048 bits of non-creditable seed for next boot
Starting network: ip: RTNETLINK answers: File exists
Skipping eth0, used for NFS from 192.168.0.241

Welcome to Buildroot
```

Udało się!!!

Szybko przetestujmy naszą partycję NFS. Uruchommy płytkę i stwórzmy nowy plik na hoście

```bash
$ cd ~/nfs
$ sudo touch test.txt
```

i zweryfikujmy go na platformie docelowej.

```bash
# ls /
bin        lib        media      proc       sbin       var
dev        lib64      mnt        root       sys        tmp
etc        linuxrc    opt        run        test.txt   usr
```

Jak widać, możemy teraz wymieniać i edytować pliki bez dotykania karty SD.

## Końcowe przemyślenia

Przez użycie dwóch skryptów U-Boot możemy łatwo aplikować zmiany do drugiego, bez potrzeby zmiany zawartości karty SD. Jeśli musimy zmodyfikować uEnv.txt, możemy oczywiście skopiować go na kartę lub użyć TFTP i magii U-Boot 😀. Dodajmy 'test 1' do naszego uEnv.txt, załadujmy go z hosta i zapiszmy do partycji startowej.

```bash
...
U-Boot> tftpb 0xc00000 uEnv.txt
Using ethernet@7d580000 device
TFTP from server 192.168.0.241; our IP address is 192.168.0.66
Filename 'uEnv.txt'.
Load address: 0xc00000
Loading: ##################################################  65 Bytes
         12.7 KiB/s
done
Bytes transferred = 65 (41 hex)
U-Boot> save mmc 0:1 ${fileaddr} uEnv.txt ${filesize}
65 bytes written in 27 ms (2 KiB/s)
U-Boot> setenv fileaddr 0xc00000
U-Boot> fatload mmc 0:1 ${fileaddr} uEnv.txt
65 bytes read in 9 ms (6.8 KiB/s)
U-Boot> env import -t ${fileaddr}
## Warning: Input data exceeds 1048576 bytes - truncated
## Info: input data size = 1048578 = 0x100002
U-Boot> printenv test
test=1
```

## Podsumowanie

W tym artykule skonfigurowaliśmy serwer TFTP i NFS. Zbudowaliśmy obraz Linuxa, główny system plików i bootloader używając Buildroot. Następnie skonfigurowaliśmy U-Boot do obsługi uruchamiania sieciowego. Na koniec użyliśmy go do uruchomienia Raspberry Pi 4 przez sieć.

To podejście jest łatwo odtwarzalne dla innych płytek i może drastycznie skrócić czasy iteracji podczas rozwoju. Dlatego warto poświęcić czas na konfigurację 😀.

Mam nadzieję, że się podobało. Dzięki za przeczytanie!

## Dalsze czytanie 🙂

- Mastering Embedded Linux Programming – Third Edition — Frank Vasquez, Chris Simmonds
- [Boot Linux Kernel From NFS (NFSboot)-buildroot](https://ez.analog.com/cfs-filesystemfile/__key/communityserver-discussions-components-files/417/Boot-Linux-Kernel-From-NFS-_2800_NFSboot_29002D00_buildroot_2D00_v2_2D00_20200616_5F00_234604.pdf?_=637279626624460698)
