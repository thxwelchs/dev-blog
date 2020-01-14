---
layout: post
category: "Java"
title: "JVM GC종류와 튜닝"
author: thxwelchs
tags: ["jvm", "garbage collector"]
image: img/JVM-GC-postbg.jpg
date: "2018-08-22T19:11:55.000Z"
draft: false
---

# GC 종류

먼저 GC에는 크게 **Minor GC, Major GC, Full GC**가 있는데, Minor GC와 Full GC에서는 GC를 하기위해 JVM으로부터 구동되는 애플리케이션이 모두 stop 되는 stop-the-world가 상태가 됩니다.

- Serial GC
 Mark-Sweep-Compact 알고리즘을 사용하며, Old Generation 영역의 객체들을 식별하면서 Heap 앞 부분부터 체크하며 살아 있는 객체는 남기고 죽은 객체는 삭제하며 힙의 앞쪽으로 모두 몰아줍니다.
이 방식은 GC 알고리즘 중 매우 느린편에 속한다, 하지만 느리게 수행하는 만큼 OS자원은 덜 소모됩니다.
- Parallel GC
이 방식은 Serial GC와 GC를 수행하는 방식은 같습니다, 차이점은 멀티 쓰레드로 병렬적으로 처리한다는 점입니다.
멀티 쓰레드로 처리하기 때문에 수행속도는 빠르며 대신 그만큼 OS자원은 많이 소모됩니다.
- CMS(Concurrent Mark-Sweep)
Parallel GC와 같이 멀티쓰레드로 처리되는 GC이며 대신 Minor GC에서 사용되는 알고리즘은 Concurrent Mark-Sweep을 사용합니다,  애플리케이션의 백그라운드에서 GC를 처리하므로 stop the world 상태가 거의 일어나지 않습니다. 백그라운드에서 GC를 수행해야 하므로 OS 리소스를 많이 소모합니다. 단점으로 중간중간에 존재하는 죽은 객체들을 삭제하며 중간에 의미없이 비어있는 메모리 공간이 생겨 메모리 파편화 현상이 발생, 그러면 결국 메모리부족 현상으로 인해 Serial GC처럼 Mark-Sweep-Compact 알고리즘으로 GC를 수행하게 됩니다.
- G1 GC

    CMS의 단점을 극복하기 위해 고안된 GC, Heap영역에 여러 영역을 세분화 하여(Region) 참조가 없어진 객체들을 삭제하기 위해 참조가 존재하고 사용중인 객체들은 특정 Region 영역으로 옮겨 참조가 없어진 객체들이 모여 있는 Region 을 통째로 삭제해버리는 GC 전략, 그러면 중간중간 비어있는 메모리 공간이 줄어들어 메모리 파편화를 해결해줄 수 있다고 합니다.

## JVM VM option

#### Serial GC
- -XX:+UseSerialGC	

#### Parallel GC
- -XX:+UseParallelGC
- -XX:ParallelGCThreads=value	 

#### Parallel Compacting GC
- -XX:+UseParallelOldGC	 

#### CMS GC
- -XX:+UseConcMarkSweepGC
- -XX:+UseParNewGC
- -XX:+CMSParallelRemarkEnabled
- -XX:CMSInitiatingOccupancyFraction=value
- -XX:+UseCMSInitiatingOccupancyOnly

#### G1 GC
- -XX:+UnlockExperimentalVMOptions
- -XX:+UseG1GC

# Java Version별 default GC

- JDK 5, 6 - Serial GC
- JDK 7 - Parallel GC
- JDK 8 - Parallel GC (G1GC라는 글도 있어 직접 설치된 jdk 기준으로 default GC를 살펴본 결과 Parallel GC 였습니다.)
- JDK 9 - G1 GC
- JDK 10 - G1 GC
- JDK 11 - G1 GC

현재 내 jdk default gc 살펴보기
```shell
$ java -XX:+PrintCommandLineFlags -version
```


현재 내 jdk default gc 변경하기
```shell
$ java -XX:+UseG1GC -XX:+PrintCommandLineFlags -version
```
