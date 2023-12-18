---
layout: post
category: "엔지니어링"
series: "코틀린 코루틴"
seriesOrder: 4
title: "코틀린 코루틴 4편 - 코루틴 직접 구현해보기"
author: thxwelchs
tags: ["kotlin", "coroutine", "코루틴", "continuation", "JNI", "ucontext"]
image: /img/covers/eng/kotlin-coroutine-4.png
date: "2023-12-18T12:01:42.000Z"
draft: false
---

# 들어가며

이번엔 코루틴이 내부에서 어떻게 "멈췄다 다시 이어서" 도는지를 직접 흉내 내봅니다. Kotlin에선 `suspend` 한 단어로 끝나지만, 그 밑바닥이 늘 궁금했습니다. 그래서 컴파일러의 도움 없이, C로 멈춤·재개를 직접 만들어보고 그걸 JNI로 Java에서 불러봤습니다.

미리 말해두면, 이건 원리를 손으로 만져보려는 교육용 단순 데모입니다. 뒤에서 쓸 `ucontext`는 macOS에선 deprecated 됐고(컴파일 시 경고를 끄고 썼습니다), 단일 스레드 기준이라 실전용은 아닙니다. 목적은 "동작 원리 확인"입니다.

<br/>

# 컨티뉴에이션이 뭐였더라

코루틴의 핵심은 `suspend`, 즉 "멈춤"입니다. 그런데 멈췄다가 나중에 그 자리에서 다시 이어서 돌려면 무엇이 필요할까요? "어디서 멈췄고, 그때 무슨 값을 들고 있었는지"를 어딘가에 저장해둬야 합니다. 그 "저장된 나머지 계산"을 컨티뉴에이션(continuation)이라고 부릅니다.

비유하면 책갈피(북마크)입니다. `yield`는 책갈피를 끼우고 책을 덮어 호출자에게 넘기는 것이고, `resume`은 그 책갈피를 펴서 멈춘 줄부터 다시 읽는 것입니다.

![suspend는 멈춘 지점(북마크=컨티뉴에이션)을 저장하고, resume은 그 북마크에서 이어서 실행한다는 타임라인](/img/kotlin-coroutine-4/continuation-resume-v1.png)

<br/>

# C로 yield/resume 만들기 (ucontext)

그럼 컴파일러의 도움 없이 이 멈춤·재개를 어떻게 만들 수 있을까요? C에는 실행 컨텍스트를 통째로 다루는 `ucontext`라는 도구가 있습니다. `getcontext`로 현재 상태를 뜨고, `makecontext`로 새 컨텍스트에 진입 함수를 걸고, `swapcontext`로 두 컨텍스트를 맞바꿉니다. 이 `swapcontext`가 핵심인데, **현재 실행 컨텍스트(스택 + 레지스터)를 저장하고 다른 컨텍스트를 복원**합니다. 이게 사실상 컨티뉴에이션을 교체하는 동작 그 자체였습니다.

![swapcontext가 호출자 컨텍스트와 코루틴 컨텍스트(각자의 스택)를 맞바꿔, 제어가 둘 사이를 오가는 그림](/img/kotlin-coroutine-4/ucontext-swap-v1.png)

코루틴 본체는 10, 20, 30을 차례로 내보내는 단순한 함수로 잡았습니다. 값을 하나 정해두고 `swapcontext`로 호출자에게 돌아가면(yield), 다음에 호출자가 다시 들어올 때(resume) 바로 그 다음 줄부터 이어집니다.

```c
typedef struct {
    ucontext_t caller;   // resume를 호출한 쪽으로 돌아갈 컨텍스트
    ucontext_t coro;     // 코루틴 본체의 컨텍스트
    char *stack;
    int yielded;
    int finished;
} Coro;

// 코루틴 본체: 10, 20, 30 을 차례로 yield
// makecontext는 int 인자만 넘길 수 있어, 핸들 포인터를 상·하위 32비트로 쪼개 받는다
static void coro_entry(unsigned int hi, unsigned int lo) {
    Coro *self = (Coro *) (((uintptr_t) hi << 32) | (uintptr_t) lo);
    for (int i = 1; i <= 3; i++) {
        self->yielded = i * 10;
        swapcontext(&self->coro, &self->caller);   // yield: 내 컨텍스트 저장 후 호출자로
    }
    self->finished = 1;
}

int coro_resume(Coro *c) {
    if (c->finished) {
        return -1;
    }
    swapcontext(&c->caller, &c->coro);   // resume: 호출자 저장 후 코루틴으로 점프
    if (c->finished) {
        return -1;
    }
    return c->yielded;
}
```

`swapcontext(&coro, &caller)`가 yield, `swapcontext(&caller, &coro)`가 resume입니다. 같은 함수 호출인데 어느 쪽을 저장하고 어느 쪽으로 가느냐만 다릅니다. 멈춤과 재개가 결국 한 동작의 양방향이었던 셈입니다.

<br/>

# JNI로 Java에서 부르기

이제 이 C 코루틴을 Java에서 부를 차례입니다. Java는 `native` 메서드와 JNI(Java Native Interface)로 C 함수를 호출할 수 있습니다. Java 쪽엔 네이티브 선언만 둡니다.

```java
public class NativeCoroutine implements AutoCloseable {

    static {
        System.loadLibrary("coro");
    }

    private final long handle;

    public NativeCoroutine() {
        this.handle = create();
    }

    private static native long create();

    private static native int resume(long handle);

    private static native boolean done(long handle);

    private static native void destroy(long handle);

    public int resume() {
        return resume(handle);
    }

    public boolean isDone() {
        return done(handle);
    }

    @Override
    public void close() {
        destroy(handle);
    }
}
```

빌드는 세 단계였습니다. `javac -h`로 JNI 헤더를 만들고, 그 시그니처에 맞춰 C를 구현한 뒤, 공유 라이브러리로 컴파일합니다.

```bash
# 1) JNI 헤더 생성 (NativeCoroutine.h)
javac -h . NativeCoroutine.java

# 2) 공유 라이브러리 컴파일 (macOS arm64, JDK 21)
clang -shared -fPIC -Wno-deprecated-declarations \
  -I"$JAVA_HOME/include" -I"$JAVA_HOME/include/darwin" \
  coro.c -o libcoro.dylib

# 3) 실행
java -Djava.library.path=. NativeCoroutine
```

`resume`을 반복 호출하며 yield 값을 받아 찍어봤더니, 실제로 이렇게 나왔습니다.

```text
=== JNI 네이티브 코루틴 흉내 (C ucontext) ===
resume #1 -> 코루틴이 yield 한 값: 10
resume #2 -> 코루틴이 yield 한 값: 20
resume #3 -> 코루틴이 yield 한 값: 30
코루틴이 끝까지 실행됨 (done)
```

Java 입장에선 `resume()`을 부를 때마다 코루틴이 멈췄던 자리에서 다음 값을 들고 돌아왔습니다. 손으로 만든 yield/resume이 정말로 도는 걸 보니, 추상적이던 컨티뉴에이션이 비로소 손에 잡히는 느낌이었습니다.

<br/>

# 두 개를 번갈아 돌려도 안전한가

코루틴이라면 여러 개를 번갈아 돌릴 수 있어야 진짜 쓸모가 있겠죠? 그래서 핸들을 `makecontext`의 인자로 넘기도록 만들었습니다(`ucontext`는 `int` 인자만 받아서, 포인터를 상·하위 32비트로 쪼개 전달했습니다). 코루틴 A와 B를 번갈아 `resume` 해봤습니다.

```java
try (NativeCoroutine A = new NativeCoroutine();
     NativeCoroutine B = new NativeCoroutine()) {
    for (int round = 1; round <= 3; round++) {
        int va = A.resume();
        int vb = B.resume();
        System.out.println("round " + round + ":  A -> " + va + "   B -> " + vb);
    }
}
```

```text
=== 두 코루틴 A, B 를 번갈아 resume ===
round 1:  A -> 10   B -> 10
round 2:  A -> 20   B -> 20
round 3:  A -> 30   B -> 30
```

A와 B가 서로의 진행에 끼어들지 않고 각자 10·20·30을 이어갑니다. 컨티뉴에이션(멈춘 지점 + 상태)을 코루틴마다 따로 들고 있으니 당연한 결과인데, 직접 번갈아 돌려보니 "각자의 책갈피"라는 게 더 또렷하게 와닿았습니다.

<br/>

# Kotlin은 이걸 어떻게 할까?

그럼 Kotlin도 이렇게 스택을 통째로 뜰까요? 우리는 코루틴 전용 스택을 통째로 따로 떠서(`ucontext`) 그걸 맞바꿨습니다. 이런 방식을 스택풀(stackful)이라고 합니다. 그런데 Kotlin 코루틴은 이렇게 하지 않습니다.

Kotlin은 컴파일러가 `suspend` 함수를 상태 머신(CPS, continuation-passing style)으로 바꿔치웁니다. 멈출 수 있는 지점마다 번호(label)를 매기고, 그때까지의 지역변수를 `Continuation` 객체에 담아둡니다. 재개할 때는 그 객체의 label을 보고 "몇 번 지점부터"를 이어서 실행합니다. 스택을 통째로 들고 있는 게 아니라, 작은 객체 하나에 상태를 담는 스택리스(stackless) 방식입니다.

![Kotlin은 컴파일러가 suspend를 CPS 상태머신으로 바꿔 Continuation 객체(label+지역변수)에 담고, 이 데모는 ucontext로 스택을 통째로 맞바꾸는 비교](/img/kotlin-coroutine-4/kotlin-vs-native-v1.png)

그래서 차이가 큽니다. 우리 데모는 코루틴 하나당 네이티브 스택을 하나씩 잡아 무겁지만, Kotlin은 힙에 작은 객체만 남기니 코루틴을 수십만 개 띄워도 가볍습니다. 1편에서 "코루틴은 스레드보다 가볍다"고 했던 그 가벼움의 출처가, 결국 이 스택리스 설계였던 거였음. 방식은 달라도 목적은 똑같았습니다. 멈춘 지점을 저장했다가 그 자리에서 재개하는 것.

> 참고로 최근의 자바 가상 스레드(Virtual Threads)도 큰 틀에서는 JVM 레벨의 컨티뉴에이션을 활용합니다. "멈췄다 재개"라는 발상은 같은데 층위가 다른 셈인데, 이건 [리액티브 시리즈](/reactive-streams-9/)에서 예고한 대로 가상 스레드를 따로 다룰 때 이어서 정리해보려 합니다.

<br/>

# 마지막 정리

4편 내용을 정리하면 이렇습니다.

- **컨티뉴에이션**: 코루틴의 본질은 "멈춘 지점 + 그때의 상태"를 저장했다가 그 자리에서 재개하는 것. yield와 resume은 한 동작의 양방향이었음.
- **직접 구현**: C의 `ucontext`로 `swapcontext`를 yield/resume으로 써서 코루틴을 흉내 냈고, JNI로 Java에서 불러 실제로 10·20·30을 받아봤음.
- **Kotlin과의 차이**: 우리는 스택을 통째로 뜨는 스택풀, Kotlin은 컴파일러가 CPS로 바꿔 `Continuation` 객체에 담는 스택리스. 코루틴이 가벼운 이유가 여기 있었음.

직접 만들어보니, 코루틴이라는 추상이 결국 "어디서 멈췄는지를 저장하는 자료구조"로 내려앉는 게 보였습니다. 평소에 `suspend` 한 줄로 누리던 편함 뒤에 이런 기계가 돌고 있었다는 걸, 손으로 한 번 만들어보고 나서야 제대로 납득한 것 같습니다.

<br/>

# 참고

> - [Kotlin coroutines 디자인 문서(KEEP)](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.md)
> - [Java Native Interface Specification](https://docs.oracle.com/en/java/javase/21/docs/specs/jni/index.html)
> - `man ucontext` / `man swapcontext`
