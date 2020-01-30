---
layout: post
category: "Java"
title: "제네릭 1편 와일드카드 (Generic Wildcard)"
author: thxwelchs
tags: ["java", "kotlin", "generic", "제네릭"]
image: img/WILDCARD-GENERIC-postbg.jpg
date: "2020-01-30T23:11:55.000Z"
draft: false
---

# Java 와일드카드 제네릭

`<?>` 제네릭은 Unbound wildcard라고 불리며, 어떤 타입이 될지 모른다 라는 의미입니다. wildcard가 사용된 제네릭은 타입으로 들어온 타입에 대하여 관심이 없다 라는 의미도 되며 기능적인 메소드 외에 원소 값과 관련된 메소드에는 null 값만 허용됩니다.

코드로 예를 들어보자면 다음과 같습니다.

```java
List<?> wildcards = new ArrayList<>();

wildcards.size() // 문제없음 (원소와는 상관없는 기능적인 메소드)
wildcards.add(1) // 컴파일 에러 남
wildcards.add(null) // 문제없음 null은 어떤 타입의 원소든 가능
```
    
## Upper, Lower Bound Generic
- `extends`: 공변 제네릭이라고도 하며, 구체적인 방향성을 가진 타입을 명시 ( `자기자신과 서브 클래스만 허용`) **`read`**만 가능, <{1} extends {2}> **1은 2의 서브클래스 이거나 자기 자신이어야 한다. 라고 명시하는 것과 같습니다.**
- `super`: 반공변 제네릭이라고도 하며, 추상적인 방향성을 가진 타입을 명시 ( `자기 자신과 슈퍼 클래스만 허용`) **`write`**만 가능, <{1} super {2}> **1은 2의 슈퍼클래스 이거나 자기 자신이어야 한다. 라고 명시하는 것과 같습니다.**

또한 자바에서는 클래스 상속은 하나만 할 수 있지만, 인터페이스는 여러개를 구현할 수 있으므로 인터페이스를 구현한 구현체도 서브클래스 이기 때문에 

다음과 같이 표현이 가능하다고 합니다.

```java
class Zergling extends Unit implements GroundAttack, Burrow {
}

class Ultralisk extends Unit implements GroudAttack {
}


class D<T extends Unit & GroundAttack & Burrow> { //T에는 Zergling만 올 수 있습니다.

}
```



Upper, Lower Bound wildcard 예시 코드
```java
import java.util.ArrayList;
import java.util.List;

public class GenericsTester {

    public static void addCat(List<? super Cat> catList) {
        System.out.println("Cat Added");
    }

    public static void main(String[] args) {
        List<Animal> animalList= new ArrayList<Animal>();
        List<Cat> catList= new ArrayList<Cat>();
        List<RedCat> redCatList= new ArrayList<RedCat>();
        List<Dog> dogList= new ArrayList<Dog>();

            // Animal은 Cat의 슈퍼 클래스 이므로 추가가 가능하다.
        addCat(animalList);

        // Cat은 자기자신이므로 추가가 가능하다. 
        addCat(catList);

        // RedCat과 Dog는 Cat의 상위클래스가 아니므로 타입 미스매치 컴파일 에러 남
        addCat(redCatList);
        addCat.addMethod(dogList); 
    }
}
class Animal {}

class Cat extends Animal {}

class RedCat extends Cat {}

class Dog extends Animal {}
``` 
\
이처럼 특정 클래스 나 메소드 안에서 특정 타입 혹은 T와 같은 제네릭 타입을 이용해서 어떤 작업을 수행하는 것이 아니라면 와일드카드를 이용하면

내부 구현이 노출되지 않을 수 있고, 내부 메소드 의 의도를 조금 더 올바르게 드러낼 수 있습니다.

<br/>

## capture

와일드카드로 정의한 `<?>` 제네릭은 이 타입이 뭔지 모른다라고 정의를 한건데, 필요에 따라서  타입이 뭔지를 추론을 해야하는 상황일 때 capture라고 한다.


<br/>

# Kotlin 에서의 와일드카드

- `in T` : Java의 `? super T`와 같음. `input`의 약자이며 `write` 만 가능
- `out T` : Java의 `? extends T`와 같음. `output`의 약자이며 `read` 만 가능

kotlin에서는 out T 서브타입 한정에서 null로 값을 대입하는 것이 불가능함

위 자바에서 예시를 들었던 코드를 코틀린 으로 작성했습니다.

    
```kotlin 
class WildcardGenerics {
    fun addCat(catList: ArrayList<in Cat>) {
        println("Cat Added")
    }


    fun main(args: Array<String>) {
        val animals = arrayListOf<Animal>()
        val cats = arrayListOf<Cat>()
        val redCats = arrayListOf<RedCat>()
        val dogs = arrayListOf<Dog>()
        
        addCat(animals)
        
        addCat(cats)
        
        // 컴파일 에러
        addCat(redCats)
        addCat(dogs)
    }
}

open class Animal {}

open class Cat: Animal()

class RedCat: Cat()

class Dog: Animal()
```

\
<u><span style="color:#e96900;">
혹시나 잘못된 점이 있거나 정보가 틀렸다면 반드시 코멘트 혹은 <a href="mailto:thxwelchs@gmail.com">이메일</a>로 알려주시면 감사하겠습니다!
</span></u>


### 참고

> [https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics](https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics/)
[https://www.youtube.com/watch?v=ipT2XG1SHtQ](https://www.youtube.com/watch?v=PQ58n0hk7DI) 토비님 제네릭 강의
[https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics/](https://thdev.tech/kotlin/androiddev/2017/10/03/Kotlin-Generics/)