---
title: "EDPB Website Auditing Tool – narzędzie do audytu zgodności stron z RODO"
description: "Przewodnik po darmowym narzędziu EDPB do audytowania stron internetowych pod kątem zgodności z przepisami o ochronie danych osobowych. Sprawdź jak łatwo przeprowadzić audyt swojej witryny."
pubDate: 2026-01-12
author: pl/fabbio-protopapa
tags: ["RODO", "bezpieczeństwo", "prywatność", "audyt"]
category: "bezpieczeństwo i prywatność"
draft: false
---

Europejska Rada Ochrony Danych (EDPB) udostępniła darmowe narzędzie do audytowania stron internetowych pod kątem zgodności z przepisami o ochronie danych osobowych. **EDPB Website Auditing Tool** to aplikacja, która pomaga audytorom, administratorom i deweloperom stron sprawdzić, czy ich witryny spełniają wymogi RODO.

Najważniejsza zaleta? Darmowa, otwarto-źródłowa i lokalna aplikacja, z którą możemy tworzyć w prosty sposób raporty i na żywo analizować strony. 

## Jak uruchomić aplikację

Narzędzie jest dostępne za darmo na licencji EUPL 1.2. Możesz je pobrać ze strony:
- [Website Auditing Tool](https://code.europa.eu/edpb/website-auditing-tool)

Narzędzie jest dostępne już w formie skompilowanej dla
- Windows
- Linux (pakiet `deb`)
- macOS

Możemy je jednak sami skompilować za pomocą npm.

```
git clone -b 2.0.0 --single-branch https://code.europa.eu/edpb/website-auditing-tool.git
cd website-auditing-tool

npm install

npm run start
```

Jest też dostępny Dockerfile, jednak kontener (przynajmniej u mnie) nie działał poprawnie.

## Jak używać narzędzia

Gdy się wszystko skompiluje, otworzy nam się taki widok.

![Główny interfejs użytkownika](/images/posts/edpb_website_auditing_tool/interface.webp)

Możemy przejść do zakładki `NEW` i dodać informacje o stronie, która nas interesuje. Każdą analizę możemy opisać z tagiem, np. możemy mieć trzy scenariusze:
- Przed akceptacją ciasteczek.
- Po akceptacji.
- I odmowa.

![Zakładka dodawania nowej analizy](/images/posts/edpb_website_auditing_tool/add_search.webp)

W interaktywnym oknie możemy używać strony tak jak użytkownik, ustawiając stan, który chcemy sprawdzić. Po lewej mamy interaktywne okno pokazujące nam podgląd strony. Po prawej widzimy wykryte ciasteczka, lokalną pamięć, stan zabezpieczenia strony za pomocą SSL, połączenia z domenami trzecimi i beacony na stronie. W górnym pasku możemy zatrzymać i zapisać sesję.

![Interaktywne okno, pokazując stronę na żywo i podgląd wyników](/images/posts/edpb_website_auditing_tool/interactive_window.webp)

W raporcie możemy sprawdzić szczegóły, zapisać np. ciastko do naszej bazy wiedzy, lub ocenić wykrytą treść pod punktem zgodności z RODO. Oczywiście możemy też wyeksportować raport.

## Baza ciasteczek 

Możemy sobie sporo pracy zaoszczędzić, jeśli wykorzystamy darmową bazę wiedzy, która zawiera zbiór znanych ciasteczek. Pod poniższym linkiem znajdziemy otwarty projekt, który udostępnia dokładnie taką bazę. I nawet wspiera format potrzebny dla aplikacji EDPB 😀.

- [Open-Cookie-Database](https://github.com/jkwakman/Open-Cookie-Database)

## Podsumowanie

EDPB Website Auditing Tool to świetne narzędzie dla każdego, kto chce:
- Sprawdzić zgodność swojej strony z RODO
- Przeprowadzić profesjonalny audyt
- Udokumentować stan strony pod kątem ochrony danych
- Tworzyć lub sprawdzać aktualność polityki ciasteczek

