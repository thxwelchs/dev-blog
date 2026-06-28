---
layout: post
category: "엔지니어링"
series: "리액티브 스트림즈"
seriesOrder: 3
title: "리액티브 스트림즈 3편 - 직접 만들어보기, pull에서 push까지"
author: thxwelchs
tags: ["리액티브", "pull", "push", "옵저버 패턴", "직접 구현"]
image: /img/covers/eng/reactive-streams-3.png
date: "2022-06-12T14:57:19.000Z"
draft: false
---

[2편](/reactive-streams-2/)에서 명세(네 인터페이스)를 봤습니다. 이번엔 그 명세를 어떤 구현 라이브러리도 없이 순수 인터페이스로 직접 만들어보려 합니다. 그런데 곧장 코드로 들어가기 전에, 1편에서 언급했던 프로그래밍 패러다임 pull과 push라는 두 방식에 대해 이해할 필요가 있는데요, 구현하기 전 먼저 그 부분을 짚고 넘어가겠습니다.

# pull과 push, 방향이 반대인 두 방식

어떠한 시퀀셜한 데이터를 똑같이 1부터 5까지 받는 예시가 있다고 가정해보겠습니다. 그런데 이 데이터를 누가 주도하느냐에 따라 프로그래밍 방식이 정반대로 갈립니다.

## pull, 소비자가 당김

기존에 가장 자연스럽게 프로그래밍 하는 방식입니다. 소비자가 필요할 때 `next()`로 하나씩 당겨옵니다.

```java
Iterator<Integer> it = numbers.iterator();
while (it.hasNext()) {
    int v = it.next();     // 소비자가 "지금 줘" 하고 당긴다
    process(v);
}
```

루프도 소비자가 돌리고, `next()`도 소비자가 부릅니다. 값을 가지러 가는 주체가 소비자가 됩니다. 또한 값이 필요한 시점도 소비자가 정합니다.

## push, 생산자가 민다 (옵저버 패턴)

반대로, 소비자는 "값이 오면 이렇게 해줘"라는 반응만 등록해두고, 값을 흘려보내는 건 생산자가 하는 방식입니다. 객체지향에서 오래 써온 옵저버 패턴이 이 push의 가장 원초적인 형태라고 볼 수 있습니다. [1편](/reactive-streams-1/)에서 리액티브의 조상이라 불렀던 그 패턴입니다.

```java
class Subject<T> {
    private final List<Consumer<T>> observers = new ArrayList<>();

    public void subscribe(Consumer<T> observer) {
        observers.add(observer);
    }

    public void emit(T value) {
        for (Consumer<T> observer : observers) {
            observer.accept(value);   // 생산자가 소비자에게 민다
        }
    }
}
```

쓰는 쪽은 이렇습니다.

```java
Subject<Integer> subject = new Subject<>();
subject.subscribe(v -> process(v));   // "값 오면 이렇게 반응해"만 등록
for (int v = 1; v <= 5; v++) {
    subject.emit(v);                   // 생산자가 민다
}
```

소비자는 `process(v)`라는 반응에 대한 구독만 한 형태가 됩니다. 그 다음 실제로 값을 생산하여 흘려(`emit`)보내는 쪽은 생산자입니다. 값이 오는 시점을 생산자가 정하고, 소비자는 그때 반응할 뿐입니다.

## 데이터의 흐름제어 방향

두 코드는 결과(1..5)는 같지만, 제어의 방향이 정반대인 것을 다음 표와 같이 살펴볼 수 있습니다.

| | pull | push (옵저버) |
|---|---|---|
| 루프를 도는 주체 | 소비자 (`while`) | 없음 (생산자가 emit) |
| 값을 얻는 방식 | 당긴다 `next()` | 밀어준다 `emit → 콜백` |
| "언제"를 정하는 쪽 | 소비자 | 생산자 |
| 소비자가 하는 일 | 능동적으로 부름 | 반응만 등록 |

결국 이 흐름제어의 방향이 뒤집히는 메커니즘이 리액티브의 핵심입니다. "지금 값을 줘"라고 당기는 게 아니라, "값이 흘러오면 그때 반응한다"는 [1편](/reactive-streams-1/)의 그 감각적인 부분이 바로 push입니다.

## push가 어울리는 곳, 값이 언제 올지 모를 때

그럼 push는 언제 빛을 발할까요? 값이 제멋대로, 언제 올지 모르는 시점에 도착할 때입니다. 마우스 클릭, 센서 값, 네트워크로 들어오는 이벤트가 그런 케이스에 속합니다. 반대로 pull은 `next()`로 "지금" 당기는 방식이라, 값이 아직 안 왔으면 올 때까지 스레드를 붙잡고 기다리거나 계속 폴링해야 합니다. 반면 push는 "오면 반응해"만 걸어두면, 값이 툭 튀어나오는 순간 콜백이 알아서 그 다음 흐름을 수행할 수 있게 됩니다. 언제 오는지를 소비자가 신경 쓸 필요가 없는 겁니다. 그렇기에 결국 비동기적인 데이터 처리가 언제 완료될지 모르는 흐름제어에 대해서는 pull 방식보다 push가 훨씬 자연스럽고 프로그래밍 하기 수월해집니다.

## 그런데 단순 push(옵저버 패턴)엔 빈틈이 있다

1편에서 언급했듯, 이러한 데이터가 발생할 때마다 밀어넣는 push 방식은 완전하지 않습니다.

- 받는 쪽이 느려도 `emit`은 계속 밀립니다. "천천히 보내라"거나 "그만 보내라"고 전달할 방법이 없습니다. 즉 백프레셔가 없습니다.
- "이제 끝났다"(완료)나 "에러가 났다"를 알리는 표준이 없습니다. 그냥 값만 계속 흘러올 뿐입니다.

이것은 결국 생산자-소비자 문제에 직면하게 되는데, 이건 이후에 장을 나눠서 디테일하게 정리해보겠습니다.

# 리액티브 스트림즈, request가 붙은 push

리액티브 스트림즈는 이러한 순수 push(옵저버)에다 받을 양을 조절하는 `request(n)`과, 종료·에러를 알리는 `onComplete`/`onError`를 얹어 표준으로 다듬은 것이라고 볼 수 있습니다. 2편에서 본 네 인터페이스가 정확히 그 명세이자 장치가 됩니다. 다음은 이제 명세들을 어떤 구현 라이브러리도 없이, 순수 인터페이스(`org.reactivestreams`)로 직접 만들어보겠습니다.

## 1부터 n까지 흘리는 Publisher

![직접 만든 RangePublisher가 subscribe되면 Subscription을 건네고, Subscriber가 request(n)한 만큼만 onNext로 흘린 뒤 onComplete 하는 흐름](/img/reactive-streams-3/toy-impl-v1.png)

핵심은 `Subscription.request(n)`에 들어온 수요만큼만 `onNext`로 데이터를 흘려보내는 부분입니다. 옵저버 패턴엔 없던, 바로 그 백프레셔 손잡이 역할이 되게 됩니다.

```java
import org.reactivestreams.Publisher;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;

// 1..n 을 흘리는 Publisher (Reactive Streams 순수 인터페이스만 사용)
static class RangePublisher implements Publisher<Integer> {
    private final int n;

    RangePublisher(int n) {
        this.n = n;
    }

    @Override
    public void subscribe(Subscriber<? super Integer> subscriber) {
        subscriber.onSubscribe(new RangeSubscription(subscriber, n));
    }
}

static class RangeSubscription implements Subscription {
    private final Subscriber<? super Integer> sub;
    private final int n;
    private int next = 1;
    private boolean completed = false;

    RangeSubscription(Subscriber<? super Integer> sub, int n) {
        this.sub = sub;
        this.n = n;
    }

    @Override
    public void request(long count) {
        if (completed) {
            return;
        }
        // 명세 규칙 3.9: request 의 인자가 0 이하면 onError(IllegalArgumentException)
        if (count <= 0) {
            completed = true;
            sub.onError(new IllegalArgumentException("request 의 인자는 양수여야 합니다"));
            return;
        }
        try {
            // 요청한 만큼만, 남은 게 있을 때까지만 흘린다 = 백프레셔
            // onNext 안에서 request 가 재진입하므로 completed 도 함께 본다
            for (long i = 0; i < count && next <= n && !completed; i++) {
                sub.onNext(next++);
            }
        } catch (RuntimeException e) {
            // 발행 중 예외는 던지지 말고 onError 로 신호만 보내고 멈춘다
            completed = true;
            sub.onError(e);
            return;
        }
        // onComplete 는 completed 로 막아 딱 한 번만
        if (next > n && !completed) {
            completed = true;
            sub.onComplete();
        }
    }

    @Override
    public void cancel() {
        completed = true;
    }
}
```

소비자는 처음에 2개만 요청하고, 하나 처리할 때마다 하나씩 더 요청하게 했습니다.

```java
new RangePublisher(5).subscribe(new Subscriber<Integer>() {
    private Subscription s;

    @Override
    public void onSubscribe(Subscription s) {
        this.s = s;
        s.request(2);   // 일단 2개만
    }

    @Override
    public void onNext(Integer item) {
        System.out.println("받음: " + item);
        s.request(1);   // 하나 처리했으니 하나 더
    }

    @Override
    public void onComplete() {
        System.out.println("완료");
    }

    @Override
    public void onError(Throwable t) {
        System.out.println("에러: " + t);
    }
});
```

위 코드를 실행해보았을 때 결과는 예상한 대로 이렇게 나오게 됩니다.

```text
받음: 1
받음: 2
받음: 3
받음: 4
받음: 5
완료
```

소비자가 요청한 만큼만 흘러오고, 다 주면 `완료`가 한 번 찍힙니다. 단순 push(옵저버 패턴)에선 생산자가 데이터를 밀어넣는 대로 소비자는 그냥 다 받아서 처리할 수밖에 없었는데, 리액티브 스트림즈는 `request`로 소비자가 받을 양을 직접 제어할 수 있다는 결정적인 큰 차이가 있습니다.

# 참고

> - 김중철 역, *실전! 스프링 5를 활용한 리액티브 프로그래밍* (원서: *Hands-On Reactive Programming in Spring 5*)
> - [Reactive Streams Specification](https://www.reactive-streams.org/) · [java.util.concurrent.Flow (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Flow.html)
> - 토비의 봄 TV: [(2) Operators](https://www.youtube.com/watch?v=DChIxy9g19o) (Publisher를 직접 구현하며 연산자까지 만들어봄)
