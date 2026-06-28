---
layout: post
category: "PS"
title: "코드포스 1514A Perfectly Imperfect Array"
author: thxwelchs
tags: ["코드포스", "수학", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-05-20T10:12:41.000Z"
draft: false
---

# 문제

길이 N인 배열에서, **곱이 완전제곱수가 아닌** 비어있지 않은 부분수열(subsequence)이 존재하는지 판별하면 된다.

- **입력**: 1번째 줄에 테스트케이스 수 `t`. 각 케이스마다 `n`과 배열 `a_1 … a_n`.
- **출력**: 그런 부분수열이 있으면 `YES`, 없으면 `NO`.
- **제한**: `t ≤ 100`, `n ≤ 100`, `1 ≤ a_i ≤ 10,000`.

# 접근

부분수열 곱을 다 따져볼 필요 없다. 결론은 단순하다. **원소 중 완전제곱수가 아닌 게 하나라도 있으면 `YES`**.

- 어떤 원소 하나가 완전제곱수가 아니라면, 그 원소 **하나짜리** 부분수열의 곱이 곧 완전제곱수가 아니니 바로 `YES`.
- 반대로 모든 원소가 완전제곱수라면, 완전제곱수끼리의 곱은 항상 완전제곱수다(`a² · b² · … = (a·b·…)²`). 그러니 어떤 부분수열을 골라도 곱은 완전제곱수 → `NO`.

그래서 미리 완전제곱수 표를 만들어 두고, 완전제곱수가 아닌 원소가 있는지만 훑으면 끝이다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/codeforces/perfectly_imperfect_array.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

int square[10001];

void solve() {
    int n;
    vector<int> v;
    cin >> n;

    for(int i = 0; i < n; i++) {
        int a;
        cin >> a;
        v.push_back(a);
    }

    for(int i = 0; i < n; i++) {
        if(!square[v[i]]) {
            cout << "YES" << '\n';
            return;
        }
    }

    cout << "NO" << '\n';
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);
    int t;
    cin >> t;

    for(int i = 1; i <= 100; i++) {
        square[i * i] = 1;
    }

    while(t--) {
        solve();
    }
    
    return 0;
}
```
