---
title: "Utwardzanie npm w czasach Shai-Hulud i innych robaków"
description: "Utwardzanie npm i bezpieczne aktualizowanie paczek w aplikacjach bazujących na Node.js."
pubDate: 2025-11-30
author: pl/fabbio-protopapa
tags: ["utwardzanie", "npm"]
category: "bezpieczeństwo teleinformatyczne"
draft: false
---

## Jak nie dać się zeżreć przez pustynnego robala

Jeśli tworzysz lub chcesz skorzystać z dostępnej aplikacji to szanse są duże że ona używaja npm lub innego menadżera pakietów Noda.  Nawet najmniejszy projekt potrafi mieć kilkaset zależności, a większe… cóż, szkoda gadać.

Każda zależność, to potencjalny wektor ataku. I to nie tylko teoretyczny: fałszywe pakiety, typosquatting, dependency confusion, zhackowane konta maintainerów… lista jest długa.

A potem pojawił się Shai-Hulud.  Tak, ktoś naprawdę nazwał złośliwe oprogramowanie jak gigantycznego czerwiowego potwora z Diuny. 

Atak trafił m.in. w `@ctrl/tinycolor`, rozlał się na ponad 526 paczek, a ucierpiały nawet duże firmy jak CrowdStrike. Dla ciekawych:

- [What Actually Happened? – Phoenix Security](https://phoenix.security/npm-shai-hulud-tinycolor-compromise/)
- [F5 Threat Report](https://community.f5.com/kb/security-insights/f5-threat-report---november-26th-2025/344513)
- [PostHog post-mortem](https://posthog.com/blog/nov-24-shai-hulud-attack-post-mortem)
- [Datadog Security Labs: analiza Shai-Hulud 2.0](https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/)
- [Largest npm Attack in History – Updated](https://jfrog.com/blog/new-compromised-packages-in-largest-npm-attack-in-history/)

W skrócie, jak działa Shai-Hulud?

1. Przejęcie kont maintainerów kilku popularnych projektów.
2. Publikacja nowych wersji paczek zawierające złośliwi kod.
3. Kod infekował developerów i pipeline CI poprzez side-loading skryptów.
4. Worm replikował się na kolejne pakiety publikowane przez ofiary.
## Jak zapobiec infekcji

Na szczęście istnieje kilka praktycznych kroków, które można wdrożyć od razu, bez rakietowej inżynierii.

### 1. Ustaw minimalny wiek release’u przed instalacją

Zablokować automatyczne instalowanie najnowszych wersji, które pojawiły się np. <24h temu. Jest to dobra metoda aby uniknąć problemów z nowym paczkami, i nie tylko dla bezpieczeństwa :).

W tej chwili npm nie wspiera takiej opcji [(issue na githubie)](https://github.com/npm/cli/issues/8570), jednak menadżery jak pnpm [(minimumreleaseage)](https://pnpm.io/settings#minimumreleaseage) i yarn mają. Z tym można ustawić zachowanie na poziomie projektu lub nawet na poziomie systemu.

Dla npm można w tej chwili można wykorzystać nową opcje w [npm-check-updates](https://github.com/raineorshine/npm-check-updates/releases/tag/v18.2.0).
### 2. npm ci w CI/CD

`npm install` to kreatywny, pełen życia proces, który potrafi zdecydować się na „odrobinę inne wersje”.  `npm ci` to jego grzeczny, przewidywalny brat, deterministyczne instalacje oparte o lockfile. I jedyna poprawna opcja w CI lub do pierwszego uruchomienia projektu na komputerze dewelopera.

### 3. Blokowanie skryptów

Złośliwy kod w Shai-Hulud uruchamiał się głównie dzięki lifecycle scripts (`postinstall`).  
Możesz to po prostu globalnie wyłączyć:

```bash
npm config set ignore-scripts true
```

W projekcie, przy komendzie `npm install` lub `ci` możemy dodać flage `--ignore-scripts`. Tylko trzeba o tym pamiętać :).

A co jak pakiet potrzebuje koniecznie taki skrypt? Tu może nam pomóc pakiet `@lavamoat/allow-scripts`. 

```
npm install --save-dev @lavamoat/allow-scripts
```

I możemy ustawiać zachowanie w `packet.json`:

```
{
  "lavamoat": {
    "allowScripts": {
      "keccak": true,
      "core-js": false
    }
  }
}
```

Dokumentacje można znaleźć [tutaj](https://www.npmjs.com/package/@lavamoat/allow-scripts).

### 4. Pomoc w audycie i aktualizacjach

Polecane darmowe narzędzia:
- **[Dependabot](https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide)**: automatyczne PR-y z aktualizacjami (wspiera flagę cooldown) 
- **[GuardDog](https://github.com/DataDog/guarddog)**: wykrywa złośliwe pakiety npm, pypi, golang, i więcej
- **[npm audit](https://docs.npmjs.com/cli/v9/commands/npm-audit)**:  sprawdzanie oprogramowanie na podatności
- **[lockfile-lint](https://www.npmjs.com/package/lockfile-lint)**: walidacja integrity hashy
- **[npm-check-updates](https://www.npmjs.com/package/npm-check-updates)**: pomoc w aktualizacjach

Pakiety się zmieniają, ważne jest wiedzieć kiedy i dlaczego.

## Jak monitorować na bieżąco

Korzystaj z budowanych narzędzi npma:
 
 `npm audit`

Nie wykryje wszystkiego, ale może wskazać zależności z podejrzanych wersji.

Sprawdź logi systemowe:

`journalctl --since "2025-11-23" | grep node`

Korzystaj z skanera bezpieczeństwa, np. guardog

`guarddog scan --path .`

## SBOM czy nie SBOM

to nie jest pytanie. W 2025 SBOM nie jest „nice to have”, tylko absolutną koniecznością.
SBOM (Software Bill of Materials) to pełna lista zależności w danej wersji aplikacji.  

Dzięki temu:
- możesz sprawdzić, czy dana wersja zawiera podatny pakiet,
- możesz szybciej reagować na incydenty,
- masz transparentność w release’ów.

Jak to zrobić? Proste:

`npm sbom --sbom-format spdx > sbom.json`

Jak przechowujesz SBOM dla releasu to masz pewność używanych paczek, licencji, i użytych wersji. Same plusy :).

## Więc co mamy robić?

Npm wprowadza nowe zabezpieczenia, i tak też cały menadżery paczek. Świadomość publiczna  na punkcie bezpieczeństwa rośnie i już nie możemy sobie pozwalać aby lekceważyć ją.

Jednocześnie… druga strona też nie śpi.  Shai-Hulud pokazał, że atakujący potrafią działać szybko, automatycznie i z dużą skalą.

Najlepsze, co możesz zrobić, to:

- nie ufać „świeżym” publikacjom,
- nie wykonywać losowych skryptów podczas instalacji,
- dbać o deterministyczne buildy,
- generować SBOMy,
- i ogólnie - być trochę paranoikiem :).

Bo w ekosystemie JavaScript jeden niewinny `npm install` potrafi być początkiem bardzo złego dnia.