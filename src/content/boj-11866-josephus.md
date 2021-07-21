---
layout: post
category: "PS"
title: "백준 11866 요세푸스 문제 0"
author: thxwelchs
tags: ["백준", "큐", "시뮬레이션", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-07-21T11:30:52.000Z"
draft: false
---

# 문제

`1`번부터 `N`번까지가 원을 이루고 앉아 있다. `K`번째 사람을 차례로 제거하고, 남은 사람들로 원을 이어가며 같은 과정을 반복한다. 모두 제거되는 순서(요세푸스 순열)를 구하면 된다.

- **입력**: `N K`.
- **출력**: `<a, b, ...>` 형식의 요세푸스 순열.
- **제한**: `1 ≤ K ≤ N ≤ 1,000`.

# 접근

원을 도는 동작은 **큐**로 그대로 흉내 낼 수 있다. 큐에 `1..N`을 넣고, 앞에서 하나씩 꺼내되 **`K-1`명은 다시 뒤에 넣고(한 바퀴 돌리고), `K`번째는 꺼내서 결과에 담는다.** 큐가 빌 때까지 반복하면 제거 순서가 그대로 만들어진다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/11866.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

queue<int> q;
int N, K;
vector<int> ans;

int main() {
   ios::sync_with_stdio(false);
   cin.tie(NULL); cout.tie(NULL);

   cin >> N >> K;
   for(int i = 1; i <= N; i++) {
       q.push(i);
   }

   while(!q.empty()) {
       for(int i = 1; i <= K; i++) {
           int t = q.front(); q.pop();

            if(i == K) {
                ans.push_back(t);
                continue;
            }
           q.push(t);
       }
   }

    cout << '<';
   for(int i = 0; i < ans.size(); i++) {
       if(i == ans.size() - 1) {
           cout << ans[i];
           continue;
       }
       cout << ans[i] << ", ";
   }
    cout << '>';

   return 0;
}
```
