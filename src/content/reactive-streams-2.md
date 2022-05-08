---
layout: post
category: "엔지니어링"
series: "리액티브 스트림즈"
seriesOrder: 2
title: "리액티브 스트림즈 2편 - 명세와 백프레셔, 네 개의 인터페이스"
author: thxwelchs
tags: ["리액티브", "Reactive Streams", "백프레셔", "Publisher", "Subscriber"]
image: /img/covers/eng/reactive-streams-2.png
date: "2022-05-08T11:54:38.000Z"
draft: false
---

[1편](/reactive-streams-1/)에서 "왜 리액티브인가"를 봤습니다. 이번엔 그 개념을 실제로 코드에서 합의할 수 있게 한 명세이자 약속인 Reactive Streams 명세를 정리해보겠습니다.

# 네 개의 인터페이스

명세라고 하기에는 민망할 정도로, 리액티브 스트림즈의 인터페이스 네 개가 전부입니다.

![Reactive Streams 네 인터페이스: Publisher → Processor → Subscriber로 데이터(onNext)는 앞으로 흐르고, request(n)·cancel(Subscription을 통한 수요 제어)은 소비자에서 거꾸로 흐른다. Processor는 Publisher이자 Subscriber인 중간 단계](/img/reactive-streams-2/rs-interfaces-v3.png)

- `Publisher<T>`: 데이터를 만들어 내보내는 쪽. `subscribe(Subscriber)` 하나만 가집니다.
- `Subscriber<T>`: 데이터를 받는 쪽. `onSubscribe`, `onNext`, `onError`, `onComplete` 네 콜백을 가집니다.
- `Subscription`: 둘 사이의 연결. 소비자가 이걸 통해 `request(n)`(n개 더 달라)과 `cancel`(그만)을 호출합니다.
- `Processor<T, R>`: `Publisher`이면서 동시에 `Subscriber`인, 중간 단계. 받아서 변환해 다시 내보냅니다.

그럼 이 넷이 어떻게 맞물릴까요? 흐름을 따라가면 이렇습니다. 소비자가 `subscribe`로 붙으면, 생산자가 `onSubscribe(subscription)`으로 연결 고리를 건넵니다. 그러면 소비자가 그 `Subscription`에 대고 `request(n)`을 호출하고, 생산자는 그 수만큼만 `onNext`로 데이터를 흘립니다. 다 끝나면 `onComplete`, 문제가 생기면 `onError`입니다.

# 메소드를 하나씩 뜯어보기

방금 흐름을 훑었으니, 이제 메소드 하나하나가 누가 부르고 언제 불리는지를 꼼꼼히 짚어보겠습니다. 헷갈릴 때 기준이 되는 한 가지는, 데이터는 생산자가 소비자에게 밀어주고(앞 방향), 제어는 소비자가 `Subscription`을 통해 되돌려 신호한다(뒤 방향)는 점입니다. 이 방향만 잡으면 각 메소드가 제자리를 찾습니다.

## Publisher, 메소드는 subscribe 하나

`Publisher<T>`에는 `subscribe(Subscriber)` 메소드 하나뿐입니다.

- 누가 부르나: 소비자(또는 그를 대신하는 프레임워크)가 "나 구독할게" 하고 부릅니다.
- 생산자가 할 일: 이 안에서 반드시 `Subscriber.onSubscribe(subscription)`를 **딱 한 번** 불러줘야 합니다. 그게 첫 신호이자, 둘을 잇는 연결 고리(`Subscription`)를 건네는 순간입니다.
- 주의: `subscribe`는 "데이터를 달라"가 아니라 "연결만 하자"입니다. 이걸 불렀다고 데이터가 곧장 흐르진 않습니다. 한 생산자에 여러 소비자가 각각 `subscribe`할 수도 있는데, 그럼 각자 자기 `Subscription`을 받습니다.

## Subscriber, 생산자가 불러주는 네 콜백

`Subscriber<T>`의 네 메소드는 전부 생산자가 불러주는 콜백입니다. 내가 부르는 게 아니라, 나는 구현해두고 불리기를 기다리는 쪽이죠.

- `onSubscribe(Subscription s)`: 맨 처음, 한 번 불립니다. 생산자가 "연결 고리 여기 있어" 하고 `Subscription`을 건네는 자리예요. 소비자는 보통 이걸 필드에 보관하고, **여기서 `s.request(n)`을 불러야 비로소 데이터가 흐르기 시작**합니다. 안 부르면 영영 아무것도 안 옵니다. 받을 준비가 됐다는 신호를 소비자가 직접 줘야 하는 셈이죠.
- `onNext(T item)`: 데이터 한 개가 도착할 때마다 불립니다. 단, 내가 `request`로 요청한 총량을 넘겨서는 불리지 않습니다. 2개 요청했으면 `onNext`도 최대 2번입니다.
- `onComplete()`: 더 보낼 게 없을 때, 정상 종료 신호로 딱 한 번 불립니다. 이후엔 어떤 신호도 오지 않습니다.
- `onError(Throwable t)`: 도중에 문제가 났을 때 딱 한 번 불립니다. 역시 이후엔 침묵입니다. `onComplete`와는 둘 중 하나만 옵니다.

## Subscription, 소비자가 쥔 제어 손잡이

`Subscription`은 생산자와 소비자 사이의 연결인데, 핵심은 이걸 호출하는 쪽이 소비자라는 점입니다. 받기만 하던 소비자가 이걸로 흐름을 거꾸로 제어합니다.

- `request(long n)`: "나 지금 n개까지 더 받을 수 있어." **이게 백프레셔의 손잡이**입니다. 호출할 때마다 수요가 누적됩니다(2 요청하고 또 3 요청하면 총 5). `n`은 양수여야 하고, 0 이하면 명세 규칙 3.9에 따라 `onError(IllegalArgumentException)`로 끝내야 합니다. 참고로 `Long.MAX_VALUE`를 요청하면 사실상 "무한정 줘", 곧 백프레셔를 안 쓰겠다는 선언이 됩니다.
- `cancel()`: "그만 보내." 소비자가 더는 필요 없을 때 부르고, 생산자는 발행을 멈춰야 합니다. 여러 번 불러도 안전해야 합니다.

한 가지 더. `request`와 `cancel`은 `onNext` 안에서 다시 불려도(재진입) 문제가 없게 만들어야 합니다. 소비자가 "하나 받았으니(`onNext`) 하나 더(`request(1)`)"처럼 `onNext` 안에서 `request`를 부르는 경우가 흔하거든요.

## Processor, 받으면서 동시에 내보내는 중간 단계

`Processor<T, R>`는 `Subscriber<T>`이면서 동시에 `Publisher<R>`입니다. 위에서 데이터를 받아(`Subscriber` 역할) 변환한 뒤 아래로 다시 내보내는(`Publisher` 역할) 중간 단계죠. `map`이나 `filter` 같은 연산자가 결국 이 자리에 앉는 셈입니다.

## 신호가 오는 순서엔 규칙이 있다

이 메소드들은 아무 때나 막 불리는 게 아니라, 정해진 순서를 따릅니다. 문법으로 적으면 이렇습니다.

```text
onSubscribe  →  onNext*  →  (onComplete | onError)?
```

말로 풀면,

- `onSubscribe`가 **항상 맨 먼저, 정확히 한 번**.
- 그다음 `onNext`가 요청한 양 이하로 0번 이상.
- 마지막에 `onComplete`나 `onError`가 많아야 한 번. 이 종료 신호가 온 뒤엔 더 이상 아무 신호도 없음.
- 한 소비자에게 가는 이 신호들은 겹치지 않게(직렬로) 전달됨. `onNext`가 둘이 동시에 불리는 일은 없으니, 소비자는 그 가정 위에서 안심하고 짜도 됨.

정리하면 생산자는 `onSubscribe`로 연결을 열고, 소비자가 `request`로 수요를 밝히면, 그만큼 `onNext`로 흘리다, 끝에 `onComplete`나 `onError`로 한 번 닫는 흐름임. 이 순서와 횟수 규칙을 구현하는 쪽이 지켜야 한다는 게 명세의 핵심임.

# 생산자-소비자 문제

그런데 왜 받을 양을 소비자가 정하는 장치가 필요할까요? 한 가지 배경을 깔면 이해가 더 쉽기에, 아주 유명한 생산자-소비자(producer-consumer) 문제부터 이야기해보겠습니다. 한쪽(생산자)은 데이터를 만들고 다른 쪽(소비자)은 그걸 처리하는데, 둘의 속도가 다를 때 무슨 일이 벌어지느냐는 거죠.

생산자가 빠르면 만든 게 쌓이고, 소비자가 빠르면 놀게 됩니다. 그래서 보통 중간에 버퍼(큐)를 둬 속도의 차이를 커버할 수 있는 완충 역할을 하는데, 그 버퍼는 무한하지 않습니다. 생산이 계속 빠르면 버퍼가 가득 차고, 그때 "생산자를 어떻게 멈추거나 늦출 것인가"가 핵심 질문이 됩니다. 운영체제의 파이프, 스레드 사이의 블로킹 큐, 메시지 큐가 다 이 문제를 저마다의 방식으로 풀고 있습니다.

리액티브 스트림즈에선 `Publisher`가 생산자, `Subscriber`가 소비자입니다. 그러니 이 둘을 비동기로 잇는 순간, 이 생산자-소비자 문제를 그대로 떠안게 됩니다. 그 답이 바로 다음에 볼 백프레셔입니다.

# 핵심은 백프레셔

여기서 가장 중요한 한 가지가 백프레셔(backpressure)입니다. 보통 "생산자가 데이터를 밀어낸다(push)"고 생각하기 쉬운데, 리액티브 스트림즈의 명세에서는 실은 거꾸로입니다. 소비자가 `request(n)`으로 "나는 n개까지 받을 수 있어"라고 말하면, 생산자는 딱 그만큼만 보냅니다.

![백프레셔: 느린 소비자가 request(2)로 2개만 요청하면 빠른 생산자도 onNext를 2개만 보내고, 소비자가 더 받을 수 있을 때 다시 request 한다](/img/reactive-streams-2/backpressure-v2.png)

왜 이렇게 만들었을까요? 빠른 생산자가 느린 소비자에게 데이터를 마구 쏟아부으면, 소비자 쪽 버퍼가 넘치거나 메모리가 과도하게 찰 수 있기 때문에, 받을 양을 소비자가 정하도록 선택권을 주어 흐름이 소비자 속도에 맞춰 자연스럽게 조절되게 하는 것입니다.

# 참고

> - 김중철 역, *실전! 스프링 5를 활용한 리액티브 프로그래밍* (원서: *Hands-On Reactive Programming in Spring 5*)
> - [Reactive Streams Specification](https://www.reactive-streams.org/)
> - 토비의 봄 TV: [(1) Reactive Streams](https://www.youtube.com/watch?v=8fenTR3KOJo) · [(2) Operators](https://www.youtube.com/watch?v=DChIxy9g19o) (Publisher·Subscriber·Subscription과 연산자를 직접 구현하며 설명)
