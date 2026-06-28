---
layout: post
category: "엔지니어링"
title: "통합테스트에서만 ConfigurationProperties 바인딩이 안 되던 문제"
author: thxwelchs
tags: ["트러블슈팅", "Kotlin", "Spring Boot", "ConfigurationProperties"]
image: /img/covers/eng/troubleshooting-kotlin-configurationproperties-v2.png
date: "2024-07-26T10:25:59.000Z"
draft: false
---

Spring + Kotlin으로 개발하면서, 통합테스트에서만 `@ConfigurationProperties` 바인딩이 안 돼 한참을 삽질했던 조금 민망한 후기를 공유합니다.

# 배경

코틀린 데이터 클래스로 불변 프로퍼티를 이렇게 선언해 두고 썼습니다.

```kotlin
@ConfigurationProperties(prefix = "my.props")
data class MyProperties(
    val a: String,
    val b: String,
    val c: String,
)
```

로컬에서 애플리케이션을 띄우면 `application.yml`의 값이 잘 바인딩됩니다. 그런데 `@SpringBootTest` 통합테스트로 돌리면 이 프로퍼티 빈을 만들다가 컨텍스트 로딩이 깨졌습니다. 대략 이런 에러였습니다.

```text
Parameter 0 of constructor in com.example.MyProperties
required a bean of type 'java.lang.String' that could not be found.
```

`String` 타입 빈을 찾는다는 메시지가 좀 이상했습니다. 이건 yml을 생성자에 바인딩하려는 게 아니라, 생성자 인자(`a`)를 빈으로 주입하려다 못 찾은 모양새였거든요. 로컬에선 멀쩡한데 통합테스트만 왜 이럴까요?

# 해결

## 원인은 테스트의 component class 지정이었다

원인은 `@SpringBootTest`에 어떤 클래스를 빈으로 올릴지 직접 지정해둔 부분이었습니다. 설정 클래스와 프로퍼티 클래스를 둘 다 `classes`에 박아뒀던 게 화근이었던 듯합니다.

```kotlin
// 문제가 된 설정
@SpringBootTest(classes = [MyConfig::class, MyProperties::class])
class MyIntegrationTest { /* ... */ }
```

`@SpringBootTest(classes = [...])`에 `MyProperties`를 직접 넣으면, 스프링은 이걸 **프로퍼티 POJO가 아니라 평범한 컴포넌트 빈으로** 보고 생성하려 듭니다. 그런데 `MyProperties`는 `val`만 가진 데이터 클래스라 생성자 인자가 셋(`a`, `b`, `c`)이고, 일반 빈으로 만들려면 그 인자들을 빈으로 주입해야 합니다. `String` 빈이 있을 리 없으니 "Parameter 0 ... required a bean of type 'java.lang.String'"으로 깨진 것이었습니다.

로컬에서 됐던 이유는, 프로퍼티 등록을 `MyConfig` 쪽 `@EnableConfigurationProperties`에 맡겨두고 있었기 때문입니다. 이 경로로 등록되면 스프링은 생성자 주입(autowiring)이 아니라 생성자 바인딩(constructor binding)으로, yml 값을 인자에 채워 인스턴스를 만듭니다. 그래서 같은 클래스라도 "누가 어떻게 등록하느냐"에 따라 결과가 갈렸던 거였습니다.

```kotlin
// 고친 설정: 프로퍼티는 config가 @EnableConfigurationProperties로 등록하게 둔다
@SpringBootTest(classes = [MyConfig::class])
class MyIntegrationTest { /* ... */ }

@Configuration
@EnableConfigurationProperties(MyProperties::class)
class MyConfig { /* ... */ }
```

`MyConfig`만 올려도 거기 달린 `@EnableConfigurationProperties(MyProperties::class)`가 프로퍼티 클래스를 알아서 등록·바인딩해줍니다. 테스트의 `classes`에서 `MyProperties`를 빼는 것만으로 해결됐습니다.

> 이 내용은 [스프링 공식 문서](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/test/context/SpringBootTest.html)에도 소개되어 있었습니다. `@SpringBootTest`의 `classes`는 "ApplicationContext를 로딩할 component class"를 지정하는 자리라, 여기에 넣은 클래스는 그 용도(컴포넌트/설정)로 다뤄집니다. 프로퍼티 클래스를 여기 직접 넣는 건 의도와 어긋났던 셈입니다.

## 그럼 왜 var + 기본값일 땐 됐을까

사실 처음엔 이 데이터 클래스를 `var`에 기본값까지 줘서 쓰고 있었는데, 그땐 통합테스트도 잘 됐습니다. 왜 그랬을까요?

```kotlin
@ConfigurationProperties(prefix = "my.props")
data class MyProperties(
    var a: String = "",
    var b: String = "",
    var c: String = "",
)
```

- 주생성자의 모든 프로퍼티에 기본값이 있으면, 코틀린은 이 데이터 클래스에 인자 없는 기본 생성자(no-arg)도 만들어줍니다. 그래서 스프링이 일반 빈으로 생성하려 해도 빈 생성자로 일단 인스턴스를 만들 수 있었습니다.
- 인스턴스가 만들어진 뒤에는 `ConfigurationPropertiesBindingPostProcessor`(바인더)가 yml 값을 setter로 채워 넣었습니다. `var`라 setter가 있으니 이 사후 바인딩이 동작했던 것입니다.

즉 `var` + 기본값은 "일반 빈으로 생성 → 사후 setter 바인딩"이라는 다른 경로로 우연히 성공했던 거였고, `val`만 가진 불변 버전에선 그 경로가 막혀 잘못된 테스트 설정의 문제가 드러난 것이었습니다.

# 결과

한동안 `val` 불변 프로퍼티가 문제인 줄 알고 애먼 데이터 클래스만 노려봤습니다. 사실 코드는 처음부터 멀쩡했고, 깨진 건 테스트의 `classes`에 프로퍼티 클래스를 직접 박아둔 제 설정이었습니다. "로컬에선 되는데 테스트에서만 안 된다"는 증상에 홀려서, 양쪽에 공통인 코드보다 다른 쪽(테스트 설정)을 먼저 의심했어야 했는데 순서가 거꾸로였던 셈입니다.

정작 얄궂은 건 `var` + 기본값일 땐 됐다는 점이었습니다. 잘못된 설정이 "no-arg 생성 후 setter 바인딩"이라는 다른 경로 덕에 우연히 가려져 있었던 거라, `val`로 바꾸면서 오히려 숨어 있던 문제가 드러난 것이었습니다. 우연히 되던 게 안 되기 시작할 때가, 사실은 원래 틀려 있던 걸 마주하는 순간이기도 했습니다.

그래서 결국 반영한 것은 두 가지입니다. 프로퍼티 클래스는 `@EnableConfigurationProperties`(또는 `@ConfigurationPropertiesScan`)에 등록을 맡기고, 테스트 `classes`엔 설정 클래스만 올릴 것. 그리고 Spring Boot 3부터 단일 주생성자면 `@ConstructorBinding`은 생략해도 된다는 것도 이참에 같이 정리해뒀습니다.

# 참고

> - [Spring Boot: @SpringBootTest (classes 설명)](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/test/context/SpringBootTest.html)
> - [Spring Boot Reference: Constructor Binding](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.constructor-binding)
