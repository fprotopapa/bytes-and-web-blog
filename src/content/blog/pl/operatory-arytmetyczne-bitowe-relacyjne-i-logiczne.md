---
title: "Operatory arytmetyczne, bitowe, relacyjne i logiczne"
description: "Poznamy dostępne operatory w języku C i przyjrzymy się ich wykorzystaniu w praktyce."
pubDate: 2025-12-27
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "operatory", "Typy danych"]
category: "język C"
draft: false
---

Znając już różne typy danych możemy pójść dalej i zastanowić się w jaki sposób połączyć, rozdzielić lub jeszcze inaczej modyfikować ich zawartość. Dlatego dzisiaj przejdziemy przez różne typy operatorów jakie są dostępne w języku C. 

## Operatory arytmetyczne

Zaczynamy od operatorów arytmetycznych, w większości są to znane z matematyki operacje takie jak dodawanie, odejmowanie, dzielenie i mnożenie. Do ich opisu wykorzystuje się dobrze znane symbole, kolejno: `+`, `-`, `/` i `*`. W tym momencie warto zwrócić uwagę, że wynik mnożenia lub dzielenia  zazwyczaj jest tego samego typu co największy z argumentów. Przyjrzymy się poniższemu fragmentowi kodu:

```c
float x = 5 / 2;
printf("%f \n", x);
```
Można by było spodziewać się, że wynik będzie `2.5`, ale po skompilowaniu i uruchomieniu tego kodu terminal wypisuje `2.000000`. Wynika to z tego, że większy argument, czyli `5` jest liczbą całkowitą, dzieloną przez kolejną liczbę całkowitą `2`. W rezultacie czego otrzymujemy też liczbę całkowitą, która dopiero w momencie przypisania do zmiennej `x` jest rzutowana na typ zmienno przecinkowy `float`. Ale podczas rzutowania liczba nie zawiera części ułamkowej, dlatego po przecinku dodawane są `0`. 
Aby temu zapobiec rzutowania powinniśmy dokonać przed operacją dzielenia. Dla przypomnienia w tym celu wystarczy dodać `(float)` przy jednej z liczb lub zamiast `5` napisać `5.0`.

Jest jeszcze jeden operator arytmetyczny, dzielenie modulo opisywane symbolem `%`. Jako rezultat tej operacji jest zwracana reszta z dzielenia. Dla wcześniej omawianego przykładu dzielenia `5 / 2` resztą będzie `1`.

Zamiast stosować pełen zapis np. `float x = 5 / 2` dla wszystkich operacji arytmetycznych można zastosować skróconą wersję:
- `+=`
- `-=`
- `*=`
- `/=`
- `%=`

### Kolejność wykonywania operatorów arytmetycznych w C

| Priorytet | Operator | Opis | Kierunek oceny |
|-----------|----------|------|----------------|
| 1         | `()`     | Nawiasy – wymuszają kolejność | od lewej do prawej |
| 2         | `*` `/` `%` | Mnożenie, dzielenie, modulo | od lewej do prawej |
| 3        | `+` `-`  | Dodawanie, odejmowanie | od lewej do prawej |

## Operatory bitowe

Często w programowaniu, a szczególnie często w programowaniu niskopoziomowym, operuje się na bitach w tym celu mamy w C dostępne operatory bitowe. Do ich zrozumienia dobrze jest znać system dwójkowy i algebre Boole'a. Jeśli jest ci to obce, bez obaw, postaram się to wszystko wytłumaczyć.

Operacje bitowe jak nazwa wskazuje operują na bitach, bit jest to najmniejsza jednostka informacji, ma wartość `0` lub `1`. Działa to tak samo jak przełącznik do światła - `0` światło jest wyłączone, `1` światło jest włączone. Warto zaznaczyć, że __operacje bitowe w języku C są zdefiniowane tylko dla liczb całkowitych.__

Algebra Boole'a opisuje działania jakie można wykonywać na bitach oraz określa _tabelę prawdy_ która definiuje jaki będzie wynik dla danych wartości. 

W C mamy do dyspozycji następujące operacje bitowe:
- `<<` - przesunięcie bitowe w lewo, przesuwa bity o zadaną wartość, a w ich miejsce wstawia 0.

    Przykład:

    | x | x<<1 | x<<3 |
    |---|---|---|
    | 0b010110 | 0b101100 | 0b011000 |

- `>>` - przesunięcie bitowe w prawo, przesuwa bity o zadaną wartość, a w ich miejsce wstawia 0.

    Przykład:

    | x | x>>1 | x>>5 |
    |---|---|---|
    | 0b101101 | 0b010110 | 0b000001 |

- `~` - negacja bitowa (NOT) - zmienia wartość bitu na przeciwną
    
    Tabela prawdy:

    | A | ~A |
    |---|----|
    | 0 | 1  |
    | 1 | 0  |

- `&` - koniunkcja bitowa (AND) - wynik jest równy 1 jeśli obie składowe też są 1.

    Tabela prawdy:

    | A | B | A & B |
    |---|---|--------|
    | 0 | 0 | 0      |
    | 0 | 1 | 0      |
    | 1 | 0 | 0      |
    | 1 | 1 | 1      |

- `|` - alternatywa bitowa (OR) - wynik jest równy 1 jeśli chociaż jedna ze składowych jest 1, gdy obie są 0 wynik jest też 0.

    Tabela prawdy:

    | A | B | A \| B |
    |---|---|----------|
    | 0 | 0 |    0     |
    | 0 | 1 |    1     |
    | 1 | 0 |    1     |
    | 1 | 1 |    1     |

- `^` - alternatywa rozłączna (XOR) - wynik jest równy 1, gdy składowe mają różne wartości.

    Tabela prawdy:

    | A | B | A ^ B |
    |---|---|-------|
    | 0 | 0 | 0     |
    | 0 | 1 | 1     |
    | 1 | 0 | 1     |
    | 1 | 1 | 0     |

Wynik powyższych operacji nie jest nigdzie zapisywany. Aby go zachować należy zastosować pełen zapis np. `x = 5 << 2` lub też, jak w przypadku operatorów arytmetycznych, są krótsze wersje:
- `<<=`
- `>>=`
- `&=`
- `^=`
- `|=`

Należy zwrócić uwagę, że nie ma wśród nich operatora `!=`, ponieważ jest to operator relacyjny.

Szybka ściągawka, szczególnie przydatna dla programistów embedded, pokazująca jak manipulować konkretnymi bitami w rejestrach.

```c
// ustawienie bitu n
x |= (1 << n);

// wyzerowanie bitu n
x &= ~(1 << n);

// sprawdzenie bitu n
if (x & (1 << n)) { ... }

// przełączenie bitu n
x ^= (1 << n);
```


## Operatory relacyjne

Teraz przechodzimy do kolejnej grupy operatorów, które są dobrze znane z matematyki i wykorzystują algebrę Boole'a. Zaliczamy do nich:

- `==`  — operator przyrównania, jeśli obie wartości są sobie równe to zwróci 1, jeśli nie to 0.
- `!=`  — operator nierówności, gdy wartości są od siebie różne zwróci 1, a gdy równe to 0.
- `<`   — operator mniejszości, jeśli wartość z lewej strony jest mniejsza niż z prawej to zwróci 1, w przeciwnym razie 0.
- `>`   — operator większości, jeśli wartość z lewej jest większa niż z prawej to zwróci 1, w przeciwnym razie 0.
- `<=`  — mniejsze lub równe, jeśli wartość z lewej strony jest mniejsza lub równa od wartości z prawej to zwróci 1, w przeciwnym razie 0.
- `>=`  — większe lub równe, jeśli wartość z lewej strony jest większa lub równa od wartości z prawej to zwróci 1, w przeciwnym razie 0.

Czasem stosując operator `==` zdarzy się pominąć jeden symbol równości, dobrą praktyką żeby wyłapać ten błąd jest stosowanie kolejności `5 == x`, zamiast `x == 5`. Stosując pierwszy zapis, i zapominając o symbolu równości kompilator zwróci mam błąd, ponieważ nie da się do liczby `5` przypisać innej wartości. Natomiast w drugim przypadku gdy popełnimy błąd porównanie nie zostanie wykonane, a do zmiennej `x` zapiszemy liczbę `5` i operacja porównania będzie miała wartość `1`.

## Operatory logiczne

Kolejna grupa operatorów jest wykorzytywana głównie podczas wykonywania instrukcji warunkowych takich jak `if`, `while` i `do while`. Zaliczamy do nich:
- `!` - negacja
- `&&` - koniunkcja, popularny AND
- `||` - alternatywa, popularny OR

Operatory logiczne działają na wartościach logicznych (`true = 1`, `false = 0`), a nie bezpośrednio na bitach jak operatory bitowe. Jednak logika operacji AND, OR i negacji pozostaje ta sama.
Warto wspomnieć tutaj o mechnizmie __Short-circuiting__, który optymalizuje działanie programu, polega on na tym, że jeżeli w wyrażeniu z AND pierwszy argument jest 0, to drugi nie jest sprawdzany, ponieważ wiadomo, że wynik będzie równy 0. Z kolei dla OR jeżeli pierwszy argument jest 1 to wiadomo, że wynik też będzie 1.

## Podsumowanie

W dzisiejszym wpisie poznaliśmy aż 4 typy operacji - arytmetyczne, bitowe, relacyjne oraz logiczne. Wiemy do czego służą i jak je zastosować w praktyce. Nauczyliśmy się także podstaw algebry Boole'a, tabel prawdy dla najpopularniejszych operacji. A programiści embedded przypomnieli sobie podstawowe operacje na bitach.
