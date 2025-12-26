---
title: "Szyfrowanie (maila) - za pomocą GPG"
description: "Utworzymy klucze przy użyciu GPG i zabezpieczymy komunikację e‑mail."
pubDate: 2025-12-26
author: pl/fabbio-protopapa
coverImage: "/images/posts/email-encryption-best-practices.jpg"
tags: ["bezpieczeństwo", "szyfrowanie", "email", "gpg", "pgp"]
category: "bezpieczeństwo"
draft: false
---
## Wprowadzenie
Zróbmy szybkie świąteczne szyfrowanie, żeby nawet Święty Mikołaj nie mógł się dobrać do naszych wiadomości. Do tego zastosujemy GPG (GNU Privacy Guard) - to wolno dostępna implementacja OpenPGP. PGP (Pretty Good Privacy), brzmi dobrze 😃.
## Instalacja
Jeśli nie masz zainstalowanej paczki GPG, to z dużym prawdopodobieństwem będzie dostępna w menedżerze paczek twojej dystrybucji.
```
$ sudo apt install gpg
```
Po wspisaniu komendy `gpg --version` zobaczymy poza wersją GPG, także wspierane szyfry i algorytmy.
```
gpg (GnuPG) 2.4.4
libgcrypt 1.10.3
Copyright (C) 2024 g10 Code GmbH
License GNU GPL-3.0-or-later <https://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Home: /home/jdoe/.gnupg
Supported algorithms:
Pubkey: RSA, ELG, DSA, ECDH, ECDSA, EDDSA
Cipher: IDEA, 3DES, CAST5, BLOWFISH, AES, AES192, AES256, TWOFISH,
CAMELLIA128, CAMELLIA192, CAMELLIA256
Hash: SHA1, RIPEMD160, SHA256, SHA384, SHA512, SHA224
Compression: Uncompressed, ZIP, ZLIB, BZIP2
```
Możemy sobie sprawdzić czy nasza wersja jest nadal wspierana czy powinniśmy ją zaktualizować.
- https://www.gnupg.org/download/
## Tworzymy nową tożsamość
  Na początek ostrzegam 😃 GPG używa słowa ‘klucz’ w różnych kontekstach.
  > Part of the challenge of understanding gpg key management documentation is the flexibility in the definition of the word ‘key’. It can refer to a specific private or public key, or to a particular key pair, or to the OpenPGP ‘certificate’ that defines a suite of information associated with a key or set of keys.
  >- [Anatomy of a GPG key](https://davesteele.github.io/gpg/2014/09/20/anatomy-of-a-gpg-key/)

  Komenda `gpg --full-generate-key` jest interaktywną komendą która nas przeprowadzi przez proces generowania kluczy. Jeśli nie mamy specyficznych potrzeb co do szyfru możemy użyć wyboru domyślnego.
```
~ gpg --full-generate-key
gpg (GnuPG) 2.4.4; Copyright (C) 2024 g10 Code GmbH
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
gpg: keybox '/tmp/gpg-test/pubring.kbx' created
Please select what kind of key you want:
(1) RSA and RSA
(2) DSA and Elgamal
(3) DSA (sign only)
(4) RSA (sign only)
(9) ECC (sign and encrypt) *default*
(10) ECC (sign only)
(14) Existing key from card
Your selection?
Please select which elliptic curve you want:
(1) Curve 25519 *default*
(4) NIST P-384
(6) Brainpool P-256
Your selection?
```
Potem możemy ustawić czas ważności klucza. **Ważność klucza to nie to samo co jego unieważnienie**. Klucze nie powinny być bezterminowe, ich ważność zawsze można przedłużyć. Jego zadaniem jest unieważnienie klucza w przypadku gdy utracimy dostęp do prywatnego klucza, lub pełni funkcje czuwaka. Dodatkowo zmusza nas do przemyślenia wykorzystanych przez nas ustawień, możemy np. sprawdzić bezpieczeństwo stosowanych szyfrów. Długość wybranego okresu zależy od naszej analizy zagrożeń. Ale dobry czas na klucze do codziennego użytku to 1-2 lat. Nasz główny klucz może mieć większą wartość.
```
Please specify how long the key should be valid.
0 = key does not expire
<n> = key expires in n days
<n>w = key expires in n weeks
<n>m = key expires in n months
<n>y = key expires in n years
Key is valid for? (0) 2y
Key expires at Sat 25 Dec 2027 05:59:52 PM CET
Is this correct? (y/N) y
```
Nasz główny klucz jest powiązany z jedną lub z wieloma tożsamościami.
```
GnuPG needs to construct a user ID to identify your key.
Real name: John Doe
Email address: jdoe@example.com
Comment:
You selected this USER-ID:
"John Doe <jdoe@example.com>"
Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? O
```
Jeszcze musimy poddać hasło, które będzie chronił nasz klucz prywatny i generujemy klucze. 
```
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.
```
GPG automatycznie tworzy nam certyfikat do unieważnienia klucza. Warto zapisać ten certyfikat w bezpiecznym miejscu. Nawet bez dostępu do prywatnego klucza możemy z tym plikiem cofnąć nasze klucze.
```
gpg: /home/jdoe/.gnupg/trustdb.gpg: trustdb created
gpg: directory '/home/jdoe/.gnupg/openpgp-revocs.d' created
gpg: revocation certificate stored as '/home/jdoe/.gnupg/openpgp-revocs.d/FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C.rev'
```
Teraz mamy dwie pary kluczy. Pierwszy to nasz główny klucz (primary key), którego można użyć do podpisywania danych (S) i certyfikatów (C). Drugi klucz służy do szyfrowania (E), i jest kluczem podrzędnym (sub). GPG zawsze tworzy dwa oddzielne klucze do podpisywania i szyfrowania. Pozatym widzimy algorytm stosowany i ważność klucza. Tożsamość naszego głównego klucza jest jego odcisk palca (fingerprint) `FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C`.
```
public and secret key created and signed.
pub ed25519 2025-12-25 [SC] [expires: 2027-12-25]
FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C
uid John Doe <jdoe@example.com>
sub cv25519 2025-12-25 [E] [expires: 2027-12-25]
```
  Komenda `gpg -K` wyświetli nam prywatne klucze a `gpg -k` publiczne. W wierszu `uid [ultimate] John Doe <jdoe@example.com>` mamy poza informacją o powiązanej tożsamości też informację o stopniu zaufaniu, które udzielimy kluczowi. `ultimate` to stopień, który powinny mieć jedynie nasze własne klucze.
```
~ gpg -K
gpg: checking the trustdb
gpg: marginals needed: 3 completes needed: 1 trust model: pgp
gpg: depth: 0 valid: 1 signed: 0 trust: 0-, 0q, 0n, 0m, 0f, 1u
gpg: next trustdb check due at 2027-12-25
/home/jdoe/.gnupg/pubring.kbx
-------------------------
sec ed25519 2025-12-25 [SC] [expires: 2027-12-25]
FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C
uid [ultimate] John Doe <jdoe@example.com>
ssb cv25519 2025-12-25 [E] [expires: 2027-12-25]
```
My możemy zawsze edytować nasz klucz. Możemy dodać klucze, dodać tożsamości, przedłużyć ważność, itd. Dobrym zwyczajem jest nie używać naszego głównego klucza do niczego poza podpisaniem innych kluczy. Dlatego dodamy sobie najpierw nowy klucz i zmienimy ważność naszych kluczy do szyfrowania i do podpisu na jeden rok.
```
~ gpg --edit-key FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C
...
gpg> addkey

Please select what kind of key you want:
(3) DSA (sign only)
(4) RSA (sign only)
(5) Elgamal (encrypt only)
(6) RSA (encrypt only)
(10) ECC (sign only)
(12) ECC (encrypt only)
(14) Existing key from card
Your selection? 10

Please select which elliptic curve you want:
(1) Curve 25519 *default*
(4) NIST P-384
(6) Brainpool P-256
Your selection?

Please specify how long the key should be valid.
0 = key does not expire
<n> = key expires in n days
<n>w = key expires in n weeks
<n>m = key expires in n months
<n>y = key expires in n years
Key is valid for? (0) 1y
Key expires at Fri 25 Dec 2026 06:09:39 PM CET
Is this correct? (y/N) y

Really create? (y/N) y
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.

sec ed25519/90D8B8CF09E0A29C
created: 2025-12-25 expires: 2027-12-25 usage: SC
trust: ultimate validity: ultimate
ssb cv25519/313A048A9F9DCC52
created: 2025-12-25 expires: 2027-12-25 usage: E
ssb ed25519/12A1B15D90713E21
created: 2025-12-25 expires: 2026-12-25 usage: S
[ultimate] (1). John Doe <jdoe@example.com>

gpg> key 1
sec ed25519/90D8B8CF09E0A29C
created: 2025-12-25 expires: 2027-12-25 usage: SC
trust: ultimate validity: ultimate
ssb* cv25519/313A048A9F9DCC52
created: 2025-12-25 expires: 2027-12-25 usage: E
ssb ed25519/12A1B15D90713E21
created: 2025-12-25 expires: 2026-12-25 usage: S
[ultimate] (1). John Doe <jdoe@example.com>

gpg> expire
Changing expiration time for a subkey.
Please specify how long the key should be valid.
0 = key does not expire
<n> = key expires in n days
<n>w = key expires in n weeks
<n>m = key expires in n months
<n>y = key expires in n years
Key is valid for? (0) 1y
Key expires at Fri 25 Dec 2026 06:10:39 PM CET
Is this correct? (y/N) y

sec ed25519/90D8B8CF09E0A29C
created: 2025-12-25 expires: 2027-12-25 usage: SC
trust: ultimate validity: ultimate
ssb* cv25519/313A048A9F9DCC52
created: 2025-12-25 expires: 2026-12-25 usage: E
ssb ed25519/12A1B15D90713E21
created: 2025-12-25 expires: 2026-12-25 usage: S
[ultimate] (1). John Doe <jdoe@example.com>

gpg> save
```
Jedna rzecz, o której trzeba pamiętać, to, że dodanie większej liczby podrzędnych kluczy do np. szyfrowania nie umożliwia nam ustalenia ich sposobu użytkowania. To znaczy, domyślnie GPG wybierze sobie (na ogół) najnowszy aktywny klucz. Co może spowodować nie przewidziane zachowanie, np. szyfrowanie innym kluczem niż chcieliśmy. Standardowa struktura aktywnych kluczy powinna wyglądać tak, jak pokazuję poniżej:
```
Primary key:   [C]
Subkey #1:     [S]
Subkey #2:     [E]
Subkey #3:     [A]  (możliwość użycia do SSH)
```
To też znaczy że używanie więcej tożsamości niż jednej nie daje nam możliwości użycia oddzielnych kluczy do nich.
## Backup
Do odzyskania kluczy potrzebny jest nam pełny zapis kluczy prywatnych.
```
gpg --homedir /tmp/gpg-test --armor --export-secret-keys jdoe@example.com > jdoe@example.com.asc
```
Dodatkowo możemy zapisać certyfikat unieważnienia.
```
ls /home/jdoe/.gnupg/openpgp-revocs.d/FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C.rev
# Jak nie mamy to zawsze możemy nowe stworzyć
gpg --armor --gen-revoke jdoe@example.com > revoke.asc
```
Komendy GPG pozwalają nam podawać odcisk palca lub szukać po identyfikatorach, na pewno spróbują znaleźć coś trafnego 😃.  Flaga `armor` oznacza eksport w formie tekstowej zakodowanej w Base64.
Publiczne klucze możemy eksportować w poniższy sposób. Inni potrzebują nformacji z tego, żeby się z nami komunikować w formie szyfrowanej lub sprawdzać nasze podpisy.
```
gpg --armor --export jdoe@example.com > jdoe@example.com.pub.asc
```
  Przed dalszym postępowaniem musimy sprawdzić nasz backup.
```
mkdir /tmp/gpg-test
chmod 700 /tmp/gpg-test
gpg --homedir /tmp/gpg-test --import jdoe@example.com.asc
# Sprawdź czy wszystko jest jak powinno
gpg --homedir /tmp/gpg-test -K --with-subkey-fingerprints
rm -rf /tmp/gpg-test
```
**Ważne** , żeby zaszyfrować swój backup i trzymać go w bezpiecznym miejscu.
## Usuwamy główny klucz
Aby zwiększyć bezpieczeństwo możemy usunąć główny klucz. W taki sposób na naszym urządzeniu do codziennego użytku mamy tylko klucze do podpisu i szyfrowania. Aby przedłużyć ważność naszych kluczy możemy zaimportować nasz główny klucz na czasz aktualizacji lub najlepiej wykonać tę czynność na oddzielnym i zabezpieczonym urządzeniu.
Najpierw eksportujemy klucze podrzędne.
```
gpg --armor --export-secret-subkeys jdoe@example.com > jdoe@example.com-subkeys.asc
```
I usuwamy klucz i potwierdzamy million i dwa razy że jesteśmy tego pewni 😃.
```
gpg --delete-secret-keys jdoe@example.com
gpg (GnuPG) 2.4.4; Copyright (C) 2024 g10 Code GmbH
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
sec ed25519/90D8B8CF09E0A29C 2025-12-25 John Doe <jdoe@example.com>
Delete this key from the keyring? (y/N) y
This is a secret key! - really delete? (y/N) y
```
Importujemy nasze klucze podrzędne:
```
gpg --import jdoe@example.com-subkeys.asc
gpg: key 90D8B8CF09E0A29C: "John Doe <jdoe@example.com>" not changed
gpg: To migrate 'secring.gpg', with each smartcard, run: gpg --card-status
gpg: key 90D8B8CF09E0A29C: secret key imported
gpg: Total number processed: 1
gpg: unchanged: 1
gpg: secret keys read: 1
gpg: secret keys imported: 1
```
I sprawdzamy. To `sec#` nam pokazuje że brakuje prywatnego klucza.
```
~ gpg -K
/home/jdoe/.gnupg/pubring.kbx
-------------------------
sec# ed25519 2025-12-25 [SC] [expires: 2027-12-25]
FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C
uid [ultimate] John Doe <jdoe@example.com>
ssb cv25519 2025-12-25 [E] [expires: 2026-12-25]
ssb ed25519 2025-12-25 [S] [expires: 2026-12-25]
```
## Publikujemy nasze klucze
Aby ułatwić odnalezienie naszych kluczy możemy je publikować na serwerach kluczowych. `keys.openpgp.org` - to jeden z najbardziej popularnych. Serwer jest hostowany na infrastrukturze Hetznera i sporządzany przez [społeczność OpenPGP](https://gitlab.com/keys.openpgp.org/governance/).
Przed publikacją musimy potwierdzić, że adres mailowy, który podaliśmy w identyfikatorze jest nasz. 
```
gpg --keyserver keys.openpgp.org --send-keys FABB90C80AEFBFFFA0C7344390D8B8CF09E0A29C
# Przechodzimy weryfikacje mailową i od teraz jesteśmy widoczni (można nas odnaleźć):
gpg --keyserver keys.openpgp.org --search-keys jdoe@example.com
```
## WKD
Jak mamy własną domenę i możemy dodać wpis do DNSu, to możemy sobie dodatkowo ustawić WKD (Warszawska Kolej Dojazdowa, jak zażartowała moja żona .. nie to, Web Key Directory). WKD ułatwia dostarczanie kluczy publicznych dla adresu mailowego za pomocą domeny i zabezpieczenia przez HTTPS.
Klient mailowy tworzy URLa w formie:
```
$ gpg-wks-client --print-wkd-url jdoe@example.com
https://openpgpkey.example.com/.well-known/openpgpkey/example.com/hu/4pkteh5be3b3shuzepabpupwbi95cirz?l=jdoe
```
Serwer `keys.openpgp.org` umożliwia nam używanie jego do celów udostępniania WKD dla naszej domeny.  Musimy jedynie dodać wpis CNAME jak pokazano poniżej.
```
openpgpkey.example.com. 300 IN CNAME wkd.keys.openpgp.org.
```
I możemy przetestować czy wszystko działa. W tym przypadku dostosowałem przykład, bo oczywiście nie mam dostępu do domeny example.com ani do maila `jdoe@example.com`.
```
$ curl 'https://wkd.keys.openpgp.org/status/?domain=openpgpkey.example.com'
CNAME lookup ok: openpgpkey.example.org resolves to wkd.keys.openpgp.com
$ gpg --locate-keys --auto-key-locate clear,nodefault,wkd jdoe@example.com
```
## A co z folderem .gnupg
Warto dodać folder `.gnupg` do backupu. **Ważne** , żeby zaszyfrować backup.  Do szyfrowania możemy użyć GPG, np. za pomocą AES256.
```
tar czvf gnupg-backup.tar.gz .gnupg/
gpg --symmetric --cipher-algo AES256 gnupg-backup.tar.gz
rm gnupg-backup.tar.gz
# Store backup and passphrase
# Decrypt
gpg --decrypt gnupg-backup.tar.gz.gpg | tar xzv
```

Po co nam folder `.gnupg`?

Zawiera importowane klucze publiczne, nasze ustawienia zaufania, klucze, ustawienia agenta, itd.
Umożliwia nam to szybkie odzyskanie działającej konfiguracji systemu.
## Pierścień kluczy
Pierścień kluczy GPG (key ring) to zbiór kluczy publicznych i prywatnych.
GPG przechowuje klucze publiczne w pliku `pubring.kbx`, a prywatne w folderze `private-keys-v1.d`.  Klucze publiczne nie są przechowywane w postaci zaszyfrowanej, w przeciwieństwie do kluczy prywatnych.
## Przedłużamy ważność
W końcu nadejdzie ten dzień kiedy musimy przedłużyć ważność kluczy. Warto sobie ustawić przypomnienie z zapasem 😉.
Najpierw otworzymy na bezpiecznym komputerze naszą bazę z kluczem głównym i przedłużamy **wszystkie** klucze.
```
mkdir /tmp/gpg-test
chmod 700 /tmp/gpg-test
gpg --homedir /tmp/gpg-test --import jdoe@example.com.asc
gpg --homedir /tmp/gpg-test --list-secret-keys --keyid-format LONG
gpg --homedir /tmp/gpg-test --edit-key jdoe@example.com
gpg> expire
gpg> 2y
gpg> key 1
gpg> expire
gpg> 1y
...
gpg> save
```
Potem eksportujemy sobie publiczną część z flagą `export-clean`, aby wyczyścić klucz z nie potrzebnych informacji. Ten plik zaimportujemy do naszego komputera codziennego użytku.
```
gpg --homedir /tmp/gpg-test --armor --export-options export-clean --export jdoe@example.com > ext_jdoe@example.com.pub.asc
```
Możemy odnowić nasz backup kluczy.
```
gpg --homedir /tmp/gpg-test --armor --export-secret-keys jdoe@example.com > ext_jdoe@example.com.asc
 ```
Jak dodamy nowe klucze podrzędne, to musimy je oczywiście też zaimportować. Jak tylko zmieniamy meta dane, to wystarczy nam plik publiczny.
 ```
gpg --homedir /tmp/gpg-test --armor --export-secret-subkeys jdoe@example.com > ext_jdoe@example.com-subkeys.asc
```
Na koniec usuwamy wszystko (też pliki już nie potrzebne).
```
rm -rf /tmp/gpg-test
```
Na naszym urządzeniu codziennym importujemy aktualizację i publikujemy zmiany.
```
gpg --import ext_jdoe@example.com.pub.asc
gpg -K
gpg --keyserver hkps://keys.openpgp.org --send-keys jdoe@example.com
```
## Klienci
Jest mnóstwo klientów mailowych, wiec tylko podaję linki do Thunderbirda i K9. W klientach musimy zaimportować prywatne klucze, żeby one były w stanie szyfrować nasze wiadomości.
```
gpg --export-secret-keys --armor jdoe@example.com > jdoe@example.com.asc
```
  W tej chwili wykorzystanie dostępnych kluczy z `.gnupg` w Thunderbirdzie nie działa w zadowalający sposób. Co najmniej z mojego doświadczenia.
- https://support.mozilla.org/pl/kb/openpgp-w-thunderbirdzie-howto-i-faq
- https://docs.k9mail.app/en/6.400/security/pgp/
## Podsumowanie
Oprogramowanie GPG jest bardzo złożone, ale daje nam sporo praktycznych zastosowań. Możemy nie tylko zabezpieczyć naszą komunikację, ale też wymieniać pliki szyfrowane, lub podpisywać się, np. w gitcie.