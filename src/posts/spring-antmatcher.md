---
layout: post
category: "엔지니어링"
title: "AntPathMatcher 제대로 보기 - 경로 패턴 매칭은 어디에 쓰이나"
author: thxwelchs
tags: ["Spring", "Spring Security", "URL 매칭", "AntPathMatcher"]
image: /img/covers/eng/spring-antmatcher.png
date: "2021-09-14T14:09:23.000Z"
draft: false
---

Spring Security 설정을 짜다 보면 `antMatchers("/admin/**")` 같은 줄을 거의 무의식적으로 씁니다. 저도 그랬는데요. 어느 순간 궁금해졌습니다. 이 `/**` 패턴은 어떤 원리로 구현되어 있고 어떻게 동작되는걸까요?

# AntPathMatcher가 뭔가

핵심부터 정리하면, `antMatchers`의 매칭은 `AntPathMatcher`라는 클래스가 담당합니다. 이름 그대로 **Ant** 빌드 툴에서 쓰던 경로 패턴 문법을 가져온 건데, 스프링에서는 "경로 문자열이 이 패턴에 맞는가"를 판단하는 범용 유틸로 자리 잡았습니다.

# 매칭 규칙

기호의 의미는 이렇습니다.

- `?` : 한 글자
- `*` : 한 경로 구간(segment) 안의 임의 문자열 (`/`는 못 넘음)
- `**` : 여러 구간에 걸친 임의 경로
- `{id}` : 경로 변수 (값을 뽑아 쓸 수 있음)
- `{var:[a-z]+}` : 정규식을 곁들인 경로 변수

그래서 `/admin/*` 는 `/admin/users`엔 맞지만 `/admin/users/1`엔 안 맞고, `/admin/**`는 그 아래 전부에 맞습니다. `com/t?st.jsp`는 `com/test.jsp`·`com/tast.jsp`엔 맞습니다. 직접 써본다면 이렇게 단순합니다.

```java
AntPathMatcher matcher = new AntPathMatcher();
matcher.match("/admin/**", "/admin/users/1");   // true
matcher.match("/admin/*",  "/admin/users/1");   // false
matcher.match("com/t?st.jsp", "com/test.jsp");  // true
```

# 시큐리티만 쓰는 게 아니다

여기가 이번에 새로 알게 된 부분입니다. AntPathMatcher는 스프링 여러 모듈에서 "경로를 패턴으로 다뤄야 하는" 거의 모든 곳에 들어가 있었습니다.

- **Spring MVC 요청 매핑**: `@RequestMapping("/users/**")` 같은 컨트롤러 매핑이 (전통적으로) 이 매처로 동작했습니다.
- **정적 리소스 핸들러**: `registry.addResourceHandler("/assets/**")` 처럼 어떤 경로를 정적 파일로 내줄지 정할 때.
- **인터셉터 경로**: `addPathPatterns("/api/**")` / `excludePathPatterns("/api/public/**")` 로 인터셉터를 걸고 뺄 때.
- **리소스 로딩**: `PathMatchingResourcePatternResolver`가 `classpath*:config/**/*.xml` 같은 패턴으로 클래스패스의 파일들을 한 번에 긁어올 때.
- **메시징/인터그레이션**: STOMP 목적지 매칭, Spring Integration 라우팅 등에서도 같은 패턴 문법을 씁니다.
- 그리고 **Spring Security**의 `antMatchers`.

같은 패턴이 리소스 핸들러에서도, 인터셉터에서도 똑같이 동작한다는 걸 알면 한 번 익힌 걸 여러 곳에 써먹을 수 있습니다.

# Spring Security의 antMatcher와 함정

이제 시큐리티 얘기입니다. 작성 시점(2021년) 기준 설정은 보통 이렇게 생겼습니다.

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .antMatchers("/admin/**").hasRole("ADMIN")
            .antMatchers("/login", "/css/**").permitAll()
            .anyRequest().authenticated();
    }
}
```

여기서 두 가지를 조심해야 했습니다.

먼저 **순서**. 규칙은 위에서부터 먼저 매칭되는 게 우선됩니다. 넓은 `/**`를 구체적 규칙보다 위에 두면 뒤 규칙이 통째로 무시됩니다.

그리고 더 까다로운 게 하나 있었는데요. `antMatchers`의 매칭 규칙과, 실제 컨트롤러를 찾는 MVC의 매칭 규칙이 **미묘하게 다릅니다.** 예를 들어 `antMatchers("/admin")`은 정확히 `/admin`에만 맞는데, MVC는 끝에 슬래시가 붙은 `/admin/`도 같은 컨트롤러로 받아줍니다(트레일링 슬래시 규칙이 허용되어 있다면요). 그럼 어떻게 될까요? 공격자가 `/admin/`로 요청하면 시큐리티 규칙엔 안 걸리고 컨트롤러는 정상 처리해버리는, 인증 우회가 생깁니다.

그래서 MVC를 쓰는 환경이라면, 시큐리티 매칭을 MVC와 같은 규칙으로 맞추는 `mvcMatchers`가 더 안전한 선택입니다. 매칭 기준을 통일하여 관리하는 방법을 택하는 거죠. 결국 보안 규칙을 짤 땐 "이 패턴이 무엇에 맞는가"만큼이나 "컨트롤러와 똑같이 맞는가"를 같이 봐야 한다는 걸, 직접 파보고서야 이해했습니다.

# 5.3에 들어온 PathPattern

작성 시점 기준으로 한 가지 흐름만 덧붙이면, Spring 5.3부터는 경로 매칭 엔진으로 기존 `AntPathMatcher` 외에 `PathPatternParser`(`PathPattern`)가 들어왔습니다. 더 빠르고 파싱을 미리 해두는 방식이라, 앞으로는 해당 경로 패턴 구현체들을 사용 사례에 맞게 활용해볼 수 있지 않을까 싶습니다.

# 정리

정리하면 AntPathMatcher는 시큐리티 전용이 아니라 **스프링 전반의 경로 패턴 매칭 도구**였고, 리소스 핸들러·인터셉터·리소스 로딩·메시징·시큐리티가 다 같은 문법을 공유하고 있었습니다. 시큐리티에서만큼은 그 매칭 규칙이 실제 컨트롤러 매핑과 어긋날 수 있어서, MVC 환경이면 `mvcMatchers`로 기준을 맞추는 게 안전함. 한 번 익힌 패턴 문법을 여러 곳에 써먹을 수 있다는 게, 이 글을 정리하며 얻은 가장 실용적인 수확이었음.

# 참고

> [Spring Framework: AntPathMatcher (Javadoc)](https://docs.spring.io/spring-framework/docs/5.3.x/javadoc-api/org/springframework/util/AntPathMatcher.html)
> [Spring Security Reference: Authorize HttpServletRequests](https://docs.spring.io/spring-security/site/docs/5.5.x/reference/html5/#servlet-authorization)
