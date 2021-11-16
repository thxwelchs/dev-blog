---
layout: post
category: "엔지니어링"
series: "Jackson 딥다이브"
seriesOrder: 2
title: "Jackson 딥다이브 - 2: Jackson 직접 구현해보기"
author: thxwelchs
tags: ["Jackson", "직렬화", "JSON", "리플렉션", "벤치마킹"]
image: /img/covers/eng/jackson-deepdive-2.png
date: "2021-11-16T10:22:20.000Z"
draft: false
---

[1편](/jackson-deepdive-1/)에서 Jackson의 구현체 흐름을 따라가 봤습니다. 직렬화는 `BeanPropertyWriter`가 getter로 값을 꺼내 `JsonGenerator`로 흘리고, 캐시·스트리밍 같은 설계도 되어있는 걸 살펴봤는데요. 머리로만 이해한 걸 직접 구현해보면 좋을 것 같아서, 직접 구현해보고 테스트 그리고 Jackson과 속도 비교까지 해보고 싶어 정리하게 되었습니다.

# Jackson 직접 구현해보기 (JSON 직렬화기 구현)

Jackson의 동작 원리를 이전에 살펴봤을 때, `BeanSerializer`가 하는 일을 아주 단순화하면, **`getXxx()`/`isXxx()`를 찾아 호출하고 그 반환값을 JSON으로 쓰는 것**이기 때문에, 그 역할에 집중해 공통 동작을 추상 클래스 하나에 모아봤습니다. getter를 찾는 `introspect`와, 객체를 `{"키":값,...}`으로 쓰는 `writeBean`이 핵심입니다.

```java
public abstract class ReflectiveJsonSerializer {

    static final class Property {
        private final String name;
        private final Method getter;

        Property(String name, Method getter) {
            this.name = name;
            this.getter = getter;
        }

        String name() {
            return name;
        }

        Method getter() {
            return getter;
        }
    }

    // 프로퍼티 목록을 "매번 찾을지 / 캐시할지"만 하위 클래스가 정한다
    protected abstract List<Property> propertiesOf(Class<?> type);

    // 클래스에서 getXxx()/isXxx()를 찾아 (이름, Method) 목록으로
    protected static List<Property> introspect(Class<?> type) {
        List<Property> properties = new ArrayList<>();
        for (Method method : type.getMethods()) {
            if (method.getParameterCount() != 0) continue;
            if (method.getDeclaringClass() == Object.class) continue;   // getClass() 제외
            String name = method.getName();
            if (name.startsWith("get") && name.length() > 3 && method.getReturnType() != void.class) {
                properties.add(new Property(decapitalize(name.substring(3)), method));
            } else if (name.startsWith("is") && method.getReturnType() == boolean.class) {
                properties.add(new Property(decapitalize(name.substring(2)), method));  // boolean은 is
            }
        }
        return properties;
    }

    // 객체를 {"키":값,...} 로 (writeValue는 null/문자열/숫자/컬렉션/중첩객체로 분기)
    private void writeBean(Object bean, StringBuilder out) throws Exception {
        out.append('{');
        boolean first = true;
        for (Property p : propertiesOf(bean.getClass())) {
            Object value = p.getter().invoke(bean);
            if (!first) out.append(',');
            first = false;
            writeString(p.name(), out);
            out.append(':');
            writeValue(value, out);
        }
        out.append('}');
    }
    // serialize(...), writeValue(...), writeString(...) 등은 생략
}
```

그리고 효율성 비교를 위해 구현체를 둘로 나눴습니다. **리플렉션 정보를 캐시하지 않는 구현체와, 캐시하는 구현체.** 차이는 `propertiesOf` 하나뿐인데, 캐시하지 않는 쪽은 직렬화할 때마다 `introspect`로 getter를 다시 찾게 되고, 캐시하는 구현체는 클래스별 목록을 한 번 찾고 재사용합니다(Jackson의 직렬화기 캐시처럼).

```java
// 캐시하지 않는 구현: 매 호출마다 다시 찾는다
public final class NonCachedJsonSerializer extends ReflectiveJsonSerializer {
    @Override
    protected List<Property> propertiesOf(Class<?> type) {
        return introspect(type);
    }
}

// 캐시 구현: 클래스별 목록을 한 번만 찾는다
public final class CachedJsonSerializer extends ReflectiveJsonSerializer {
    private final Map<Class<?>, List<Property>> cache = new ConcurrentHashMap<>();
    @Override
    protected List<Property> propertiesOf(Class<?> type) {
        return cache.computeIfAbsent(type, ReflectiveJsonSerializer::introspect);
    }
}
```

지금 당장은 객체를 JSON으로 직렬화하는 기능만 있으면 됐기에, Jackson처럼 고도화하진 않고 단순화해서 구현했습니다. 실제로 두 구현으로 같은 객체를 직렬화해보면, 캐시 여부와 무관하게 같은 JSON이 나옵니다. 테스트로 각각 확인해보았습니다.

```java
// 키는 알파벳 순으로 고정. 두 구현은 캐시 여부만 다르고 출력은 동일하다
private static final String EXPECTED_JSON =
        "{\"active\":true," +
        "\"address\":{\"city\":\"Seoul\",\"zipCode\":\"04524\"}," +
        "\"age\":33," +
        "\"email\":\"kim@example.com\"," +
        "\"id\":7," +
        "\"name\":\"kim\"," +
        "\"roles\":[\"ADMIN\",\"USER\"]}";

@Test
void 캐시하지_않는_구현이_예상_JSON_문자열을_그대로_만든다() {
    String json = new NonCachedJsonSerializer().serialize(sample());
    System.out.println("NonCachedJsonSerializer => " + json);
    assertThat(json).isEqualTo(EXPECTED_JSON);
}

@Test
void 캐시하는_구현이_예상_JSON_문자열을_그대로_만든다() {
    String json = new CachedJsonSerializer().serialize(sample());
    System.out.println("CachedJsonSerializer    => " + json);
    assertThat(json).isEqualTo(EXPECTED_JSON);
}
```

찍어보면 출력은 이렇습니다(두 구현 동일).

```json
{"active":true,"address":{"city":"Seoul","zipCode":"04524"},"age":33,"email":"kim@example.com","id":7,"name":"kim","roles":["ADMIN","USER"]}
```

키를 알파벳 순으로 고정했을 뿐, Jackson 출력과 내용은 동일했음(둘의 출력을 다시 `Map`으로 파싱해 비교했습니다).

# 벤치마킹, Jackson vs 자체 구현

그럼 성능은 어떨까요? 궁금해서 측정해봤습니다. [JMH](https://github.com/openjdk/jmh)로 쟀고, 측정 과정은 이렇습니다.

- 대상: `Sample`(필드 7개 + 중첩 객체 + 리스트) **1만 건이 담긴 `List`를 통째로 직렬화**.
- 모드: 평균 시간(`AverageTime`), 단위 µs/op. 워밍업 2회, 측정 3회, 포크 1.
- 환경: JDK 17, Jackson 2.12.5.

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Thread)
public class SerializationBenchmark {

    private static final int SIZE = 10_000;

    private List<Sample> samples;
    private ObjectMapper jackson;
    private NonCachedJsonSerializer nonCached;
    private CachedJsonSerializer cached;

    @Setup
    public void setUp() throws Exception {
        samples = new ArrayList<>(SIZE);
        for (int i = 0; i < SIZE; i++) {
            samples.add(new Sample(
                    i, "user" + i, "user" + i + "@example.com",
                    (i & 1) == 0, 20 + (i % 50),
                    List.of("ROLE_" + (i % 7), "GROUP_" + (i % 13)),
                    new Address("city" + (i % 100), String.format("%05d", i % 100000))));
        }
        jackson = new ObjectMapper();
        nonCached = new NonCachedJsonSerializer();
        cached = new CachedJsonSerializer();
        jackson.writeValueAsString(samples);   // 캐시·직렬화기 워밍업
        cached.serialize(samples);
    }

    @Benchmark
    public String jackson() throws Exception {
        return jackson.writeValueAsString(samples);
    }

    @Benchmark
    public String nonCached() {
        return nonCached.serialize(samples);
    }

    @Benchmark
    public String cached() {
        return cached.serialize(samples);
    }
}
```

워밍업·측정 횟수 같은 실행 옵션은 `build.gradle`의 `jmh { }`에 뒀습니다.

```groovy
jmh {
    warmupIterations = 2
    iterations = 3
    fork = 1
    benchmarkMode = ['avgt']   // 호출 1회 평균 시간
    timeUnit = 'us'            // 대량(1만 건)이라 마이크로초 단위
}
```

결과는 이렇게 나왔습니다.

```text
Benchmark                         Mode  Cnt     Score     Error  Units
SerializationBenchmark.jackson    avgt    3  2856.586 ± 191.089  us/op
SerializationBenchmark.cached     avgt    3  5063.837 ± 305.844  us/op
SerializationBenchmark.nonCached  avgt    3  9081.485 ± 852.146  us/op
```

읽어보면, **캐시하지 않는 구현(`nonCached`)은 Jackson보다 3배쯤 느렸습니다.** 매 객체마다 getter를 다시 찾으니 당연한 결과였음. 그런데 **프로퍼티만 캐시해도(`cached`) 1.8배 차이까지 좁혀졌습니다.** "리플렉션이 느리다"기보다 "리플렉션을 매번 반복하는 게 느리다"에 가까웠던 거였습니다.

그럼에도 Jackson이 여전히 더 빠른 건, 아마 앞에서 본 설계들이 겹겹이 깔려 있어서인 것 같습니다. 벤치마크 관점에서 다시 짚으면 이렇습니다.

- **스트리밍 코어**: 토큰을 바이트·문자에 바로 써냅니다. 중간에 큰 문자열을 모았다 뱉지 않아 메모리 이동이 적습니다.
- **버퍼 재활용**: 출력 버퍼(`byte[]`/`char[]`)를 스레드별로 돌려써서, 1만 건을 도는 동안 새 배열을 거의 할당하지 않습니다. GC 부담이 줄어듦.
- **타입별 전용 직렬화기**: `String`·`long`·`boolean`을 각자 전용 경로로 바로 써냅니다. 저의 구현은 `writeValue`에서 매번 `instanceof`로 타입을 분기하는데, 그 비용이 없는 셈.

저의 구현은 그냥 `StringBuilder`에 json 문자열을 이어붙이는 수준이라, 그래서 차이가 발생하는 것 같았습니다. 😅

# 정리

직접 만들어보니, 리플렉션 직렬화기는 "리플렉션이 느리다"기보다 "매번 반복하는 게 느리다"에 가까웠음. 프로퍼티만 캐시해도 Jackson과의 격차가 3배에서 1.8배로 좁혀졌고, 그럼에도 남는 차이는 스트리밍 코어·버퍼 재활용·타입별 전용 직렬화기 같은 설계가 겹겹이 받치고 있어서였음. [1편](/jackson-deepdive-1/)에서 글로 읽은 설계가 왜 거기 있는지를 숫자로 확인한 셈이었음. 다음 편에서는 이 구조를 바탕으로 내보내는 응답 객체와 받는 요청 객체를 어떻게 설계하는지로 넘어갑니다.

# 참고

> [Jackson Databind: Documentation](https://github.com/FasterXML/jackson-databind/wiki)
> [Jackson 2.12 javadoc (databind)](https://fasterxml.github.io/jackson-databind/javadoc/2.12/)
> [Jackson 2.12 javadoc (core)](https://fasterxml.github.io/jackson-core/javadoc/2.12/)
