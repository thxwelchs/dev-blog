---
layout: post
category: "PS"
title: "백준 7579 앱"
author: thxwelchs
tags: ["백준", "DP", "배낭", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-08-30T11:02:07.000Z"
draft: false
---

# 문제

실행 중인 앱 N개가 각각 메모리 `m_i` 바이트를 쓰고 있다. 새 앱을 실행하려면 M바이트가 더 필요한데, 앱을 비활성화하면 그 메모리를 확보하는 대신 (다시 켤 때 드는) 비용 `c_i`가 발생한다. **M바이트 이상을 확보하면서 비활성화 비용의 합을 최소로** 만들면 된다.

- **입력**: 1번째 줄에 `N M`, 2번째 줄에 메모리 `m_1 … m_N`, 3번째 줄에 비용 `c_1 … c_N`
- **출력**: 메모리를 확보하기 위한 최소 비용 한 줄
- **제한**: `1 ≤ N ≤ 100`, `1 ≤ M ≤ 10,000,000`, `1 ≤ m_i ≤ 10,000,000`, `0 ≤ c_i ≤ 100`, `M ≤ m_1 + … + m_N`

# 접근

끄거나 안 끄거나를 고르는 0/1 배낭이다. 그런데 점화식을 세우려니 다뤄야 할 양이 둘이었다. 확보한 **메모리**와 비활성화 **비용**. 배열 인덱스로 쓸 수 있는 건 하나뿐이니, 둘 중 하나를 인덱스로 두고 다른 하나를 값으로 정해야 했다.

먼저 메모리를 인덱스로 두는 쪽을 생각해봤는데, M과 `m_i`가 최대 천만(10,000,000)이라 배열이 그만큼 커져서 무리다. 반면 비용은 `0 ≤ c_i ≤ 100`이고 앱이 최대 100개라 **총합이 100 × 100 = 10,000**을 넘지 않는다. 그래서 비용을 인덱스로 잡기로 했다.

상태는 이렇게 정의했다.

`dp[j]` = 비용을 `j` 이하로 들였을 때 확보할 수 있는 최대 메모리

이제 앱을 하나씩 보면서 끄냐 마냐를 정한다. 앱 `i`(메모리 `m_i`, 비용 `c_i`)를 처리할 때, 비용 `j` 상태는 두 경우로 갈린다.

- **안 끈다**: 이 앱은 아무것도 안 바꾸니 값은 그대로 `dp[j]`.
- **끈다**: 비용 `j` 중 `c_i`를 이 앱에 쓰고, 남은 `j - c_i`로 앞선 앱들에서 만들어둔 최대 메모리 `dp[j - c_i]`에 `m_i`를 더한다.

둘 중 더 큰 값을 취하면 점화식이 나온다.

`dp[j] = max(dp[j], dp[j - c_i] + m_i)`

1차원 배열을 덮어쓰며 갱신하니, 같은 앱을 두 번 끄는 일이 없도록 `j`는 **큰 쪽에서 작은 쪽으로** 내려가며 돈다 (`dp[j - c_i]`가 아직 이번 앱을 반영하지 않은 값이어야 하므로).

다 채운 뒤, `dp[j] ≥ M`을 만족하는 **가장 작은 `j`**가 답이다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/b7579_앱.cpp)

```cpp
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// 백준 7579 앱
// https://www.acmicpc.net/problem/7579

const int MAX = 100;

int main() {

    int N, M;
    cin >> N >> M;

    int memories[MAX];
    int costs[MAX];

    // DP 배열 dp[i], i = 비활성화 시 비용(cost)
    // 비용이 아무리 많이 발생해도 10000을 넘어가지 않는다. 최악의 경우 비활성화 시 100 비용이 발생하는 100개의 메모리가 있다고 해도 100 * 100 = 10000
    // dp[i] i 만큼의 비용을 들여서 얻을 수 있는 이전까지 메모리를 포함한 합을 의미
    int dp[MAX * MAX + 1];

    for(int i = 0; i < N; i++) {
        cin >> memories[i];
    }

    // 비용 0부터 모든 비용을 더한 것 까지의 메모리 합 dp를 구하기 위해 비용 총합 더하기
    int totalCost = 0;

    for(int i = 0; i < N; i++) {
        cin >> costs[i];
        totalCost += costs[i];
    }

    for(int i = 0; i < N; i++) {
        // 최근의 메모리 합과, 현재 메모리 + 현재 비용과 구해야할 비용에서 남는 메모리 중 더 큰 값
        // 만약 역 루프가 아니라면, 지금 구해야 할 비용보다 작은 비용의 현재 비용의 기준으로 메모리 값이 갱신되어져 버리기 때문에 잘못된 계산이 이루어진다.
        for(int j = totalCost; j >= costs[i]; j--) {
            int remain = j - costs[i];
            dp[j] = max(dp[j], memories[i] + dp[remain]);
        }
    }

    // 모든 비활성화 비용별 메모리 합을 구해놓았기 때문에 dp[i] 에는 i의 비용을 들여 최대 가용할 수 있는 메모리값이 저장되어 있다.
    int answer = 0;
    for(int i = 0; i <= totalCost; i++) {
        if(dp[i] >= M) {
            answer = i;
            break;
        }
    }

    cout << answer << endl;

    return 0;
}
```
