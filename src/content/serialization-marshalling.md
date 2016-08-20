---
layout: post
category: "엔지니어링"
title: "직렬화(Serialization)!?"
author: thxwelchs
tags: ["직렬화", "스트림", "마샬링"]
image: /img/covers/eng/serialization-marshalling.png
date: "2016-08-20T15:11:55.000Z"
draft: false
---

# 직렬화란?

직렬화라는 개념을 처음 접하고 이해해보려 했을 때, 머릿속에서 명확하게 정리가 되지 않았습니다. 그래서 이참에 한번 제대로 짚어봤습니다.

공식적인 정의를 제 식대로 다시 정리해보면, 직렬화(serialization)는 **객체(나 자료구조)의 상태를, 저장하거나 전송할 수 있는 형태로 바꿔서 나중에 다시 복원할 수 있게 만드는 것**입니다. 여기서 "형태"가 꼭 바이트일 필요는 없습니다. JSON이나 XML 같은 텍스트도 엄연히 직렬화의 결과입니다(파이썬에선 같은 일을 '피클링(pickling)'이라 부릅니다). 반대로 그 형태를 다시 객체로 되돌리는 건 **역직렬화(deserialization)** 라고 합니다. 객체를 한 줄로 쭉 펴서 내보내고, 받는 쪽에서 다시 조립하는 그림이라고 보면 될 것 같습니다.

> 여담으로, '직렬(直列)'이라는 번역이 꽤 잘 맞습니다. serial·series의 뿌리가 라틴어 *series*(잇닿음)와 *serere*(잇다·엮다)인데, 객체를 한 줄로 죽 이어 펴낸다는 그림과 의미가 일맥상통합니다. 한자로도 '곧을 직(直) + 줄 열(列)', 곧 줄지어 늘어놓는다는 뜻이라, 전기회로에서 부품을 한 줄로 잇는 '직렬 연결'의 그 직렬과도 같은 말입니다. 단어 자체는 1856년 '연재(serial publication)'라는 뜻으로 먼저 생겼고, 컴퓨팅에서의 의미는 누가 딱 정해 만들었다기보다 이 '차례로 늘어놓다'에서 자연스럽게 번진 쪽에 가까운 것 같습니다.

<br/>

## 직렬화는 왜 필요해졌을까?

정의만 보면 "객체를 바이트로 바꾼다"가 전부인데, 저는 이게 왜 필요한지부터 짚고 나니 좀 더 와닿았습니다.

생각해보면, 결국 컴퓨터가 다루는 데이터는 전부 바이트입니다. (더 저수준으로 내려가면 결국 0과 1, 바이너리겠죠?) 그런데 우리가 코드에서 쓰는 **"객체"라는 건 그 데이터를 객체지향적으로 다루기 위한 개념적인 표현**에 가깝습니다. 그래서 자바는 객체를 자기 방식대로 메모리에 배치해서 관리합니다. 실제로 자바 객체는 우리가 선언한 필드만 달랑 있는 게 아니라, 객체를 식별하고 관리하기 위한 헤더(클래스 정보·락·GC 정보 등) 같은 것까지 붙어서, JVM이 정한 구조로 힙 위에 올라갑니다.

문제는 이 구조가 **"자바, 그것도 그 JVM, 그 순간"에만 통하는 표현**이라는 점입니다. 알아보니 객체의 메모리 레이아웃은 자바 표준으로 못박힌 게 아니라 JVM 구현체 재량이라, 32비트냐 64비트냐 같은 환경에 따라서도 달라진다고 합니다. 게다가 객체끼리 참조(주소)로 얽혀 있는데, 그 주소 값도 그 프로그램 그 순간에만 의미가 있습니다.

![자바 객체의 메모리 구조와, 환경마다 달라 그대로는 전송할 수 없다는 점](/img/serialization/object-layout-v3.png)

그러니 이 객체를 파일에 저장하거나 네트워크 너머 다른 시스템으로 보내려고 메모리 모양 그대로 내보내면, 받는 쪽에선 해석할 수가 없습니다. 결국 객체를 **어디서든 똑같이 해석되는 바이트 형태로 번역**해줄 약속이 필요한데, 그게 바로 직렬화인 셈인 것입니다.

<br/>

## 직렬화의 원리를 살펴보자

직렬화를 이해하려고 저는 프로그램에 두 개의 세상이 있다고 생각해봤는데, 그렇게 보니 조금 편했습니다. 하나는 객체들이 참조로 얽혀 떠 있는 **객체의 세상**(메모리), 다른 하나는 데이터가 바이트로만 존재하는 **바이트의 세상**(파일·네트워크)입니다.

![객체의 세상과 바이트의 세상, 그 사이를 잇는 직렬화와 역직렬화](/img/serialization/two-worlds-v10.png)

직렬화는 이 두 세상 사이의 다리라고 볼 수 있습니다. **객체 → 바이트**로 건너가는 다리가 직렬화, **바이트 → 객체**로 돌아오는 다리가 역직렬화인 거죠.

직렬화가 실제로 하는 일을 한 문장으로 줄여보면, **객체와 그 객체가 참조로 끌고 있는 다른 객체들까지 쭉 따라가며, 각자의 필드 값을 정해진 순서대로 바이트에 풀어 적는 것** 정도가 될 것 같습니다. 그래서 어떤 객체를 직렬화하면 그 안에 들고 있던 객체들도 줄줄이 같이 직렬화됩니다(그 객체들도 `Serializable`이어야 합니다). 역직렬화는 그 바이트를 거꾸로 읽어, 객체를 다시 만들고 참조 관계를 복원해 객체의 세상으로 되돌리는 과정입니다.

<br/>

## 잠깐, 마샬링이랑 뭐가 다른가요?

직렬화를 찾다 보면 **마샬링(marshalling)** 이라는 단어도 같이 나옵니다. 마샬링은 객체를 저장·전송에 적합한 형태로 바꾸는 더 넓은 개념으로, 경우에 따라 타입 정보 같은 부가적인 것까지 함께 다룹니다. 직렬화는 그 중 "바이트로 바꾸는" 한 가지 수단이라고 보면 깔끔합니다. (마샬링이라는 큰 개념 안에 직렬화가 들어갑니다.)

<br/>

## 자바는 어떻게 직렬화할까?

앞의 정의가 포맷을 가리지 않는 일반 개념이라면, **자바 표준 직렬화는 그중에서도 객체를 바이트 스트림(byte stream)으로 인코딩하는 방식**입니다. 이때 필드 값만이 아니라 클래스·타입 정보까지 함께 실립니다(그래서 받는 쪽이 같은 클래스로 복원할 수 있습니다).

방법은 의외로 간단합니다. 클래스에 `java.io.Serializable`만 구현하면 됩니다. 메서드를 만들 필요도 없이 "이 객체는 직렬화해도 된다"는 표시만 하는 마커 인터페이스입니다. 그다음 `ObjectOutputStream`으로 내보내고 `ObjectInputStream`으로 다시 읽습니다.

```java
import java.io.*;

class User implements Serializable {
    private static final long serialVersionUID = 1L;
    String name;
    transient String password;   // 직렬화에서 제외
    User(String name, String password) {
        this.name = name;
        this.password = password;
        System.out.println("생성자 실행");
    }
}

public class Demo {
    public static void main(String[] args) throws Exception {
        User u = new User("thxwelchs", "1234");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        new ObjectOutputStream(bos).writeObject(u);                 // 직렬화
        System.out.println("--- 역직렬화 ---");
        User restored = (User) new ObjectInputStream(
                new ByteArrayInputStream(bos.toByteArray())).readObject();   // 역직렬화
        System.out.println("name = " + restored.name);
        System.out.println("password = " + restored.password);
    }
}
```

실제로 돌려보면 이렇게 나옵니다.

```
생성자 실행
--- 역직렬화 ---
name = thxwelchs
password = null
```

여기서 벌써 이상한 게 두 개 보입니다. `password`가 `null`로 돌아왔고, "생성자 실행"이 딱 한 번만 찍혔습니다. 바로 이 두 가지가 직렬화의 진짜 핵심으로 이어집니다.

<br/>

# 직렬화 주의해야 할 점들

앞 예제에서 봤던 두 가지, `password = null`과 "생성자 실행"이 한 번만 찍힌 것부터가 사실 직렬화의 핵심입니다.

**① 역직렬화는 생성자를 거치지 않는다.** 객체가 생성자 대신 바이트로부터 필드가 직접 채워져 되살아납니다. 그래서 생성자의 유효성 검사가 통째로 건너뛰어지고, 정상적으로는 못 만들 객체가 만들어질 수 있습니다.

**② `transient`를 붙인 필드는 직렬화에서 빠진다.** 위 코드에서 `password` 앞에 슬쩍 붙은 `transient`가 그 키워드입니다. 처음 보면 "이게 뭐지?" 싶은데, *"이 필드는 직렬화하지 마라"* 는 자바 예약어입니다.

- 직렬화 때 **통째로 제외** → 역직렬화 후엔 기본값으로 복원됩니다. 참조형(객체)은 `null`, 원시형(primitive)은 `0`·`false` 같은 값이 됩니다. `password`가 `null`로 온 이유입니다.
- 보통 비밀번호 같은 **민감정보**, 또는 저장할 필요 없거나 직렬화가 안 되는 필드에 붙입니다.
- 반대로 안 붙이면 그 값이 그대로 바이트에 실려 나가니 주의해야 합니다.

**③ `serialVersionUID`는 직접 적어두는 게 안전하다.** 이건 궁금해서 직접 한번 재현해봤습니다. UID를 명시하지 않으면 클래스 구조로 자동 계산되는데, 필드 하나만 추가해도 값이 바뀝니다. 옛 버전으로 저장한 데이터를 새 버전으로 읽으면 다음과 같이 예외가 발생합니다.

```
InvalidClassException: local class incompatible:
  stream serialVersionUID = 1083403443499066393,
  local  serialVersionUID = -2371363878291482250
```

예를 들어 톰캣 같은 WAS는 재시작할 때 메모리에 있던 세션을 디스크에 직렬화해 저장했다가 다시 읽어 들이고, 세션 클러스터링을 쓰면 노드끼리 세션 객체를 직렬화해 주고받습니다. 이런 구조에서 세션에 담기는 클래스에 필드 하나 추가해 배포하는 순간, 예전에 직렬화돼 있던 세션이 전부 이렇게 깨질 수 있습니다.

**④ 보안: 신뢰할 수 없는 데이터는 역직렬화하지 마라.** ①의 "생성자를 안 거친다"는 성질이 공격자에겐 무기가 됩니다. 외부 바이트를 그대로 역직렬화하면 임의 코드 실행까지 이어질 수 있어서, 새 시스템이라면 자바 기본 직렬화 대신 JSON 같은 형식이 무난합니다.

이 밖에도 찾아보니 알아두면 좋을 것들이 몇 가지 더 있었는데, 개발할 때 참고하면 좋을 것 같습니다.

- **싱글톤**도 역직렬화하면 새 인스턴스가 생겨 깨집니다 (→ `readResolve()`로 막을 수 있습니다).
- **부모 클래스가 `Serializable`이 아니면** 부모 필드는 복원되지 않고, 부모의 기본 생성자 값으로 채워집니다.

# 직렬화 성질을 역이용한 활용

직렬화의 "통째로 새 객체를 만든다"는 성질을 역이용하면 여러 가지로 활용할 수 있는데, 그중 하나가 객체 **깊은 복사(deep copy)** 입니다. 객체를 직렬화했다가 곧바로 다시 역직렬화하면, 내부에 든 객체들까지 전부 복제된: 원본과 완전히 분리된 사본이 나옵니다.

예를 들어 `Outer`가 내부에 `Inner` 객체를 들고 있을 때, 직렬화·역직렬화로 복사한 뒤 사본의 `Inner`만 바꿔봤습니다.

```java
class Inner implements Serializable { String value = "old"; }
class Outer implements Serializable { Inner inner = new Inner(); }

Outer original = new Outer();

// 직렬화했다가 곧바로 역직렬화 = 깊은 복사
ByteArrayOutputStream bos = new ByteArrayOutputStream();
new ObjectOutputStream(bos).writeObject(original);
Outer copy = (Outer) new ObjectInputStream(
        new ByteArrayInputStream(bos.toByteArray())).readObject();

copy.inner.value = "new";   // 사본의 '내부 객체'만 바꾼다
System.out.println("원본 = " + original.inner.value);
System.out.println("사본 = " + copy.inner.value);
```

실제로 돌려보면 이렇게 나옵니다.

```bash
원본 = old
사본 = new
```

사본의 내부 객체를 바꿔도 원본은 그대로입니다. 내부 객체까지 새로 복제됐다는 뜻이라, 참조가 얽히는 얕은 복사와는 다릅니다.

<br/>

# 정리

직렬화는 객체를 저장·전송할 수 있는 형태로 펴내는 변환이고(자바 표준에선 그 형태가 바이트 스트림입니다), 크게 보면 마샬링의 한 가지 수단입니다. 개념 자체는 단순한데, 막상 정리해보니 "생성자를 안 거친다"는 점과 거기서 오는 보안 문제, `serialVersionUID` 같은 부분은 생각보다 신경 쓸 게 많았습니다.

이번에 정리하면서, 다음엔 스프링에서 JSON 직렬화에 쓰는 Jackson에 대해서도 관심이 생겼습니다. 같은 직렬화·역직렬화라도 Jackson은 내부적으로 어떤 방식으로 구현하는지 디테일하게 살펴보고 싶어졌습니다. (언젠가는..!?)

<br/>

# 참고

> - [Serialization: Wikipedia](https://en.wikipedia.org/wiki/Serialization)
> - [Serializable (Java Platform SE 8). Oracle](https://docs.oracle.com/javase/8/docs/api/java/io/Serializable.html)
> - [Java Object Serialization Specification (Java SE 8). Oracle](https://docs.oracle.com/javase/8/docs/platform/serialization/spec/serialTOC.html)
> - [serialization: Online Etymology Dictionary](https://www.etymonline.com/word/serialization)
