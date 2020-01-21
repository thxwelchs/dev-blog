---
layout: post
category: "Java"
title: "JPA Locking"
author: thxwelchs
tags: ["java", "jpa", "lock"]
image: img/JPA-locking-postbg.jpg
date: "2020-01-20T22:11:55.000Z"
draft: false
---

## 낙관적 락

*충돌이 발생하지 않을 거라고 낙관적으로 가정하는 방법*

데이터베이스 레벨이 아닌 JPA레벨에서 버전 관리 기능을 통해 구현되어있음

테이블에 version 관리를 할 컬럼을 지정해놓고

읽었을 때의 버전과, 변경 할 때의 버전이 같지 않으면 예외(OptimisticLockException)를 발생시켜서 다른 트랜잭션에서의 데이터 접근을 막습니다.
 

*낙관적 락 종류* 에는 네가지 타입이 있습니다.

- NONE: 낙관적 잠금을 사용하지 않음.
- VERSION: `@Version` 어노테이션이 붙어있는 컬럼을 조건으로 낙관적 락을 시행 ( 이 컬럼을 기준으로 락 버전을 관리함
- DIRTY: 변경된 필드에 의해서 낙관적 락 사용
- ALL: 모든 필드를 충돌감지의 조건으로 사용

DIRTY나 ALL  타입으로 낙관적 락을 사용할 경우, 버전 컬럼이 없어도 락을 걸 수 있는데, ALL타입은 전체 컬럼의 값 비교로 락을 컨트롤 합니다. 이 때 주의해야 할 점은 `@DynamicUpdate` 어노테이션을 달아주는 것이 좋습니다.

왜냐하면 하이버네이트는 업데이트 할 엔티티의 상태가 변화할 때, save 메소드를 호출하지 않아도 값이 기존 값과 비교하여 변경됐을 때 값이 어느정도로 변화했는지 체크해서 변경 쿼리를 날립니다. 이 때 상태 변경 감지 하는 걸 Dirty Checking 이라고 하는데, Dirty한 상황이 일어났을 때 하이버네이트는 전체 컬럼에 대한 값 변경을 시도합니다. 이럴 때 진짜 변화가 일어난 컬럼만 업데이트에 반영되도록  `@DynamicUpdate` 어노테이션을 달아주는 것이 좋다고 합니다.

## 비관적 락

*충돌이 발생할 것이라고 우선적으로 가정하고 락을 거는 방법*

데이터베이스 레벨에서의 락 기능을 사용하는데, 대표적인 레코드락을 사용

FOR UPDATE(exclusive), LOCK IN SHARE MODE(shared mode) 을 거는 방법

    
    -- innoDB 테이블에 대해 걸 수 있는 레코드 락은 반드시 auto-commit이 비활성화 상태 이거나, 
    -- 트랜잭션을 직접 제어하는 상태에서만 Lock을 컨트롤 할 수 있습니다.
    -- 현재 AutoCommit 값 확인 ( 1 = O, 0 = X )
    SELECT @@AUTOCOMMIT;
    
    -- AutoCommit 해제
    SET AUTOCOMMIT = 0;
    
    BEGIN;
    
    -- shared mode
    SELECT 
    t.*
    FROM test_table t
    WHERE t.id = 10
     FOR UPDATE;
    -- LOCK IN SHARE MODE;
    
    
    /**
    실제로 다른 세션에서 해당 t.id = 10인 레코드에 접근하려는 READ(FOR UPDATE), WRITE SQL을 실행했을 때, 
    해당 레코드가 LOCK 이 걸려 있으므로 대기상태로 빠짐 (COMMIT 하기 전 까지)
    */
    COMMIT;

shared mode = 내가 락을 건 이상 다른 세션에서 UPDATE나 DELETE는 못하게 하는 것

exclusive mode = 내가 락을 걸면 다른 트랜잭션에서는 읽기 쓰기도 못하게 하는 것 ( 읽기를 못한다는 것은, 단순 SELECT 문은 허용되나, exclusive mode를 하려고 하는 읽기에 대한 부분만 해당됩니다, 인덱스가 exclusive lock이 걸려 있다면, 대기상태로 돌려짐)


# 추가 보너스!
위에서 소개한 JPA레벨에서의 잠금을 설정하는 Optimistic Lock (낙관적 잠금)을 할 때
`@Version` 어노테이션이 존재하는 엔티티에서는 `@DynamicUpdate`를 명시해주는게 좋다고 했었죠? 그런데 어차피 모든 필드를 항상 업데이트 할 것도 아닌데 당연히 명시해주면 무조건 좋은거 아닐까? 라는 생각을 하던 찰나에 선임 분께 찾아볼것을 권유 받았습니다. 그래서 `@DynamicUpdate`를 사용했을 때의 장단점과 어떨 때 사용해야 할지 찾아봤습니다.
## `@DynamicUpdate` 장점
상태가 변화된 Dirty한 필드 만을 대상으로 UPDATE SET 절 쿼리를 수행합니다. (Dirty하다는 것은 필드의 데이터 값이 기존의 origin 값과 달라졌다는 뜻입니다.)

## `@DynamicUpdate` 단점
JPA 구현체인 hibernate는  애플리케이션이 처음 로드 될 때, 엔티티 들을 스캔 하여 모든 필드를 업데이트 할 쿼리로 캐싱 해놓고 업데이트 할 때 마다 메모리에 캐시 된 쿼리를 사용하는 것인데, @DynamicUpdate를 명시 해주면, 업데이트 할 컬럼만 UPDATE SET 절에 포함시키기 위해 캐시 된 쿼리를 사용하지 못하고 업데이트 할 때마다 동적 쿼리를 생성해야 합니다.
​

따라서 @DynamicUpdate는 업데이트 시 무의미한 필드 들이 많이 존재하는 엔티티 이면서 업데이트 시  오버헤드가 많이 발생하는 경우에 사용해야 할 것 같습니다.

​덧붙여서, JPA @Version 어노테이션으로 명시 해놓은 버전 필드가 있는 엔티티의 Optimistic Lock(낙관적 락)을 사용하고자 할 때는 @DynamicUpdate를 사용하는 것이 좋습니다. (@Version 필드만 업데이트 해야 하는 경우가 분명하기 때문에)

<u><span style="color:#e96900;">
혹시나 잘못된 점이 있거나 정보가 틀렸다면 반드시 코멘트 혹은 <a href="mailto:thxwelchs@gmail.com">이메일</a>로 알려주시면 감사하겠습니다!
</span></u>

### 참고

> [https://effectivesquid.tistory.com/category/Server/JPA](https://effectivesquid.tistory.com/category/Server/JPA)\
[https://lng1982.tistory.com/289](https://lng1982.tistory.com/289)\
[https://jojoldu.tistory.com/415](https://jojoldu.tistory.com/415)\
[https://www.baeldung.com/spring-data-jpa-dynamicupdate](https://www.baeldung.com/spring-data-jpa-dynamicupdate)

