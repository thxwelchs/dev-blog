---
layout: post
category: "엔지니어링"
series: "리액티브 스트림즈"
seriesOrder: 5
title: "리액티브 스트림즈 5편 - 구현체들 둘러보기"
author: thxwelchs
tags: ["리액티브", "RxJava", "Reactor", "Akka Streams", "Flow"]
image: /img/covers/eng/reactive-streams-5.png
date: "2022-08-21T14:37:50.000Z"
draft: false
---

이번에는 리액티브 스트림즈 인터페이스를 구현한 구현체들, 리액티브 라이브러리를 한번 알아보려고 합니다.

# 같은 명세, 여러 구현체

[2편](/reactive-streams-2/)에서 본 `Publisher`·`Subscriber`·`Subscription`·`Processor`는 인터페이스, 즉 약속일 뿐입니다. 대표적으로 리액티브 스트림즈의 명세를 따르는 구현체는 다음과 같습니다.

![같은 명세 위에 여러 구현체가 존재한다](/img/reactive-streams-5/rs-impls-v1.png)

- RxJava: `Observable`(백프레셔 없음)과 `Flowable`(백프레셔 있음)을 구분해 제공합니다. 리액티브 흐름을 대중화한 라이브러리죠.
- Project Reactor: `Flux`(여러 개)와 `Mono`(0~1개). 스프링 진영에서 사실상 표준처럼 쓰입니다.
- Akka Streams: `Source`/`Flow`/`Sink`로 스트림을 조립합니다.
- Flow (JDK 9 이상): `java.util.concurrent.Flow` 안의 `Flow.Publisher`·`Flow.Subscriber`·`Flow.Subscription`이 리액티브 스트림즈 1.0 인터페이스와 같은 모양입니다.

# 구현체들끼리는 연결될 수 있다

이 라이브러리들은 같은 표준을 따르기 때문에 서로 연결됩니다. 한쪽 라이브러리의 `Publisher`를 다른 쪽이 그대로 `subscribe` 할 수 있습니다. 예를 들어 Reactor의 `Flux`는 그 자체가 리액티브 스트림즈 `Publisher`라, RxJava의 `Flowable`이 그걸 구독하는 것도 가능하다는 점이 장점입니다.

그리고 JDK 9부터는 이 인터페이스가 아예 표준 라이브러리(`java.util.concurrent.Flow`)로 들어왔습니다. 다만 이름만 표준에 들어왔을 뿐, 연산자(`map`·`filter` 등)나 실제 구현은 여전히 위 라이브러리들의 몫입니다. `Flow`는 "타입 정의"고, RxJava·Reactor는 "그 타입으로 뭔가 할 수 있게 만든 것"에 가깝습니다.

다음 편은 백엔드 개발을 하다 보면 가장 보편적으로 활용하게 되는 Spring의 꽃 WebFlux의 리액티브 스트림즈 구현체인 Reactor에 대해 알아보겠습니다.

# 참고

> - 김중철 역, *실전! 스프링 5를 활용한 리액티브 프로그래밍* (원서: *Hands-On Reactive Programming in Spring 5*)
> - [Reactive Streams Specification](https://www.reactive-streams.org/) · [java.util.concurrent.Flow (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Flow.html)
