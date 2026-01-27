---
title: "Funkcje i nagłówki"
description: Poznamy metody podziału kodu, co pozwoli łatwiej nim zarządzać oraz wyodrębniać moduły do wielokrotnego użytku.
pubDate: 2026-01-06
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "Funkcje", "Nagłówki"]
category: "język C"
draft: false
---

Pisząc większe programy, bardzo szybko dochodzimy do momentu, w którym pojedyńczy plik z setkami linii kodu przestaje być wygodny w utrzymaniu. Właśnie tutaj kluczową rolę odgrywają **funkcje** oraz **pliki nagłówkowe**. Pozwalają one porządkować kod, dzielić go na logiczne części i ponownie wykorzystywać w innych projektach.

## Funkcje
Funkcja to wydzielony fragment kodu, który ma nazwę, może (ale nie musi) przyjmować argumenty oraz może (ale nie musi) zwracać wartość. Dzięki funkcjom unikamy powtarzania kodu i poprawiamy jego czytelność. Najczęściej spotkasz się z dwoma podstawowymi rodzajami funkcji: funkcjami zwracającymi wartość oraz funkcjami typu `void`, które nie zwracają wartości.

Poniżej przykład funkcji typu `int` o nazwie `suma`. Typ funkcji określa rodzaj zwracanej wartości, a sama wartość jest przekazywana przez zmienną podaną po słowie `return`. Zwracana wartość musi być zgodna z typem zadeklarowanym w nagłówku funkcji. W nawiasach podawane są argumenty funkcji — tutaj `a` i `b`.
```c
int suma(int a, int b) {
    int wynik;
    wynik = a + b;
    return wynik;
}
```

Przykładowa funkcja typu `void` — czyli taka, która nie zwraca wartości. W tym przypadku nie jest wymagane użycie słowa `return`, jednak jego obecność może poprawić czytelność kodu. Do funkcji `void`, jak i do każdej innej, możemy przekazywać argumenty.

```c
void hello(int a, int b) {
    if(a+b > 5){
        printf("Hello world!\n");
    }
}
```

### Wywoływanie funkcji
W celu użycia funkcji trzeba ją **wywołać**, podając jej nazwę oraz argumenty – mogą to być bezpośrednio wartości lub zmienne wykorzystywane w programie.  
Przykładowe wywołanie funkcji `hello`:
```c
hello(4, 7);
```

Dla funkcji `suma` możemy od razu zapisać zwracany wynik do zmiennej:
```c
int zmienna = suma(4, 7);
```

### Deklaracja vs definicja funkcji
Musimy jeszcze rozróżnić **deklarację funkcji** od **jej definicji**. Deklaracja informuje kompilator, że funkcja o danej nazwie istnieje w naszym programie. Najczęściej umieszcza się ją na początku pliku programu lub w pliku nagłówkowym. Definicja natomiast zawiera **ciało funkcji**, czyli kod, który ma się wykonać.

Deklaracja:
```c
int suma(int a, int b);
```

Definicja:
```c
int suma(int a, int b) {
    int wynik;
    wynik = a + b;
    return wynik;
}
```

Wywołanie:
```c
int zmienna = suma(4, 7);
```

### Przekazywanie argumentów – kopia, nie oryginał
W języku C argumenty funkcji są przekazywane **przez wartość**, co oznacza, że funkcja otrzymuje **kopię przekazanej zmiennej**, a nie jej oryginał. Każda zmiana dokonana na argumencie wewnątrz funkcji **nie wpływa** na zmienną w miejscu jej wywołania.

```c
void zmien(int x) {
    x = 10;
}

int main() {
    int a = 5;
    zmien(a);
    printf("%d\n", a); // nadal 5
}
```

Jeżeli chcemy, aby funkcja mogła modyfikować oryginalną wartość, musimy przekazać **adres zmiennej**, czyli użyć wskaźników. O tym będzie mowa w przyszłości — teraz jedynie krótki przykład:

```c
void zmien(int *x) {
    *x = 10;
}

int main() {
    int a = 5;
    zmien(&a);
    printf("%d\n", a); // 10
}
```

> **Uwaga:**  
> Tablice w C są przekazywane do funkcji jako wskaźniki — dlatego ich zawartość można modyfikować bez użycia operatora `&`.

### Zakres zmiennych i zmienne globalne
Zmienne mogą mieć różny **zakres widoczności**:
- **lokalne** – widoczne tylko w obrębie funkcji, w której zostały zadeklarowane,
- **globalne** – widoczne w całym pliku lub nawet w wielu plikach (jeśli użyjemy `extern`).

Przykład zmiennej globalnej:

```c
int licznik = 0; // zmienna globalna

void inkrementuj() {
    licznik++;
}
```

Nadmierne używanie zmiennych globalnych może prowadzić do błędów i trudności w utrzymaniu kodu.

### Słowo kluczowe `static`
- **Zmienne statyczne w funkcji** zachowują swoją wartość między wywołaniami. Zmienna nie jest na nowo inicjalizowana, tylko przechowuje wartość po ostatnim wywołaniu funkcji.

```c
void licz() {
    static int i = 0;
    i++;
    printf("%d\n", i);
}
```

- **Funkcje statyczne** są widoczne tylko w pliku, w którym zostały zdefiniowane:
```c
static void pomocnicza() {
    // kod niewidoczny poza tym plikiem
}
```
### Funkcje inline
Każde wywołanie funkcji wiąże się z przekazaniem argumentów, skokiem do innego miejsca w kodzie oraz zapisem i odczytem ze stosu. Chcąc to zoptymalizować, można zastanowić się nad użyciem __funkcji inline__. Jest to funkcja, której kod jest wstawiany bezpośrednio w miejscu wywołania. Oznacza to, że zamiast samego wywołania funkcji pojawia się jej cała zawartość. Deklaruje się ją, dodając `inline` przed typem i nazwą funkcji.

```c
inline int dodaj(int a, int b) {
    return a + b;
}
```
`inline` stosuje się do krótkich i często wywoływanych funkcji, takich jak proste operacje matematyczne. Może to przyspieszyć wykonanie programu — może, ale nie musi. Dlaczego? Ponieważ jest to jedynie sugestia dla kompilatora i to on podejmuje ostateczną decyzję.
Nadużywanie `inline` może zwiększyć rozmiar kodu wynikowego(tzw. code bloat), pogorszyć wykorzystanie pamięci cache, a także utrudnić debugowanie. Współczesne kompilatory, np. GCC czy Clang, są bardzo zaawansowane i często same decydują, które funkcje wstawić inline'ować, nawet jeśli nie użyto przy nich słowa kluczowego `inline`.

### Funkcje rekurencyjne
Funkcja rekurencyjna wywołuje samą siebie. Bardzo przydatne przy problemach takich jak silnia, ciągi liczb Fibonacciego czy przeszukiwanie drzew.

```c
int silnia(int n) {
    if (n <= 1)
        return 1;
    return n * silnia(n - 1);
}
```

Należy pamiętać o **warunku zakończenia**, inaczej program skończy się przepełnieniem stosu.

### Makra
Makra pozwalają na tworzenie stałych i prostych funkcji tekstowych:

```c
#define PI 3.14159
#define MAX(a,b) ((a) > (b) ? (a) : (b))
```

Makra są **bez typów**, więc trzeba uważać na kolejność działań i nawiasy.

## Nagłówki
### `#include`

Dyrektywa `#include` wstawia zawartość innego pliku:
```c
#include <stdio.h>   // biblioteka standardowa
#include "moj.h"     // własny nagłówek
```

- `< >` – szukanie w katalogach systemowych  
- `" "` – najpierw szukanie w katalogu projektu

### `#define`
Służy do tworzenia **makr**, czyli stałych i funkcji tekstowych (opisane wyżej).

### `#ifdef` / `#ifndef`
Pozwalają na **warunkową kompilację**, np. ochronę przed wielokrotnym włączeniem nagłówka:

```c
#ifndef MOJ_H
#define MOJ_H

void funkcja();

#endif
```

> Można też użyć `#pragma once` — prostsze, ale mniej przenośne.

### `extern`

Umożliwia użycie zmiennych i funkcji z innych plików:

```c
// plik1.c
int globalna = 10;

// plik2.c
extern int globalna;
```

## Podsumowanie
Funkcje i nagłówki to fundament każdego większego programu w C. Funkcje dzielą kod na logiczne, wielokrotnego użytku fragmenty, zwiększają czytelność i ułatwiają debugowanie. Nagłówki porządkują interfejsy między plikami i pozwalają współdzielić deklaracje funkcji oraz stałe. Zakres zmiennych, static, extern pozwalają kontrolować widoczność i czas życia danych. Makra i rekurencja oferują wygodne sposoby na automatyzację powtarzalnych operacji. Przekazywanie argumentów w C domyślnie przez wartość, modyfikacja oryginału wymaga wskaźników.  
Dzięki przemyślanemu stosowaniu tych elementów Twój kod staje się czytelny, modularny i łatwy do utrzymania, nawet przy dużych projektach.