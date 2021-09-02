---
layout: post
category: "PS"
title: "백준 11053 가장 긴 증가하는 부분 수열"
author: thxwelchs
tags: ["백준", "DP", "LIS", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-09-02T12:11:39.000Z"
draft: false
---

# 문제

수열 `A`에서 **가장 긴 증가하는 부분 수열(LIS)** 의 길이를 구하면 된다. 부분 수열은 원래 순서를 유지한 채 일부를 고른 것이고, 증가는 강증가(앞보다 뒤가 크다)다.

- **입력**: 1번째 줄에 `N`, 2번째 줄에 수열 `A`.
- **출력**: LIS의 길이.
- **제한**: `1 ≤ N ≤ 1,000`, `1 ≤ A_i ≤ 1,000`.

# 접근

`dp[i]` 를 **`i`번째 원소를 마지막으로 하는 LIS의 길이**로 정의한다.

그러면 `dp[i]` 는, 자기보다 앞에 있으면서 값도 더 작은 `j`들 중 `dp[j]` 가 가장 큰 것에 1을 더한 값이다.

`dp[i] = max(dp[j]) + 1` (단, `j < i` 이고 `A[j] < A[i]`)

이런 `j`가 없으면 자기 혼자라 `dp[i] = 1`. 모든 `i`에 대해 구한 `dp[i]` 중 최댓값이 답이다. `N`이 1,000이라 이중 루프(`O(N²)`)로 충분하다. (아래 코드는 같은 점화식을 메모이제이션 재귀로 풀었다.)

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/11053.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

// dp[x] = x번째 까지의 가장 긴 증가하는 부분 수열의 길이
// dp[i] = max j<i dp[j] + 1 (단, a[j] < a[i])

int N;
int A[1001];
int dp[1001];

int go(int x) { // dp[x]를 계산하는 함수
    if(x == 1) {
        return 1;
    }

    if(dp[x] != -1) {
        return dp[x];
    }

    int j = x - 1;
    int ma = 0;
    for(int i = 1; i <= j; i++) {
        if(A[i] < A[x]) {
            ma = max(ma, go(i));
        }
    }

    dp[x] = ma + 1;

    return dp[x];
}

int main() {
   ios::sync_with_stdio(false);
   cin.tie(NULL); cout.tie(NULL);

   cin >> N;
   for(int i = 1; i <= N; i++) {
       cin >> A[i];
   }

   memset(dp, -1, sizeof(dp));

   int ans = 0;
   for(int i = 1; i <= N; i++) {
       ans = max(ans, go(i));
   }

   cout << ans;

   return 0;
}
```
