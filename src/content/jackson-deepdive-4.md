---
layout: post
category: "엔지니어링"
series: "Jackson 딥다이브"
seriesOrder: 4
title: "Jackson 딥다이브 - 4: 설정·어노테이션·함정"
author: thxwelchs
tags: ["Jackson", "직렬화", "Spring", "JSON"]
image: /img/covers/eng/jackson-deepdive-4.png
date: "2021-11-27T14:09:40.000Z"
draft: false
---

[1편](/jackson-deepdive-1/)에서 구현체 흐름을, [2편](/jackson-deepdive-2/)에서 직렬화기를 직접 만들어보고, [3편](/jackson-deepdive-3/)에서 응답·요청 객체 설계와 불변 객체 받기를 봤습니다. 마지막 편은 개발을 하다 보면 자주 만나게 되는 **ObjectMapper 설정**과 **어노테이션 정리**, 그리고 발생할 수 있는 문제들을 모았습니다.

# ObjectMapper 설정으로 동작이 갈린다

ObjectMapper 설정에 따라, 같은 객체·같은 JSON이라도 직렬화·역직렬화 결과가 달라질 수 있다는 사실, 알고 계셨나요? 실무에서 자주 만진 설정만 추려보면 이렇습니다.

```java
ObjectMapper mapper = JsonMapper.builder()
    .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)     // 날짜를 숫자 말고 ISO-8601 문자열로
    .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)  // 모르는 필드 와도 안 죽게
    .serializationInclusion(JsonInclude.Include.NON_NULL)        // null 필드는 응답에서 생략
    .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE) // camelCase ↔ snake_case 자동 변환
    .addModule(new JavaTimeModule())                            // java.time 지원
    .build();
```

- `WRITE_DATES_AS_TIMESTAMPS`(SerializationFeature): 켜져 있으면 날짜가 `[2021,11,16]` 같은 숫자로 나갑니다. 보통 꺼서 ISO 문자열로 둡니다.
- `FAIL_ON_UNKNOWN_PROPERTIES`(DeserializationFeature): 기본이 켜짐이라, JSON에 모르는 필드가 하나라도 있으면 예외가 납니다. 외부 응답을 받을 땐 꺼두는 편이 안전했습니다.
- `PropertyNamingStrategies.SNAKE_CASE`: 자바는 camelCase, JSON은 snake_case를 쓰는 경우가 많은데 이걸로 한 번에 맞췄습니다.
- `JavaTimeModule`: `java.time` 타입(`LocalDateTime` 등) 지원. Spring Boot는 자동 등록해주지만, 순수 Jackson을 직접 만들 땐 빼먹기 쉽습니다.

Spring Boot라면 이걸 코드로 만들기보다 `application.yml`의 `spring.jackson.*`나 `Jackson2ObjectMapperBuilderCustomizer`로 설정하는 방법이 더 명시적이고 관리가 수월할 것 같았습니다. 또한 `@RequestBody`/`@ResponseBody`가 쓰는 건 스프링 MVC 메시지 컨버터가 들고 있는 **별도 ObjectMapper**이기 때문에, 해당 ObjectMapper 설정을 할 것이라면 Spring 컨텍스트에 빈으로 등록을 해주거나 빌더를 등록해주면 됩니다.

```java
// 1) 빌더 커스터마이저로 (Boot 기본 구성을 유지한 채 필요한 것만 얹기, 권장)
@Bean
public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
    return builder -> builder
        .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .serializationInclusion(JsonInclude.Include.NON_NULL);
}

// 2) ObjectMapper 빈을 직접 등록 (Boot가 이 빈을 우선 사용)
@Bean
public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
    return builder
        .failOnUnknownProperties(false)
        .serializationInclusion(JsonInclude.Include.NON_NULL)
        .build();
}
```

2번처럼 직접 등록할 땐 `new ObjectMapper()`을 쌩으로 등록하기보다, `Jackson2ObjectMapperBuilder`를 거치는 게 안전합니다. 그래야 `JavaTimeModule` 등록 같은 Boot의 기본 구성이 빠지지 않기 때문입니다.

# 자주 쓰이는 어노테이션 정리

분명 자주 쓰는 것들인데도 매번 헷갈리고 다시 찾아보게 되지 않나요? 그래서 의미를 한번 표로 정리해봤습니다.

| 어노테이션 | 정확히 하는 일 |
|---|---|
| `@JsonProperty("name")` | 그 프로퍼티의 JSON 키 이름을 지정. `access`로 읽기/쓰기 전용도 지정 가능 |
| `@JsonIgnore` | 그 프로퍼티를 직렬화·역직렬화 양쪽에서 제외 |
| `@JsonIgnoreProperties(ignoreUnknown=true)` | (클래스에) JSON에 있는 모르는 필드를 무시 |
| `@JsonInclude(NON_NULL)` | null(또는 빈 값)인 프로퍼티를 출력에서 생략 |
| `@JsonCreator` | 역직렬화 시 호출할 생성자/팩토리 메서드 지정(불변 객체용) |
| `@JsonValue` | 객체 전체를 이 메서드의 반환값 하나로 직렬화(예: enum 코드값) |
| `@JsonAlias({"a","b"})` | 역직렬화 때 여러 입력 키 이름을 같은 프로퍼티로 받음 |
| `@JsonFormat(pattern=...)` | 날짜·숫자 등의 표현 형식 지정 |
| `@JsonAnyGetter` / `@JsonAnySetter` | `Map`을 펼쳐 평평한 키들로 직렬화 / 모르는 키들을 `Map`에 모아 받기 |
| `@JsonNaming(...)` | 그 클래스에 네이밍 전략(예: snake_case)을 따로 적용 |

# 양방향 연관관계의 무한 순환

예전에 JPA 양방향 엔티티 연관관계를 그대로 직렬화하다 만난 문제가 있는데요([JPA 양방향 Entity 무한 재귀](</JPA 양방향 Entity 무한 재귀 문제 해결/>)로도 정리했던 그 종류입니다).

`User`가 `List<Order>`를 갖고 각 `Order`가 다시 `User`를 가리키면, Jackson은 getter를 타고 User → Order → User … 를 끝없이 따라가다 `StackOverflowError`가 발생하게 됩니다. 이 문제를 해결하는 방법은 `@JsonManagedReference`/`@JsonBackReference`(한쪽만 직렬화), `@JsonIgnore`(한쪽 제외), `@JsonIdentityInfo`(두 번째 등장부터 id만) 정도가 있지만, 근본적으로는 응답 전용 DTO로 분리하면 순환 자체가 안 생기니, 결국 이게 제일 깔끔한 방법인 것 같았습니다.

# ObjectMapper는 재사용하자

마지막으로 `ObjectMapper`는 만들 때 비용이 있는 객체이기 때문에, 설정이 끝난 뒤에는 스레드 세이프해서 같이 사용해도 됩니다. 그래서 필요할 때마다 인스턴스를 생성해서 사용하지 않고, 같은 유스케이스의 JSON 직렬화 전략을 가져간다면 하나를 만들어 재사용하는 게 좋습니다.

# 정리

세 편에 걸쳐 Jackson을 구현체부터 설계, 설정, 불변까지 따라가 봤습니다. 결국 직렬화는 `BeanPropertyWriter`가 getter로 값을 꺼내 쓰고, 역직렬화는 `ValueInstantiator`로 만든 뒤 `SettableBeanProperty`로 채우는 한 쌍의 구조였고, 응답·요청 설계와 불변 고민, 의외의 함정까지 전부 이 구조에서 갈렸습니다. "Jackson은 필드가 아니라 접근자를 본다", 이 핵심만 기억하고 있어도 대부분 설명이 됐음.

# 참고

> [Jackson Databind: Documentation](https://github.com/FasterXML/jackson-databind/wiki)
> [Spring Boot: Customize the Jackson ObjectMapper](https://docs.spring.io/spring-boot/docs/2.5.x/reference/html/features.html#features.json.jackson)
