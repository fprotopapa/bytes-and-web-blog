---
title: "Jak pisać SOLIDny kod?"
description: Przedstawimy zasadę SOLID, opiszemy na czym polega oraz czemu warto ją stosować
pubDate: 2026-02-27
author: pl/przemyslaw-selwiak
coverImage: "/images/posts/test-post/aliveandkicking.webp"
tags: ["programowanie obiektowe", "RAID"]
category: "programowanie obiektowe"
draft: false
---

Nazwa SOLID jest akronimem utworzonym z pięciu zasad sformułowanych i opisanych przez Robert C. Martin. Wytyczne te pomagają pisać kod, który jest bardziej czytelny, a dzięki temu łatwiejszy do utrzymania. Ułatwiają również jego rozszerzalność o nowe funkcjonalności oraz zmniejszają podatność na błędy.
Przejdźmy przez wszystkie te zasady.

## Single responsibility principle - Zasada jednej odpowiedzialności

Definicja pochodząca bezpośrednio z książek Clean Code i Clean Architecture brzmi:
"Klasa powinna mieć tylko jeden powód do zmiany."
Każdy moduł w oprogramowaniu powinien mieć określone jedno zadanie, klasa nie powinna mieć metod, które potencjalnie wymagałyby zmian z różnych powodów.
Mając klasę `UserService` chcąc zmodyfikować sposób generowania raportów, wysyłania maili lub zapis do bazy danych mamy już trzy powody do jej zmiany.
```c++
class UserService {
public:
    void registerUser(const User& user) {
        saveToDatabase(user);
        sendEmail(user);
        generateReport(user);
    }

private:
    void saveToDatabase(const User& user) {}

    void sendEmail(const User& user) {}

    void generateReport(const User& user) {}
};
```
Stosując się do zasady pojedyńczej odpowiedzialności, powinniśmy wydzielić poszczególne metody do oddzielnych klas.
```c++
class UserRepository {
public:
    void save(const User& user) {}
};

class EmailService {
public:
    void send(const User& user) {}
};

class ReportGenerator {
public:
    void generate(const User& user) {}
};

class UserService {
private:
    UserRepository repository;
    EmailService emailService;
    ReportGenerator reportGenerator;

public:
    void registerUser(const User& user) {
        repository.save(user);
        emailService.send(user);
        reportGenerator.generate(user);
    }
};
```
Mając klase wykonująca jedno zadanie łatwiej jest naprawiać błedy lub modyfikować funkcjonalności.

## Open/closed principle - Zasada otwarte-zamknięte 

Moduły powinny być otwarte na rozszerzanie, ale zamknięte na modyfikację. Oznacza to, że dodając nową funkcjonalność nie powinniśmy zmieniać istniejącego, przetestowanego kodu, możemy go jedynie rozszerzać.
Stosując tę zasadę w praktyce, często wykorzystuje się metody wirtualne i polimorfizm.
Biorąc przykładowo klasę `ReportGenerator` z poprzedniego akapitu, można ją rozszerzyć w następujący sposób:
```c++
class PdfReportGenerator : public IReportGenerator {
public:
    void generate(const User& user) override {}
};

class XmlReportGenerator : public IReportGenerator {
public:
    void generate(const User& user) override {}
};

class JsonReportGenerator : public IReportGenerator {
public:
    void generate(const User& user) override {}
};
```

## Liskov substitution principle - Zasada podstawienia Liskov

Zasada ta jest powiązana z poprzednią – otwarte-zamknięte. Mówi, że obiekty klasy bazowej powinny dać się zastąpić obiektami klas pochodnych bez zmiany poprawności działania programu. Oznacza to, że klasa dziedzicząca musi zachowywać się zgodnie z kontraktem klasy bazowej. Nie wystarczy jedynie implementować wszystkie metody. Ich zachowanie musi być zgodne z oczekiwaniami.

## Interface segregation principle - Zasada segregacji interfejsów

Klienci nie powinni być zmuszani do zależności od metod, których nie używają.
Lepiej stworzyć kilka małych, wyspecjalizowanych interfejsów niż jeden duży.
Złe podejście:
```c++
class IWorker {
public:
    virtual void work() = 0;
    virtual void eat() = 0;
    virtual void sleep() = 0;
};
```
Robot implementujący taki interfejs byłby zmuszony do implementacji metod `eat()` i `sleep()`, mimo że ich nie potrzebuje.
Lepsze podejście:
```c++
class IWorkable {
public:
    virtual void work() = 0;
    virtual ~IWorkable() = default;
};

class IEatable {
public:
    virtual void eat() = 0;
    virtual ~IEatable() = default;
};
```
Każda klasa implementuje tylko te interfejsy, które są jej rzeczywiście potrzebne. Dzięki tej zasadzie łatwiej jest rozbudować kod.

## Dependency inversion principle - Zasada odwrócenia zależności

Moduły wysokiego poziomu nie powinny zależeć od modułów niskiego poziomu. Oba powinny zależeć od abstrakcji.
Złe podejście:
```c++
class MySQLDatabase {
public:
    void save(const User& user) {}
};

class UserService {
private:
    MySQLDatabase database;

public:
    void registerUser(const User& user) {
        database.save(user);
    }
};
```
`UserService` jest silnie związany z konkretną implementacją bazy danych. 
Zastępując `MySQLDatabase` klasą abstrakcyjną możemy łatwo podmienić bazę danych lub użyć obiektu testowego.
```c++
class IDatabase {
public:
    virtual void save(const User& user) = 0;
    virtual ~IDatabase() = default;
};

class MySQLDatabase : public IDatabase {
public:
    void save(const User& user) override {}
};

class UserService {
private:
    IDatabase& database;

public:
    UserService(IDatabase& db) : database(db) {}

    void registerUser(const User& user) {
        database.save(user);
    }
};
```

## Podsumowanie

W dzisiejszym wpisie poznaliśmy pięć zasad SOLID i zobaczyliśmy, jak wpływają one na jakość kodu. Dowiedzieliśmy się, dlaczego warto ograniczać klasy do jednej odpowiedzialności, projektować systemy otwarte na rozszerzenia, zapewniać poprawne dziedziczenie, tworzyć małe interfejsy oraz zależeć od abstrakcji zamiast konkretów.
Dzięki tym praktycznym wskazówkom jesteśmy w stanie pisać kod czytelny, elastyczny i odporny na zmiany.