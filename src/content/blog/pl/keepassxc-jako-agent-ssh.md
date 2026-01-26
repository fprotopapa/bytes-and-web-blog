---
title: "KeePassXC jako agent SSH"
description: "Jak skonfigurować KeePassXC do zarządzania kluczami SSH — bezpiecznie i wygodnie."
pubDate: 2026-01-26
author: pl/fabbio-protopapa
tags: ["ssh", "keepassxc", "bezpieczeństwo", "linux"]
category: "narzędzia"
draft: false
---

Przechowywanie kluczy prywatnych SSH w postaci plików na dysku to powszechna praktyka, ale nie jedyna opcja. **KeePassXC** potrafi odgrywać rolę agenta SSH — klucz prywatny jest zaszyfrowany w bazie danych i ładowany do agenta tylko wtedy, gdy go potrzebujesz.

## Włączenie integracji z SSH

Otwórz KeePassXC i przejdź do **Tools → Settings → SSH Agent**.

Zaznacz opcję **Enable SSH Agent integration**. Po włączeniu zamknij i otwórz ponownie okno ustawień — powinien pojawić się wykryty socket agenta SSH. Jeśli używasz agenta OpenSSH, a właściwie każdej nowszej dystrybucji Linuksa, wykrycie powinno nastąpić automatycznie. W przeciwnym razie trzeba ustawić zmienną środowiskową dla socketu SSH. Szczegóły zależą od używanego systemu.

## Dodanie klucza do wpisu

1. Utwórz nowy wpis (lub edytuj istniejący).
2. W polu **Password** wpisz hasło do klucza prywatnego (passphrase), jeśli klucz je posiada.
3. Przejdź do zakładki **Advanced** i dodaj plik klucza prywatnego jako **załącznik** (attachment).
4. Przejdź do zakładki **SSH Agent** — z listy rozwijanej wybierz dodany klucz z załączników.

### Opcje ładowania kluczy

W zakładce **SSH Agent** dostępne są dodatkowe opcje:

- **Remove key from agent when database is closed** — klucz zostanie usunięty z agenta po zamknięciu bazy. Zalecane.
- **Add key to agent when database is opened** — klucz ładuje się automatycznie po odblokowaniu bazy (wygodna opcja dla często używanych kluczy, np. git).

Lepszym podejściem jest **ładowanie klucza ręcznie**, gdy jest potrzebny, zamiast automatycznego dodawania przy otwarciu bazy. Dzięki temu klucz trafia do agenta tylko na czas pracy. Jeśli mamy więcej niż pięć kluczy, mogą wystąpić problemy z połączeniem — większość serwerów SSH ma maksymalną liczbę prób logowania ustawioną na pięć.

## Konfiguracja SSH

Po przeniesieniu klucza do KeePassXC możesz uprościć plik `~/.ssh/config`. Usuń dyrektywę (jak jest podana) `IdentityFile` — agent SSH zajmie się dostarczeniem właściwego klucza.

```
Host server
  HostName 192.168.159.223
  User user
  Port 22
```

Możemy usunąć teraz klucze z folderu `~/.ssh` i na nowo zalogować się do systemu. Tak będziemy mieli czysty system bez załadowanych kluczy. Możemy to sprawdzić za pomocą polecenia: `ssh-add -l`.

## Ładowanie klucza i połączenie

Gdy potrzebujesz klucza:

1. Odblokuj bazę KeePassXC.
2. Zaznacz wpis z kluczem i naciśnij **Ctrl+H** (lub kliknij prawym przyciskiem myszy → **Add key to SSH agent**).
3. Połącz się:

```bash
ssh server
```

Klucz zostanie automatycznie użyty przez agenta. Po zamknięciu bazy (jeśli zaznaczono odpowiednią opcję) klucz zniknie z agenta.

## Podsumowanie

Zamiast trzymać klucze prywatne jako pliki w `~/.ssh/`, możesz je przechowywać w zaszyfrowanej bazie KeePassXC i ładować do agenta SSH tylko wtedy, gdy są potrzebne. To prosty sposób na zwiększenie bezpieczeństwa i ułatwienie zarządzanie kluczami.


