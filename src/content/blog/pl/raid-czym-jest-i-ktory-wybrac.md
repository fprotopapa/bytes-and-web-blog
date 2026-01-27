---
title: "RAID - czym jest i który wybrać"
description: „Omówimy najważniejsze poziomy RAID ich zalety, wady oraz typowe zastosowania.”
pubDate: 2026-01-27
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["storage", "RAID"]
category: "storage"
draft: false
---

RAID (Redundant Array of Independent Disks) to technologia łączenia wielu dysków twardych w jedną logiczną całość. Jej celem może być zwiększenie wydajności, poprawa bezpieczeństwa danych lub znalezienie kompromisu pomiędzy tymi cechami.
RAID jest powszechnie wykorzystywany w serwerach, macierzach dyskowych oraz systemach NAS, ale coraz częściej spotyka się go również w komputerach domowych i stacjach roboczych. Obecnie najpopularniejsze poziomy RAID to: 0, 1, 5, 6 oraz 10.

## RAID 0

RAID 0, nazywany również __stripingiem__, polega na dzieleniu danych na bloki i zapisywaniu ich naprzemiennie na co najmniej dwóch dyskach.
Do zalet tego rozwiązania należy bardzo wysoka wydajność odczytu i zapisu, ponieważ dane są zapisywane równolegle na wszystkie dostępne dyski, im więcej dysków, tym większa wydajność. W takiej konfiguracji użytkownik ma do dyspozycji pełną pojemność wszystkich dysków.
Do wad należy całkowity brak redundancji danych oraz fakt, że awaria jednego dysku powoduje utratę wszystkich danych.
RAID 0 sprawdzi się tam, gdzie liczy się wyłącznie wydajność, na przykład w obróbce wideo, grafice czy testach wydajności, ale nie nadaje się do przechowywania ważnych danych.

## RAID 1

RAID 1 działa na zasadzie __mirroringu__, czyli lustrzanego zapisu danych na wszystkich dostępnych dyskach. Każdy z nich zawiera identyczną kopię danych.
Dzięki temu zapewnia bardzo wysoki poziom bezpieczeństwa danych oraz umożliwia dalszą pracę systemu po awarii jednego dysku, dopóki co najmniej jeden pozostaje sprawny. RAID 1 jest również prosty w konfiguracji.
Czas zapisu danych jest równy czasowi zapisu najwolniejszego dysku, natomiast dostępna pojemność macierzy jest równa pojemności najmniejszego dysku.
Jest to idealny wybór dla systemów, w których priorytetem jest bezpieczeństwo danych, takich jak serwery plików czy systemy backupowe.

## RAID 5

RAID 5 łączy striping z rozproszonymi danymi parzystości (parity). Wymaga minimum trzech dysków. Łączna pojemność dla N dysków będzie równa N − 1. Dane i informacje parzystości są równomiernie rozkładane pomiędzy wszystkie dyski. Dane parzystości służą do odtworzenia danych w przypadku awarii dysku, bez potrzeby trzymania pełnej kopii, jak w RAID 1. Do odtworzenia danych wymagana jest wiedza o układzie RAID, czyli o tym, w których sektorach znajdują się dane, a w których parity.
Warto w tym momencie wyjaśnić, czym są dane parzystości. Parzystość to informacja matematyczna, która pozwala wyliczyć brakujący fragment danych. Wykorzystuje się do tego algebrę Boole’a, opartą wyłącznie na wartościach 0 i 1. W tej algebrze funkcją parzystości jest operacja XOR — przyjmuje ona wartość 1, gdy __nieparzysta__ liczba argumentów ma wartość 1, a 0, gdy __parzysta__ liczba argumentów ma wartość 1.
Na przykład mamy trzy dyski — A, B i C. Dysk B uległ awarii i chcemy odtworzyć wartość jednego bloku. Wartości w odpowiadających blokach na dyskach A i C wynoszą 0 i 1, a wiadomo, że parity było na dysku A. Oznacza to, że przed awarią liczba bloków o wartości 1 była parzysta, stąd wiadomo, że brakujący blok przed awarią miał wartość 1.
Korzyści wynikające ze stosowania RAID 5 to dobra wydajność odczytu oraz odporność na awarię jednego dysku.
Do wad należy zaliczyć zmniejszoną szybkość zapisu ze względu na obliczanie sum kontrolnych. W przypadku awarii dostęp do danych będzie dodatkowo spowolniony z powodu konieczności wykonywania obliczeń w celu odbudowy pozostałych danych.
RAID 5 jest popularnym wyborem w serwerach plików i środowiskach biznesowych, gdzie potrzebny jest balans pomiędzy wydajnością a bezpieczeństwem.

## RAID 6

Jest to rozwinięcie omówionego wcześniej RAID 5 o dodatkową parzystość. Wymagane są minimum cztery dyski. Dzięki zastosowaniu podwójnej parzystości zapewnia większą niezawodność może dojść do awarii dwóch dysków bez utraty danych.
Powoduje to jednak większy narzut na pojemność, która dla N dysków będzie równa N − 2. Konieczność zapisu dwóch bloków parzystości zmniejsza ogólną szybkość zapisu danych.
RAID 6 jest stosowany w dużych macierzach dyskowych i systemach, gdzie utrata danych jest absolutnie niedopuszczalna.

## RAID 0+1

Jest to połączenie macierzy RAID 0 i RAID 1. Realizowany jest jako macierz RAID 1, która składa się z dwóch macierzy RAID 0, czyli mamy mirror dla RAID 0. Wymaga minimum czterech dysków.
W przypadku awarii jednego dysku cała macierz RAID 0 jest uznawana za uszkodzoną i system działa wyłącznie na drugiej połowie. Jeśli w niej również dojdzie do awarii, dane zostają utracone.
Z tego względu RAID 0+1 jest rzadko stosowany, ponieważ został wyparty przez RAID 1+0.

## RAID 1+0

Połączenie RAID 1 i RAID 0. Na wyższym poziomie mamy RAID 0, czyli dane są równolegle zapisywane na różne dyski, a na niższym poziomie RAID 1, gdzie tworzone są kopie danych. Ma to tę przewagę nad RAID 0+1, że w przypadku awarii odbudowywany jest jedynie fragment macierzy. Wymagane są minimum cztery dyski.
Szybkość odczytu jest taka sama jak w RAID 0, natomiast wydajność zapisu odpowiada wydajności RAID 0 z połowy wszystkich dysków.
Największą wadą jest koszt przechowywania danych. Wykorzystywana jest jedynie połowa dostępnej pojemności, co oznacza, że efektywnie płacimy podwójnie za każdy gigabajt.
RAID 1+0 jest stosowany w bazach danych, systemach transakcyjnych oraz serwerach o dużym obciążeniu, gdzie liczy się zarówno wydajność, jak i niezawodność.

## Podsumowanie

Wybór odpowiedniego poziomu RAID zależy przede wszystkim od potrzeb użytkownika. Jeśli wydajność jest priorytetem, dobrym wyborem będzie RAID 0. Gdy kluczowe jest bezpieczeństwo danych RAID 1 lub RAID 6. W przypadku potrzeby kompromisu pomiędzy wydajnością a niezawodnością najlepiej sprawdzą się RAID 5 lub RAID 10.
Warto pamiętać, że RAID nie jest backupem. Nawet najbardziej zaawansowana macierz nie zastąpi regularnych kopii zapasowych. RAID zwiększa dostępność i niezawodność danych, ale nie chroni ich przed przypadkowym usunięciem, wirusami ani błędami użytkownika.