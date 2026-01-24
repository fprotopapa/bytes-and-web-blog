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

## Utwórz instancje KMS

W sekcji **Identity, Security & Operations** znajdziesz **Key Management Service**. Utwórz nową instancję KMS wybierając odpowiedni region (np. `eu-central-waw` dla Warszawy). Opłata jest pobierana za każdy klucz, który przecymamy w KMSu.

### Utwórz nowy klucz serwisowy.

Service Key to klucz używany do szyfrowania lub podpisania danych. Możesz utworzyć wiele kluczy dla różnych celów lub aplikacji. Wspierane są klucze asymetryczne i symetryczne.

## Menedżer sekretów

KMS zawiera też Secret Manager do przechowywania haseł, tokeny API itd. Wspiera interfejs kompatybilny z interfejsem Hashicorp Vault V2.

## Dostęp przez API

Jak znajdziemy sporo informacji jak ustawić i wywołać komendy za pomocą interfejsu Swagger, to nie do końca jest opisane postępowanie z poziomu zewnętrznego hosta. Co najmniej musimy do tego stworzyć nowego klienta z dostępem do naszych zasobów. Do tego możemy wykorzystać tożsamość typu serwis.
Takiego klienta musimy stworzyć za pomocą interfejsu API REST OVH. Ale najpierw ustawimy politykę IAM, którą sobie potem dopiszemy do klienta.

## Polityka IAM

W tej samej zakładce co przedtem wchodzimy w `Policies` i tworzymy nową.

Musimy wybrać następujące produkty:
- `Key Management Service & Secret Manager (OKMS)` — główny zasób
- `Key Management Service/Service Keys` — klucze szyfrowania
- `Secret Manager (OKMS)/Secret` — sekrety (opcjonalne)

Nie trzeba je ręcznie ustawiać. Dodając akcję, powiązane produkty się samemu wpiszą.

## Potrzebne akcje

Niniejsze akcje możemy dodać w polu `Actions added manually`.

```
okms:apikms:serviceKey/decrypt
okms:apikms:serviceKey/encrypt

okms:apikms:secret/get
okms:apikms:secret/version/getData

okms:apiovh:resource/get
```

W naszym utworzonym KMSu jest link do interfejsu Swagger, w opisie wywołań znajdziemy także potrzebne akcje, które trzeba dozwolić. 

Wpisujemy nazwą polityki i zapisujemy.

## Tworzenie tożsamości typu serwis

Przez [OVHcloud API Console](https://eu.api.ovh.com/console) możemy znaleźć opisy wywołań REST-owych i po autentykacji, także je wykonać. 

Najpierw stworzymy tożsamość.

- **POST /me/api/oauth2/client** (API v1):

Wpisujemy dowolną nazwę i opis, i wybieramy `CLIENT_CREDENTIALS` jako flow.

```json
{
    "description": "KMS service",
    "flow": "CLIENT_CREDENTIALS",
    "name": "kms"
}
```

W odpowiedzi otrzymamy `client_id` i `client_secret`.

## Zarządzanie tożsamością

Tak jak nie można stworzyć tożsamość typu serwis w interfejsu graficznym, także nie jest ona do wyboru w zakładce polityki (Albo nie wiem jak). Jednak możemy ją zarządzać przez API.

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

Z gotową tożsamością i przypisanymi uprawnieniami, możemy teraz wygenerować certyfikat.
W panelu KMS utwórz **Access Certificate** i przypisz do niego serwis. Pobierz i zapisz klucz prywatny i certyfikat.

Te pliki są potrzebne do autoryzacji requestów do API KMS.

## Szyfrowanie i deszyfrowanie

Za pomocą KMSu możemy teraz wykonać operacje kryptograficzne bez udostępniania tajemnego klucza.

### Szyfrowanie

Dane muszą być zakodowane w Base64 inaczej dostaniemy kryptyczne błedy. Ten fakt nie jest (co najmniej pod czas pisania tego artykułu) dobrze opisany i nawet przykłady używają stringy.

```bash
$ echo -n "your secret text" | base64
eW91ciBzZWNyZXQgdGV4dA==
```

Zapytania wygląda jak poniżej pokazane. Jak podamy `context`, to musimy tę samą wartość też użyć przy deszyfrowaniu.

```bash
curl -X 'POST' \
  'https://eu-central-waw.okms.ovh.net/api/<identyfikator zasobu>/v1/servicekey/<idenryfikator klucza serwisowego>/encrypt' \
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
  'https://eu-central-waw.okms.ovh.net/api/<identyfikator zasobu>/v1/servicekey/<idenryfikator klucza serwisowego>/decrypt' \
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
