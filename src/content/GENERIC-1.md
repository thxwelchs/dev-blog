---
layout: post
category: "Java"
title: "제네릭 1편 와일드카드 (Generic Wildcard)"
author: thxwelchs
tags: ["java", "kotlin", "generic", "제네릭"]
image: img/WILDCARD-GENERIC-postbg.jpg
date: "2020-01-29T23:11:55.000Z"
draft: false
---

# Java 와일드카드 제네릭
먼저 Java의  Upper, Lower Bound Type WildCard Generic(<? extends T>, <? super T>) 을 이해해야 할 것 같아서 찾아봤습니다.

<?> 제네릭은 Unbound wildcard라고 불리며, 릭떤 타입이  될지 모른다 라는 의미입니다. wildcard가 사용된 제네릭은 타입으로 들어온 타입에 대하여 관심이 없다라는 의미도 되며 기능적인 메소드 외에 원소 값과 관련된 메소드에는 null 값만 허용됩니다. 코드로 예를 들어보자면

```java
List<?> wildcards = new ArrayList<>();

wildcards.size() // 문제없음 (원소와는 상관없는 기능적인 메소드)
wildcards.add(1) // 컴파일 에러 남
wildcards.add(null) // 문제없음 null은 어떤 타입의 원소든 가능
```
    

extends: 공변 제네릭이라고도 하며, 구체적인 방향성을 가진 타입을 명시 ( 자기자신과 서브 클래스만 허용)

super: 반공변 제네릭이라고도 하며, 추상적인 방향성을 가진 타입을 명시 ( 자기 자신과 슈퍼 클래스만 허용) 

결론부터 말하자면 <{1} extends {2}> <span style="color:orange;">**1은 2의 서브클래스이거나 자기자신이어야 한다. 라고 명시하는 것과 같습니다.**</span>

<{1} super {2}> <span style="color:orange;">**1은 2의 슈퍼클래스이거나 자기자신이어야 한다. 라고 명시하는 것과 같습니다.**</span>

자바에서는 클래스 상속은 하나만 할 수 있지만, 인터페이스는 여러개를 구현할 수 있으므로 인터페이스를 구현한 구현체도 서브클래스 이기 때문에 다음과 같이 표현이 가능하다고 합니다.

```java
class Zergling extends Unit implements GroundAttack, Burrow {
}

class Ultralisk extends Unit implements GroudAttack {
}


class D<T extends Unit & GroundAttack & Burrow> { //T에는 Zergling만 올 수 있습니다.

}
```


### 참고

> [https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics](https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics/)
[https://www.youtube.com/watch?v=ipT2XG1SHtQ](https://www.youtube.com/watch?v=PQ58n0hk7DI) 토비님 제네릭 강의
[https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics/](https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics/)