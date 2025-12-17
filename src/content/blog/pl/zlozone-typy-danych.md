---
title: "Złożone typy danych"
description: "Po omówieniu typów prostych przechodzimy do złożonych. Poznamy ich składnie, dowiemy się w jaki sposób można określić ich rozmiar, a także gdzie warto je stosować."
pubDate: 2025-12-17
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "GCC", "Typy danych"]
category: "język C"
draft: false
---

Typy złożone w języku C pozwalają tworzyć bardziej czytelne, elastyczne i skalowalne programy, porządkując dane w logiczne struktury. W tym wpisie omówimy struktury, unie, tablice, wskaźniki oraz typy wyliczeniowe. Poznamy ich składnię, sposób działania, różnice między nimi i typowe zastosowania w praktyce. Zobaczysz, jak dzięki typom złożonym efektywnie modelować rzeczywiste problemy i pisać kod łatwiejszy w utrzymaniu.

## Złożone typy danych w C

Złożone typy danych w języku C umożliwiają przechowywanie i organizowanie bardziej skomplikowanych informacji niż pojedyncze wartości. Część z nich stanowią typy, które służą do grupowania typów prostych, wśród nich wyróżniamy:

- Tablice - Przechowują wiele elementów tego samego typu w pamięci ciągłej. Aby przewidzieć rozmiar tablicy wystarczy pomnożyć ilość jej elementów przez rozmiar ich typu.
```
int arr[10];
```
- Struktury - Grupują różne typy danych w jeden obiekt. Rozmiar jest sumą rozmiarów wszystkich elementów z uwzględnieniem wyrównania i paddingu, co opiszę w dalszej części.
```
struct Point {
    int x;
    float y;
};
```
- Unie - Wszystkie pola współdzielą tę samą przestrzeń pamięci. Rozmiar jest równy rozmiarowi największego typu zdefiniowanego wewnątrz.
```
union Data {
    int i;
    float f;
    char str[20];
};
```

Pozostałe złożone typy danych nie służą bezpośrednio do grupowania wielu wartości w jednej strukturze, lecz rozszerzają możliwości języka C w zakresie organizacji kodu, zarządzania pamięcią oraz poprawy czytelności i elastyczności programów. 

- Wskaźniki - Przechowują adresy pamięci innych zmiennych. Rozmiar zależy od architektury, typowo będzie to 4 lub 8 bajtów.
```
int value = 10;
int *ptr = &value;
```
- Enum - Typy wyliczeniowe, umożliwiają definiowanie zbioru nazwanych stałych całkowitych.
```
enum Status {
    OK,
    ERROR,
    UNKNOWN
};
```
- Wskaźniki do funkcji – Pozwalają przechowywać adresy funkcji i wywoływać je dynamicznie, co jest często wykorzystywane w mechanizmach callbacków i tablicach funkcji. Rozmiar musi pomieścić wszystkie wartości wyliczenia.
```
int (*operation)(int, int);
```
- typedef – Umożliwia tworzenie aliasów dla istniejących typów, upraszczając deklaracje i poprawiając czytelność kodu, szczególnie przy bardziej złożonych definicjach. Rozmiar jest taki sam jak typu na który tworzymy alias.
```
typedef unsigned long MyOwnType;
```

## Alignment i Padding

Tworząc złożone typy danych warto zwrócić uwagę na ich rozmiar w celu optymalnego wykorzystania pamięci. O ile w typach podstawowych rozmiar zmiennej dla danej platformy był stały, tak w typach złożonych rozmiar będzie się różnił od kolejności pól. Szczególnie w przypadku `struct`. Przyjrzyjmy się dwóm strukturom.

```
struct Example1 {
    char c;   // 1 bajt
    int i;    // 4 bajty
    char cc;  // 1 bajt
};

struct Example2 {
    char c;   // 1 bajt
    char cc;  // 1 bajt
    int i;    // 4 bajty
};
```
Obie struktury wyglądają identycznie i można pomyśleć, że zajmą w pamięci tyle samo miejsca, lecz jest to błąd. Wynika to z mechanizmu wyrównania, który nazywa się _alignment_. Polega on na tym, że kompilator automatycznie dodaje bajty wypełnienia między polami struktury lub na jej końcu. Bajty wypełniania to _padding_. W wyniku tego struktury Example1 i Example2 będą miały różne rozmiary.

| Offset | Example1 | Rozmiar | Example2 | Rozmiar |
|-------:|------------------------------------|--------:|-------------------------------------|--------:|
| 0      | c                                  | 1       | c                                   | 1       |
| 1      | padding                            | 1       | cc                                  | 1       |
| 2      | padding                            | 1       | padding                             | 1       |
| 3      | padding                            | 1       | padding                             | 1       |
| 4      | i                                  | 1       | i                                   | 1       |
| 5      | i                                  | 1       | i                                   | 1       |
| 6      | i                                  | 1       | i                                   | 1       |
| 7      | i                                  | 1       | i                                   | 1       |
| 8      | cc                                 | 1       | —                                   | —       |
| 9      | padding                            | 1       | —                                   | —       |
| 10     | padding                            | 1       | —                                   | —       |
| 11     | padding                            | 1       | —                                   | —       |
| Razem | 12 bajtów                   |         | 8 bajtów                       |         |

Padding można wyłączyć na jeden z dwóch sposobów:
- dyrektywa preprocesora `Pragma pack` - pozwala na zdefiniowanie samemu wartości do wyrównania, w przypadku 1 jest brak paddingu
```
#pragma pack(push, 1)
struct Packed {
    char c;
    int i;
};
#pragma pack(pop)
```
- atrybut kompilatora `__attribute__((packed))` - wyłącza padding
```
struct __attribute__((packed)) Packed {
    char c;
    int i;
};

```

## Endianness – kolejność bajtów w pamięci

Endianness określa, w jakiej kolejności bajty wielobajtowych typów danych są zapisywane w pamięci. Najczęściej spotykane są dwa warianty:

- Little endian – najmniej znaczący bajt znajduje się pod najniższym adresem (np. x86)
- Big endian – najbardziej znaczący bajt jest pierwszy (np. część architektur sieciowych)

W zależności od architektury, bajty liczb w pamięci mogą wyglądać zupełnie inaczej. Ma to ogromne znaczenie przy zapisie do plików binarnych, komunikacji sieciowej czy odczycie danych sprzętowych. Dlatego protokoły sieciowe używają pojęcia network byte order, a programista musi świadomie konwertować dane. Jeżeli nie wiemy jaki endianness jest na platformie na której pracujemy popularnym sposobem na sprawdzenie jest prosty program. Definiujemy zmienna int, ustawiamy wskaźnik na jej początek i sprawdzamy na jaka wartość wskazuje.
```
#include <stdio.h>

int main() {
    unsigned int x = 0x01020304;
    unsigned char *p = (unsigned char*)&x; // patrzymy na pierwszy bajt

    if (*p == 0x04)
        printf("Little endian\n");
    else
        printf("Big endian\n");

    return 0;
}

```

## Aliasing i zasada strict aliasing w C

Aliasing występuje wtedy, gdy dwa różne wskaźniki lub referencje wskazują na ten sam obszar pamięci, ale traktują go jako różne typy danych.
Na pierwszy rzut oka może się wydawać, że w C możemy robić z pamięcią prawie wszystko, jednak kompilatory wykorzystują pewne założenia dotyczące aliasingu do optymalizacji kodu. Jednym z takich założeń jest strict aliasing rule.
Kompilator zakłada, że wskaźnik do jednego typu **nie wskazuje** na obszar pamięci przechowujący inny typ, z wyjątkiem wskaźnika do `char`. Dzięki temu kompilator może:
- lepiej optymalizować kod
- usuwać powtarzające się odczyty
- przesuwać operacje w czasie wykonywania

**Tego nie wolno robić!**
```
float f = 1.0f;
int *p = (int *)&f; 
*p = 42;

```

`f` jest typu _float_, a `p` traktuje te same bajty jako _int_. W efekcie kod może zachowywać się nieprzewidywalnie. Jest to **undefined behavior**.

## Podsumowanie

Złożone typy danych w C pozwalają tworzyć programy bardziej modularne i elastyczne, łącząc różne typy w logiczne struktury. Ważnym aspektem przy pracy ze strukturami i unią jest alignment i padding, które wpływają na rozmiar i efektywność pamięci. Pisząc program, należy również rozumieć endianness, aby poprawnie odczytywać dane w pamięci oraz przy komunikacji sieciowej. Zasada strict aliasing pokazuje, że manipulacja wskaźnikami różnych typów wymaga ostrożności, a nieprzestrzeganie jej może prowadzić do nieprzewidywalnego zachowania programu. Świadome korzystanie z tych mechanizmów umożliwia pisanie wydajnego, bezpiecznego i przenośnego kodu w C.