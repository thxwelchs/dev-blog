---
layout: post
category: "엔지니어링"
series: "코틀린 코루틴"
seriesOrder: 2
title: "코틀린 코루틴 2편 - 구조화된 동시성, 취소와 예외"
author: thxwelchs
tags: ["kotlin", "coroutine", "코루틴", "구조화된 동시성", "structured concurrency", "취소", "예외처리"]
image: /img/covers/eng/kotlin-coroutine-2.png
date: "2023-09-12T11:20:43.000Z"
draft: false
---

# 들어가며

[1편](/kotlin-coroutine-intro/)에서는 "코루틴이 무엇이고 왜, 어떻게 도는가"를 정리했습니다. 개념과 동작 원리를 잡는 글이었죠.

그런데 막상 실무에서 코루틴을 쓰다 보니, 정작 자주 부딪힌 건 개념보다 **생명주기** 쪽이었습니다. 이 코루틴은 언제 끝나는지, 중간에 취소되면 어떻게 되는지, 안에서 예외가 터지면 그게 어디로 흘러가는지. WebFlux + 코루틴 환경에서 이걸 어설프게 알고 쓰면 "분명 취소했는데 계속 도는" 코드나, "한 군데 터졌는데 멀쩡한 다른 작업까지 같이 죽는" 상황을 만나게 됩니다.

그래서 2편은 **코루틴을 실무에서 안전하게 쓰기 위한 세 가지**인 구조화된 동시성(structured concurrency), 취소(cancellation), 예외 처리를 정리해보려 합니다. 저도 정리하면서 "아 그래서 그랬구나" 한 부분이 많았던 것 같습니다.

- **1편**: 코루틴이 왜 필요한가, 기본 개념과 동작 원리
- **2편 (이번 글)**: 구조화된 동시성, 취소, 예외
- **3편 (예정)**: Flow

<br/>

# 1편의 Continuation 다시 보기

본론에 들어가기 전에, 1편에서 짚었던 `Continuation`을 조금만 더 구체적으로 보고 가겠습니다. 2편의 취소·예외가 결국 이 친구를 통해 동작하기 때문입니다.

1편 마지막에 "`suspend`는 런타임 마법이 아니라, 컴파일러가 **CPS(Continuation Passing Style)** 로 변환한 결과"라고 했었죠? 그때 "컴파일러가 `suspend` 함수마다 보이지 않는 `Continuation`을 끼워 넣고, 중단했다 재개할 때 그걸 통해 이어 실행한다"고 했는데요. 그 `Continuation`이 실제로는 이렇게 생긴 인터페이스입니다.

```kotlin
public interface Continuation<in T> {
    public val context: CoroutineContext
    public fun resumeWith(result: Result<T>)
}
```

생각보다 단출합니다. 두 가지만 담고 있어요.

- `context`: 이 코루틴이 **어떤 환경에서** 재개될지 (`Dispatchers` 등 `CoroutineContext`).
- `resumeWith(result)`: **재개 신호**. 중단됐던 지점부터 이어서 실행하라는 호출인데, 인자가 `Result<T>`라는 점이 중요합니다.

`Result<T>`는 "성공값 또는 예외"를 담는 타입입니다. 즉 재개는 항상 **성공으로 재개(`resumeWith(Result.success(...))`)** 거나 **예외로 재개(`resumeWith(Result.failure(...))`)** 둘 중 하나입니다. 이 두 번째 경로가 바로 뒤에서 볼 **예외 전파**의 출발점입니다. 코루틴 안에서 던진 예외는 마법처럼 사라지는 게 아니라, 이 `Continuation`을 타고 위로 올라갑니다.

<br/>

# 구조화된 동시성

가장 먼저, 그리고 가장 중요한 개념입니다. 취소도 예외도 전부 이 위에서 돌아갑니다.

**구조화된 동시성(structured concurrency)** 을 한 줄로 말하면 이렇습니다.

> **모든 코루틴은 어떤 스코프(scope) 안에서 태어나고, 부모는 자식이 전부 끝날 때까지 끝나지 않는다.**

코루틴은 `GlobalScope` 같은 예외를 빼면 그냥 허공에 띄울 수 없습니다. 반드시 `CoroutineScope` 안에서 시작되고, 부모-자식 관계로 묶입니다.

<br/>

## 왜 이런 구조가 필요할까?

스레드의 구조일때도 마찬가지로 떠올려 보면 와닿습니다. 백그라운드 작업을 스레드로 띄워놓고 정리(`join`/종료)를 깜빡하면, 그 스레드는 부모와 상관없이 혼자 떠돌았습니다. 누수가 나거나, 이미 의미 없어진 작업이 계속 도는 거죠.

구조화된 동시성은 이걸 **생명주기를 부모에 묶어서** 막습니다.

- 부모 스코프는 자식이 다 끝나야 완료됩니다. (작업 유실 방지)
- 부모가 취소되면 자식도 전부 취소됩니다. (누수 방지)
- 자식에서 처리되지 않은 예외는 부모로 전파됩니다. (예외 유실 방지)

<br/>

## coroutineScope는 자식이 다 끝나야 끝난다

`coroutineScope { }` 빌더가 이 성질을 잘 보여줍니다. 안에서 띄운 자식들이 **모두** 끝나야 블록을 빠져나갑니다.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    coroutineScope {
        launch { delay(100); println("자식 1 완료") }
        launch { delay(200); println("자식 2 완료") }
        println("자식들 시작함")
    }
    println("coroutineScope 끝 - 모든 자식이 끝난 뒤 도달")
}
```

실제 출력은 이렇습니다.

```
자식들 시작함
자식 1 완료
자식 2 완료
coroutineScope 끝 - 모든 자식이 끝난 뒤 도달
```

`println("자식들 시작함")`이 먼저 찍히는 건 두 `launch`가 곧장 실행을 끝까지 하지 않고 동시에 시작만 하기 때문이고, 마지막 줄이 **맨 나중에** 찍히는 게 핵심입니다. `coroutineScope`가 자식 둘이 다 끝날 때까지 기다려 준 거죠.

![구조화된 동시성 - 부모 스코프와 자식 코루틴들의 생명주기](/img/kotlin-coroutine-2/structured-concurrency-v2.png)

<br/>

# 취소(cancellation)

이제 이 묶인 코루틴들을 **중간에 멈추는** 이야기입니다.

코루틴은 `Job`을 통해 취소합니다. `launch`가 돌려주는 `Job`의 `cancel()`을 부르면 되는데요.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val job = launch {
        repeat(1000) { i ->
            println("작업 중 $i")
            delay(50)
        }
    }
    delay(120)
    println("취소 요청")
    job.cancelAndJoin()   // 취소하고, 실제로 끝날 때까지 기다림
    println("취소 완료")
}
```

출력은 이렇습니다.

```
작업 중 0
작업 중 1
작업 중 2
취소 요청
취소 완료
```

1000번 돌 작업이 3번만 찍히고 멈췄습니다. `delay` 같은 suspend 지점에서 취소가 `CancellationException`으로 던져지면서 루프가 중단된 겁니다.

<br/>

## 취소는 "협조"가 필요하다

여기서 한 가지 함정이 있습니다. 취소는 **suspend 지점에서만** 동작합니다. 즉 코루틴이 중간에 멈추는(suspend) 지점이 없으면, `cancel()`을 불러도 **절대 안 멈춥니다.** (실제로 아래 같은 루프를 돌려놓고 취소를 해보아도, 멈추지 않는 걸 확인할 수 있습니다.)

```kotlin
// CPU만 빡세게 도는 루프 (delay 같은 suspend 지점이 없음)
launch {
    var i = 0
    while (i < 1_000_000_000) {   // cancel()을 불러도 절대 안 멈추고 끝까지 돕니다
        i++
    }
}
```

위 주석에 "CPU만 빡세게 도는 루프"라고 적었는데, 이렇게 **연산 자체가 일을 다 차지하는** 작업을 **CPU 바운드(CPU-bound)** 라고 합니다. 작업은 보통 병목이 어디냐로 나뉘는데요.

- **CPU 바운드**: 연산이 병목 (계산, 암호화, 이미지 처리 등)
- **I/O 바운드**: 입출력 대기가 병목 (네트워크·디스크·DB 응답 기다리기 등)

문제는 이런 CPU 바운드 작업엔 `delay` 같은 suspend 지점이 없다는 겁니다. 그래서 취소에 **협조(cooperative)** 하도록 직접 만들어 줘야 합니다. 방법은 두 가지입니다.

- `isActive`를 검사해서 직접 루프를 빠져나가기 (`while (isActive) { ... }`)
- `ensureActive()`나 `yield()`를 루프 안에서 호출해, 취소됐으면 `CancellationException`이 던져지게 하기

> 1편에서 "코루틴은 협조적으로 스레드를 양보한다"고 했는데, 취소도 똑같이 협조가 필요하다는 게 처음엔 의외였습니다.

그리고 `CancellationException`은 **정상적인 취소 신호**라, 잡아서 무시하면 안 됩니다. 만약 `try/catch (e: Exception)`으로 뭉뚱그려 잡고 있다면 취소까지 삼켜버릴 수 있으니, 정리 코드는 `finally`에 두는 편이 안전합니다.

<br/>

# 예외 처리

마지막은 예외입니다. 코루틴의 예외는 앞서 본 구조화된 동시성을 그대로 따라갑니다. 그래서 **기본 동작이 조금 과감**합니다.

<br/>

## 기본 동작: 형제까지 같이 취소된다

`launch`로 띄운 자식에서 처리되지 않은 예외가 나면, 그 예외는 부모로 전파되고, **부모는 나머지 형제 자식들까지 전부 취소**합니다. 하나 터지면 같은 스코프의 작업이 다 같이 무너지는 거죠.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    try {
        coroutineScope {
            launch { delay(50); throw RuntimeException("A 실패") }
            launch { delay(100); println("B 완료") }
        }
    } catch (e: Exception) {
        println("scope에서 예외 잡음: ${e.message}")
    }
}
```

출력입니다.

```
scope에서 예외 잡음: A 실패
```

눈여겨볼 건 **"B 완료"가 안 찍혔다**는 점입니다. A가 50ms에 터지자, 100ms에 완료될 예정이던 형제 B가 함께 취소된 겁니다. 이게 기본값입니다.

<br/>

## SupervisorJob으로 형제는 살리기

"한 작업이 실패해도 나머지는 계속 가야 한다"면 `supervisorScope`(또는 `SupervisorJob`)를 씁니다. 자식의 실패가 부모나 형제로 전파되지 않습니다.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val handler = CoroutineExceptionHandler { _, e ->
        println("핸들러가 잡음: ${e.message}")
    }
    supervisorScope {
        launch(handler) { delay(50); throw RuntimeException("A 실패") }
        launch { delay(100); println("B 완료") }
    }
}
```

출력입니다.

```
핸들러가 잡음: A 실패
B 완료
```

이번엔 A가 터졌어도 **"B 완료"가 정상적으로 찍혔습니다.** A의 예외는 형제를 건드리지 않고 `CoroutineExceptionHandler`가 받아 처리했습니다.

참고로 `CoroutineExceptionHandler`는 아무 데서나 동작하는 게 아니라, **최상위(루트) 코루틴**의 처리되지 않은 예외에만 동작합니다. 그리고 `async`는 예외 처리 방식이 또 달라서, 예외를 안에 품고 있다가 `await()`를 호출하는 순간 던집니다. 이쯤 되면 "전파 규칙이 launch냐 async냐, 일반이냐 supervisor냐에 따라 다 다르네?" 싶은데, 맞습니다. 그래서 이 부분은 한 번에 외우기보다, "예외도 결국 부모-자식 구조를 타고 흐른다"는 큰 그림을 먼저 잡는 게 낫다고 생각합니다.

<br/>

# 마지막 정리

2편 내용을 정리하면 이렇습니다.

- **구조화된 동시성**: 코루틴은 스코프 안에서 부모-자식으로 묶인다. 부모는 자식이 다 끝나야 끝나고, 부모가 취소되면 자식도 취소된다. 취소·예외가 전부 이 구조 위에서 돈다.
- **취소**: `Job.cancel()`로 취소하되, suspend 지점이 있어야 실제로 멈춘다. CPU 바운드는 `isActive`/`ensureActive()`로 **협조**하게 만들어야 한다. `CancellationException`은 정상 신호이므로 삼키지 말 것.
- **예외**: 기본값은 자식 하나가 실패하면 형제까지 취소. 독립적으로 굴리려면 `supervisorScope`/`SupervisorJob`, 처리는 `CoroutineExceptionHandler`. `async`는 `await()` 시점에 예외가 나온다.

1편이 "왜 도는가"였다면 2편은 "어떻게 안전하게 굴리는가"였습니다. 저도 아직 실무에서 부딪히며 배우는 중이라, 더 좋은 패턴을 알게 되면 보태겠습니다.

사실 처음엔 2편이면 마무리되겠거니 했는데, 정리하다 보니 다룰 게 계속 나와서 결국 시리즈물이 되어버렸습니다.. 🥲 다음 **3편**에서는 코루틴으로 **여러 값이 흐르는 스트림**을 다루는 `Flow`를 정리해보겠습니다.

<br/>

# 참고

> - [https://kotlinlang.org/docs/coroutines-basics.html](https://kotlinlang.org/docs/coroutines-basics.html)
> - [https://kotlinlang.org/docs/cancellation-and-timeouts.html](https://kotlinlang.org/docs/cancellation-and-timeouts.html)
> - [https://kotlinlang.org/docs/exception-handling.html](https://kotlinlang.org/docs/exception-handling.html)
