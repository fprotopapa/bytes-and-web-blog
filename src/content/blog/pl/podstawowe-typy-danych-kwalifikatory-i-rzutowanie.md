---
title: "Podstawowe typy danych, kwalifikatory i rzutowanie w C"
description: Typy danych w C są fundamentem każdego programu — od prostych aplikacji po systemy wbudowane. W tym wpisie poznamy wszystkie typy proste, ich rozmiary, zakresy, praktyczne zastosowania oraz kwalifikatory, które pozwalają modyfikować zachowanie zmiennych.
pubDate: 2025-12-09
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "GCC", "Typy danych"]
category: "język C"
draft: false
---

Język C jest wyjątkowo blisko sprzętu, dlatego typy danych mają w nim ogromne znaczenie.
To, jaki typ wybierzesz, wpływa na:
- ilość zajętej pamięci,
- dokładność obliczeń,
- wydajność programu,
- zachowanie w interakcji z kompilatorem.
Wszystko to omówimy w tym wpisie.

## Podstawowe typy danych w C

Piękno języka C polega na jego prostocie. Prostota ta przejawia się chociażby tym, że posiada tylko cztery podstawowe typy danych. Wszystkie inne typy całkowite i zmiennoprzecinkowe są jedynie ich modyfikatorem, utworzonym poprzez dodanie słów kluczowych, zwanych kwalifikatorami. Zrozumienie, jak te typy działają i jakie mają warianty, jest kluczowe do pisania poprawnego i wydajnego kodu w C. Szczególnie w kontekście systemów wbudowanych i sterowników.

Język C definiuje dokładnie cztery typy podstawowe:

- `int` - Podstawowy typ liczbowy całkowity.
- `char` - Pojedynczy bajt w pamięci, przechowujący jeden znak z lokalnego zestawu znaków.
- `float` - Typ zmiennoprzecinkowy pojedynczej precyzji.
- `double` - Typ zmiennoprzecinkowy podwójnej precyzji.

### Modyfikacje typów podstawowych - typy pochodne

Z podstawowych typów można tworzyć warianty:
- modyfikatory rozmiaru zmiennej - `short int`, `long int`, `long long int` - zmieniają rozmiar zmiennej w pamięci, wpływa to na zakres możliwych do przechowywania wartości
- modyfikatory znaku - `signed`, `unsigned` - definiują czy mamy do czynienia z wartościami tylko dodatnimi, czy dodatnimi i ujemnymi
- rozszerzenia zmiennoprzecinkowe - `long double` - zwiększa precyzję lub zakres liczb zmiennoprzecinkowych

### Porównanie typów podstawowych i pochodnych

Uwaga: Rozmiary dotyczą typowej platformy x86-64 (GCC). Standard C gwarantuje jedynie minimalne wartości — rozmiary mogą różnić się na innych architekturach.

| Typ                      | Rozmiar (typowy)           | Zakres wartości          | Przykładowe zastosowanie               |
| ------------------------ | -------------------------- | ------------------------ | ---------------------------------------- |
| `signed char`            | 1 B                        | −128…127                 | pojedynczy znak ASCII                    |
| `unsigned char`          | 1 B                        | 0…255                    | bufor bajtów, dane binarne               |
| `short`                  | 2 B                        | −32768…32767             | licznik, małe liczby całkowite           |
| `unsigned short`         | 2 B                        | 0…65535                  | kolory (RGB), porty sieciowe             |
| `int`                    | 4 B                        | −2147483648…2147483647   | wartości całkowite ogólnego zastosowania |
| `unsigned int`           | 4 B                        | 0…4294967295             | indeksy tablic, maski bitowe             |
| `long`                   | Linux: 8 B<br>Windows: 4 B | zależnie od platformy    | operacje systemowe, rozmiary obiektów    |
| `long long`              | 8 B                        | −9223372036854775808…9223372036854775807              | duże liczby, timestampy                  |
| `unsigned long long`     | 8 B                        | 0…18446744073709551615                 | arytmetyka bitowa, identyfikatory        |
| `float`                  | 4 B                        | ~1e−38…1e38              | szybkie obliczenia, grafika              |
| `double`                 | 8 B                        | ~1e−308…1e308            | obliczenia naukowe, finansowe            |
| `long double`            | 16 B (Linux)               | bardzo szeroki zakres    | precyzyjne obliczenia matematyczne       |

## Kwalifikatory typów

Kwalifikatory nie tworzą nowych typów, ale modyfikują zachowanie zmiennej, dając dodatkowe gwarancje kompilatorowi.

- `const` — wartość tylko do odczytu. Zmienna nie może być zmieniona po inicjalizacji.
```
const int x = 10;
```
- `volatile` — wyłącza optymalizacje kompilatora. Wartość może zmieniać się niezależnie od kodu, a na przykład przez zmianę danych w rejestrze lub podłączonym czujniku.
```
volatile int flag;
```
- `restrict` — brak aliasowania. Informuje kompilator, że wskaźnik jest jedynym sposobem dostępu do danego obszaru pamięci (od C99).
```
void foo(int *restrict p);
```
- `_Atomic` — Gwarantuje, że operacje na zmiennej są atomowe, czyli odczyty i zapisy są niepodzielne, zapewnia spójność między wątkami (od C11).
```
_Atomic int counter;
```

## Rzutowanie typów

Rzutowanie typów w C pozwala jawnie zamienić jedną reprezentację danych na inną. W przeciwieństwie do konwersji niejawnej, która zachodzi automatycznie (np. podczas operacji arytmetycznych), rzutowanie jawne pozwala programiście wymusić określony typ, nawet jeśli prowadzi to do utraty informacji.
W C występuje hierarchia typów, oznacza to że w przypadku operacji na zmiennych o różnych typach danych. Wynik będzie miał taki sam typ jak składowa, która była wyżej w hierarchii. 

    long double
        ↑
    double
        ↑
    float
        ↑
    long long
        ↑
    unsigned long
        ↑
    long
        ↑
    unsigned int
        ↑
    int
        ↑
    unsigned short
        ↑
    short
        ↑
    unsigned char
        ↑
    char / signed char


### Rzutowanie jawne

Jawne rzutowanie wymaga podania typu w nawiasie przed wartością:
```
double x = 10.7;
int y = (int)x;  // y == 10, część ułamkowa zostaje obcięta
```

Ten zapis mówi kompilatorowi: “potraktuj tę wartość jako int”.

### Rzutowanie niejawne

C często automatycznie zmienia typ danych — na przykład w operacjach arytmetycznych:
```
int a = 5;
double b = a + 2.5; // a zostaje automatycznie zamienione na double
```

### Błędy i pułapki przy rzutowaniu typów

Podczas rzutowania trzeba pamiętać o kilku potencjalnych problemach, które mogą prowadzić do błędów w programie:
- Ucięcie części ułamkowej - rzutowanie z typu zmiennoprzecinkowego na typ całkowity obcina część dziesiętną. Wartość po rzutowaniu nie jest zaokrąglana — część po przecinku zostaje utracona.
- Przepełnienie zakresu (overflow) - Rzutowanie liczby spoza zakresu docelowego typu prowadzi do nieprzewidywalnych wyników, zależnych od architektury i kompilatora:
- Zmiana interpretacji bitów (type punning)- Rzutowanie wskaźników lub użycie typu _Generic do interpretowania tej samej pamięci w inny sposób może być niebezpieczne i prowadzić do błędów niewykrywalnych przez kompilator.

## Podsumowanie

Proste typy danych w C to fundament działania programu — wpływają na zakres przechowywanych wartości, szybkość kodu oraz zgodność między platformami. Znajomość kwalifikatorów pozwana modyfikować dostępne typy, a rzutowanie zmianę jedno typu w drugi. Należy zachować ostrożności, aby uniknąć ucięcia wartości, przepełnienia czy niebezpiecznej reinterpretacji bitów.