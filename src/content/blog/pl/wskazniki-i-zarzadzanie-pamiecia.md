---
title: "Wskaźniki i zarządzanie pamięcią"
description: „Zajrzyjmy w głąb pamięci naszych komputerów i dowiemy się jak nią zarządzać.”
pubDate: 2026-01-14
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "Wskaźniki", "Pamięć"]
category: "język C"
draft: false
---

Korzystając z C jesteśmy w stanie operować adresami pamięci, stąd też jest określany jako język niskiego poziomu. Pozwala to robić rzeczy, które nie zawsze są dostępne w innych językach. Aby uzyskać dostęp do konkretnego obszaru pamięci, trzeba wykorzystać wskaźnik, ale czym on właściwie jest?

## Wskaźniki
__Wskaźnik__ to zmienna, która przechowuje adres do obszaru pamięci. Podobnie jak __int__ przechowuje liczby całkowite, a __float__ zmiennoprzecinkowe, tak wskaźnik przechowuje adres pamięci.

### Deklaracja wskaźnika
Aby zadeklarować wskaźnik, należy podać typ danych, na który ma wskazywać, oraz użyć `*` po typie, a przed nazwą wskaźnika. Położenie spacji między typem i nazwą nie ma znaczenia dla kompilatora.
```c
int *wskaznik1;     // wskaźnik na int
float* wskaznik2;   // wskaźnik na float
double * wskaznik3; // wskaźnik na double
char *wskaznik4;    // wskaźnik na char
```
Mając tak zdefiniowane wskaźniki, można je ustawić na adresy zmiennych. Służy do tego operator pobrania adresu `&`. Dodając go do nazwy zmiennej, np. `&zmienna`, zwracany jest adres w pamięci, gdzie jest przechowywana.
```c
int a = 10;
float b = 3.5f;
double c = 7.25;
char d = 'X';

int *wskaznik1 = &a;
float *wskaznik2 = &b;
double *wskaznik3 = &c;
char *wskaznik4 = &d;
```
Rozmiar wskaźnika zależy od architektury i kompilatora. Dla 32-bit jest to 4 bajty, a dla 64-bit 8 bajtów.

### Wskaźnik typu void
Może istnieć także wskaźnik typu `void*`, oznacza to, że przechowuje adres danych, ale nie wiadomo, jakiego typu one są.
```c
void *wskaznik1; // wskaźnik nieznanego typu
```
Korzystając ze wskaźnika typu void, za każdym razem musimy zrzutować go na typ, jako jaki chcemy traktować dany obszar pamięci. Wykorzystuje się to do pisania bardziej generycznego kodu.

### NULL
`NULL` pointer to wskaźnik, który nie wskazuje na żaden obiekt w pamięci. Jest to specjalna stała, używana do inicjalizacji wskaźników jako niepoprawnych. Dobrą praktyką jest sprawdzenie przed użyciem, czy wskaźnik nie jest `NULL`.
```c
if (p != NULL) {
    printf("%d\n", *p);
}
```
Użycie `NULL` pointera prowadzi do niezdefiniowanego zachowania, najczęściej do awarii programu.

### Arytmetyka wskaźników
Wskaźniki w C nie służą tylko do przechowywania adresów. Można również wykonywać operacje arytmetyczne, zarówno na nich, jak i na adresach przez nie wskazywanych.

- __Przesuwanie wskaźnika__: Kompilator automatycznie przelicza przesunięcie w bajtach na podstawie rozmiaru typu wskaźnika. W przypadku tablic może to służyć iterowaniu po jej kolejnych elementach.
```c
int *wskaznik1 = &zmienna;
wskaznik1++;
```
- __Odejmowanie wskaźników__: pozwala obliczyć odległość między dwoma elementami w obrębie tej samej tablicy.
```c
int *wskaznik1 = &tab[0];
int *wskaznik2 = &tab[4];
int roznica = wskaznik2 - wskaznik1;
```
- __Porównywanie wskaźników__: pozwala sprawdzić kolejność elementów lub wykonać pętlę po tablicy.
```c
int *wskaznik1 = tab;
while (wskaznik1 < tab + 5) {
    printf("%d ", *wskaznik1);
    wskaznik1++;  // przesuwamy wskaźnik po tablicy
}
```

### Stałe wskaźniki i wskaźniki na stałe
Stały wskaźnik oznacza to że nie można zmienić adresu pamięci na który wskazuje. `const` musi być po `*`.
```c
int * const wskaznik1 = &zmienna;
```

Wskaźnik może też wskazywać na stałą, w ten sposób blokujemy możliwość wykonywania operacji na niej. Ale dalej możemy zmieniać to na co wskazuje. Próba użycia zwykłego wskaźnika na stałą i jej modyfikacji prowadzi do niezdefiniowanego zachowania.
```c
const int *wskaznik1;
int const *wskaznik2;
```
Można też połączyć oba wcześniejsze i mieć stały wskaźnik na stałą. Nie można zmieniać ani wartości, ani wskazywanego adresu.
```c
const int * const wskaznik1 = &zmienna;
```

### Wskaźniki na wskaźniki
Wskaźnik może przechowywać adres innego wskaźnika. Przydatne np. przy dynamicznej alokacji wielowymiarowych tablic.
```c
int a = 5;
int *w1 = &a;
int **w2 = &w1;

printf("%d\n", **w2); // 5
```

### Wskaźniki na funkcje
Funkcje, podobnie jak zmienne, mają swoje adresy w pamięci. Oznacza to, że możliwe jest tworzenie wskaźników przechowujących adresy funkcji, czyli tzw. wskaźników na funkcje. Mechanizm ten pozwala na bardziej elastyczne i dynamiczne sterowanie przebiegiem programu. Deklaracja wskaźnika na funkcję wizualnie odbiega od deklaracji funkcji, ale również musi zawierać typ zwracanej wartości oraz listę parametrów funkcji, na którą wskazuje.

```c
int (*func)(int, int);
```

Przypisanie funkcji do wskaźnika:
```c
int add(int a, int b) {
    return a + b;
}

int (*func)(int, int);
func = add;     /* równoważne: func = &add; */
```

Wywołanie funkcji przez wskaźnik:
```c
int result1 = func(2, 3);
int result2 = (*func)(2, 3);
```

Jednym z najczęstszych zastosowań wskaźników na funkcje jest przekazywanie funkcji jako argumentów do innych funkcji, np. w celu realizacji mechanizmu callback. Dzięki temu ta sama funkcja może wykonywać różne operacje bez zmiany swojej implementacji. Jest to prosty przykład polimorfizmu behawioralnego - jeden interfejs wywołania, ale różne zachowania.
Innym przykładem jest zmiana logiki działania programu poprzez przekazanie innego wskaźnika na funkcję, w zależności od wartości danego parametru.
Wskaźniki na funkcje można również przechowywać w tablicach, co pozwala na wygodną implementację prostych mechanizmów wyboru zachowania programu, takich jak maszyna stanów lub menu.

## Wykorzystanie wskaźników
### Przekazywanie parametrów do funkcji
Przekazywanie parametrów do funkcji przez wskaźniki pozwala uniknąć kopiowania dużych struktur danych, co oszczędza czas i pamięć. Brak kopiowania powoduje, że operujemy na oryginalnych zmiennych.
```c
void zwieksz(int *x) {
    (*x)++;
}

int main() {
    int a = 10;
    zwieksz(&a);
    printf("%d\n", a); // 11
    return 0;
}
```

### Dynamiczna alokacja pamięci
Wskaźniki umożliwiają dynamiczne przydzielanie pamięci, przydaje się to na przykład przy tworzeniu tablic o zmiennym rozmiarze w czasie działania programu. Pamięć dynamiczna jest przydzielana na stercie i zarządzana za pomocą wskaźników. Możemy zaoszczędzić jej użycie alokując ją tylko wtedy gdy jest potrzebna.
Do dynamicznej alokacji pamięci w C służą funkcje z biblioteki `<stdlib.h>`:
- `malloc` - Alokuje ciągły blok pamięci o podanym rozmiarze (w bajtach) ale jej nie inicjalizuje. Zwraca wskaźnik do przydzielonej pamięci.
```c
int *tab = (int*) malloc(5 * sizeof(int));
```
- `calloc` - Alokuje pamięć dla tablicy elementów oraz inicjalizuje pamięć zerami.
```c
void* calloc(size_t liczba_elementów, size_t rozmiar_elementu);
```
- `realloc` - Zmienia rozmiar wcześniej zaalokowanej pamięci.
```c
void* realloc(void* ptr, size_t new_size);
```
- `free` - Zwalnia wcześniej zaalokowaną pamięć, po wywołaniu nie wolno używać wskaźnika. Brak zwalniania pamięci prowadzi do __wycieków pamięci__.
```c
void free(void* ptr);
```

### Iteracja po tablicach i strukturach danych
Wskaźniki pozwalają efektywnie iterować po tablicach, listach i innych strukturach danych. Nazwa tablicy w wielu kontekstach zachowuje się jak wskaźnik na jej pierwszy element. Przechodzenie przez tablicę za pomocą arytmetyki wskaźników jest często szybsze niż używanie indeksów [i]. 
```c
int tab[5] = {1,2,3,4,5};
int *p = tab;
for (int i = 0; i < 5; i++) {
    printf("%d ", *(p + i));
}
```
Stringi w C to de facto wskaźniki na tablice znaków zakończone znakiem `\0`, więc można na nich robić takie operacje jak na innych tablicach.

### Dostęp do rejestrów
W programowaniu systemowym oraz w systemach wbudowanych rejestry urządzeń peryferyjnych są mapowane w przestrzeni adresowej pamięci. Oznacza to, że  dostęp do pamięci, poprzez wskaźnik, powoduje fizyczny odczyt lub zapis do rejestru sprzętowego. W języku C realizuje się to przez rzutowanie konkretnego adresu pamięci na wskaźnik odpowiedniego typu.

## Podsumowanie
Wskaźniki w C pozwalają na bezpośredni dostęp do pamięci i efektywne operowanie na danych. Dzięki nim możemy przekazywać parametry do funkcji bez kopiowania dużych obiektów, tworzyć dynamiczne struktury danych, iterować po tablicach i strukturach danych, także tworzyć bardziej elastyczny i generyczny kod. Poprawne użycie wskaźników wymaga uwagi, ponieważ nieprawidłowe operacje mogą prowadzić do niezdefiniowanego zachowania i awarii programu.