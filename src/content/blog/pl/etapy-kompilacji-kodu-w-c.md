---
title: "Etapy kompilacji kodu w C"
description: "Po napisaniu programu w języku C zanim będziemy mogli go uruchomić musimy przejść proces kompilacji składający się z 4 etapów. Zrozumienie tych etapów pomaga w debugowaniu i optymalizacji kodu."
pubDate: 2025-12-03
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["Język C", "GCC", "kompilacja"]
category: "język C"
draft: false
---

Proces kompilacji może wydawać się skomplikowany, szczególnie na początku przygody z programowaniem. Jednak poznanie narzędzi oraz zrozumienie, co robią, ułatwia jego opanowanie. Bardzo przydatny tutaj jest GCC - GNU Compiler Collection. Zawiera w sobie zestaw kompilatorów, w tym oczywiście dla języka C, a dzięki obsłudze różnego rodzaju flag proces ten możemy modyfikować.

## Etapy kompilacji kodu C

Przejdziemy teraz przez kolejne etapy kompilacji, dodatkowo przeprowadzimy eksperymenty z wykorzystaniem prostego programu:

```
#define A 10
#define B 20

int main() {
    int sum = A + B;
    return 0;
}

```
Podstawowa komenda do kompilacji programu to:
```
gcc <input_file>.c -o <output_file>
```
przechodzi ona przez cały proces kompilacji, plik wyjściowy jest gotowy do uruchomienia. W dalszej części będziemy korzystali z flag dostępnych dla GCC żeby dokładnie poznać poszczególne etapy kompilacji.

### Preprocesor

Pierwszym z etapów kompilacji jest preprocesor. Jego zadanie to przetwarzanie wszystkich instrukcji zaczynających się `#`, m.in.:

- #include
- #define
- #if, #ifdef, #ifndef
- #pragma

Preprocesor także usuwa komentarze z kodu.
W GCC żeby uruchomić preprocesor należy wywołać komendę:
```
gcc -E <input_file>.c -o <output_file>.i
```
Dla przykładowego programu kod po przetworzeniu przez preprocesor wygląda następująco:
```
# 0 "main.c"
# 0 "<built-in>"
# 0 "<command-line>"
# 1 "/usr/include/stdc-predef.h" 1 3 4
# 0 "<command-line>" 2
# 1 "main.c"



int main() {
    int sum = 10 + 20;
    return 0;
}
```

Pierwsze 6 linii to instrukcje specjalne generowane przez preprocesor nazywane _line markers_, służą do śledzenia skąd pochodzi każda linia kodu, kiedy zaczyna się nowy plik oraz czy nagłówek jest systemowy. Dzięki tym znacznikom debugger może wskazywać prawidłowe numery linii, kompilator generuje ostrzeżenia w prawidłowych miejscach, makra i nagłówki są rozwijane bez utraty informacji o pochodzeniu kodu.
Preprocesor po wykonaniu tych instrukcji zwraca przetworzony kod. W przykładzie widać, że zniknęły `#define`, a w ich miejscu pojawiły się wartości liczbowe.

### Kompilacja do kodu asemblera

Kolejny etap polega na kompilacji kodu z C do asemblera. Do uruchomienia służy polecenie:
```
gcc -S <input_file>.i -o <output_file>.s
```
W tym momencie możemy także wybrać platformę, dla której chcemy skompilować kod z wykorzystaniem flagi `--target` i podając jej nazwę. W przypadku braku tej flagi kompilacja odbywa się na platformę, na której jest uruchamiana.
Program z przykładu po kompilacji:
```
	.file	"main.c"
	.text
	.globl	main
	.type	main, @function
main:
.LFB0:
	.cfi_startproc
	endbr64
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register 6
	movl	$30, -4(%rbp)
	movl	$0, %eax
	popq	%rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
.LFE0:
	.size	main, .-main
	.ident	"GCC: (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0"
	.section	.note.GNU-stack,"",@progbits
	.section	.note.gnu.property,"a"
	.align 8
	.long	1f - 0f
	.long	4f - 1f
	.long	5
0:
	.string	"GNU"
1:
	.align 8
	.long	0xc0000002
	.long	3f - 2f
2:
	.long	0x3
3:
	.align 8
4:
```

Widać, jak nasz program się rozrósł, został także zoptymalizowany przez kompilator, można to zaobserwować w tym miejscu:
```
	movl	$30, -4(%rbp)
```
Program po każdym uruchomieniu nie będzie już tracił czasu na wykonanie operacji dodawania dwóch stałych liczb (10 i 20), tylko zapisze wynik dodawania na stosie.

### Generowanie kodu maszynowego

O ile kod asemblera jest w miarę czytelny dla człowieka, o tyle na kolejnym etapie kompilacji powstaje kod maszynowy — ciąg bajtów reprezentujących instrukcje procesora. Aby go wygenerować, używamy polecenia:
```
gcc -c <input_file>.s -o <output_file>.o
```
W ten sposób otrzymujemy plik obiektowy `.o`, który zawiera już skompilowany kod maszynowy, ale jeszcze nie jest kompletnym programem wykonywalnym.
Jeśli spróbujemy otworzyć taki plik w edytorze tekstu, zobaczymy chaotyczne znaki lub zapis w formie heksadecymalnej, to normalne. Plik obiektowy nie jest przeznaczony do bezpośredniego czytania, ponieważ zawiera:
- surowy kod maszynowy instrukcji CPU,
- tablice symboli,
- nagłówki i metadane właściwe dla formatu ELF,
- potencjalne relokacje, jeśli kod odwołuje się do symboli zewnętrznych.

### Linkowanie

Ostatnim etapem kompilacji jest linkowanie. To proces, w którym wszystkie pliki obiektowe oraz potrzebne biblioteki są łączone w jeden finalny program wykonywalny. Linker odpowiada m.in. za:
- scalanie sekcji kodu i danych z wielu plików `.o`,
- rozwiązywanie odwołań do symboli (np. funkcji i zmiennych globalnych),
- zastępowanie nazw funkcji rzeczywistymi adresami w pamięci,
- dołączanie kodu z bibliotek standardowych i zewnętrznych,
- przygotowanie finalnej struktury pliku wykonywalnego (np. ELF w Linuksie).

Aby wygenerować plik wykonywalny z pliku obiektowego, używamy:
```
gcc <input_file>.o -o <output_file>
```
Domyślnym punktem wejścia w programach w C nie jest bezpośrednio funkcja `main`, lecz symbol `__start` zdefiniowany przez linker, który następnie wywołuje kod startowy biblioteki C(CRT), a dopiero później `main`.
Jednak możemy nadpisać punkt wejścia, wskazując inny symbol, np. funkcję `poczatek`:
```
gcc main.o -o program -Wl,-e,poczatek
```
- `-Wl,` - określa, że kolejne opcje są przekazywane bezpośrednio do linkera.
- `-e, poczatek` - ustawia symbol `poczatek` jako punkt wejścia do programu.


## Flagi kompilacji w GCC

Poznaliśmy już kilka flag dostępnych w GCC, ale jest ich dużo więcej omówię te najczęściej używane, a wszystkie dostępne można znaleźć tutaj:
[gcc.gnu.org/onlinedocs/gcc/Option-Index.html](https://gcc.gnu.org/onlinedocs/gcc/Option-Index.html)

### Flagi optymalizacji

- `O0` - Brak optymalizacji, domyślnie dla debugowania.
- `O1` - Podstawowa optymalizacja, niewielki wpływ na czas kompilacji.
- `O2` - Optymalizacja standardowa, najczęściej używana w produkcji.
- `O3` - Maksymalna optymalizacja.
- `Os` - Optymalizacja pod rozmiar programu, mniejszy kod.
- `Ofast` - Maksymalna optymalizacja oraz ignorowanie niektórych standardów zgodności.

### Flagi debugowania

- `g` - Dodaje informacje debugowe – do użycia z gdb.
- `ggdb` - Optymalizacja informacji debugowych pod gdb.
- `Wall` - Włącza większość ostrzeżeń kompilatora.
- `Wextra` - Włącza dodatkowe ostrzeżenia (np. nieużywane zmienne).
- `pedantic` - Wymusza zgodność z standardem C/C++.

### Flagi architektury

- `m32` - Kompilacja 32-bitowa (x86).
- `m64` - Kompilacja 64-bitowa (x86-64).
- `march=<arch>` - Generuje kod dla konkretnego CPU, np. -march=native, -march=haswell.
- `mtune=<cpu>` - Optymalizacja dla konkretnego CPU, bez zmiany kompatybilności.

### Flagi diagnostyczne

- `v` - Pokazuje szczegółowy przebieg kompilacji – które pliki startowe, biblioteki, opcje są używane.
- `save-temps` - Zachowuje wszystkie pliki pośrednie (.i, .s, .o) po kompilacji.
- `fno-builtin` - Nie używa funkcji wbudowanych kompilatora, wymusza własną implementację.

## Podsumowanie

Cały proces kompilacji kodu w języku C składa się z 4 etapów - preprocesora, kompilacji do kodu asemblera, kompilacji do kodu maszynowego oraz linkera. Każdy z nich pełni inną, istotną rolę i dopiero ich połączenie pozwala uzyskać działający program.
Jednym z najpopularniejszych kompilatorów jest GCC, dzięki któremu możemy prześledzić kolejne procesy kompilacji. Zachęcam do eksperymentowania z kolejnymi flagami GCC, analizowania plików pośrednich oraz samodzielnego prześledzenia procesu kompilacji bardziej złożonych projektów.