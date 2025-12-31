---
title: "Pętle i instrukcje warunkowe"
description: „Pętle oraz instrukcje warunkowe to podstawowe elementy sterujące przebiegiem programu w języku C.”
pubDate: 2025-12-31
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "operatory", "Instrukcje warunkowe"]
category: "język C"
draft: false
---

Pętle oraz instrukcje warunkowe pozwalają podejmować decyzje na podstawie danych wejściowych oraz wielokrotnie wykonywać ten sam fragment kodu. W tym wpisie przyjrzymy się, jak działają i jak poprawnie stosować je w praktyce.

## Pętle
### for
Pisząc program, często zdarza się, że kilka razy trzeba wykonać ten sam zestaw poleceń. Aby nie pisać wielokrotnie tego samego kodu, można skorzystać z pętli. Pętla to fragment kodu, który będzie się wykonywał, dopóki dany warunek jest spełniony.
Pierwszym rodzajem pętli, jaki poznamy, jest `for`. Jej składnia prezentuje się następująco:
```c
for (inicjalizacja; warunek wyjścia; aktualizacja) {
    // wnętrze pętli – kod, który będzie się powtarzał, dopóki warunek jest spełniony
}
```
W pętli `for` kluczowe są trzy elementy:
- inicjalizacja – wykonywana jest przed rozpoczęciem pętli,
- warunek wyjścia – sprawdza, czy pętla powinna być kontynuowana,
- aktualizacja – instrukcja wykonywana po każdym przebiegu pętli.
Przykładowo `for (int i = 0; i < 10; i++)` wykona się 10 razy. Zmienna `i` zostanie zainicjalizowana wartością 0 i przy każdym przebiegu pętli będzie zwiększana o 1. Przy pierwszym przebiegu pętli `i` będzie równe 0, a przy ostatnim — 9.

Warto wspomnieć, że nie trzeba podawać wszystkich parametrów dla pętli `for`. Ba, nie podając żadnych, np. `for(;;)`, otrzymamy pętlę nieskończoną, która w niektórych przypadkach może być pożądana.

### while
Kolejnym przykładem pętli jest `while`. Działa ona na tej samej zasadzie co `for`, czyli wykonuje się tak długo, jak długo warunek jest spełniony. Różnica między nimi polega na tym, że w przypadku `for` zazwyczaj wiemy z góry, ile razy pętla się wykona, natomiast przy `while` nie zawsze jest to znane. Składnia na pierwszy rzut oka wydaje się prostsza, ponieważ definiujemy jedynie warunek wyjścia.
```c
while (warunek) {
    // wnętrze pętli – kod, który będzie się powtarzał, dopóki warunek jest spełniony
}
```
Korzystając z petli `while` zawsze warto upewnić się, że zmienna sterująca będzie w końcu spełniać warunek zakończenia pętli. Jeśli zapomnimy zwiększyć wartość zmiennej sterującej, warunek nigdy nie zostanie spełniony i pętla stanie się nieskończona, co może spowodować zawieszenie programu. Tak samo jak dla `for(;;)`, stosujac `while(1)` otrzymamy pętlę nieskończona.

### do while
Pętla `do...while` jest podobna do pętli `while`, z tą różnicą, że warunek sprawdzany jest dopiero po wykonaniu wnętrza pętli. Oznacza to, że kod znajdujący się w pętli wykona się co najmniej jeden raz, nawet jeśli warunek początkowo nie jest spełniony.
Składnia pętli `do...while` wygląda następująco:
```c
do {
    // wnętrze pętli – kod, który zostanie wykonany przynajmniej raz
} while (warunek);
```

## Instrukcje warunkowe
Instrukcje warunkowe w języku C pozwalają programowi podejmować decyzje w zależności od spełnienia określonych warunków. Dzięki nim możemy wykonywać różne fragmenty kodu w zależności od wartości zmiennych lub wyniku wyrażeń logicznych.
### if
Instrukcja `if` sprawdza warunek i wykonuje blok kodu tylko wtedy, gdy warunek jest prawdziwy.
```c
if (warunek) {
    // kod wykonywany, jeśli warunek jest prawdziwy
}
```
Można też rozszerzyć `if` o dodatkowe warunki przy użyciu `else if` i `else`:
```c
if (warunek1) {
    // kod wykonywany, jeśli warunek1 jest prawdziwy
} else if (warunek2) {
    // kod wykonywany, jeśli warunek1 jest fałszywy, a warunek2 jest prawdziwy
} else {
    // kod wykonywany, jeśli wszystkie powyższe warunki są fałszywe
}
```
W języku C możemy tworzyć bardziej złożone warunki przy użyciu operatorów logicznych `&&`, `||` i `!`, opisanych w poprzednim wpisie. Instrukcje `if` mogą być też zagnieżdżane, czyli umieszczone jedna w drugiej. Pozwala to tworzyć decyzje wielopoziomowe, które reagują na bardziej skomplikowane sytuacje. Warto jednak zachować ostrożność zbyt wiele zagnieżdżonych warunków może sprawić, że kod stanie się trudny do czytania i utrzymania.

### switch
Instrukcja `switch` służy do sprawdzania wartości wyrażenia i wykonywania odpowiedniego bloku kodu w zależności od tej wartości. Jest szczególnie przydatna, gdy mamy wiele możliwych przypadków do obsłużenia.
```c
switch (wyrażenie) {
    case x:
        // kod wykonywany, jeśli wyrażenie == x
        break;
    case y:
        // kod wykonywany, jeśli wyrażenie == y
        break;
    default:
        // kod wykonywany, jeśli żaden przypadek nie pasuje
}
```
Każdy przypadek `case` zwykle kończy się instrukcją `break`. W przypadku jej braku wszystkie kolejne przypadki poniżej spełnionego również zostaną wykonane.
`default` jest opcjonalne, ale warto je stosować, aby obsłużyć sytuacje nieprzewidziane.
Instrukcja `switch` działa tylko z typami całkowitymi: int, char lub enum. Nie działa bezpośrednio na typach zmiennoprzecinkowych float, double ani na łańcuchach znaków w C.

## Goto

Przy okazji tego wpisu wspomnę o instrukcji `goto` wykonuje ona skok do miejsca w kodzie oznaczonego etykietą. Przykład użycia:
```c
#include <stdio.h>

int main(void) {
    int x;

    printf("Podaj liczbę dodatnią: ");
    if (scanf("%d", &x) != 1) {
        goto blad;
    }

    if (x <= 0) {
        goto blad;
    }

    printf("Podana liczba to: %d\n", x);
    return 0;

blad:
    printf("Błąd: podano niepoprawną wartość.\n");
    return 1;
}
```
Instrukcja `goto` w języku C budzi kontrowersje wśród programistów. Uznawana jest za symbol złych praktyk programistycznych w praktyce jej nadmierne używanie prowadzi do tzw. _spaghetti code_, czyli kodu, w którym przepływ sterowania jest trudny do prześledzenia i utrzymania. Dlatego należy podchodzić do niej z rozsądkiem. Dobrze sprawdza się natomiast w obsłudze błędów.

## Podsumowanie
Pętle `for`, `while`, `do...while` pozwalają wielokrotnie wykonywać kod, a wybór odpowiedniej zależy od tego, czy znamy liczbę iteracji i czy kod ma wykonać się przynajmniej raz. Instrukcje warunkowe `if` i `switch` umożliwiają podejmowanie decyzji w zależności od wartości zmiennych lub wyrażeń logicznych. `goto` pozwala na skok w kodzie, ale należy używać go ostrożnie, głównie przy obsłudze błędów. Znajomość tych konstrukcji jest podstawą czytelnego i efektywnego programowania w C.