---
layout: post
category: "PS"
title: "프로그래머스 부족한 금액 계산하기"
author: thxwelchs
tags: ["프로그래머스", "수학", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-08-02T11:18:36.000Z"
draft: false
---

# 문제

놀이기구의 기본 이용료가 `price`인데, `i`번째로 탈 때는 `price × i`만큼을 낸다. 소지금이 `money`일 때 `count`번 타면 돈이 얼마나 **부족한지**를 구하면 된다(부족하지 않으면 0).

- **입력**: `price`(이용료), `money`(소지금), `count`(이용 횟수).
- **출력**: 부족한 금액. 충분하면 `0`.
- **제한**: 값이 커서 총액이 `int` 범위를 넘을 수 있으니 `long long`으로 계산해야 한다.

# 접근

`count`번 탈 때 총액은 `price·1 + price·2 + … + price·count` 이다. 이건 **등차수열의 합**이라 반복문 없이 공식으로 한 번에 구할 수 있다.

`총액 = price × (1 + 2 + … + count) = price × count(count+1)/2`

총액에서 소지금을 빼서 부족분을 내면 되는데, 한 가지 함정이 있다. **중간 계산을 `int`로 하면 오버플로**가 난다(`count`와 `price`가 크면 곱이 21억을 넘는다). 그래서 `long long`으로 캐스팅한 채 계산해야 한다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/프로그래머스/82612.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

// 위클리 챌린지 1주차 부족한 금액 계산하기
// https://programmers.co.kr/learn/courses/30/lessons/82612

long long solution(int price, int money, int count) {
    // 등비수열의 합으로 구하기 (공비는 price이고 항 갯수는 count)
    // 캐스팅 안해주면 overflow가 난채로 totalPay 변수에 값이 대입되어 입력범위에 따라 정답처리가 되지 않는다.
    // 여기서 최대 범위는 아마도 count ^ 2 * price 정도가 될 것인데, 
    // 2500 ^ 3 만 해보더라도 int의 최대범위를 넘어간다.
    long long totalPay = ((long long) (price + (count * price))) * count / 2;
    
    return money >= totalPay ? 0 : (long long) (totalPay - money);
}

int main() {
   ios::sync_with_stdio(false);
   cin.tie(NULL); cout.tie(NULL);

   cout << solution(3, 20 , 4);

   return 0;
}
```
