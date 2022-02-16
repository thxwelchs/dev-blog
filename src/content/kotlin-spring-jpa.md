---
layout: post
category: "엔지니어링"
title: "스프링과 코틀린이 만나면 생기는 불편한 상황들"
author: thxwelchs
tags: ["Kotlin", "Spring", "JPA", "Jackson"]
image: /img/covers/eng/kotlin-spring-jpa.png
date: "2022-02-16T11:35:37.000Z"
draft: false
---

[지난 글](/kotlin-from-java/)에서 코틀린의 편함과 비용을 언어 차원에서 봤습니다. 코틀린을 스프링과 함께 사용하다보면 여러가지 불편한점들이 있는데, 결국 그 불편함을 해결하기 위한 방법을 여러 대체방안으로 해소해야 했습니다. 이번 글은 그런 부분을 정리하고자 합니다. 예전에 [코틀린으로 JPA 엔티티를 모델링](</Kotlin JPA Entity 모델링하기/>)하면서도 한 번 짚었지만, 이번엔 "왜 그렇게 해야 하나"의 내부 동작까지 좀 더 파봤습니다.

# 코틀린 클래스는 final이라 프록시가 안 만들어진다

자바 클래스는 기본이 상속 가능하지만, 코틀린은 클래스도 메서드도 기본이 `final`입니다. 평소엔 좋은 기본값인데, Spring·JPA에선 오히려 불편한 점으로 다가올수 있습니다. 왜 그럴까요? 스프링 DI/AOP 구조를 이해하고 있는 분들은 아시겠지만, 이 둘이 런타임에 클래스를 상속한 프록시(proxy)를 만들어 동작하기 때문입니다.

- Spring은 `@Transactional` 같은 빈을 CGLIB 프록시로 감싸 부가 기능을 끼워 넣습니다.
- JPA(Hibernate)는 지연 로딩을 위해 엔티티를 상속한 프록시를 만듭니다.

클래스가 `final`이면 상속이 안 되니 프록시를 못 만들어 깨집니다. 클래스마다 `open`을 붙이는 건 비현실적이라, 컴파일러 플러그인으로 풉니다.

```kotlin
plugins {
    kotlin("plugin.spring") version "1.6.10"  // 스프링 애너테이션 붙은 클래스를 자동 open
    kotlin("plugin.jpa") version "1.6.10"     // @Entity 등에 기본 생성자 합성 + open
}
```

# JPA는 기본 생성자를 요구한다

JPA 명세상 엔티티는 인자 없는 기본 생성자가 있어야 합니다. Hibernate가 데이터를 객체화 하기위해 빈 객체를 먼저 만든 뒤 채우기 때문인데요. 코틀린에서는 주 생성자에 프로퍼티를 다 넣으면 인자 없는 기본생성자가 없으니, 위의 `kotlin-jpa` 플러그인이 합성 기본 생성자를 만들어 해결합니다.

# data class를 엔티티로 쓰면 안 되는 이유

`data class`는 DTO와 같이 데이터 전달용이나 Value Object 같은 객체로서는 알맞지만, JPA 엔티티로는 어울리지 않는 부분이 있습니다. `data class`가 자동으로 만들어주는 것들이 엔티티 생애주기와 충돌하는 부분이 많기 때문입니다.

- equals/hashCode가 모든 프로퍼티 기반이라, id가 자동 생성이면 영속화 전후로 `hashCode`가 바뀌어 `Set`에서 객체를 잃어버립니다. 연관관계 필드까지 포함하면 비교하다 지연 로딩이 트리거되거나 무한 순환에 빠집니다.
- toString도 모든 필드를 찍어, 로그 한 줄에 쿼리가 나가거나 양방향이면 `StackOverflowError`가 납니다.
- copy()로 영속 엔티티를 복사하면 같은 id의 detached 객체가 떠돌게 됩니다.

그래서 엔티티는 `data class`가 아니라 일반 class로 두고, equals/hashCode가 필요하면 도메인 생명주기의 기초가 되는 id와 같은 값들로 정의하는 편이 안전했습니다.

```kotlin
@Entity
class Member(
    @Column(nullable = false)
    var name: String,
) {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
```

엔티티 필드를 `val`로 막고 싶은 욕심이 들지만, 엔티티는 변경 감지(dirty checking) 기반 update를 전제로 하니 수정될 필드는 `var`여야 합니다. id처럼 안 바뀌는 값만 `val`로 둘 수 있습니다.

# 그리고 Jackson, data class 역직렬화

직렬화로 넘어가도 같은 뿌리의 함정이 나옵니다. Jackson은 역직렬화할 때 기본 생성자로 빈 객체를 만든 뒤 채우는데, `data class`는 보통 주 생성자에서 값을 다 받으니 기본 생성자가 없습니다. 그래서 순정 Jackson은 data class를 역직렬화하지 못합니다.

이걸 풀어주는 게 `jackson-module-kotlin`입니다. 코틀린이 심어둔 메타데이터를 읽어 주 생성자 파라미터 이름으로 역직렬화 해주는 중요한 역할을 가지고 있습니다. Spring Boot라면 클래스패스에 있기만 하면 자동 등록되어 따로 신경써야 할 부분이 적습니다.

```kotlin
val mapper = jacksonObjectMapper()   // KotlinModule이 등록된 ObjectMapper
val user = mapper.readValue<User>("""{"id":1,"name":"kim"}""")
```

# 애너테이션을 어디에 붙여야 할까? (use-site target)

코틀린에서 프로퍼티 하나는 사실 생성자 파라미터(`param`)·백킹 필드(`field`)·getter(`get`)·setter(`set`)로 펼쳐집니다. 여기서 백킹 필드(backing field)는 그 프로퍼티의 값이 실제로 저장되는 숨은 필드를 말합니다. 코틀린은 프로퍼티에 접근할 때 기본적으로 getter/setter를 거치는데, 그 안쪽에서 값을 담아두는 진짜 변수가 바로 이 backing field입니다. 자바로 치면 `private String name` 같은 필드에 해당하죠.

그래서 프로퍼티에 애너테이션을 달면 코틀린이 "이걸 파라미터·필드·getter·setter 중 어디에 붙일지"를 정해야 하는데, 이걸 use-site target이라 하고 `@field:`/`@get:`/`@param:`/`@set:`으로 지정합니다.

예를 들어 DTO 프로퍼티에 `@JsonProperty`로 JSON 키 이름을 지정한다고 해보겠습니다.

```kotlin
data class UserDto(
    @get:JsonProperty("user_name")
    val name: String,
)
```

여기서 `@get:`을 빼고 그냥 `@JsonProperty`만 달면, target을 안 줬으니 코틀린이 기본 규칙으로 한 곳을 고르는데, 그게 Jackson이 실제로 읽는 위치와 어긋나면 애너테이션이 무시된 것처럼 동작합니다. "분명 `@JsonProperty`를 붙였는데 왜 안 먹지?"의 답이 대개 이 target 불일치였습니다.

target별로 애너테이션이 실제 어디에 붙는지 정리하면 이렇습니다.

```kotlin
class Example(
    @param:Min(0)            // 생성자 파라미터에
    @field:NotNull           // 백킹 필드에
    @get:JsonProperty("v")   // getter에
    @set:Inject              // setter에 (var일 때만)
    var value: Int,
)
```

- `@param:` 생성자 파라미터. 역직렬화·DI가 생성자로 값을 받을 때 보는 자리입니다.
- `@field:` 백킹 필드. 보통 JPA `@Column`이나 필드 주입 애너테이션에 활용됩니다.
- `@get:` getter. Jackson 직렬화나 Bean Validation에 보통 활용합니다.
- `@set:` setter. `var` 프로퍼티에만 생기고, setter 주입 같은 데 씁니다.

target을 생략하면 코틀린이 `param → property → field` 순으로 적용 가능한 한 곳을 골라줍니다. 문제는 그 기본 선택이 프레임워크가 읽는 위치와 늘 같진 않다는 점이라, 안 먹을 땐 target을 명시하는 게 확실했습니다.

# 정리

결국 코틀린의 좋은 기본값(final·data class·프로퍼티 펼침)이 프레임워크의 런타임 동작(프록시·기본 생성자·자바빈 규칙)과 어긋나는 게 핵심이었습니다. 대부분은 `kotlin-spring`/`kotlin-jpa`/`jackson-module-kotlin`과 같은 대체방안들이 있습니다.

# 참고

> [Kotlin Docs: All-open / No-arg compiler plugins](https://kotlinlang.org/docs/all-open-plugin.html)
> [jackson-module-kotlin (GitHub)](https://github.com/FasterXML/jackson-module-kotlin)
