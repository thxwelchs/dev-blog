---
layout: post
category: "PS"
title: "코드포스 1478A Nezzar and Colorful Balls"
author: thxwelchs
tags: ["코드포스", "그리디", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-05-20T12:31:16.000Z"
draft: false
---

# 문제

공 N개에 비내림차순(`a_i ≤ a_{i+1}`)으로 수가 적혀 있다. 공을 색칠하는데, **같은 색끼리만 모았을 때 그 수열이 강증가(strictly increasing)** 가 되어야 한다(길이 1 이하는 강증가로 본다). 필요한 **최소 색 개수**를 구하면 된다.

- **입력**: 1번째 줄에 테스트케이스 수 `t`. 각 케이스마다 `n`과 비내림차순 수열 `a_1 … a_n`.
- **출력**: 최소 색 개수.
- **제한**: `t ≤ 100`, `n ≤ 100`, `1 ≤ a_i ≤ n`, 수열은 비내림차순.

# 접근

같은 색끼리는 강증가여야 한다. 그런데 **같은 값이 `k`번** 나오면, 그 `k`개는 절대 한 색에 같이 못 담는다(같은 값이 둘이면 강증가가 깨지니까). 따라서 어떤 값이 최대 `k`번 등장한다면 색이 최소 `k`개는 있어야 한다.

거꾸로 `k`개면 충분하다. 비내림차순이라 같은 값들은 붙어 있고, 각 값의 중복분을 서로 다른 색으로 돌려 담으면 어느 색을 봐도 강증가가 된다. 결국 답은 **가장 많이 나온 값의 등장 횟수(최빈도)** 다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/codeforces/nezzar_and_colorful_balls.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

int arr[101];

void solve() {
    memset(arr, 0, sizeof(arr));
    int n;
    cin >> n;

    int ma = 0;
    for(int i = 0; i < n; i++) {
        int a;
        cin >> a;
        arr[a]++;

        ma = max(ma, arr[a]);
    }

    cout << ma << '\n';
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);

    int t;
    cin >> t;

    while(t--) {
        solve();
    }
    
    return 0;
}
```
