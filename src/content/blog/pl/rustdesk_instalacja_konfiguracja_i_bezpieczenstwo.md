---
title: "RustDesk – instalacja, konfiguracja i bezpieczeństwo"
description: "W tej serii będziemy analizować różne sposoby uruchamiania, budowania, i debugowania aplikacji embedded bez dostępu do fizycznego sprzętu."
pubDate: 2025-12-06
author: pl/fabbio-protopapa
tags: ["IT", "support", "open source"]
category: "otwarte oprogramowanie"
draft: false
---
## Czy to jest w ogóle potrzebne?
Jest wieczór, chcesz mieć święty spokój, a tu nagle dzwoni babcia — „komputer znowu odmówił współpracy!”. No cóż, trzeba działać.  
A jeśli jesteś jak ja i masz już serdecznie dość TeamViewerów, AnyDesków i ich coraz bardziej „odchudzonych” wersji darmowych, to zdradzę ci sekret: **RustDesk**.

To otwarto źródłowe oprogramowanie dostępne na licencji AGPL-3.0. Oferuje szybki zdalny dostęp, pełną kontrolę nad własnymi danymi i zaskakującą prostotę obsługi. A jak sama nazwa wskazuje - napisano je w Rust, co zdecydowanie nie szkodzi, a wręcz pomaga :)

## Jaki pulpit, zdalny?
To są aplikacje (tak jak np. TeamViewer) umożliwiające łączenie i kontrolowanie drugiego komputera. 

W czym to może pomóc:
- kontrolowanie komputera z dowolnego miejsca  
- przesyłanie plików  
- synchronizację schowka  
- administrację systemami  
- udzielanie zdalnego wsparcia technicznego  

## Dlaczego RustDesk
Oprogramowanie w pełni open-source, serwer i klienci. Przez to mamy możliwość samodzielnego hostowania serwera. Komunikacja szyfrowana end-to-end. Protokół umożliwia urządzeniom bezpośrednią komunikacje, z fallbackiem przez serwer relay.
Dostępny jest klient na Windowsa, Linuxa, macOS a nawet Androida. Dobrze słyszałeś. Możemy działać też na komórce!

## Pierwsze kroki

1. Zainstaluj co najmniej 100 dependencje
2. Skompiluj wszystko od zera
3. ...

Spokojnie, tylko się nabijam.

Idź na Githuba, na stronę releasów (w tej chwili mamy wersje 1.4.4)
- [Release 1.4.4 · rustdesk/rustdesk · GitHub](https://github.com/rustdesk/rustdesk/releases/tag/1.4.4)
- Pobierz klienta dla twoją platformę (na pewno coś znajdziesz)
- Zainstaluj klienta
- Po uruchomieniu klienta zobaczysz w dolnym prawym roku okna przycisk aby wystartować serwis (ja mam klienta na Linuxa)

![pasmo informacyjne o stanu serwisu](/images/posts/rustdesk_instalacja_konfiguracja_i_bezpieczenstwo/service_status.webp)

- Po wystartowaniu widzisz po lewej twój identyfikator i hasło OTP przez które można się połączyć na maszynę. Aby połączyć się z innym komputerem, wpisz jego identyfikator w środkowe pole, połącz się i podaj hasło OTP drugiej strony.

![okno odpalonej aplikacji](/images/posts/rustdesk_instalacja_konfiguracja_i_bezpieczenstwo/rustdesk_app_view.webp)

Gotów, i masz zdalną kontrolę nad urządzeniem :).

## Bezpieczeństwo
Komunikacja jest szyfrowana za pomocą kryptografii asymetrycznej i szyfrowaniu typu end-to-end. Więcej na ten temat można znaleźć w tym [wątku](https://github.com/rustdesk/rustdesk/issues/63#issuecomment-855530293).

W aplikacji mamy dostęp do szczegółów połączenia, jak forma łącza (bezpośrednia czy przez relay), czy szyfrowanie jest aktywne czy sygnatura urządzenia. 

![wyświetlona informacja o zabezpieczeniu komunikacji](/images/posts/rustdesk_instalacja_konfiguracja_i_bezpieczenstwo/encrypted_communication.webp)

Serwer nie może odszyfrować ruchu, bo szyfrowanie odbywa się już między klientami, jedynie ma informacje o meta danych. Więcej o tym później.

Aplikacja wspiera sporo ustawień bezpieczeństwa, jak np. IP whitelisting i 2FA z TOTP. 

Jeśli jest taka potrzeba można też ustawić stałe hasło do łączenia, identyfikator jest przypisany przy instalacji do urządzenia. Ale istnieje możliwość jego zmiany.

## Jak działa RustDesk?
Postaram się szybko pokazać Ci, jak ta cała magia działa. Poniższe zdjęcie pokazuje działanie systemu RustDesk. Serwer HBBS jest wykorzystany do wymiany szczegółów potrzebnych do stworzenia połączenia, jak klucz publiczny i adres IP. Klient przed możliwością korzystania z usługi musi się zgłosić do serwera HBBS. 

Aby obie strony mogły się połączyć zastosuje się technologie znaną jako Hole Punching. Wykorzystuje ona serwer, który siedzi pomiędzy dwoma klientami - a Ci z kolei znajdują się za firewallem lub NATem. Jego głównym zadaniem jest informowanie klientów o adresie i porcie, pod którym dostępny jest komputer, z którym do którego chcą nawiązać kontakt. 

![Schemat architektury systemu](/images/posts/rustdesk_instalacja_konfiguracja_i_bezpieczenstwo/rustdesk_architecture.webp)
Źródło: [How does RustDesk work? · rustdesk/rustdesk Wiki · GitHub](https://github.com/rustdesk/rustdesk/wiki/How-does-RustDesk-work%3F)

Teraz mamy dwie możliwe ścieżki komunikacji: hole-punching (bezpośrenidnio z drugą stroną) lub przez serwer relay ( który przekazuje wiadomości dalej, działając jak proxy). 

## Korzystanie z publicznych serwerów RustDesk
Nie musisz hostować własnego serwera aby używać aplikacji. Publiczne serwery RustDeska są przeznaczone raczej do testów, ale można je również wykorzystać do szybkiej i bezproblemowej konfiguracji systemu. I tak w większości przypadków będziemy trenować jedynie serwer HBBS, bo hole-punching na ogół się udaje. 

Dlatego może pojawiać się pytanie, kiedy tego nie używać?
-  Kiedy operator ma wgląd w metadane. 
-  Kiedy jesteśmy zależni od zawnętrznego serwera.
-  Kiedy nie mamy pełnej kontroli nad naszą infrastrukturą.
-  Kiedy nie mamy dostępu do wszystkich opcji bezpieczeństwa. 

## Podsumowanie
RustDesk to szybkie, bezpieczne, otwarte i całkowicie prywatne rozwiązanie do zdalnego pulpitu. Możliwość uruchomienia własnego serwera czyni je wyjątkowym narzędziem dla użytkowników indywidualnych, małych firm oraz dużych organizacji. 
Ma wsparcie dla dużej ilość urządzeń i systemów operacyjnych, i dostarcza klientów gotowych do użycia. Co dla mnie jest fenomenalne to możliwość łączenia się na komórki z Androidem.

## I co dalej?
W następnym wpisie zajmiemy się stawianiem własnego serwer i ustawimy klientów do wykorzystania naszej własnej infrastruktury. 
