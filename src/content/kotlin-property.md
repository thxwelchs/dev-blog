---
layout: post
category: "kotlin"
title: "코틀린 필드와 속성"
author: thxwelchs
tags: ["kotlin", "property", "field"]
image: img/JPA-locking-postbg.jpg
date: "2020-01-20T22:11:55.000Z"
draft: false
---
안녕하세요 이번에 소개할 내용은 코틀린에서의 **필드(field)**와 **속성(property)** 입니다.

얼핏 보면 비슷해보이지만 전혀 다른 개념인데요. 저도 너무 헷갈리고 대체 어떻게 이해해야 좋을까 고민하다가 이 글을 작성하게 되었습니다. 

그럼 대체 필드와 속성이 어떤 개념인지 차근차근 살펴보겠습니다.

먼저 **속성**과 **프로퍼티**를 이해하기 위해서는 이 둘이 의미하는 바를 이해해야 하는데

먼저 속성(`property`)은 노출되어있는 필드를 의미하고,

필드는 클래스에 비공개로 유지되며 `gettter` 혹은 `setter`를 통해 접근할 수 있어야 하는 것을 의미합니다. 

그런데 코틀린에서의 클래스는 무조건 `property`(속성)만 가질 수 있고 이 속성이란 것은 filed + 접근자를 의미합니다.

코틀린이 속성만 가질 수 밖에 없는 이유는  코틀린에 클래스에서 지역 변수를 선언하면 `get` 과 `set` 함수도 함께 정의되기 때문입니다.  ( 물론 backing field를 통해서 임의로 정의할 수도 있습니다. )

다음과 같이 코틀린에서는 속성 선언을 할 때 var(mutable) 혹은 val(immutable)로 선언할 수 있습니다.

    class Person(var name: String, var age: Int)

위 코틀린 코드가 자바 코드로 디컴파일 되면 다음과 같습니다.

    public class Person {
    	private String name;
    	private Integer age;
    
    	public void setName(String value) {
            this.name = value;
        }
    
      public String getName() {
          return this.name;
      }
    
    	public void setAge(Integer value) {
            this.age= value;
      }
    
      public String getAge() {
          return this.age;
      }
    }

이 글이 이해에 도움이 되실 것 같습니다.
[https://wooooooak.github.io/kotlin/2019/05/24/property/](https://wooooooak.github.io/kotlin/2019/05/24/property/)