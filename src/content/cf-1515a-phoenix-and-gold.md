---
layout: post
category: "PS"
title: "코드포스 1515A Phoenix and Gold"
author: thxwelchs
tags: ["코드포스", "그리디", "정렬", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-05-25T12:56:05.000Z"
draft: false
---

# 문제

서로 다른 무게의 금덩이 N개를 저울에 하나씩 올린다. 그런데 저울은 올린 무게의 **누적 합이 정확히 `x`가 되는 순간 폭발**한다. 누적 합이 한 번도 `x`가 되지 않도록 올리는 순서를 찾으면 된다.

- **입력**: 1번째 줄에 테스트케이스 수 `t`. 각 케이스마다 `n x`, 그리고 금덩이 무게 `w_1 … w_n`.
- **출력**: 가능하면 `YES`와 한 가지 순서, 불가능하면 `NO`.
- **제한**: `t ≤ 1000`, `1 ≤ n ≤ 100`, `1 ≤ x ≤ 10,000`.

# 접근

먼저 명백한 불가능 케이스. **전체 합이 `x`와 같으면** 마지막에 다 올렸을 때 무조건 `x`가 되니 `NO`다. 어떤 순서로도 피할 수 없다.

그 외에는 정렬해두고 앞에서부터 누적 합을 쌓는다. 쌓다가 **누적 합이 `x`가 되는 순간**이 있으면, 그 원소를 더 큰(뒤쪽) 원소와 **swap** 한다. 정렬돼 있어 단조 증가가 보장되므로, 더 큰 값으로 바꿔 끼우면 그 자리의 누적 합은 `x`를 넘어가 회피된다.

여기서 의문. 누적 합이 `x`가 되는 지점이 여러 번 생기면 어쩌나? 그럴 일이 없다. 누적 합이 `x`가 될 수 있는 지점은 많아야 한 번뿐이고(전체 합이 `x`가 아닌 한), 그 한 번만 비켜주면 끝이다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/codeforces/phoenix_and_gold.cpp)

```cpp
#include <bits/stdc++.h>

// Phoenix And Gold

using namespace std;

void solve() {
    int n, x;
    vector<int> v;
    cin >> n >> x;

    for(int i = 0; i < n; i++) {
        int a;
        cin >> a;
        v.push_back(a);
    }

    sort(v.begin(), v.end());

    int sum = 0;
    for(int i = 0; i < n; i++) {
        sum += v[i];
    }

    // 어떠한 경우에도, 수열의 모든합이 x가 된다면 반드시 터질 수 밖에 없어서 NO 이다.
    if(sum == x) {
        cout << "NO" << '\n';
        return;
    }

    // 위에서 정렬되었으니 수열의 단조증가성은 보장되어져있고,
    // 연속된 두 수를 더했을 때 x가 된다면, 가장 마지막에 있는 수와 swap 해준다. 그러면 적어도 x보다는 무조건 크다.
    // (실은 가장 마지막에 있는 수를 더할 필요 없고, 현재 위치보다 한칸 더 앞에 있는 수(i + 1)를 더해주어도 x보다는 무조건 크다는 조건이 성립한다.)
    // 1. 의문? 그런데 만약 수열의 가장 마지막 수까지 더했을 때 x가 된거라면? (n - 2 + n - 1) 이 더해졌을 때의 상황이라면?
    // - 실은 이미 이 상황은 이미 위 모든합이 x가 되었을 때의 조건과 같으므로 여기서는 이 상황이 나올 수가 없다.
    // - 애초에 한번이라도 연속된 두수의 합이 x가 나올수 있는 부분은 단 한번 뿐이 될 것이다.
    sum = 0;
    int back = n - 1;
    for(int i = 0; i < n; i++) {
        sum += v[i];
        if(sum == x) {
            sum -= v[i];
            int tmp = v[back];
            v[back] = v[i];
            v[i] = tmp;
            sum += v[i];

            break;
        }
    }

    cout << "YES" << '\n';
    for(int i = 0; i < n; i++) {
        cout << v[i] << ' ';
    }
    cout << '\n';
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
