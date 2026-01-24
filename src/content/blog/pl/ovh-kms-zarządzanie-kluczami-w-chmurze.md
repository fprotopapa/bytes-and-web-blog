---
title: "OVH KMS — zarządzanie kluczami i sekretami w chmurze"
description: "Jak korzystać z OVH Key Management Service do szyfrowania danych."
pubDate: 2026-01-24
author: pl/fabbio-protopapa
tags: ["bezpieczeństwo", "szyfrowanie", "kms", "ovh", "chmura"]
category: "chmura"
draft: false
---

Key Management Service (KMS) to usługa do zarządzania kluczami kryptograficznymi. Zamiast trzymać główne klucze w konfiguracji aplikacji lub zmiennych środowiskowych, przekazujemy operacje szyfrowania i deszyfrowania do zewnętrznego serwisu [(Fajne ilustracje)](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html).

Zalety:
- **Centralizacja** — jeden punkt zarządzania kluczami dla wielu aplikacji
- **Audyt** — pełna historia operacji kryptograficznych
- **Rotacja kluczy** — automatyczna wymiana kluczy bez modyfikacji aplikacji
- **Separacja** — aplikacja nie ma dostępu do samego klucza, tylko do operacji

Samodzielnie hostowane rozwiązania jak HashiCorp Vault, OpenBao, Infisical lub podobne są potężne, ale wymagają utrzymania infrastruktury, backupów, aktualizacji i monitoringu. Alternatywy zarządzane tych menedżerów sekretów są drogie. Czasem prosty zarządzany KMS może być lepszym wyborem.

## Dlaczego OVH?

OVHcloud to europejski dostawca chmury z siedzibą we Francji. Dane pozostają w UE (nawet mamy do wyboru rejon Warszawy), jak i kasa :). Usługa OKMS (OVHcloud Key Management Service) zawiera zarówno zarządzanie kluczami, jak i menedżer sekretów.

W momencie pisania tego artykułu usługa jest w fazie beta, ale działa stabilnie. Chmura OVH znajduje się nadal w rozwoju, jak można śledzić [tutaj](https://github.com/orgs/ovh/projects/16/views/6?pane=info).

## Przełącz wersje interfejsu

![Przełącznik interfejsu użytkownika](/images/posts/ovh-kms-zarzadzanie-kluczami-i-sekretami-w-chmurze/beta_interfejs.webp)

W panelu OVH przełącz się na interfejs Beta — jest czytelniejszy i bardziej logiczny (co najmniej moim zdaniem).

## Utwórz instancję KMS

W sekcji **Identity, Security & Operations** znajdziesz **Key Management Service**. Utwórz nową instancję KMS wybierając odpowiedni region (np. `eu-central-waw` dla Warszawy). Opłata jest pobierana za każdy klucz, który przechowujemy w KMS-ie.

### Utwórz nowy klucz serwisowy

Service Key to klucz używany do szyfrowania lub podpisywania danych. Możesz utworzyć wiele kluczy dla różnych celów lub aplikacji. Wspierane są klucze asymetryczne i symetryczne.

## Menedżer sekretów

KMS zawiera też Secret Manager do przechowywania haseł, tokenów API itd. Wspiera interfejs kompatybilny z HashiCorp Vault V2.

## Dostęp przez API

Choć znajdziemy sporo informacji o tym, jak ustawić i wywołać komendy za pomocą interfejsu Swagger [(np. tu)](https://support.us.ovhcloud.com/hc/en-us/articles/34887531180435-Using-OVHcloud-Key-Management-Service-KMS), to nie do końca jest opisane postępowanie z poziomu zewnętrznego hosta. Przynajmniej musimy stworzyć nowego klienta z dostępem do naszych zasobów. Do tego możemy wykorzystać tożsamość typu serwis.

Takiego klienta musimy stworzyć za pomocą API REST OVH. Najpierw jednak ustawimy politykę IAM, którą potem przypiszemy do klienta.

## Polityka IAM

W tej samej zakładce co przedtem wchodzimy w `Policies` i tworzymy nową.

Musimy wybrać następujące produkty:
- `Key Management Service & Secret Manager (OKMS)` — główny zasób
- `Key Management Service/Service Keys` — klucze szyfrowania
- `Secret Manager (OKMS)/Secret` — sekrety (opcjonalne)

Nie trzeba ich ręcznie ustawiać. Dodając akcję, powiązane produkty same się wpiszą.

## Potrzebne akcje

Poniższe akcje możemy dodać w polu `Actions added manually`.

```
okms:apikms:serviceKey/decrypt
okms:apikms:serviceKey/encrypt

okms:apikms:secret/get
okms:apikms:secret/version/getData

okms:apiovh:resource/get
```

W utworzonym KMS-ie jest link do interfejsu Swagger — w opisie wywołań znajdziemy potrzebne akcje, na które trzeba zezwolić.

Wpisujemy nazwę polityki i zapisujemy.

## Tworzenie tożsamości typu serwis

Przez [OVHcloud API Console](https://eu.api.ovh.com/console) możemy znaleźć opisy wywołań REST i po uwierzytelnieniu także je wykonać. 

Najpierw stworzymy tożsamość.

- **POST /me/api/oauth2/client** (API v1):

Wpisujemy dowolną nazwę i opis, a jako flow wybieramy `CLIENT_CREDENTIALS`.

```json
{
    "description": "KMS service",
    "flow": "CLIENT_CREDENTIALS",
    "name": "kms"
}
```

W odpowiedzi otrzymamy `client_id` i `client_secret`.

## Zarządzanie tożsamością

Tak jak nie można stworzyć tożsamości typu serwis w interfejsie graficznym, tak też nie jest ona do wyboru w zakładce polityki (albo nie wiem jak). Możemy ją jednak zarządzać przez API.

Pobierz listę dostępnych polityk i znajdź naszą:

**GET /iam/policy** (API v2)

Zaktualizuj politykę, dodając utworzoną tożsamość:

**PUT /iam/policy/{policyId}** (API v2):

```json
{
  "conditions": {
    "operator": "MATCH"
  },
  "identities": [
    "urn:v1:eu:identity:credential:xxxxxx-ovh/oauth2-EU.xxxxxxxxxxxx"
  ],
  "name": "kms",
  "permissions": {
    "allow": [
      {
        "action": "...",
        ...
      }
    ]
  },
  "resources": [
    {
      "urn": "urn:v1:eu:resource:okms:..."
    }
  ]
}
```

Nad przykładem jest zakładka `schema`, gdzie znajdziemy opis możliwych i potrzebnych parametrów.

Więcej szczegółów w dokumentacji: [Managing OVHcloud service accounts via the API](https://support.us.ovhcloud.com/hc/en-us/articles/19909526680467-Managing-OVHcloud-service-accounts-via-the-API).

## Certyfikat dostępu

Z gotową tożsamością i przypisanymi uprawnieniami możemy teraz wygenerować certyfikat.
W panelu KMS utwórz **Access Certificate** i przypisz do niego utworzony serwis. Pobierz i zapisz klucz prywatny oraz certyfikat.

Te pliki są potrzebne do autoryzacji żądań do API KMS.

## Szyfrowanie i deszyfrowanie

Za pomocą KMS-u możemy teraz wykonywać operacje kryptograficzne bez udostępniania tajnego klucza.

### Szyfrowanie

Dane muszą być zakodowane w Base64, inaczej dostaniemy kryptyczne błędy. Ten fakt nie jest (przynajmniej w czasie pisania tego artykułu) dobrze opisany i nawet przykłady używają zwykłych stringów.

```bash
$ echo -n "your secret text" | base64
eW91ciBzZWNyZXQgdGV4dA==
```

Zapytanie wygląda jak poniżej. Jeśli podamy `context`, musimy tę samą wartość użyć przy deszyfrowaniu.

```bash
curl -X 'POST' \
  'https://eu-central-waw.okms.ovh.net/api/<identyfikator zasobu>/v1/servicekey/<identyfikator klucza serwisowego>/encrypt' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "plaintext": "eW91ciBzZWNyZXQgdGV4dA==",
  "context": "some context"
}' \
  --cert certificate.pem \
  --key privatekey.pem
```

Odpowiedź zawiera zaszyfrowany tekst (`ciphertext`).

### Deszyfrowanie

```bash
curl -X 'POST' \
  'https://eu-central-waw.okms.ovh.net/api/<identyfikator zasobu>/v1/servicekey/<identyfikator klucza serwisowego>/decrypt' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "ciphertext": "...",
  "context": "some context"
}' \
  --cert ID_certificate.pem \
  --key ID_privatekey.pem
```

W odpowiedzi otrzymujemy nasz tekst zakodowany w Base64:

```json
{"plaintext":"eW91ciBzZWNyZXQgdGV4dA=="}
```

Pole `context` musi być takie samo przy szyfrowaniu i deszyfrowaniu — służy jako dodatkowe zabezpieczenie (AAD — Additional Authenticated Data).

## Podsumowanie

OVH KMS to dobra alternatywa dla samodzielnie hostowanych menedżerów sekretów lub chmur jak AWS i podobne. Mniej konfiguracji, brak infrastruktury do utrzymania, dane w UE. 
