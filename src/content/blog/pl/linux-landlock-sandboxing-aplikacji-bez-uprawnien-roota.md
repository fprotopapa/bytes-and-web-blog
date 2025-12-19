---
title: "Linux Landlock – Sandboxing aplikacji bez uprawnień roota"
description: "Dowiedz się jak używać Landlock API do zabezpieczenia aplikacji Linuxowych przez ograniczenie dostępu do systemu plików i sieci"
pubDate: 2025-12-19
author: pl/fabbio-protopapa
tags: ["linux", "bezpieczeństwo", "lsm", "kernel"]
category: "user space"
draft: false
canonicalUrl: "https://tuxownia.pl/blog/linux-landlock-sandboxing-aplikacji-bez-uprawnien-roota/"
externalSource: "tuxownia.pl"
isExternal: true
originalAuthor: "Fabbio Protopapa"
---

Jest druga w nocy, budzi Cię powiadomienie na telefonie – hacker znalazł podatność w twojej aplikacji i teraz może wykraść dostępy do systemów twoich klientów. Jak możemy zapobiec takiemu scenariuszowi?

Do tej pory mieliśmy jedynie możliwość zabezpieczenia aplikacji ze strony systemu, w którym mamy takie rozwiązania jak SELinux czy AppArmor. Możemy również ustawić uprawnienia użytkownika i grup, albo filtrować syscalle przez seccomp. Ale co gdyby deweloper mógł samodzielnie zarządzać uprawnieniami aplikacji?

I tu w grę wchodzi Landlock – mechanizm bezpieczeństwa kernela Linuxa, który pozwala aplikacjom na dobrowolne ograniczenie własnych uprawnień. Bez roota. Bez skomplikowanej konfiguracji. I to w prosty sposób: tylko trzy nowe syscalle.

## Czym jest Landlock?

> Landlock is a Linux Security Module (LSM) that enables unprivileged processes to voluntarily restrict their own access rights.
>
> — Źródło: [Linux Kernel Documentation](https://docs.kernel.org/userspace-api/landlock.html)

Landlock to Linux Security Module wprowadzony w kernelu 5.13, który pozwala zwykłym procesom dobrowolnie ograniczyć własne uprawnienia do zasobów systemowych. Używa path-based access control, czyli definiujesz dokładnie które ścieżki i jakie operacje są dozwolone.

## Dlaczego Landlock?

**Główne zalety:**

1. Działa bez roota
2. Tylko 3 syscalle do nauczenia:
   - `landlock_create_ruleset()` - tworzy zestaw zasad
   - `landlock_add_rule()` - dodaje konkretne reguły dostępu
   - `landlock_restrict_self()` - aplikuje ograniczenia na proces
4. Aplikacje działają na starszych kernelach (z mniejszą ochroną lub bez)
5. Używane przez systemd, Chromium, Pacman

Landlock działa na zasadzie **deny-by-default**: domyślnie wszystko jest zablokowane. Musisz jawnie zdefiniować co jest dozwolone. To odwrotność normalnego zachowania systemów Unix gdzie wszystko jest dozwolone dopóki czegoś nie zabronisz.

Mamy trzy kroki aby zabezpieczyć aplikację:

1. Stwórz ruleset → Zdefiniuj jakie typy dostępu chcesz kontrolować.
    - Handled_access - jakie uprawnienia chcesz w ogóle kontrolować (np. czytanie, pisanie).

2. Dodaj reguły → Określ konkretne ścieżki i dozwolone operacje.
    - Allowed_access - co konkretnie jest dozwolone dla danej ścieżki

3. Zastosuj reguły → Aktywuj ograniczenia dla procesu.
    - Ustalone reguły są przestrzegane i ograniczenia przechodzą na procesy potomne (fork, exec).

### Pseudo kod:
```c
// Chcę kontrolować czytanie i pisanie
ruleset = create_ruleset(READ | WRITE);

// /usr może być czytane
add_rule(ruleset, "/usr", READ);

// /tmp może być czytane i pisane
add_rule(ruleset, "/tmp", READ | WRITE);

// Wszystko inne: zablokowane!
restrict_self(ruleset);
```
Po `restrict_self()` proces (i jego dzieci) mogą tylko czytać z `/usr` i czytać/pisać do `/tmp`. Próba dostępu do `/home` lub `/etc` zakończy się `EACCES`.

## Zbudujmy zamek z piasku :)

Aplikacja umożliwia uruchomienie oprogramowania przez wiersz poleceń i ustawienie uprawnień przez plik konfiguracyjny. Cały kod jest dostępny tu [Landlock - Sandbox](https://codeberg.org/fprotopapa/landlock-sandbox). W mainie wczytujemy konfigurację i parametry które są przekazane przez wiersz poleceń. Potem tworzymy ruleset, dodajemy uprawnienia do ścieżek i sieci, i następnie aktywujemy landlock. Na końcu uruchamiamy oprogramowanie w którym chcemy ograniczyć dostęp.

```c
// sandbox.cpp
int main(int argc, char* argv[], char *const *const envp) {
    ...
    landlock.create_ruleset(fs_restrictions, net_restrictions);

    for (auto& it : path_perms) {
        landlock.add_rule(it.first, it.second);
    }
    ...
    if (net_port >= 0) {
        landlock.add_net_rule(static_cast<__u64>(net_port), net_permissions);
    ...
    landlock.restrict_self(no_new_priv);
    ...
    execvpe(cmd_args_c[0], cmd_args_c.data(), envp);
}
```

Teraz możemy przejść do pliku `landlock.cpp` i przeanalizować implementację. Na początek potrzebujemy nagłówka `landlock.h`.

```c
#include <linux/landlock.h>
```

Poniżej są wszystkie dostępne uprawnienia aż do ABI v5. Polecam przeczytać komentarze w nagłówku `landlock.h`, tam jest wspaniały opis wszystkich symboli :).

```c
...
static const std::map<std::string, __u64> LANDLOCK_FS_MAP = {
    {"execute",         LANDLOCK_ACCESS_FS_EXECUTE},
    {"read_file",       LANDLOCK_ACCESS_FS_READ_FILE},
    {"write_file",      LANDLOCK_ACCESS_FS_WRITE_FILE},
    {"read_dir",        LANDLOCK_ACCESS_FS_READ_DIR},
    {"remove_dir",      LANDLOCK_ACCESS_FS_REMOVE_DIR},
    {"remove_file",     LANDLOCK_ACCESS_FS_REMOVE_FILE},
    {"make_char",       LANDLOCK_ACCESS_FS_MAKE_CHAR},
    {"make_dir",        LANDLOCK_ACCESS_FS_MAKE_DIR},
    {"make_reg",        LANDLOCK_ACCESS_FS_MAKE_REG},
    {"make_sock",       LANDLOCK_ACCESS_FS_MAKE_SOCK},
    {"make_fifo",       LANDLOCK_ACCESS_FS_MAKE_FIFO},
    {"make_block",      LANDLOCK_ACCESS_FS_MAKE_BLOCK},
    {"make_sym",        LANDLOCK_ACCESS_FS_MAKE_SYM},

    /* ABI v2 */
    {"refer",           LANDLOCK_ACCESS_FS_REFER},

    /* ABI v3 */
    {"truncate",        LANDLOCK_ACCESS_FS_TRUNCATE},

    /* ABI v5 */
    {"ioctl_dev",       LANDLOCK_ACCESS_FS_IOCTL_DEV},
};

static const std::map<std::string, __u64> LANDLOCK_NET_MAP = {
    /* ABI v4 */
    {"bind_tcp",         LANDLOCK_ACCESS_NET_BIND_TCP},
    {"connect_tcp",       LANDLOCK_ACCESS_NET_CONNECT_TCP},
};
```

Następnie mamy trzy nowe syscalle `landlock_create_ruleset`, `landlock_add_rule`, `landlock_restrict_self`.

```c
...
static inline int sys_create_ruleset(
    const struct landlock_ruleset_attr *attr,
    size_t attr_size,
    __u32 flags
) {
    return syscall(__NR_landlock_create_ruleset, attr, attr_size, flags);
}

static inline int sys_add_rule(
    int ruleset_fd,
    enum landlock_rule_type rule_type,
    const void *rule_attr,
    __u32 flags
) {
    return syscall(__NR_landlock_add_rule, ruleset_fd, rule_type, rule_attr, flags);
}

static inline int sys_restrict_self(
    int ruleset_fd,
    __u32 flags
) {
    return syscall(__NR_landlock_restrict_self, ruleset_fd, flags);
}
```

Aby stworzyć nowy ruleset musimy dostarczyć strukturę `landlock_ruleset_attr`, która zawiera bitmaski uprawnień które mają zostać domyślnie zablokowane. W zależności od wersji ABI mamy pole na uprawnienia systemu plików i sieci. Ważny krok to dostosowanie uprawnień do ABI. Syscall bez parametrów zwraca nam dostępną wersję.

```c
...
int Landlock::create_ruleset(
        const std::vector<std::string>& fs_restr,
        const std::vector<std::string>& net_restr) {
        ...
            struct landlock_ruleset_attr ruleset_attr = {
        .handled_access_fs = fs_access,
        .handled_access_net = net_access,
    };

    int abi = sys_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);
    if (abi < 0) {
        /* Degrades gracefully if Landlock is not handled. */
        std::cerr << "The running kernel doesn't support Landlock API\n";
        return 0;
    }

    switch (abi) {
    case 1:
        /* Removes LANDLOCK_ACCESS_FS_REFER for ABI < 2 */
        ruleset_attr.handled_access_fs &= ~LANDLOCK_ACCESS_FS_REFER;
        __attribute__((fallthrough));
    case 2:
        /* Removes LANDLOCK_ACCESS_FS_TRUNCATE for ABI < 3 */
        ruleset_attr.handled_access_fs &= ~LANDLOCK_ACCESS_FS_TRUNCATE;
        __attribute__((fallthrough));
    case 3:
        /* Removes network support for ABI < 4 */
        ruleset_attr.handled_access_net &=
            ~(LANDLOCK_ACCESS_NET_BIND_TCP |
            LANDLOCK_ACCESS_NET_CONNECT_TCP);
        __attribute__((fallthrough));
    case 4:
        /* Removes LANDLOCK_ACCESS_FS_IOCTL_DEV for ABI < 5 */
        #ifdef LANDLOCK_ACCESS_FS_IOCTL_DEV
        ruleset_attr.handled_access_fs &= ~LANDLOCK_ACCESS_FS_IOCTL_DEV;
        #endif
        break;
    }

    ruleset_fd = sys_create_ruleset(&ruleset_attr, sizeof(ruleset_attr), 0);
    ...
}
```

Żeby dodać ścieżkom uprawnienia musimy dostarczyć strukturę `landlock_path_beneath_attr` zawierającą deskryptor pliku ścieżki i bitmaskę uprawnień.

```c
int Landlock::add_rule(
        const std::string path,
        std::vector<std::string>& fs_perms) {
    int path_fd;
    struct landlock_path_beneath_attr path_beneath = {0};

    if (open_path(path, path_fd) < 0) {
        return -1;
    }

    __u64 fs_access = make_allowed_mask(fs_perms);
    path_beneath.parent_fd = path_fd;
    path_beneath.allowed_access = fs_access;

    if (sys_add_rule(ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path_beneath, 0) < 0)
    ...
}
```

Uprawnienia sieciowe dopisywane są do ruleseta.

```c
sys_add_rule(ruleset_fd, LANDLOCK_RULE_NET_PORT, &net_port, 0)
```

Na koniec wywołujemy `landlock_restrict_self`. Ten syscall zwróci nam błąd jeśli proces nie ma ustawionej flagi `PR_SET_NO_NEW_PRIVS`. Bez tej flagi proces może po zastosowaniu restrykcji eskalować swoje uprawnienia, np. przez wywołanie binarki z flagą `setuid`.


```c
...
int Landlock::restrict_self(bool no_new_privs) {
    /* Set no_new_privs (required before landlock_restrict_self) */
    ...
        if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) < 0)
    ...
    /* Apply the ruleset */
    if (sys_restrict_self(ruleset_fd, 0) < 0)
    ...
}
```

## Jak zintegrować landlock do swojej aplikacji

**Strategia wyboru uprawnień:**
- Zaczynaj od minimum: tylko `READ_FILE` + `READ_DIR`
- Dodawaj uprawnienia stopniowo gdy aplikacja tego potrzebuje
- Testuj czy wszystko działa z ograniczeniami
- Dokumentuj dlaczego każde uprawnienie jest potrzebne

## Wersje ABI

Landlock ewoluował przez kilka wersji kernela. Każda wersja ABI dodaje nowe możliwości:

| ABI | Kernel | Kluczowa funkcja |
|-----|--------|------------------|
| **1** | 5.13 | Podstawowe ograniczenia filesystem |
| **2** | 5.19 | `REFER` - kontrola rename/link |
| **3** | 6.2 | `TRUNCATE` - skracanie plików |
| **4** | 6.7 | Network - TCP bind/connect |
| **5** | 6.10 | `IOCTL_DEV` - IOCTL na urządzeniach |
| **6** | 6.12 | IPC - signals, abstract sockets |


## Pułapka z deskryptorem

Deskryptor pliku otwarty przed zastosowaniem uprawnień pozostaje dostępny.

```c
int fd = open("/etc/passwd", O_RDONLY);  // Otwórz PRZED sandbox

apply_landlock_sandbox();

// To nadal działa! FD już otwarty
char buf[1024];
read(fd, buf, sizeof(buf));
```

Rozwiązanie: Zamykaj wszystkie deskryptory przed syscallem `restrict_self` albo używaj `O_CLOEXEC` z syscallamy `open*`.

## Jak mogę sobie przetestować aplikację?

To proste :). Skompiluj aplikację dostępną tutaj: [Landlock - Sandbox](https://codeberg.org/fprotopapa/landlock-sandbox). Sprawdź sobie jak wpływają ustawienia na zachowanie aplikacji.

Aplikacja `vulnerable_server.py` pozwala na wywołanie komend na plikach systemowych, co ułatwia zapoznanie się z zachowaniem API.

```bash
./sandbox -- python3 vulnerable_server.py
```

## Czy mój kernel wspiera Landlocka?

Sprawdź w swoim systemie:
```bash
dmesg | grep landlock
uname -r
```

## Podsumowanie

Landlock wprowadza rewolucję w bezpieczeństwie aplikacji Linuxowych, umożliwiając deweloperom bezpośrednie wprowadzanie ograniczeń dostępu do ścieżek i socketów. Development nad Landlockiem nadal nie jest skończony i dalsze ulepszenia zostaną wprowadzone.

Mam nadzieję, że Ci się podobało. Dzięki za przeczytanie!

## Dokumentacja i źródła:

- [Linux Kernel Landlock Documentation](https://docs.kernel.org/userspace-api/landlock.html)
- [Rust `landlock` crate](https://crates.io/crates/landlock)
- [Go `go-landlock`](https://github.com/landlock-lsm/go-landlock)
- [Landlock.io](https://landlock.io)
- [Landlock Man Page](https://www.man7.org/linux/man-pages/man7/landlock.7.html)


