---
layout: post
category: "Spring"
title: "Embedded Tomcat과 Tomcat의 차이"
author: thxwelchs
tags: ["springboot", "tomcat"]
image: img/EmbeddedTomcat과Tomcat의차이/postbg.png
date: "2021-08-28T08:42:30Z"
draft: false
---

이번 포스팅에서는 내장톰캣과 설치형으로 사용하는 외장톰캣이 무엇이 다른지, 그리고 내장톰캣으로는 해결 할 수 없는것이 있는지
간단하게 알아보았습니다.
포스팅 내용을 작성하기 전 이 내용을 조사해본 것은 전 직장 동료분과 오랜만에 만나 개발 담소를 나누다 내장톰캣, 외장톰캣과 관련된 이야기가 오갔고, 좀 더 확실하게 알아보기로 했습니다.

거의 대부분의 Spring 개발자라면 알고 있을 사실이지만, Spring Boot에는 `tomcat`이 내장되어 있어, 애플리케이션을 빌드하고 실행하는 것만으로 웹애플리케이션을 서비스 할 수 있습니다.

즉 스프링부트는 실행될 환경에 톰캣을 설치할 필요없이 애플리케이션을 바로 실행 할 수 있다는 것을 의미합니다. 
그렇다면 과거 스프링 레거시에서는 어떻게 웹 애플리케이션을 실행 할 수 있었을까요? 


먼저 내장톰캣이 없던 시절의 스프링은 서블릿 컨테이너가 없기 때문에, 실제로 자바로 작성된 코드와 상호작용할 다리역할의 시스템이 필요했습니다. 그렇기 때문에 서블릿 컨테이너가 필요했고 우리는 일반적으로 그 중 대표격인 톰캣을 선택하여 설치하고, 자바로 작성되어있는 자바 웹애플리케이션을 톰캣에 포함시켜주어야 했습니다. 

# 애플리케이션 실행방법 차이
간단하게 다시 정리해보자면 다음과 같습니다.

**내장톰캣을 사용하는 스프링부트 애플리케이션 실행**

- build된 스프링부트 애플리케이션 jar, war 를 java 명령어로 실행한다.

**외장톰캣을 사용하는 스프링 애플리케이션 실행**

- tomcat을 설치한다.
- tomcat 설정 파일을 구성한다.
- tomcat webapp 디렉토리에 build된 스프링 애플리케이션 war 파일을 포함시켜준다.
- tomcat을 실행해준다.

한눈에 봐도 어떤것이 더 복잡한지는 알 수 있습니다. 물론 무조건 내장톰캣이 좋다 나쁘다를 따지려는 것은 아닙니다만. 적어도 실행 절차만 본다면 내장톰캣을 사용하는것이 훨씬 간단하다는것을 알 수 있습니다.

저는 이러한 이유로 환경이 허락된다면 내장톰캣을 사용하여 애플리케이션을 실행하는 방법을 선호했고, 

심지어 내장톰캣이든 외장톰캣이든 큰 차이가 없다라고 생각하고 있었습니다. 

그래서 가끔 내장톰캣에 대한 부정적인 인식( "내장톰캣은 외장톰캣보다 성능이 좋지 않을거야" 등 ..) 을 가지고 내장톰캣을 사용 할 수 있음에도 외장톰캣을 설치해서 배포하는 것을 볼때면 의문이 들 때가 많았습니다 

실제로 스프링에서는 외장톰캣 구성요소를  보통 `server.xml` 을 작성하여 구성 할 수 있고

스프링부트에서 또한 내장톰캣의 구성요소를  application.properties(yml)에서 구성 할 수 있기 때문이었는데요

애초에 스프링부트가 스프링에서의 많은 xml 기반 설정들이 너무 불편하고 알아야 할 요소가 많았기에 이런 구성 요소들을 대신 해주기 위해 탄생한 것이기에 위와 같은 생각을 했습니다.

https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.server application.properties에서 톰캣 구성 설정을 담당하는 부분



</br>
</br>

# 외장톰캣 vs 내장톰캣 다른점
그렇다면 정...말!? 전혀 다른게 없을까요?

결론만 말씀드리자면 `NO` 입니다.

물론 많은 부분이 다르지는 않지만, 대표적으로 내장톰캣으로는 할 수 없지만 먼저 외장톰은 가능한 기능이 하나 있는데요 바로 tomcat의 virtual host라는 기능입니다.

## virtual host
virtual host라는 기능은 이런겁니다.

![Untitled](img/EmbeddedTomcat과Tomcat의차이/Untitled.png)

위 그림처럼 도메인 host에 따라 각각의 다른 루트 컨텍스트를 갖게하여 하나의 웹애플리케이션 배포만으로 마치 여러 애플리케이션을 운영하는 것처럼 할 수 있는 것입니다.

이 기능을 사용하기 위해서는 위에서 잠깐 언급한 스프링 외장톰캣 구성요소 파일인 `server.xml` 을 손보면 됩니다.

```xml
<!--...-->
<Host name="a.thxwelchs.com"  appBase="/webapps/weba" unpackWARs="true" autoDeploy="true" xmlValidation="false" xmlNamespaceAware="false">
</Host>

<Host name="b.thxwelchs.com"  appBase="/webapps/webb" unpackWARs="true" autoDeploy="true" xmlValidation="false" xmlNamespaceAware="false">
</Host>
<!--...-->
```

위 처럼 구성하게 되면 [a.thxwelchs.com](http://a.thxwelchs.com) 으로 접속시 weba 루트컨텍스트를 기준으로 작성된 뷰 메인페이지가 보일 것이고 [b.thxwelchs.com](http://b.thxwelchs.com) 으로 접속시 webb 루트컨텍스트를 기준으로 작성된 뷰 메인페이지가 보이게 될 것입니다.

이처럼 multiple host 웹애플리케이션을 단일애플리케이션으로 구성하는 이유는 관리포인트를 줄이기 위함입니다. (하나의 애플리케이션에서, 여러 사이트의 역할의 코드를 모아서 작성하고 관리 할 수 있거나 버전관리 측면을 보자면?)


## Embedded Tomcat Mutlple context
이 기능은 확실하지 않지만 내장톰캣으로 구성하기에는 상당히 까다로운 것 같은데요, 가능은 한 것 같습니다.

예를 들면 다음과 같이 서블릿컨테이너팩토리 빈을 다시 재구성하여 multiple context를 등록하는 방법도 있습니다 (직접 해보지는 않았습니다.)

```java
@Bean
public ServletWebServerFactory servletContainer() {
    return new TomcatServletWebServerFactory() {
        protected TomcatWebServer getTomcatWebServer(Tomcat tomcat) {
            System.out.println( "tomcat.getServer().getCatalinaBase() =" + tomcat.getServer().getCatalinaBase() + "=" );
            new File(tomcat.getServer().getCatalinaBase(), "/webapps").mkdirs();
            try {
                Context context2 = tomcat.addWebapp("/weba", new ClassPathResource("/home/thxwelchs/playground/weba.war").getFile().toString());
                Context context3 = tomcat.addWebapp("/webb", new ClassPathResource("/home/thxwelchs/playground/webb.war").getFile().toString());
                context2.setParentClassLoader(getClass().getClassLoader());
                context3.setParentClassLoader(getClass().getClassLoader());
            } catch (IOException ex) {
                ex.printStackTrace();
            }
            return super.getTomcatWebServer(tomcat);
        }
    };
}
```

</br>
</br>

## 웹서버를 활용한 reverse proxy
하지만.. 잘 생각해보면 굳이 이럴 필요가 있을까요? virtualHost라는 기능은 일종의 웹서버 기능으로써 WAS의 책임에는 조금 벗어나는 범위입니다. 물론 WAS가 웹서버의 기능을 할 수 도 있지만, 일반적으로 WAS는 서블릿 컨테이너의 역할로써 소스코드의 파일을 해석하고 데이터를 로드하여 동적인 자료를 기반으로 정적인 자료로 전달해주는 것이 목적입니다.

그렇다면 실제 웹서버를 사용하고 WAS는 서블릿컨테이너의 역할만 하게끔 구성하는건 어떨까요?

그러기 위해서는 먼저 우리는 내장톰캣이 구현된 애플리케이션 하나를 서비스 하나의 단위로 생각하는 것이 좋습니다. 

하나의 서버에 여러 애플리케이션을 운영하는 것보다는 하나의 애플리케이션이 VM 혹은 Linux Container(Docker)로 하나의 서비스로 구성하고 여러 서비스를 운영하는 것이 효율적이기 때문입니다.

그렇다면 우리는 이렇게 구성해볼 수 있습니다. 

![제목 없는 프레젠테이션.png](img/EmbeddedTomcat과Tomcat의차이/제목_없는_프레젠테이션.png)


이렇게 구성하는 것을 reverse proxy라고 부릅니다.

이렇게하면 웹서버의 역할과 WAS의 역할을 정확히 구분시킬 수 있습니다.

여기서 아까 외장톰캣을 쓰는 스프링 애플리케이션처럼 하나의 스프링 애플리케이션에서 여러 애플리케이션의 코드를 작성하고 관리하고 싶다면? 물론 가능합니다. 스프링부트 애플리케이션에서 여러 애플리케이션 코드를 작성하고 스프링부트 애플리케이션을 실행 할 때 컨텍스트 구성 설정 값을 argument로 넘겨주게끔 구성하면 됩니다.
(예를 들어 view  resource root path, server port, context path와 같은)

</br>
</br>

# 마지막 정리
조금 두서 없이 포스팅이 길어졌지만 마지막으로 간략하게 정리해보자면 다음과 같습니다.

내장톰캣
- 내장톰캣으로 실행하는 스프링부트 애플리케이션은 그 자체가 하나의 프로그램으로 서블릿컨테이너가 하나의 포트를 독자적으로 점유함 그렇기 때문에 여러 호스트를 분기 할 수 있는 기능을 사용하기 매우 복잡함
- jar든 war든 톰캣이 내장된 애플리케이션은 톰캣 구성에 대한 부분의 관심사를 분리하여 개발자에게 애플리케이션단의 코드 작성에 더 집중할 수 있게해줌(필요에 의하면 server.xml에서 작성했던 구성요소를 application.properties 에서 바인딩되어 내장톰캣에 설정됌)

외장톰캣
- 외장톰캣은 Apache HTTPd 에서 사용하는 Virtual Host라는 main host 하위에 가상의 호스트를 소프트웨어적으로 둘 수 있는 기능을 제공하는데, 외장 Tomcat에서도 Host설정으로 이 apache virtual host를 설정할 수 있음 ( 즉 여러 애플리케이션을 하나의 포트로 서비스 할 수 있음 )

</br>
</br>
각각의 조직이 가지고 있는 애플리케이션 실행환경에 따라 맞는 애플리케이션 구성을 고민해보면 좋다.

하지만 현재의 모던 환경에서는 일반적으로 여러 애플리케이션을 하나의 포트로 서비스 하지않고, 웹서버를 앞단에 두는 리버스프록시 구성환경이 많이 사용되고 있음


</br>
</br>
</br>

# 참고
> [https://stackoverflow.com/questions/54308472/multi-context-spring-boot-application-how-to-define-standard-spring-boot-proper](https://stackoverflow.com/questions/54308472/multi-context-spring-boot-application-how-to-define-standard-spring-boot-proper)
[https://stackoverflow.com/questions/31374726/spring-boot-how-to-add-another-war-files-to-the-embedded-tomcat](https://stackoverflow.com/questions/31374726/spring-boot-how-to-add-another-war-files-to-the-embedded-tomcat)
[https://www.ramkitech.com/2012/02/understanding-virtual-host-concept-in.html](https://www.ramkitech.com/2012/02/understanding-virtual-host-concept-in.html)
