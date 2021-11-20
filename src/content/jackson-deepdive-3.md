---
layout: post
category: "엔지니어링"
series: "Jackson 딥다이브"
seriesOrder: 3
title: "Jackson 딥다이브 - 3: 응답·요청 객체 설계"
author: thxwelchs
tags: ["Jackson", "직렬화", "Spring", "JSON"]
image: /img/covers/eng/jackson-deepdive-3.png
date: "2021-11-20T14:57:20.000Z"
draft: false
---

[1편](/jackson-deepdive-1/)에서 Jackson의 구현체를 따라가 보고, 직렬화는 `getter → JsonGenerator`, 역직렬화는 `인스턴스 생성 → setter/필드 주입`이라는 한 쌍의 구조라는 걸 봤습니다. 이번 편은 그 구조를 바탕으로, **내보내는 응답 객체**와 **받는 요청 객체**를 어떻게 설계해볼 수 있는지 정리합니다.

# 응답 객체로서 설계할 때 (객체 → JSON 직렬화)

그럼 직렬화 대상이 될 응답 객체는 뭘 신경 써야 할까요? 내보내는 쪽은 지난 편에서 본 대로 **getter가 기준**입니다. 그래서 응답 객체를 설계할 때 개인적으로 제일 먼저 챙긴 건 "무엇이 JSON에 실려 나가는가"를 의식하는 일이었던 것 같습니다.

```java
public class UserResponse {
    private String name;
    private String password;
    private boolean isActive;

    public String getName() {
        return name;
    }

    public String getPassword() {   // 무심코 둔 getter
        return password;
    }

    public String getDisplayName() {   // 필드도 아닌데
        return "Mr. " + name;
    }

    public boolean isActive() {
        return isActive;
    }
}
```

여기서 `password`는 필드를 숨길 의도였더라도 getter가 있으면 그대로 나갑니다. 심지어 필드가 없는 `getDisplayName()` 같은 계산형 getter도 `"displayName"`으로 직렬화됩니다. 응답 쪽에서 자주 신경 써야 할 포인트는 이런 것들이었습니다.

- 민감하거나 내부용인 값은 `@JsonIgnore`로 명시적으로 제외한다.
- 키 이름을 바꿔 내보내려면 `@JsonProperty("user_name")`.
- `null`이거나 비어 있는 필드를 응답에서 빼려면 `@JsonInclude(JsonInclude.Include.NON_NULL)`(또는 `NON_EMPTY`).
- 날짜 형식을 고정하려면 `@JsonFormat(shape = STRING, pattern = "yyyy-MM-dd")`.

## 의도하지 않은 직렬화

Jackson은 직렬화기를 만들기 전에 클래스의 구조를 먼저 훑어봅니다(introspection, [`POJOPropertiesCollector`](https://fasterxml.github.io/jackson-databind/javadoc/2.12/com/fasterxml/jackson/databind/introspect/POJOPropertiesCollector.html)가 담당). 이때 **필드만 보는 게 아니라 존재하는 getter·setter를 모두 고려해서** 접두사를 떼고 이름이 같으면 하나의 논리 프로퍼티로 합칩니다. 즉 기준이 "필드"가 아니라 "접근자(accessor)"가 됩니다.

그럼 이게 뭘 모아두는 걸까요? `POJOPropertiesCollector`가 모아놓는 결과를 단순화해 그려보면, 논리 프로퍼티 하나가 필드·getter·setter를 묶어 들고 있는 형태입니다(실제 구현은 위 링크의 jackson-databind `introspect` 패키지에 있습니다).

```text
POJOPropertiesCollector
└─ Map<논리 프로퍼티 이름, POJOProperty>
   ├─ "name"        → { field: name,  getter: getName(),        setter: setName() }
   ├─ "displayName" → { field: 없음,  getter: getDisplayName(), setter: 없음 }
   └─ "password"    → { field: password, getter: getPassword(), setter: 없음 }
```

즉 `displayName`처럼 **필드 없이 getter만 있어도** 프로퍼티 하나로 판단하게 됩니다. 그렇기 때문에 필드도 아닌 `getDisplayName()` 같은 메서드의 리턴값도 키가 되는 거였음. Jackson이 기본 가시성에서 **public이고 인자 없는 `getXxx()`/`isXxx()`를 전부 프로퍼티로 판단**하기 때문이죠. 단순 getter·setter가 아니라 비즈니스 로직으로 만든, `get`/`is` 접두사가 붙은 메서드라면 그 리턴값이 JSON 프로퍼티에 포함된다는 의미입니다.

```java
public class Item {
    private String name;
    private int price;

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }
}

public class Order {
    private List<Item> items;

    public List<Item> getItems() {
        return items;
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public int getTotalPrice() {
        return items.stream().mapToInt(Item::getPrice).sum();
    }
}
```

그래서 위 `Order`에 아이템 둘을 담아 직렬화하면 실제 응답은 이렇게 나옵니다.

```json
{
  "items": [
    {"name": "apple", "price": 1000},
    {"name": "banana", "price": 2000}
  ],
  "empty": false,
  "totalPrice": 3000
}
```

`isEmpty()`, `getTotalPrice()`는 비즈니스 로직으로 활용하는 메서드인데 `"empty"`, `"totalPrice"`가 응답에 끼어버린 겁니다. 막는 법은 안 내보낼 메서드에 `@JsonIgnore`를 달거나, Jackson이 getter 메서드에 대해 자동검출을 하지 않도록(`@JsonAutoDetect(getterVisibility = NONE, isGetterVisibility = NONE)`) 하거나, 혹은 비즈니스 도메인 객체와 응답 객체를 명확히 구분하는 것입니다.

## boolean의 is가 사라진다

맨 앞 `UserResponse`에 슬쩍 끼워둔 `isActive` 필드를 다시 보겠습니다. 필드 이름 자체가 `is`로 시작하는 경우인데, 여기서 또 다른 함정이 있었습니다. `boolean` 필드 `isActive`의 getter는 관례상 `isActive()`입니다. 그런데 Jackson은 이 getter에서 **`is`를 떼서** 프로퍼티 이름을 `active`로 봅니다. 그래서 JSON 키가 `"isActive"`가 아니라 `"active"`로 나갑니다.

```java
private boolean isActive;

public boolean isActive() {   // -> JSON 키: "active"
    return isActive;
}
```

황당한 건 래퍼 타입이면 또 다르다는 거였습니다. `Boolean`을 Lombok 등이 `getIsActive()`로 만들면, 이번엔 `get`만 떼어 `"isActive"`가 그대로 유지됩니다. 같은 의도인데 primitive냐 wrapper냐로 키가 갈리는 셈이라, API 스펙이 `isActive`를 요구하면 `@JsonProperty("isActive")`로 명시해야 했습니다.

## enum은 무슨 기준일까?

enum은 기본적으로 아무 설정이 되어 있지 않으면 enum 인스턴스 이름(`name()`)이 그대로 문자열로 변환됩니다. 다음과 같은 enum이 있다고 하면,

```java
public enum Color {
    RED("R"),
    GREEN("G"),
    BLUE("B");

    private final String code;

    Color(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
```

아무 설정이 없으면 `Color.RED`는 상수 이름 그대로 나갑니다.

```json
"RED"
```

그렇다면 코드값(`"R"`)로 내보내고 싶다면 어떻게 할까요? 그 값을 돌려주는 메서드에 `@JsonValue`를 붙이면 됩니다. 그러면 객체 전체가 그 반환값 하나로 직렬화됩니다.

```java
@JsonValue
public String getCode() {
    return code;   // 이제 Color.RED -> "R"
}
```

받는 쪽도 짝이 맞아야 합니다. 기본값은 상수 이름으로 매칭하므로 `"RED"`를 받지만, `@JsonValue`로 코드값을 내보냈다면 입력도 `"R"`로 들어옵니다(Jackson이 `@JsonValue` 메서드를 거꾸로 써서 매칭). 그리고 정의에 없는 값(`"WHITE"`)이 오면 기본은 예외라, 무시하고 넘기려면 `READ_UNKNOWN_ENUM_VALUES_AS_NULL`로 눅이면 됩니다.

이 기준을 그대로 테스트로 확인해보면 이렇습니다(직접 돌려본 코드입니다). 먼저 단일 enum:

```java
@Test
void 단일_enum은_JsonValue가_있으면_코드값으로_직렬화되고_그_코드값으로_역직렬화된다() throws Exception {
    // 직렬화: 상수 이름(RED)이 아니라 코드값(R)
    assertThat(mapper.writeValueAsString(Color.RED)).isEqualTo("\"R\"");
    // 역직렬화: 코드값으로 매칭
    assertThat(mapper.readValue("\"G\"", Color.class)).isEqualTo(Color.GREEN);
    // @JsonValue를 단 뒤로는 상수 이름("RED")으로는 직렬화도 역직렬화도 안 된다
    assertThatThrownBy(() -> mapper.readValue("\"RED\"", Color.class))
            .isInstanceOf(JsonMappingException.class);
}
```

`@JsonValue`를 다는 순간, 그 enum은 코드값으로만 오가고 **상수 이름(`"RED"`)으로는 더 이상 직렬화·역직렬화되지 않습니다.**

enum이 단독이 아니라 **다른 객체의 필드로 들어가 있어도** 같은 기준이 그대로 적용됩니다.

```java
static class Paint {
    private String name;
    private Color color;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Color getColor() {
        return color;
    }

    public void setColor(Color color) {
        this.color = color;
    }
}

@Test
void 객체에_enum_필드가_있어도_같은_기준으로_직렬화_역직렬화된다() throws Exception {
    Paint paint = new Paint();
    paint.setName("crimson");
    paint.setColor(Color.RED);

    // 직렬화: 객체 안의 enum 필드도 코드값으로 나간다
    assertThat(mapper.writeValueAsString(paint))
            .isEqualTo("{\"name\":\"crimson\",\"color\":\"R\"}");
    // 역직렬화: 코드값으로 enum 필드가 채워진다
    assertThat(mapper.readValue("{\"name\":\"sky\",\"color\":\"B\"}", Paint.class).getColor())
            .isEqualTo(Color.BLUE);
}
```

핵심은 "엔티티나 도메인 객체를 그대로 내보내지 말고, 나갈 것만 담은 응답 전용 객체를 따로 두는 것"이었습니다. 그래야 내부 구조가, 그리고 방금 본 메서드·`is`·enum 같은 게 의도치 않게 새어 나가지 않으니까요.

# 날짜와 시간을 다룰 때

날짜·시간은 직렬화든 역직렬화든 결국 "어떤 문자열 모양으로 주고받을까"의 문제입니다. 이걸 제공하는 Jackson의 기능은 `@JsonFormat` 하나인데, `shape`랑 `pattern`이 처음엔 헷갈려서 직접 돌려봤습니다.

## shape와 pattern, 뭐가 다른가

같은 `LocalDateTime`(2021-11-16 09:30)을 필드마다 다르게 달아봤습니다.

```java
static class Event {
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    public LocalDateTime patterned;     // 패턴대로 문자열

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    public LocalDateTime isoString;     // 패턴 없으면 ISO-8601 문자열

    public LocalDateTime noAnnotation;  // 아무것도 안 달면 ObjectMapper 설정을 따라감
}
```

`JavaTimeModule`을 단 `ObjectMapper`로 직렬화한 실제 결과입니다.

```text
// 기본 (WRITE_DATES_AS_TIMESTAMPS 켜짐)
{"patterned":"2021-11-16 09:30:00","isoString":"2021-11-16T09:30:00","noAnnotation":[2021,11,16,9,30]}

// 타임스탬프 끄면 (disable WRITE_DATES_AS_TIMESTAMPS)
{"patterned":"2021-11-16 09:30:00","isoString":"2021-11-16T09:30:00","noAnnotation":"2021-11-16T09:30:00"}
```

정리하면 이렇습니다.

- `pattern`: 그 패턴 문자열 그대로 나갑니다(`"2021-11-16 09:30:00"`). 제일 명시적.
- `shape = STRING`(패턴 없이): ISO-8601 문자열(`"2021-11-16T09:30:00"`).
- `shape = NUMBER_INT`: 전역 타임스탬프 설정과 무관하게 숫자(타임스탬프) 형태로 강제합니다. 예제의 `LocalDateTime`이라면 `[2021,11,16,9,30]`처럼 구성요소 숫자 배열로 나갑니다.
- `@JsonFormat` 없음: 필드 단위 지정이 없으니 `ObjectMapper` 전역 설정을 따라갑니다. 타임스탬프가 켜져 있으면 `[2021,11,16,9,30]` 같은 숫자 배열, 끄면 ISO 문자열.

그러니까 `shape`는 "이 값을 무슨 모양으로 낼까", 즉 문자열이냐 숫자냐를 정하고, `pattern`은 문자열일 때 그 형식을 정한다고 보면 됩니다.

## pattern에 쓰는 문자

그럼 `pattern` 문자열엔 뭘 적는 걸까요? Jackson이 자체적으로 만든 포맷 규약일까요? 아닙니다. `LocalDateTime` 같은 `java.time` 타입은 `JavaTimeModule`이 그 패턴으로 [`DateTimeFormatter`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/format/DateTimeFormatter.html#patterns)를 만들어 쓰고, 옛 `java.util.Date`는 [`SimpleDateFormat`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/text/SimpleDateFormat.html) 규약을 따릅니다. 그래서 패턴 문자도 그쪽 규약을 그대로 가져다 쓰게 됩니다.

자주 쓰는 문자만 추리면 이렇습니다.

- `yyyy` 연도 4자리, `yy`면 2자리
- `MM` 월 2자리(`M`은 한 자리수면 한 글자로)
- `dd` 일 2자리
- `HH` 24시간(00~23), `hh` 12시간(01~12)
- `mm` 분, `ss` 초, `SSS` 밀리초
- `a` 오전/오후, `E` 요일

전체 패턴 문자는 위 `DateTimeFormatter` 문서의 패턴 표(JDK 17 기준)에 다 정리돼 있으니, 헷갈릴 땐 거기서 확인하면 됩니다. `HH`(24시간)랑 `hh`(12시간)을 헷갈리면 오후 3시가 `03`시로 찍히는 식이라, 개인적으로 제일 자주 실수했던 지점이었음.

같은 `2021-11-16 09:30:00`을 패턴만 바꿔 실제로 찍어보면 이렇게 갈립니다.

```text
yyyy-MM-dd            ->  2021-11-16
yyyy-MM-dd HH:mm:ss   ->  2021-11-16 09:30:00
yyyy/MM/dd a hh:mm    ->  2021/11/16 오전 09:30
HH:mm                 ->  09:30
yyyy년 MM월 dd일 (E)   ->  2021년 11월 16일 (화)
MM/dd HH:mm:ss.SSS    ->  11/16 09:30:00.000
```

여기서 한 가지 함정이 있었습니다. `a`(오전/오후)나 `E`(요일)처럼 글자로 나오는 부분은 로케일을 탑니다. 위는 시스템 로케일이 한국어라 "오전", "화"로 나왔는데, 영어 로케일이면 같은 패턴이 "AM", "Tue"로 나옵니다. 그래서 표현을 고정하고 싶으면 `@JsonFormat(locale = "ko")`처럼 로케일까지 같이 명시하는 게 안전했습니다.

오히려 더 자주 만난 함정은 타입 선택이었습니다. 보내는 쪽이 `2021-11-16T09:30:00+09:00`처럼 오프셋(타임존)까지 실어 보냈는데, 받는 타입을 `LocalDateTime`으로 선언해버리면 그 오프셋을 담을 자리가 없습니다. 이러면 파싱이 깨지거나 타임존 정보가 통째로 날아가니, 오프셋을 보존해야 한다면 `OffsetDateTime`이나 `ZonedDateTime`으로 받아야 했습니다.

## 받을 때도 결국 같은 패턴

역직렬화도 짝이 맞아야 합니다. `@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")`로 들어오는 문자열 형식을 맞추고, `LocalDateTime` 같은 `java.time` 타입은 `JavaTimeModule`이 등록돼 있어야 파싱됩니다(없으면 예외가 납니다). 타임존이 섞이면 `@JsonFormat(timezone = ...)`이나 전역 타임존 설정으로 못박는 게 안전했음.

`@JsonFormat`을 안 달면 전역 설정이 좌우하니, 날짜는 필드에 박든 전역으로 통일하든 한 곳에서 정해두는 게 덜 헷갈렸습니다.

# 요청 객체로서 설계할 때 (JSON → 객체 역직렬화)

객체로 받는 쪽은 반대로 **인스턴스를 만들고 값을 설정해주는** 과정이라, 고민의 결이 좀 다른 편이었습니다.

기본 동작은 "기본 생성자로 빈 객체를 만들고 setter/필드로 채우기"이기 때문에, 아무 설정 없이 받으려면 사실상 가변 객체(기본 생성자 + setter)가 되기 쉽습니다.

역직렬화할 요청 객체에서 고려해야 할 부분은 보통 다음과 같습니다.

- 들어오는 키 이름이 다르면 `@JsonProperty("user_name")`, 여러 이름을 다 받아주려면 `@JsonAlias({"user_name", "userName"})`.
- 외부 API가 필드를 추가해도 안 깨지게 `@JsonIgnoreProperties(ignoreUnknown = true)`(또는 전역으로 `FAIL_ON_UNKNOWN_PROPERTIES`를 끔).
- 날짜·시간은 앞의 "날짜와 시간을 다룰 때"에서 따로 정리했습니다. 받을 때도 `@JsonFormat`의 `pattern`을 들어오는 문자열에 맞추고 `JavaTimeModule`을 등록해두면 됩니다.
- 입력으로 모르는 enum 값이 오면 예외가 발생합니다. 무시하도록 하려면 `READ_UNKNOWN_ENUM_VALUES_AS_NULL` 설정이 필요합니다.
- 값 검증은 Jackson이 아니라 Bean Validation(`@NotNull`, `@Size` 등)에 맡기는 게 역할 분리상 깔끔했습니다. Jackson은 "채우는 것"까지만.

> 한 가지 짚을 점은, 받는 객체와 내보내는 객체를 굳이 한 클래스로 합치지 않는 편이 편했다는 겁니다. 요청은 "느슨하게 받아 검증", 응답은 "필요한 것만 통제해서 내보내기"라 신경 쓰는 게 서로 달랐거든요.

## 불변 객체로 역직렬화하기

기본 경로는 가변(빈 객체 + setter)이기 때문에, 실제로는 비즈니스에 활용하지도 않을 setter 메서드를 정의해야 합니다. 그리고 setter를 열어두는 건 객체의 변경 범위를 열어주는 것이기 때문에 위험이 따르는 편입니다. 그래서 가능하면 객체는 정말 필요하지 않은 이상 setter를 지양하는 게 좋다고 생각합니다.

그럼 불변을 유지하면서 역직렬화 객체를 설계하려면? 인스턴스 생성을 **생성자 한 번으로** 끝내고 그 뒤로는 못 바꾸게 하면 됩니다. 그때 쓰는 게 `@JsonCreator`입니다. 생성자에 붙여두면 Jackson이 빈 객체를 만들어 채우는 대신, 그 생성자로 한 번에 값을 넣어 완성합니다.

```java
public final class Money {
    private final long amount;
    private final String currency;

    @JsonCreator
    public Money(@JsonProperty("amount") long amount,
                 @JsonProperty("currency") String currency) {
        this.amount = amount;
        this.currency = currency;
    }

    public long getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }
}
```

- 모든 필드를 `final`로 두고 setter는 만들지 않습니다. `@JsonCreator` + `@JsonProperty`로 생성자 주입을 지정하면, Jackson이 [`ValueInstantiator`](https://fasterxml.github.io/jackson-databind/javadoc/2.12/com/fasterxml/jackson/databind/deser/ValueInstantiator.html)로 그 생성자를 호출해 한 번에 완성된 불변 객체를 만듭니다.
- 파라미터 이름을 일일이 `@JsonProperty`로 적기 싫으면, `@ConstructorProperties`를 달거나 컴파일 옵션에 `-parameters`를 주면 Jackson이 컴파일된 파라미터 이름을 읽어냅니다.

### 불변이 깨지는 지점

반대로 Jackson이 불변을 깰 수밖에 없는, 혹은 무심코 두면 깨지는 자리도 분명히 있었습니다.

- `@JsonCreator` 같은 생성자 지정이 없으면(기본 경로), Jackson은 기본 생성자(no-arg)로 빈 객체를 만든 뒤 setter나 필드 리플렉션으로 값을 넣습니다. 그래서 가변이 전제됩니다.
- 컬렉션은 조건이 한 가지 더 붙었습니다. **getter만 있고 setter(또는 같은 이름으로 쓸 수 있는 필드)가 없으면**, Jackson이 새 컬렉션을 만드는 대신 그 getter가 돌려준 컬렉션에 `add`로 채워 넣습니다(getter-as-setter). 그래서 그 자리에 `Collections.unmodifiableList(...)`가 있으면 `UnsupportedOperationException`으로 깨졌습니다. (직접 돌려보니, 필드에 바로 쓸 수 있는 경우엔 새 리스트로 교체돼서 안 깨졌습니다.) 불변으로 받고 싶으면 생성자로 받아 새 리스트로 복사해 감싸는 게 안전했음.

정리하면 "불변 + Jackson"은 생성자 기반(`@JsonCreator`)으로 가면 깔끔하게 관리되지만, 아무것도 안 하면 기본값이 가변 쪽이라 의식적으로 잘 선택해야 할 필요가 있었습니다.

### 인자가 하나밖에 없을 때 동작의 차이

방금 `@JsonCreator`를 소개했는데, 여기엔 주의할 점이 있습니다. 필드가 하나뿐인 값 객체에서 발생할 수 있는 문제입니다.

```java
public final class UserId {
    private final String value;

    @JsonCreator
    public UserId(String value) {
        this.value = value;
    }
}
```

이 생성자 하나를 두고, Jackson은 들어오는 JSON을 **두 가지로 받아들일 수 있습니다.**

- 프로퍼티 기반: 입력을 객체로 보고 그 안의 `value` 키를 꺼내 인자에 넣습니다. 즉 `{"value": "u-123"}`을 기대합니다.
- 위임(delegating): 입력 JSON을 풀지 않고 **통째로** 그 인자 하나에 넘깁니다. 즉 키 없는 값 `"u-123"`(문자열 그 자체)을 기대합니다.

같은 클래스인데 받아야 하는 JSON이 `{"value":"u-123"}`이냐 그냥 `"u-123"`이냐로 갈리는 겁니다. 인자가 하나면 어느 쪽인지 애매한데, 이름 정보가 없으면 위임 방식으로 동작하게 됩니다. 실제로 2.12에서 위 `UserId`(이름 정보 없음)에 둘을 넣어보면 이렇게 갈립니다.

```text
{"value":"u-123"}  ->  MismatchedInputException (cannot deserialize from Object value)
"u-123"            ->  UserId(value=u-123)
```

기본값이 위임이라, 정작 객체로 보낸 `{"value":"u-123"}`은 받지를 못합니다. 그래서 단일 인자엔 `@JsonProperty`로 이름을 명시하거나 모드를 명시했습니다.

```java
@JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
public UserId(@JsonProperty("value") String value) {
    this.value = value;
}
```

매번 어노테이션을 다는 대신, 2.12부터 들어온 [`ConstructorDetector`](https://fasterxml.github.io/jackson-databind/javadoc/2.12/com/fasterxml/jackson/databind/cfg/ConstructorDetector.html)로 단일 인자 생성자의 해석 정책을 전역으로 정할 수도 있습니다.

```java
ObjectMapper mapper = JsonMapper.builder()
    .constructorDetector(ConstructorDetector.USE_PROPERTIES_BASED)
    .build();
```

다만 직접 돌려보니 주의할 게 있었습니다. `USE_PROPERTIES_BASED`는 "단일 인자도 프로퍼티 기반으로"라는 뜻이지만, 그러려면 **인자 이름을 알 수 있어야** 합니다. `@JsonProperty`로 명시했거나, `jackson-module-parameter-names`(스프링 부트는 기본 등록)가 있어 컴파일된 파라미터 이름을 읽을 수 있을 때 얘기입니다. 이름 정보가 전혀 없으면 오히려 "프로퍼티 이름을 못 정한다"며 에러가 났습니다. 필요하면 `USE_DELEGATING`(늘 위임), `EXPLICIT_ONLY`(`mode`를 직접 명시하지 않으면 추론 안 함)으로 바꿀 수도 있습니다.

# 정리

- 응답은 나갈 것만 통제한다.
- 요청은 느슨히 받되, 불변이 필요하면 생성자 기반으로 간다.
- 의외의 함정도 결국 "Jackson은 필드가 아니라 접근자를 본다"는 [1편](/jackson-deepdive-1/)의 사실에서 나온다. 이 한 줄은 잊지 말 것.

다음 편에서는 **ObjectMapper 설정과 어노테이션 정리, 그리고 자주 터지는 함정들**을 이어서 보려 합니다.

# 참고

> [Jackson Databind: Documentation](https://github.com/FasterXML/jackson-databind/wiki)
