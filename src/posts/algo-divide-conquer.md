---
layout: post
category: "PS"
title: "분할 정복 (Divide and Conquer) 정리"
author: thxwelchs
tags: ["알고리즘", "분할 정복"]
image: /img/covers/ps-algorithm.jpg
date: "2018-11-18T11:45:42.000Z"
draft: false
---

# 분할 정복

큰 문제를 같은 형태의 작은 부분 문제로 나눠서(divide) 각각 풀고(conquer), 그 결과를 **합쳐(combine)** 원래 문제의 답을 만드는 설계 기법.

DP와 헷갈리기 쉬운데, 분할 정복은 보통 부분 문제들이 **겹치지 않는다**. (겹치는 부분 문제를 메모이제이션으로 재활용하는 게 DP다.)

![병합 정렬 동작 과정 - 끝까지 분할한 뒤 정렬하며 병합한다](/img/algo-divide-conquer/merge-sort-v2.gif)

## 3단계

1. **분할(Divide)**: 문제를 더 작은 부분 문제로 쪼갠다.
2. **정복(Conquer)**: 부분 문제를 재귀로 푼다. 충분히 작아지면(기저 사례) 바로 답한다.
3. **결합(Combine)**: 부분 답들을 합쳐 전체 답을 만든다.

## 대표 예시

그럼 이 방식이 실제로 어디에 쓰일까?

- **병합 정렬**: 반으로 나눠 각각 정렬한 뒤 합친다. `O(N log N)`
- **퀵 정렬**: 피벗 기준으로 나눠 각각 정렬한다.
- **거듭제곱(분할 제곱)**: `a^n`을 `a^(n/2)`의 제곱으로 구해 `O(log n)`
- **이분 탐색**도 넓게 보면 분할 정복의 일종이다.

## 시간복잡도

`T(N) = a·T(N/b) + (합치는 비용)` 꼴의 점화식으로 분석한다(마스터 정리). 병합 정렬은 `T(N) = 2T(N/2) + O(N) = O(N log N)`.

## 기본 코드 구조 (분할 제곱)

```cpp
// a^n 을 O(log n)에 계산 (mod 연산 포함)
long long power(long long a, long long n, long long mod) {
    if (n == 0) return 1;

    long long half = power(a, n / 2, mod); // 분할
    long long result = half * half % mod;  // 결합

    if (n % 2 == 1) result = result * a % mod; // 홀수면 a 한 번 더
    return result;
}
```
