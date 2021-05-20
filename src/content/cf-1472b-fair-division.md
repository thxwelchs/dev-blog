---
layout: post
category: "PS"
title: "코드포스 1472B Fair Division"
author: thxwelchs
tags: ["코드포스", "그리디", "수학", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-05-20T13:17:46.000Z"
draft: false
---

# 문제

무게가 1 또는 2인 사탕 N개를 두 사람에게 **무게 합이 똑같이** 나눌 수 있는지 판별하면 된다(사탕은 쪼갤 수 없다).

- **입력**: 1번째 줄에 테스트케이스 수 `t`. 각 케이스마다 `n`과 사탕 무게 `a_1 … a_n`(각 1 또는 2).
- **출력**: 공정하게 나눌 수 있으면 `YES`, 없으면 `NO`.
- **제한**: `t ≤ 10,000`, `n ≤ 100`, 모든 `n`의 합 ≤ 100,000.

# 접근

무게 1짜리 개수와 무게 2짜리 개수만 세면 된다.

- **무게 1이 홀수 개**면 불가능하다(`NO`). 전체 합이 홀수가 되어 절반으로 못 가른다.
- **무게 1이 0개인데 무게 2가 홀수 개**여도 불가능하다(`NO`). 2짜리만 홀수 개면 한쪽이 2만큼 더 가질 수밖에 없고, 메울 1짜리도 없다.
- 그 외에는 **항상 가능**하다(`YES`). 1이 짝수 개면, 2가 홀수 개여도 2짜리 하나를 한쪽에 더 주고 부족한 2는 1짜리 2개로 메우면 된다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/codeforces/fair_division.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

int arr[3];

void solve() {
    memset(arr, 0, sizeof(arr));

    int n;
    cin >> n;
    for(int i = 0; i < n; i++) {
        int a;
        cin >> a;
        arr[a]++;
    }

    // 공정하게 나눌 수 없을 때의 경우는, 1 무게의 캔디가 홀수개 이거나,
    // 1 무게의 캔디가 0개 이면서 2 무게의 캔디가 짝수개 일 때이다.

    // 만약 1무게의 캔디가 짝수개이면, 2무게의 캔디가 몇개가 있던 공정하게 나눌 수 있다.
    // 1무게의 캔디가 짝수개이고, 2무게의 캔디가 짝수개라면 당연하게도 짝수개를 2씩 나눠서 둘에게 공정하게 나누어주면 된다.
    // 1무게의 캔디가 짝수개이고, 2무게의 캔디가 홀수개라면, 2무게의 캔디를 2로 나누어 한명에게 하나를 더 주고, 나머지 한명에게 
    // 주어야 할 부족한 캔디는 1무게의 2개로 채우면 된다. (1무게의 캔디가 짝수개이기 때문에 2개로 무조건 채울 수 있다.)

    if(arr[1] % 2) {
        cout << "NO";
    } else if(!arr[1] && arr[2] % 2) {
        cout << "NO";
    } else {
        cout << "YES";
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
