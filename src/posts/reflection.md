---
layout: post
category: "엔지니어링"
title: "Java Reflection"
author: thxwelchs
tags: ["reflection", "java"]
image: /img/covers/eng/reflection.png
date: "2016-08-22T15:11:55.000Z"
draft: false
---

# Java Reflection

**객체를 통해서 그 객체의 클래스 정보를 분석해내는 프로그래밍 기법**을 의미합니다.

위키백과에서는 컴퓨터 과학에서의 Reflection(반영)을 **"런타임 시점에 자신의 구조와 행위를 관리하고 수정할 수 있는 프로세스"** 라고 설명합니다.

<br/>

## 그래도 잘 이해가 안 가는 Reflection?

맞습니다. 사전적인 의미만 가지고는 잘 와닿지 않는 것 같습니다. 뭐든 예를 들어보는 게 이해가 제일 잘 됐던 것 같아서, 이번에도 예를 들어보겠습니다.

자바로 코드를 작성해본 사람이라면 다 아시다시피, Java는 컴파일이 필요한 언어입니다. 우리가 작성한 `.java` 소스 파일을 그대로 실행하는 게 아니라, **자바 컴파일러(`javac`)가 먼저 `.class` 바이트코드(bytecode) 파일로 변환**하고, 실행할 땐 그 `.class`를 **JVM이 읽어서** 돌립니다.

```
Hello.java  --(javac)-->  Hello.class  --(java/JVM)-->  실행
  소스 코드        컴파일       바이트코드      실행
```

이 과정에서 핵심은 **타입이 컴파일 시점에 다 정해진다**는 점입니다. 즉 Java는 기본적으로 정적인 영역에서 타입이 결정되는 언어입니다.

그런데 가끔은 **프로그램을 실행해봐야** 어떤 클래스를 써야 할지 알게 되는 경우가 있습니다. 예를 들어 설정 파일에 적힌 클래스 이름(문자열)으로 객체를 만들어야 할 때처럼요. 이러면 코드를 짤 때는 그게 무슨 클래스일지 모르니, 평소처럼 `new 타입()`이라고 미리 적어둘 수가 없습니다.

이럴 때 사용하는 개념이 바로 **Reflection**입니다. 객체나 클래스 이름만 있으면, 런타임에 그 클래스의 필드·메서드·생성자를 들여다보고, 심지어 호출까지 할 수 있게 해줍니다.

![Reflection 개념도 - 내 클래스를 런타임에 들여다보고 다루기](/img/reflection/reflection-concept-v2.png)

<br/>

## 코드로 보기

직관적인 이해를 위해 코드로 이해해보겠습니다. 간단한 클래스 하나를 두고 Reflection으로 분석해봅니다. 먼저 분석 대상입니다.

```java
class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String greet() {
        return name + "님 안녕하세요 (" + age + "살)";
    }

    private String secret() {
        return "내 비밀 이름은 " + name;
    }
}
```

이제 이 `Person`을, **타입을 직접 쓰지 않고** 문자열 이름과 Reflection만으로 다뤄보겠습니다.

```java
import java.lang.reflect.*;

public class ReflectDemo {
    public static void main(String[] args) throws Exception {
        // 1. 문자열 이름만으로 Class 객체 얻기
        Class<?> clazz = Class.forName("Person");
        System.out.println("클래스 이름: " + clazz.getName());

        // 2. 필드 목록 들여다보기
        System.out.println("--- 필드 목록 ---");
        for (Field f : clazz.getDeclaredFields()) {
            System.out.println(f.getType().getSimpleName() + " " + f.getName());
        }

        // 3. 런타임에 인스턴스 생성 + 메서드 호출
        Constructor<?> ctor = clazz.getDeclaredConstructor(String.class, int.class);
        Object person = ctor.newInstance("welchs", 30);
        Method greet = clazz.getDeclaredMethod("greet");
        System.out.println("--- greet() 호출 ---");
        System.out.println(greet.invoke(person));

        // 4. private 멤버에 강제로 접근
        Field nameField = clazz.getDeclaredField("name");
        nameField.setAccessible(true);   // private 접근 제한 풀기
        System.out.println("--- private 필드 강제 접근 ---");
        System.out.println("name = " + nameField.get(person));

        Method secret = clazz.getDeclaredMethod("secret");
        secret.setAccessible(true);
        System.out.println(secret.invoke(person));
    }
}
```

실제로 실행하면 이렇게 나옵니다.

```
클래스 이름: Person
--- 필드 목록 ---
String name
int age
--- greet() 호출 ---
welchs님 안녕하세요 (30살)
--- private 필드 강제 접근 ---
name = welchs
내 비밀 이름은 welchs
```

`Person`이라는 타입을 코드에 한 번도 직접 쓰지 않고, **문자열 `"Person"` 하나로** 객체를 만들고 메서드를 호출했습니다. 심지어 `private`으로 막아둔 `name` 필드와 `secret()` 메서드까지 `setAccessible(true)`로 접근해버렸습니다. 이게 Reflection의 힘입니다.

> 처음 `setAccessible(true)`로 private 필드가 그냥 열리는 걸 봤을 때, 신기하면서도 한편으론 "이래도 되나?" 싶었습니다.

<br/>

## Reflection은 어디에 쓰일까?

"이걸 실무에서 직접 쓸 일이 있나?" 싶을 수도 있는데, 저는 오히려 리플렉션을 좀 더 고도화해서 써보고 싶어졌습니다. 게다가 우리가 매일 쓰는 프레임워크 상당수가 이미 내부에서 Reflection을 쓰고 있습니다.

- **Spring의 DI**: 클래스 정보를 읽어 빈을 생성하고 의존성을 주입할 때
- **JSON 직렬화/역직렬화**(Jackson 등): 필드 이름을 읽어 JSON 키와 매핑할 때
- **ORM**(JPA/Hibernate): 엔티티의 필드를 읽어 컬럼과 매핑할 때
- **어노테이션 처리·테스트 프레임워크**(JUnit 등): `@Test` 붙은 메서드를 찾아 실행할 때

공통점은 모두 **"컴파일 시점엔 어떤 타입이 올지 모른 채, 런타임에 범용적으로 다뤄야 하는"** 상황이라는 점입니다. 그래서 프레임워크를 만드는 입장에선 Reflection이 거의 필수입니다.

<br/>

## 쓸 때 주의할 점

강력한 만큼 대가도 있습니다.

- **성능 비용**: 직접 호출보다 느립니다. 매 호출마다 메타데이터를 거치기 때문입니다.
- **캡슐화 위반**: `setAccessible(true)`로 private을 열 수 있다는 건, 반대로 **내부 구현에 마음대로 손댈 수 있다**는 뜻이라 위험할 수 있습니다.
- **컴파일 타임 안전성 상실**: 메서드·필드를 문자열로 찾기 때문에, 이름을 오타 내면 컴파일은 통과하고 **런타임에 가서야 터집니다**.

그래서 Reflection은 "애플리케이션 코드에서 남발하는 도구"라기보단, **프레임워크나 라이브러리가 범용성을 위해 쓰는 도구**에 가깝다고 생각합니다.

<br/>

## 그런데 "리플렉션은 느리다", 사실일까?

"리플렉션은 느리니 쓰지 마라"는 말, 한 번쯤 들어보셨을 겁니다. 그런데 직접 재보면 **평판만큼 극단적으로 느리진 않습니다.**

![리플렉션, 정말 느릴까 - 통념 vs 실제 (Java 8 기준)](/img/reflection/reflection-perf-v3.png)

간단한 메서드를 직접 호출 vs 리플렉션으로 호출해(워밍업 후) 재봤습니다. 제 환경(Java 8)에선 직접 호출이 호출당 약 0.65ns, 리플렉션이 약 1.92ns로 **3배쯤** 차이가 났습니다. 잘 알려진 JMH 벤치마크에서도 대략 2배 수준으로 나옵니다.

다만 솔직하게 짚을 게 있습니다. '몇 배'라는 숫자는 측정 방식에 따라 들쭉날쭉합니다. 직접 호출은 JIT가 인라인해서 거의 0에 수렴해버리기 때문에, 비율만 부풀어 보이기 쉽거든요. 중요한 건 **절대 비용이 고작 몇 나노초**라는 점입니다. 호출당 2ns 안팎이면 100만 번을 호출해도 수 밀리초고, 단순 성능만 놓고 보면 웬만한 애플리케이션에선 남발하지 않는 이상 크게 리스크가 있어 보이진 않습니다.

### 왜 생각보다 빠를까?

"리플렉션 = 무조건 네이티브 호출이라 느림"이라고 알기 쉽지만, JVM은 생각보다 잘 만들어져 있습니다.

- **inflation**: 같은 대상을 여러 번(기본 15회) 호출하면, JVM이 느린 네이티브 경로 대신 **더 빠른 바이트코드 accessor를 즉석에서 생성**해 갈아끼웁니다. 즉 자주 불리는 리플렉션은 생각보다 훨씬 빠릅니다.
- **JIT 워밍업**: 거기에 JIT 최적화까지 더해지면, 반복 호출 구간에선 직접 호출과의 격차가 더 줄어듭니다.
- `setAccessible(true)`로 접근 검사를 꺼두면 호출이 조금 더 빨라지기도 합니다.

정리하면 "리플렉션은 느리다"는 건 사실 **첫 호출이거나, 아주 빡빡하게 반복되는 일부 상황에 가까운 얘기**입니다. 대부분의 코드에선 상황에 맞게 합리적으로 쓰는 한 괜찮습니다. 다만 같은 호출이 초당 수천만 번씩 도는 정도로 성능이 빠듯한 구간이라면, 그땐 리플렉션으로 얻은 `Method`·`Field` 객체를 캐싱하거나 직접 호출로 바꾸는 걸 고려하면 됩니다.

<br/>

# 결론

Reflection은 한 줄로 말하면 **"런타임에 클래스를 들여다보고 다루는 기능"** 입니다. 정적 타입 언어인 Java에서 동적인 일을 할 수 있게 열어주는 통로인 셈입니다.

평소엔 직접 쓸 일이 많지 않지만, 우리가 쓰는 프레임워크들이 "어떻게 내 클래스를 알아서 생성하고 주입하지?" 싶었다면 그 답의 상당 부분이 바로 이 Reflection입니다. 원리를 알아두면 프레임워크의 동작이 한결 덜 마법처럼 느껴집니다.

<br/>

# 참고

> - [The Reflection API: Oracle Java Tutorials](https://docs.oracle.com/javase/tutorial/reflect/)
> - 직접 호출 vs 리플렉션 비용은 Java 8에서 직접 측정 (warm 기준 약 2 ns/호출)
