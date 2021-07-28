---
layout: post
category: "PS"
title: "백준 11003 최솟값 찾기"
author: thxwelchs
tags: ["백준", "덱", "슬라이딩 윈도우", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-07-28T10:20:16.000Z"
draft: false
---

# 문제

수열 `A`와 윈도우 길이 `L`이 주어질 때, 각 `i`에 대해 `D_i = A_{i-L+1} … A_i` 구간의 **최솟값**을 출력하면 된다(구간이 시작 전이면 존재하는 부분만).

- **입력**: 1번째 줄에 `N L`, 2번째 줄에 수열 `A`.
- **출력**: `D_1 … D_N`.
- **제한**: `1 ≤ L ≤ N ≤ 5,000,000`, `-10^9 ≤ A_i ≤ 10^9`.

# 접근

`N`이 **최대 500만**이라, 매 위치마다 길이 `L` 윈도우를 다시 훑으면(`O(NL)`) 절대 시간 안에 못 끝낸다. 슬라이딩 윈도우 최솟값의 정석인 **모노토닉 덱**으로 `O(N)`에 풀어야 한다.

덱에는 `(값, 인덱스)`를 **값이 증가하는 순서로** 유지한다.

- 새 값 `arr[i]`가 들어올 때, 덱 **뒤쪽에서 자기보다 큰 값들은 전부 제거**한다. 더 작은 값이 더 늦게 들어왔으니, 그 큰 값들은 앞으로 영영 최솟값이 될 수 없다.
- 덱 **앞쪽**이 윈도우 범위(`i-L+1`)를 벗어났으면 제거한다.

그러면 항상 **덱의 맨 앞이 현재 윈도우의 최솟값**이다. 각 원소는 덱에 한 번 들어가고 한 번 빠지므로 전체 `O(N)`.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/11003.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

using pii = pair<int, int>;

const int MAX = 5000000;

int N, L;

int arr[MAX];
deque<pii> dq;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);

    cin >> N >> L;

    for (int i = 0; i < N; i++) {
        cin >> arr[i];
    }

    for (int i = 0; i < N; i++) {
        if (!dq.empty() && dq.front().second <= i - L)
            dq.pop_front();

        while (!dq.empty() && dq.back().first > arr[i]) {
            dq.pop_back();
        }

        dq.push_back({arr[i], i});
        cout << dq.front().first << " ";
    }

    cout << "\n";

    return 0;
}
```
