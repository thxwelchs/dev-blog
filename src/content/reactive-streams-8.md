---
layout: post
category: "엔지니어링"
series: "리액티브 스트림즈"
seriesOrder: 8
title: "리액티브 스트림즈 8편 - 끝까지 논블로킹, 그리고 한계"
author: thxwelchs
tags: ["리액티브", "R2DBC", "WebFlux", "StepVerifier", "논블로킹"]
image: /img/covers/eng/reactive-streams-8.png
date: "2023-12-10T10:50:33.000Z"
draft: false
---

[7편](/reactive-streams-7/)에서 WebFlux의 이점은 "끝까지 논블로킹일 때만" 나온다고 했습니다. 이번엔 그 "끝까지"가 실제로 무엇을 요구하는지, 그리고 어느 부분이 문제가 될 수 있는지를 정리해보겠습니다.

# 한 군데라도 블로킹이면 무너진다

WebFlux로 웹 계층만 바꾸면 리액티브 웹 환경이 완성되었다고 볼 수 있을까요? 도입하면서 가장 흔히 착각하는 곳이 데이터 계층입니다. 전통적인 JDBC는 본질적으로 블로킹입니다. 심지어 JPA도 내부적으로는 블로킹 JDBC를 사용하기 때문에 블로킹입니다. 쿼리를 보내고 결과가 올 때까지 그 스레드는 멈춰 기다립니다. 그런데 WebFlux는 적은 수의 이벤트 루프 스레드로 돌아갑니다. 만약 JDBC 때문에 블로킹이 돼버리면, 그 스레드가 처리하던 수많은 요청이 같이 멈춥니다.

![전 구간이 논블로킹이면 이벤트 루프가 멈추지 않지만, 중간에 블로킹 JDBC 호출이 하나 끼면 그 이벤트 루프 스레드가 묶여 전체 처리량이 무너지는 그림](/img/reactive-streams-8/end-to-end-v1.png)

그래서 리액티브로 가려면 DB 접근도 논블로킹이어야 합니다. 이걸 위해 나온 게 R2DBC(Reactive Relational Database Connectivity)입니다.

```java
public interface UserRepository extends ReactiveCrudRepository<User, String> {
    Flux<User> findByTeam(String team);
}
```

반환 타입이 `Mono`/`Flux`라는 것 말고는 JPA와 별반 다를 것이 없는데, 밑단은 드라이버부터 논블로킹으로 동작합니다. 결국 WebFlux를 제대로 쓰려면 웹 계층뿐 아니라 DB 드라이버, 호출하는 외부 API 클라이언트(WebClient)까지 전부 논블로킹으로 맞춰야 한다는 뜻입니다.

# 어쩔 수 없이 블로킹을 써야 한다면

그렇지만 현실적으로 논블로킹으로 못 바꾸는 레거시나 라이브러리도 있는데, 그럴 땐 어떡할까요? 그 블로킹 호출만 별도의 스레드 풀로 떼어내, 이벤트 루프를 막지 않게 하는 편이 그나마 안전합니다.

```java
Mono.fromCallable(() -> legacyBlockingCall())
    .subscribeOn(Schedulers.boundedElastic());
```

하지만 이건 "리액티브답게 푼" 게 아니라 "블로킹을 격리해 피해를 줄인" 쪽에 가깝습니다. 임시방편이라는 걸 알고 쓰는 것과 모르고 쓰는 건 다르다고 생각합니다.

# 테스트와 디버깅이 만만치 않다

리액티브를 실무에 적용해보면서 체감한 또 다른 점은 아마 테스트와 디버깅이 아닐까 싶습니다. 비동기로 흐르는 스트림은 평범한 단언문으로 검증하기 어렵지만, 다행히도 Reactor는 `StepVerifier`라는 전용 도구를 제공해줍니다.

```java
class StreamTest {

    @Test
    void 스트림이_짝수로_변환되는지_검증한다() {
        // given
        Flux<Integer> source = Flux.just(1, 2, 3);

        // when
        Flux<Integer> doubled = source.map(n -> n * 2);

        // then
        StepVerifier.create(doubled)
                .expectNext(2, 4, 6)
                .verifyComplete();
    }
}
```

그리고 스택 트레이스도 문제입니다(저는 개인적으로 이게 가장 큰 문제라고 생각했습니다). 비동기라 호출 스택이 끊겨, 에러가 나도 "어디서 비롯됐는지"가 잘 안 보입니다.

실제로 같은 "파싱 실패" 예외를 평범한 동기 호출과 리액티브 연산자 체인에서 각각 던져봤습니다. 먼저 동기입니다.

```java
void handleRequest() {
    loadUser();
}

void loadUser() {
    parseUser();
}

void parseUser() {
    throw new RuntimeException("파싱 실패");
}
```

```text
java.lang.RuntimeException: 파싱 실패
	at StackTraceDemo.parseUser(StackTraceDemo.java:42)
	at StackTraceDemo.loadUser(StackTraceDemo.java:38)
	at StackTraceDemo.handleRequest(StackTraceDemo.java:34)
	at StackTraceDemo.main(StackTraceDemo.java:16)
```

`parseUser`를 누가 불렀는지 `loadUser` → `handleRequest` → `main`까지 호출 경로가 그대로 남습니다. 이제 같은 예외를 리액티브 체인에서 던져봅니다.

```java
Flux.just(1, 2, 3)
    .map(this::toUser)       // id == 2 에서 예외
    .filter(this::isActive)
    .blockLast();
```

```text
java.lang.RuntimeException: 파싱 실패
	at StackTraceDemo.toUser(StackTraceDemo.java:48)
	at reactor.core.publisher.FluxMapFuseable$MapFuseableConditionalSubscriber.onNext(FluxMapFuseable.java:283)
	at reactor.core.publisher.FluxArray$ArrayConditionalSubscription.fastPath(FluxArray.java:339)
	at reactor.core.publisher.FluxArray$ArrayConditionalSubscription.request(FluxArray.java:262)
	... (Reactor 내부 프레임 계속) ...
	at reactor.core.publisher.Flux.blockLast(Flux.java:2816)
	at StackTraceDemo.main(StackTraceDemo.java:26)
	Suppressed: java.lang.Exception: #block terminated with an error
```

내 코드는 `toUser` 한 줄뿐이고, 그 아래는 전부 `FluxMapFuseable`, `FluxArray` 같은 Reactor 내부 프레임입니다. 이 스트림이 원래 어느 흐름에서 조립됐는지는 스택에 남지 않습니다. 리액티브는 스트림을 조립하는 시점과 실제로 실행되는 시점이 분리돼 있어서, 실행 중 터진 예외의 스택에는 조립 시점의 경로가 빠지기 때문입니다.

그래서 Reactor는 `checkpoint()`나 `Hooks.onOperatorDebug()`로 조립 지점을 따로 기록해 보강할 수 있도록 제공해줍니다. 실제로 `Hooks.onOperatorDebug()`를 켜고 같은 예외를 던지면 스택이 이렇게 바뀝니다.

```java
Hooks.onOperatorDebug();   // 디버그 모드 켜기 (조립 지점을 기록)

Flux.just(1, 2, 3)
    .map(this::toUser)       // 소스 17번 줄
    .filter(this::isActive)  // 소스 18번 줄
    .blockLast();
```

```text
java.lang.RuntimeException: 파싱 실패
	at StackTraceDebugDemo.toUser(StackTraceDebugDemo.java:27)
	Suppressed: The stacktrace has been enhanced by Reactor, refer to additional information below:
Assembly trace from producer [reactor.core.publisher.FluxMapFuseable] :
	reactor.core.publisher.Flux.map(Flux.java:6588)
	StackTraceDebugDemo.main(StackTraceDebugDemo.java:17)
Error has been observed at the following site(s):
	*_____Flux.map ⇢ at StackTraceDebugDemo.main(StackTraceDebugDemo.java:17)
	|_ Flux.filter ⇢ at StackTraceDebugDemo.main(StackTraceDebugDemo.java:18)
Original Stack Trace:
	... (앞서 본, 끊긴 스택) ...
```

`Assembly trace`와 `Error has been observed at the following site(s)` 블록이 새로 붙어서, `map`이 소스 17번 줄에서, `filter`가 18번 줄에서 조립됐다는 걸 짚어줍니다. 끊겼던 파이프라인의 조립 경로가 복원된 셈입니다. 다만 이 디버그 모드는 모든 연산자에 조립 스택을 캡처하는 비용을 얹기 때문에 운영 환경에서 상시 켜기는 부담스럽습니다. 그래서 운영에서는 런타임 비용이 거의 없는 `ReactorDebugAgent`(reactor-tools)를 붙이거나, 의심 가는 지점에만 `checkpoint()`를 심는 방식이 권장됩니다. 이런 보강 장치가 있어도 동기 코드의 스택 트레이스만큼 바로 와닿진 않는 듯합니다. 이 부분이 러닝 커브를 꽤 끌어올린다고 느꼈습니다.

# 참고

> - 김중철 역, *실전! 스프링 5를 활용한 리액티브 프로그래밍* (원서: *Hands-On Reactive Programming in Spring 5*)
> - [R2DBC](https://r2dbc.io/) · [Reactor StepVerifier](https://projectreactor.io/docs/test/release/reference/)
> - 토비의 봄 TV: [(4) 자바와 스프링의 비동기 기술](https://www.youtube.com/watch?v=aSTuQiPB4Ns) · [(5) 비동기 RestTemplate·MVC/Servlet](https://www.youtube.com/watch?v=ExUfZkh7Puk) · [(6) AsyncRestTemplate 콜백 헬](https://www.youtube.com/watch?v=Tb43EyWTSlQ), 그리고 [(7) CompletableFuture](https://www.youtube.com/playlist?list=PLcbHt0nf9WCClSDw2OrrX-4NzxBPXf_1R)
