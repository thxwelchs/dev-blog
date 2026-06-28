---
layout: post
category: "엔지니어링"
title: "자바에서 코틀린으로 - 편함과, 그만큼의 트레이드오프"
author: thxwelchs
tags: ["Kotlin", "Java", "언어"]
image: /img/covers/eng/kotlin-from-java.png
date: "2022-01-19T11:18:37.000Z"
draft: false
---

팀을 옮기고 코틀린(Kotlin)을 본격적으로 쓰게 된 지 몇 달이 됐습니다. 자바를 오래 쓰다 넘어오니 그동안 답답했던 것들이 코틀린 코드 단 몇 줄로 풀리는 순간이 자주 있었는데, 신기하게도 편해진 만큼 딱 그 자리에서 새로운 함정이 같이 따라오는 것 같았습니다. 이번 글은 그 편함과 대가를 정리해본 것입니다. (작성 시점 기준 코틀린은 1.6대입니다.)

# 어떤 것들이 편해졌을까?

## null이 타입에 들어왔다

자바에서 제일 지긋지긋했던 건 역시 `NullPointerException`이었습니다. `Optional`이 나왔어도 결국 런타임에 터지는 건 비슷했고 (물론 제가 잘 사용을 못했을수도 있겠죠). 코틀린은 null 가능 여부를 아예 타입에 박아버렸는데요. `String`은 null이 못 들어가고, null을 담으려면 `String?`이라고 명시해야 합니다.

```kotlin
var a: String = "hi"
// a = null            // 컴파일 에러 - 아예 안 됨
var b: String? = null  // 이건 OK
val len = b?.length ?: 0  // b가 null이면 0
```

`?.`(safe call)과 `?:`(엘비스 연산자)로 null 흐름을 표현식 안에서 처리하니, 자바에서 if문으로 겹겹이 감싸던 게 한 줄로 줄었습니다. 컴파일러가 null 가능성을 강제로 따지게 만드는 것, 이게 가장 크게 와닿은 변화였습니다.

## data class 한 줄로 끝나는 보일러플레이트

DTO 하나 만들려고 getter/setter/`equals`/`hashCode`/`toString`을 줄줄이 적던 걸 떠올리면, `data class`는 거의 사기처럼 느껴졌습니다.

```kotlin
data class User(val id: Long, val name: String)
```

이 한 줄이 `equals`, `hashCode`, `toString`, `copy`, 구조 분해까지 만들어줍니다. (단 이 편리함이 나중에 JPA·Jackson과 만나면 오히려 함정이 되는데, 그건 다음에 기회가 있다면 다루겠습니다.)

## 스마트 캐스트, 캐스팅이 사라진다

`if (x is String)` 안에서는 `x`가 자동으로 `String`으로 취급되어, 자바처럼 `instanceof` 후 다시 캐스팅할 필요가 없습니다.

```kotlin
fun describe(x: Any): String {
    if (x is String) {
        return "길이 ${x.length}짜리 문자열"   // 캐스팅 없이 바로 String
    }
    return "문자열 아님"
}
```

## when은 값을 돌려주는 표현식

자바 switch가 코틀린에선 값을 돌려주는 표현식이라, 변수에 바로 대입할 수 있습니다.

```kotlin
val grade = when (score) {
    in 90..100 -> "A"
    in 80..89  -> "B"
    else       -> "C"
}
```

## 확장 함수, 컬렉션이 1급 컬렉션처럼

`StringUtils` 같은 유틸 클래스 대신, 기존 타입에 메서드를 덧붙이듯 쓸 수 있습니다. 특히 컬렉션에 확장 함수를 붙이면 도메인 연산에 이름이 생겨서, 1급 컬렉션처럼 활용할수 있는 부분이 개인적으로 매우 인상적이었고 지금도 잘 사용하고 있습니다.

```kotlin
fun List<Order>.paidOnly(): List<Order> {
    return this.filter { it.paid }
}

fun List<Order>.totalPrice(): Int {
    return this.sumOf { it.price }
}

val amount = orders.paidOnly().totalPrice()   // 읽히는 그대로
```

## 기본값과 이름 있는 인자

생성자 오버로딩 지옥이 사라집니다.

```kotlin
fun connect(host: String, port: Int = 8080, secure: Boolean = false) {
    // ...
}

connect("localhost")                  // 기본값 사용
connect("localhost", secure = true)   // 필요한 것만 이름으로
```

# 그런데, 편한만큼 드는 비용도 있다

## ① 플랫폼 타입, null 안전이 뚫리는 구멍

코틀린의 null 안전성은 코틀린 코드 안에서만 보장됩니다. 자바 라이브러리에서 넘어온 값은 코틀린이 null 여부를 알 수 없어서 플랫폼 타입(`String!`)으로 취급하는데, "null일 수도 아닐 수도 있는데 네가 알아서 해라" 상태입니다.

```kotlin
// 자바 메서드가 null을 반환할 수 있는데
val name: String = javaApi.getName()  // 컴파일은 통과한다
println(name.length)                  // 런타임에 NPE 가능
```

그렇게 피하고 싶던 NPE가 결국에는 생기게 됩니다. 자바를 호출하는 쪽에서는 반환을 `String?`으로 받아 null을 의식적으로 처리해야 안전했습니다.

## ② ==와 ===, 자바와 의미가 반대다

자바에선 `==`가 참조 비교라 문자열은 `.equals()`로 비교하라고 귀에 못이 박히게 배웠습니다. 코틀린은 반대인데요. `==`가 구조적 동등성(내부적으로 `equals`)이고, 참조 동일성은 `===`입니다. 헷갈려서 직접 돌려봤습니다.

```kotlin
val x: Int? = 1000
val y: Int? = 1000
println(x == y)    // 값 비교
println(x === y)   // 참조 비교
```

실제 출력은 이렇습니다.

```
true
false
```

`==`는 값이 같으니 true, `===`는 박싱된 `Integer` 객체가 서로 달라서(1000은 Integer 캐시 밖) false입니다. 자바 습관대로 `==`를 참조 비교라고 착각하면 정반대로 읽게 되니, 넘어올 때 한 번은 짚고 가야 했습니다.

## ③ val은 불변(immutable)이 아니다

`val`을 보고 "아, 불변이구나" 했는데, 정확히는 재할당 금지일 뿐이었습니다. `val`이 가리키는 객체의 내부는 얼마든지 바뀔 수 있습니다.

```kotlin
val list = mutableListOf(1, 2)
list.add(3)
println(list)   // [1, 2, 3]
```

다른 리스트를 다시 대입하는 건 막히지만 원소 추가는 됩니다. 진짜 불변 컬렉션이 필요하면 `listOf`처럼 읽기 전용 타입을 써야 하고, lateinit 같은 장치도 초기화 전에 접근하면 `UninitializedPropertyAccessException`을 던지니, "val·코틀린이니 안전하겠지"라는 인상만 믿으면 안 되는 것 같습니다.

몇 달 써보니 코틀린은 분명 좋지만 "은총알"(silver bullet)은 아니었습니다. 단점 대부분이 사실은 장점의 뒷면이라, 트레이드오프로 정리하는 게 맞을 것 같습니다.

## ④ 빌드 속도를 끌어내리는 kapt

보통 같은 규모의 코드여도 자바와 코틀린 중 코틀린이 빌드가 느린데, 그 원인엔 `kapt`가 있었습니다.

먼저 `kapt`가 뭔지 짚고 가면, 원래 자바에는 컴파일 시점에 애너테이션을 읽어 코드를 생성하는 APT(Annotation Processing Tool)라는 표준 기능이 있습니다. Lombok, JPA 메타모델, QueryDSL의 `Q클래스` 같은 게 다 이 애너테이션 프로세서로 만들어집니다. 문제는 이 프로세서들이 전부 "자바 소스"를 입력으로 기대한다는 점입니다. 코틀린 소스는 그대로 적용시키지 못합니다.

그래서 코틀린은 `kapt`(Kotlin Annotation Processing Tool)라는 다리를 둬서 해결을 하는데, 코틀린 코드에서 자바 stub(껍데기만 있는 자바 소스)을 먼저 만들어내고, 거기에 기존 자바 애너테이션 프로세서를 돌리는 방식입니다.

```text
코틀린 소스 → (kapt) 자바 stub 생성 → 애너테이션 프로세서 실행 → 본 컴파일
```

이 stub 생성 단계가 통째로 더 붙는 거라 빌드가 더 길어질 수밖에 없습니다. JPA·QueryDSL처럼 애너테이션 처리가 많은 프로젝트일수록 더해집니다. (요즘은 stub 없이 코틀린을 직접 분석하는 KSP가 나오고 있어 지켜보는 중입니다.)

## ⑤ Checked Exception 없어짐

코틀린엔 체크 예외(checked exception) 강제가 없어서, 자바의 checked exception 처리를 깜빡해도 컴파일이 통과합니다.

```kotlin
// 자바 쪽 메서드: 파일을 쓰다 IOException을 던질 수 있다
//   public void writeReport(String path) throws IOException { ... }

fun saveReport() {
    reportWriter.writeReport("/tmp/report.txt")   // try-catch 없이도 컴파일 통과
}
```

자바였다면 `IOException`을 catch하거나 `throws`로 다시 던지라고 컴파일러가 강제했을 텐데, 코틀린에선 그냥 넘어갑니다. 디스크가 꽉 차거나 경로가 잘못됐을 때 이 호출이 예외를 던진다는 사실이 코드만 봐선 안 드러납니다.

안전망이 하나 사라진 셈이죠. 하지만 한편으로는 개인적으로 자바의 checked exception에 대해 큰 필요성과 실효성을 못느꼈던 1인으로서 오히려 좋게도 느껴졌습니다.

## ⑥ 표현력의 양면

`let`/`run`/`apply`/`also`/`with` 스코프 함수는 처음엔 흑마법..? 같지만, 중첩되면 `it`·`this`가 뭘 가리키는지 헷갈려 가독성을 해칩니다.

```kotlin
user?.let {
    it.address?.run {
        // 여기서 this는 address, it은 user... 슬슬 헷갈리기 시작합니다
        println("$city / ${it.name}")
    }
}
```

표현력이 높다는 건 같은 비즈니스 로직도 코드 작성자마다 다르게 작성될수도 있다는 뜻이기도 해서, 팀 컨벤션이 없으면 스타일이 제각각이 됩니다. 우리 팀도 "스코프 함수 중첩은 2단 이상 금지" 같은 선을 정해두고 쓰고 있습니다.

## ⑦ 디버깅과 도구

코루틴이 끼면 스택 트레이스가 불편하게(가독성 측면) 찍혀서, 예외가 어디서 났는지 따라가는 데 시간이 더 듭니다. 말로만 하면 와닿지 않아 직접 돌려봤습니다. 같은 호출 체인(`level1 → level2 → level3`)에서 맨 안쪽이 예외를 던지게 해두고, 자바와 코틀린 코루틴(suspend)으로 각각 찍어봤습니다.

자바는 호출 경로가 그대로 다 남습니다.

```text
java.lang.IllegalStateException: boom
	at Demo.level3(Demo.java:2)
	at Demo.level2(Demo.java:3)
	at Demo.level1(Demo.java:4)
	at Demo.main(Demo.java:6)
```

그런데 같은 흐름을 suspend 함수로 짜서 던지면, `level2`·`level1`이 통째로 사라지고 그 자리를 코루틴 내부 프레임이 채웁니다.

```text
java.lang.IllegalStateException: boom
	at DemoKt.level3(Demo.kt:2)
	at DemoKt$level3$1.invokeSuspend(Demo.kt)
	at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:34)
	at kotlinx.coroutines.DispatchedTaskKt.resume(DispatchedTask.kt:234)
	... (CancellableContinuationImpl, EventLoopImplBase 등 코루틴 인프라 프레임) ...
	at DemoKt.main(Demo.kt:6)
```

왜 이렇게 될까요? suspend 함수는 컴파일되면 콜백(Continuation)을 주고받는 상태 머신으로 바뀝니다. 그래서 실행 시점의 스택은 "내가 누구한테 불렸나"가 아니라 "어느 콜백이 재개(resume)됐나"를 따라가게 됩니다. `level3`을 부른 게 `level2`라는 정보는 그 시점 호출 스택엔 없는 거죠. 그나마 `kotlinx-coroutines-debug`의 `DebugProbes`나 디버그 모드를 켜면 원래 경로를 복원해 보여주는데, 기본 실행에선 이렇게 끊겨 나옵니다. 그리고 코틀린 클래스는 기본이 `final`이라 상속을 전제로 한 도구들과 부딪힙니다. Mockito로 목을 만들려면 mockito-inline이 필요했고, 결국 코틀린 친화적인 MockK 쪽을 사용하는게 편했습니다. 스프링에서 프록시 때문에 kotlin-spring(all-open) 플러그인을 까는 것도 같은 결의 비용입니다.

> 솔직히 저는 그래도 코틀린이 좋습니다. 다만 "좋다"에서 멈추지 않고 "그 대가가 뭔지"까지 말할 수 있어야, 팀에 권할 때도 정직할 수 있을 것 같습니다.

# 정리

자바에서 코틀린으로 넘어왔을 때 그 편의성이 너무 크게 다가왔습니다. 다만 그 편의마다 비용도 짝으로 따라온다는 걸 알고 고르면 될 것 같습니다.

# 참고

> [Kotlin Docs: Null safety](https://kotlinlang.org/docs/null-safety.html)
> [Kotlin Docs: Equality](https://kotlinlang.org/docs/equality.html)
