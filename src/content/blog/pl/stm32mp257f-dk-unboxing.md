---
title: "STM32MP257F-DK: Unboxing"
description: "Płyta deweloperska STM32MP257F-DK firmy ST - hit czy hit ;)"
pubDate: 2025-12-19
author: pl/fabbio-protopapa
tags: ["stm32", "OpenST", "MPU", "armv8"]
category: "płytki deweloperskie"
draft: false
canonicalUrl: "https://tuxownia.pl/blog/stm32mp257f-dk-unboxing/"
externalSource: "tuxownia.pl"
isExternal: true
originalAuthor: "Fabbio Protopapa"
---
Nadchodzą święta więc zrobiłem sobie prezent i muszę się pochwalić 😃. Mikołaj przyniósł mi płytkę deweloperską STM32MP257F-DK. Oferuje ona 64-bitowego ARMa, koprocesora na bazie ARM Cortex-M33 i dedykowany akcelerator AI. I to wszystko w jednym układzie.
W tym artykule przyjrzymy się cechom i funkcjonalnościom serii STM32MP2, ze szczególnym uwzględnieniem płytki deweloperskiej STM32MP257F-DK. Pod koniec uruchomimy płytkę i sprawdzimy jak się z nią połączyć.

## Czym właściwie jest seria STM32MP2?
Seria STM32MP2 to rodzina mikroprocesorów (MPU) od STMicroelectronics, zaprojektowanych do zastosowań przemysłowych. Na co już wskazuje szeroki zakres temperatury pracy od -40 do 125°C. To naturalny następca serii STM32MP1, ale z kilkoma ulepszeniami.
Największa zmiana? **Przejście na 64-bitową architekturę**. Seria STM32MP1 opierała się na 32-bitowym Cortex-A7. STM32MP2 używa Cortex-A35.
Ale to nie wszystko. ST dodał też **dedykowany akcelerator AI (NPU)** o mocy 1.35 TOPS. W czasach, gdy edge AI staje się coraz bardziej popularne, to całkiem dobry ruch.

## STM32MP257F-DK: Płytka deweloperska
STM32MP257F-DK to płytka deweloperska (discovery kit) prezentująca możliwości mikroprocesora STM32MP257F. To kompletna platforma demonstracyjna i deweloperska z mnóstwem peryferiów - od razu gotowa do pracy.

### Specyfikacja sprzętowa
Rzućmy okiem na to, co mamy pod maską:
- **Procesory:**
- Cortex-A35 (dual-core) @ 1.5 GHz - 64-bit
- Cortex-M33 @ 400 MHz - 32-bit
- NPU @ 1.35 TOPS
- GPU
- Trust Zone
- **Pamięć:**
- 4 GB LPDDR4 RAM
- 8 GB eMMC (wbudowana pamięć masowa)
- Slot na kartę microSD
- **Łączność:**
- 2x Gigabit Ethernet
- Ethernet Switch
- USB 3.0 Type-C
- 2x USB 2.0 Type-A
- Wi-Fi 802.11b/g/n
- Bluetooth Low Energy v4.1
- **Wyświetlacz i Multimedia:**
- Wyjście HDMI (do 1080p)
- Złącze LVDS do wyświetlaczy LCD
- Złącze kamery MIPI CSI-2
- Sprzętowa akceleracja H.264
- **Debugowanie:**
- Wbudowany ST-LINK/V3EC do debugowania

### Co jest w pudełku?
Płytka STM32MP257F-DK jest dostarczana z nagraną kartą microSD, zawierającą:
- **OpenSTLinux** - dystrybucja Linuxa oparta na Yocto
- **Oprogramowanie demonstracyjne** - gotowe przykłady do wypróbowania
Innymi słowy - wkładasz kartę, podłączasz zasilanie i jazda.

## Pierwsze kroki: Połącz się ...
![Opis płyty STM32MP257F-DK](/images/imported/posts/stm32mp257f-dk-odpakowywanie/stm32mp257f-dk.webp)
- [ST Wiki: Opis sprzętu](https://wiki.st.com/stm32mpu/wiki/STM32MP257x-DKx_-_hardware_description#Board_connection)
1. Reset
2. Zasilanie i konsola
3. Ethernet
4. USB-Ethernet
5. Karta SD
6. Boot piny

Wkładamy kartę SD w slot SD (5). Podłączamy się za pomocą kabla USB-C do portu USB PWR (2). Też jak zalecane jest zasilanie z 5V/3A. Szybki pomiar z tanim USB-metrem pokazuje pobór prądu z rzędu 300mA. Więc możemy płytkę zasilać z normalnego portu USB-A, co najmniej jeśli nie będziemy jej mocno obciążać. Boot piny ustawiamy na 1-0-0-0 [(opis)](https://wiki.st.com/stm32mpu/wiki/STM32MP257x-DKx_-_hardware_description#Boot_switches).

### ... Przez port szeregowy
Na systemach Linuxowych powinniśmy teraz zobaczyć dwa porty TTY /dev/ttyACM\<X\> i /dev/ttyACM\<X+1\>.
Jak jesteśmy na Ubuntu możemy sobie zainstalować `picocom` prosty terminal do komunikacji przez port szeregowy.
```
sudo apt install picocom
# Jak chcemy używać bez sudo
sudo usermod -aG dialout $USER
# I trzeba się wylogować i na nowo zalogować
```
Aby połączyć się z płytą używamy polecenia:
```
picocom -b 115200 /dev/ttyACM<X>
# Wyjście z picocom
Ctrl-A, Ctrl-X
```

### ... Przez Ethernet over USB
Na płycie mamy trzy interfejsy sieciowe
```
# ip -br a
lo UNKNOWN 127.0.0.1/8 ::1/128
end0 DOWN
usb0 DOWN
wlan0 DOWN
```
Sprawdźmy co się dzieje na płycie. Dystrybucja OpenST używa np. systemd.
```
# systemctl status systemd-networkd -l
* systemd-networkd.service - Network Configuration
Loaded: loaded (/usr/lib/systemd/system/systemd-networkd.service; enabled; preset: enabled)
Active: active (running)
...
Feb 27 18:28:39 stm32mp2-e3-aa-db systemd-networkd[772]: end0: Configuring with /usr/lib/systemd/network/80-wired.network.
...
Feb 27 18:28:40 stm32mp2-e3-aa-db systemd-networkd[772]: usb0: Configuring with /usr/lib/systemd/network/53-usb-otg.network.
```
Jak sobie zerkniemy na pliki konfiguracyjne sieciowe, to zobaczymy że USB-Ethernet ma adres 192.168.7.1/24 a port Ethernet używa DHCP.
```
# cat /usr/lib/systemd/network/53-usb-otg.network
[Match]
Name=usb0
Type=gadget
[Network]
Address=192.168.7.1/24
DHCPServer=yes
KeepConfiguration=yes
[DHCPServer]
ServerAddress=192.168.7.1/24
# cat /usr/lib/systemd/network/80-wired.network
[Match]
Type=ether
Name=!veth*
KernelCommandLine=!nfsroot
KernelCommandLine=!ip
[Network]
DHCP=yes
```
Spróbujmy najpierw nawiązać połączenie przez USB-Ethernet. Więc, wkładamy kabel w port USB DRD (4) i do naszego hosta. Pokaże się nam nowy interfejs sieciowy.
```
sudo ip -br a
...
enxb41adb4445a2 UP 192.168.7.105/24 fe80::d154:ea70:aace:4e0e/64
```
W dmesgu powinniśmy zobaczyć podobny komunikat:
```
sudo dmesg
[ 9944.768820] usb 1-2: USB disconnect, device number 25
[ 9976.926393] usb 1-2: new high-speed USB device number 26 using xhci_hcd
[ 9977.051421] usb 1-2: New USB device found, idVendor=1d6b, idProduct=0104, bcdDevice= 1.00
[ 9977.051432] usb 1-2: New USB device strings: Mfr=1, Product=2, SerialNumber=3
[ 9977.051434] usb 1-2: Product: STM32MP1
[ 9977.051435] usb 1-2: Manufacturer: STMicroelectronics
...
[ 9977.080991] cdc_ncm 1-2:1.0 eth0: register 'cdc_ncm' at usb-0000:00:14.0-2, CDC NCM (NO ZLP),
[ 9977.112222] cdc_ncm 1-2:1.0 enxb41adb4445a2: renamed from eth0
```
I już możemy się dostać na płytkę przez SSH wykorzystując adres z pliku konfiguracyjnego.
```
ssh root@192.168.7.1
The authenticity of host '192.168.7.1 (192.168.7.1)' can't be established.
RSA key fingerprint is SHA256:UPMvOwkgQbPvhVs2ZQ/ttgXBpNV4C3H8GMDqCT6tTaQ.
This host key is known by the following other names/addresses:
~/.ssh/known_hosts:22: [hashed name]
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.7.1' (RSA) to the list of known hosts.
```

### ... Przez sieć
Łączymy się przez port Ethernet (3) do naszej lokalnej sieci. Adres jest przydzielony do interfejsa za pomocą DHCP. Mamy różne sposoby aby się tego dowiedzieć. Jak mamy dostęp przez konsolę możemy go sobie odczytać za pomocą komendy `ip`. Alternatywnie możemy sprawdzić w naszym serwerze DHCP (na ogół nasz domowy router) jaki adres został przydzielony.
Jak nie mamy takiej możliwości możemy wykorzystać np. `nmap` aby wykonać skan sieci. Jak nie jesteśmy pewni czy skan sieci jest dozwolony przez operatora lub może zakłócić działanie innych urządzeń, to lepiej sobie odpuścić 😃.
```
sudo nmap -sn 192.168.0.0/24
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-15 20:56 CET
...
Nmap scan report for 192.168.0.186
Host is up (0.00037s latency).
MAC Address: 10:*:*:*:*:* (STMicrolectronics International NV)
Nmap scan report for 192.168.0.192
...
Nmap done: 256 IP addresses (5 hosts up) scanned in 2.57 seconds
```
Albo spójrzmy na tablicę ARP.
```
ip neigh
192.168.0.186 dev wlp3s0 lladdr 10:*:*:*:*:* STALE
```
I jak to nam jeszcze nie wystarczy 😃, to możemy podsłuchać ruch z `tcpdump`'em i przeanalizować ARP'y.
```
sudo tcpdump -n -e arp
tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on enp0s25, link-type EN10MB (Ethernet), snapshot length 262144 bytes
20:59:05.131862 *:*:*:*:*:* > *:*:*:*:*:*, ethertype ARP (0x0806), length 42: Request who-has 192.168.0.1 tell 192.168.0.4, length 28
```
Czasem trzeba wymusić ruch na sieci jeśli mamy ciche urządzenie, tu nam może pomóc broadcast `ping -c 1 -b 192.168.0.255`.
Jak już mamy adres urządzenia to możemy za pomocą `ssh` się połączyć jak pokazano powyżej.

### Nie mogę się połączyć :(
Warto zwrócić uwagę na diody LED, one zawierają informacje o stanie bootowania.
- Niebieska mruga kiedy Linux jest aktywny na rdzeniu Cortex-A
- Pomarańczowa mruga kiedy mikrokontroler jest uruchomiony (jak ma wgrane przykładowe oprogramowanie)
Jeśli nie możemy się połączyć to warto zresetować urządzenie za pomocą przycisku (1). Bootloader mógł się w takim przypadku zapętlić i czekać na wybór systemu:
```
Terminal ready
1: OpenSTLinux
Enter choice:
```

## Podsumowanie
Poznaliśmy platformę STM32MP2 i jej najważniejsze cechy. A potem uruchomiliśmy urządzenie i przetestowaliśmy różne możliwości łączenia się z nim.
W kolejnych wpisach bardziej szczegółowo przyjrzymy się developmentowi, przykładom AI, lub komunikacji między A35 a M33.
Dzięki za przeczytanie!

## Ciekawostki
- [STM32MP2 Series - Product Page](https://www.st.com/en/microcontrollers-microprocessors/stm32mp2-series.html)
- [STM32MP257F-DK - Discovery Kit](https://www.st.com/en/evaluation-tools/stm32mp257f-dk.html)
- [STM32 MPU Wiki](https://wiki.st.com/stm32mpu/)
- [OpenSTLinux Documentation](https://wiki.st.com/stm32mpu/wiki/STM32MP25_Discovery_kits_-_Starter_Package)
- [Zephyr RTOS - STM32MP257F Support](https://docs.zephyrproject.org/latest/boards/st/stm32mp257f_dk/)
- [Trusted Firmware-A - STM32MP2](https://trustedfirmware-a.readthedocs.io/en/v2.13.0/plat/st/stm32mp2.html)
