---
layout: post
category: "엔지니어링"
title: "JobScope 밖에서 JobParameters가 동작하지 않은 이유"
author: thxwelchs
tags: ["트러블슈팅", "Spring Batch", "JobScope", "SpEL", "ThreadLocal"]
image: /img/covers/eng/troubleshooting-jobscope-jobparameters-v2.png
date: "2024-08-08T14:07:27.000Z"
draft: false
---

Spring Batch에서 `jobParameters`를 분명 맞게 썼는데도 특정 경로에서만 값이 안 들어와 한참 멍청멍청 삽질하게 된 후기입니다. 결론부터 말하면 ThreadLocal 문제였는데, 디버깅하는 과정에서 Spring Batch가 잡 파라미터를 어떻게 얻어오고 바인딩하는지 코드를 살펴보게 됐고, 직접 구현해서 실험도 해봤습니다.

# 배경

Spring Batch에서 잡 파라미터를 `@Value("#{jobParameters['param']}")` 같은 SpEL로 받아 쓰고 있었습니다. 로컬에서도, 단일 스레드로 도는 경로에서도 값이 멀쩡히 들어왔습니다. 그런데 멀티스레드로 도는 특정 경로에서만 `jobParameters`가 null이 됐습니다. 같은 잡 실행 안인데 왜 어떤 데선 되고 어떤 데선 안 될까요?

# 해결

## jobParameters는 SpEL로 동작한다

Spring Batch에서 잡 파라미터를 받는 기본 방식은 이렇게 SpEL입니다.

```java
@Value("#{jobParameters['param']}")
private String param;
```

`jobParameters['param']`은 SpEL이 먼저 `jobParameters`라는 객체를 평가한 뒤, 거기서 `param` 키를 꺼내는 표현입니다. 그래서 핵심 질문은 하나로 좁혀지는 것 같습니다. SpEL은 `jobParameters`라는 이름을 대체 어디서 찾을까요?

SpEL이 이름을 해석하게 되는 출처는 크게 둘입니다. 하나는 Spring Bean이고, 다른 하나는 Spring Scope의 contextual object입니다. 먼저 Bean 쪽부터 보면, 애플리케이션 컨텍스트에 빈이 있으면 그 빈을 SpEL로 참조할 수 있습니다.

```java
class MyBean {
    private String name;

    MyBean(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

@Bean
public MyBean myBean() {
    return new MyBean("myBean");
}

// 컨텍스트의 빈을 SpEL로 참조
@Value("#{myBean.name}")
private String myBeanName;
```

그런데 `jobParameters`는 이런 Spring Bean이 아닙니다. 애플리케이션 컨텍스트 그 어느 곳에도 `jobParameters`라는 빈은 없습니다.

## jobParameters는 Bean이 아니라 Scope에서 온다

`jobParameters`는 **Scope의 contextual object**로 제공됩니다. `Scope` 인터페이스에는 `resolveContextualObject(key)`라는 메서드가 있는데, SpEL이 빈을 만들 때 그 빈이 속한 스코프의 이 메서드를 불러 이름을 해석하게 됩니다.

```java
class MyScope implements Scope {
    @Override
    public Object resolveContextualObject(String key) {
        if ("jobParameters".equals(key)) {
            return /* 어딘가에서 가져온 잡 파라미터 */;
        }
        return null;
    }
    // ... get, remove 등 생략
}
```

Spring Batch에서는 이 역할을 `Scope`를 구현한 [`JobScope`](https://docs.spring.io/spring-batch/reference/job/configuring.html)(스텝 단위면 `StepScope`)가 맡습니다. 즉 `#{jobParameters[...]}`는 그 빈이 잡/스텝 스코프 빈일 때만 의미가 있고, 값은 그 스코프가 꺼내 줍니다.

## 진짜 원인은 ThreadLocal이었다

진짜 헤맨 지점이 여기였습니다. 결론부터 말하면 ThreadLocal이었습니다. Spring Batch는 현재 실행 중인 `JobExecution`(스텝이면 `StepExecution`)을 ThreadLocal에 담아두고, 스코프가 값을 꺼낼 때 이 ThreadLocal을 참조합니다. 그 ThreadLocal은 [`SynchronizationManagerSupport`](https://github.com/spring-projects/spring-batch/blob/main/spring-batch-core/src/main/java/org/springframework/batch/core/scope/context/SynchronizationManagerSupport.java)에 존재합니다.

```java
// org.springframework.batch.core.scope.context.SynchronizationManagerSupport
private final ThreadLocal<Stack<E>> executionHolder = new ThreadLocal<>();
```

여기서 두 가지가 중요했습니다.

- `executionHolder`는 `ThreadLocal`이다. 즉 스레드마다 따로 들고 있다.
- 그리고 `InheritableThreadLocal`이 아니다. 즉 부모 스레드에서 만든 워커(자식) 스레드라도 이 값을 물려받지 못한다.

그 ThreadLocal에 담기는 `JobExecution` 안에 잡 파라미터가 들어 있습니다. 실제로 로그를 출력해보면 이런 모양이었습니다.

```text
JobExecution: id=1, version=0, status=STARTING,
  job=[JobInstance: id=1, Job=[playGroundJob]],
  jobParameters={
    'run.id':{value=1, type=Long, identifying=true},
    'firstParam':{value=hello, type=String, identifying=true},
    'secondParam':{value=world, type=String, identifying=true}
  }
```

배치는 잡/스텝 설정 빈을 보통 메인 스레드에서 올리고, 스코프 빈도 그 흐름에서 처음 해석됩니다. 그래서 메인 스레드에는 ThreadLocal에 `JobExecution`이 있고, `@Value("#{jobParameters[...]}")`도 그 시점에 멀쩡히 풀립니다. 문제는 멀티스레드였습니다. 워커 스레드에서 처음으로 잡 스코프 빈을 건드려 스코프가 그 스레드 위에서 값을 풀어야 하는 순간, 그 워커의 ThreadLocal엔 `JobExecution`이 없어 `jobParameters`가 null이 돼버립니다.

그래서 헷갈렸던 겁니다. 멀티스레드로 도는 `ItemProcessor`라도 그 자체를 잡 스코프 빈으로 등록해 두면, 해석이 메인 스레드 흐름에서 일어나 `jobParameters[...]`가 잘 동작합니다. 그런데 그 안에서 jobParameters를 응집해 둔 또 다른 객체를 워커 스레드에서 처음 꺼내려 하면, 그 스레드엔 컨텍스트가 없어 깨지는 것이었습니다.

## 커스텀 스코프로 직접 재현

말로만 보면 추상적인데, 정말 ThreadLocal 때문일까요? 확인해보고 싶어서, Spring Batch를 통째로 띄우는 대신 핵심 메커니즘만 떼어 직접 재현해봤습니다. `JobScope`를 흉내 낸 `MyJobScope`(`Scope` 구현)와, 잡 파라미터를 ThreadLocal에 담는 holder를 두고, `@Value("#{jobParameters['firstParam']}")`를 가진 빈을 메인/워커 스레드에서 각각 접근하게 했습니다.

먼저 잡 파라미터를 ThreadLocal에 들고 있는 holder입니다. Spring Batch의 `executionHolder`를 흉내 낸 부분인데, 일부러 `InheritableThreadLocal`이 아니라 평범한 `ThreadLocal`로 뒀습니다.

```java
public class JobScopeContext {
    // SynchronizationManagerSupport.executionHolder 를 흉내 낸 ThreadLocal
    private static final ThreadLocal<Map<String, Object>> HOLDER = new ThreadLocal<>();

    public static void register(Map<String, Object> jobParameters) {
        HOLDER.set(jobParameters);
    }

    public static Map<String, Object> getJobParameters() {
        return HOLDER.get();
    }
}
```

스코프는 `resolveContextualObject`에서 이 holder를 읽어 `jobParameters`를 돌려줍니다. `#{jobParameters[...]}` SpEL이 바로 이 경로를 탑니다.

```java
public class MyJobScope implements Scope {

    @Override
    public Object get(String name, ObjectFactory<?> objectFactory) {
        return objectFactory.getObject();   // 접근 때마다 생성 → @Value SpEL 재평가
    }

    @Override
    public Object resolveContextualObject(String key) {
        if ("jobParameters".equals(key)) {
            return JobScopeContext.getJobParameters();   // ThreadLocal에 의존
        }
        return null;
    }

    @Override
    public String getConversationId() {
        return Thread.currentThread().getName();
    }

    @Override
    public Object remove(String name) {
        return null;
    }

    @Override
    public void registerDestructionCallback(String name, Runnable callback) {
    }
}
```

`jobParameters`를 SpEL로 받는 빈은 이 스코프에 둡니다.

```java
@Component
@Scope(scopeName = "job", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ParamHolder {

    @Value("#{jobParameters['firstParam']}")
    String firstParam;

    public String getFirstParam() {
        return firstParam;
    }
}
```

이제 메인 스레드에서는 holder에 잡 파라미터를 올려두고(배치가 `JobExecution`을 ThreadLocal에 hold하는 상황을 흉내) 접근하고, 워커 스레드에서는 아무것도 올리지 않은 채 접근해봅니다.

```java
var ctx = new AnnotationConfigApplicationContext(AppConfig.class);
ParamHolder holder = ctx.getBean(ParamHolder.class);   // 스코프 프록시

// 1) 메인 스레드: ThreadLocal에 잡 파라미터가 있다
JobScopeContext.register(Map.of("firstParam", "hello", "secondParam", "world"));
System.out.println("[main]   firstParam = " + holder.getFirstParam());

// 2) 워커 스레드: ThreadLocal이 비어 있다 (InheritableThreadLocal이 아니라 못 물려받음)
Thread worker = new Thread(() -> {
    System.out.println("[worker] jobParameters in ThreadLocal? " + JobScopeContext.getJobParameters());
    try {
        System.out.println("[worker] firstParam = " + holder.getFirstParam());
    } catch (Exception e) {
        Throwable root = e;
        while (root.getCause() != null) root = root.getCause();
        System.out.println("[worker] 실패: " + root.getClass().getSimpleName() + " - " + root.getMessage());
    }
}, "worker-1");
worker.start();
worker.join();
```

돌려보면 이렇게 갈립니다.

```text
[main]   jobParameters in ThreadLocal? {firstParam=hello, secondParam=world}
[main]   firstParam = hello
[worker] jobParameters in ThreadLocal? null
[worker] 실패: SpelEvaluationException - EL1012E: Cannot index into a null value
```

메인 스레드는 ThreadLocal에 잡 파라미터가 있어 SpEL이 `hello`로 정상적으로 해석됩니다. 반면 워커 스레드는 ThreadLocal이 비어 있어 `jobParameters`가 null로 평가되고, 결국 `null['firstParam']`을 인덱싱하다 `EL1012E: Cannot index into a null value`로 깨집니다. 실제 배치에서 봤던 증상과 같은 모양이었습니다.

# 결과

이 사건이 오래 걸린 건, 증상이 "틀렸다"가 아니라 "가끔만 맞는다"는 형태의 문제였기 때문이었습니다. 항상 그렇듯, 매번 문제가 되는 경우보다 어쩌다 문제가 되는 경우가 디버깅하기 더 어려운 것 같습니다. `jobParameters`는 빈이 아니라 스코프가 그때그때 ThreadLocal에서 꺼내주는 값이었고, 그 ThreadLocal마저 `InheritableThreadLocal`이 아니라서 워커 스레드로는 따라가지 않는 것이 원인이었습니다.

그래서 결국은 스코프 해석이 일어나는 시점(메인 스레드)에 값을 미리 받아, 워커가 쓸 객체에 넘겨줘야 한다는 것을 알게 되었습니다. 이렇게 스코프와 스레드의 관계를 다시 한번 살펴보았습니다.

# 참고

> - [Spring Batch: SynchronizationManagerSupport (소스)](https://github.com/spring-projects/spring-batch/blob/main/spring-batch-core/src/main/java/org/springframework/batch/core/scope/context/SynchronizationManagerSupport.java)
> - [Spring Batch Reference: Job/Step Scope](https://docs.spring.io/spring-batch/reference/step/late-binding.html)
