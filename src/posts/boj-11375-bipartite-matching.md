---
layout: post
category: "PS"
title: "백준 11375 열혈강호"
author: thxwelchs
tags: ["백준", "이분 매칭", "그래프", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-07-13T10:29:41.000Z"
draft: false
---

# 문제

회사에 직원이 N명, 해야 할 일이 M개 있다. 각 직원은 자신이 할 수 있는 일들 중 **하나만** 담당할 수 있고, 각 일도 **한 명**만 담당한다. 할 수 있는 일의 최대 개수를 구하면 된다.

- **입력**: 1번째 줄에 `N M`. 이어서 N개 줄에 각 직원이 할 수 있는 일의 개수와 그 일 번호들.
- **출력**: 할 수 있는 일의 최대 개수.
- **제한**: `1 ≤ N, M ≤ 1,000`.

# 접근

직원과 일을 잇는 **이분 그래프**다. 직원 한 명은 일 하나만, 일 하나는 직원 한 명만 맡으니, 가능한 한 많이 짝지어주는 **최대 이분 매칭** 문제다.

핵심은 **증가 경로(augmenting path)** 다. 직원 `i`를 일에 배정해본다.

- 그 일이 아직 비어 있으면 바로 배정한다.
- 이미 다른 직원 `x`가 맡고 있으면, **`x`를 다른 일로 옮길 수 있는지** 재귀로 물어본다(`dfs(bm[an])`). 옮길 수 있으면 그 자리를 양보받아 `i`가 들어간다.

직원마다 이 시도를 하고, 성공한 횟수가 곧 최대 매칭 = 할 수 있는 일의 최대 개수다. 한 직원을 탐색할 때마다 방문 배열 `vis`를 초기화해서, 이번 직원 기준으로 일을 새로 훑게 한다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/11375.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

// 축사배정과 아예 동일하나, 최대 정점 번호만 달라진다.
const int MA = 1001;

int N, M;
vector<int> g[MA];
int bm[MA];
int vis[MA];

int dfs(int x) {
    for(int i = 0; i < g[x].size(); i++) {
        int an = g[x][i];

        if(vis[an]) {
            continue;
        }
        vis[an] = 1;

        if(!bm[an] || dfs(bm[an])) {

            bm[an] = x;
            return 1;
        }
    }
    return 0;
}

int main() {
   ios::sync_with_stdio(false);
   cin.tie(NULL); cout.tie(NULL);

   cin >> N >> M;

   for(int i = 1; i <= N; i++) {
       int s;
       cin >> s;

       for(int j = 0; j < s; j++) {
           int ii;
           cin >> ii;
           g[i].push_back(ii);
       }
   }

    int ans = 0;
    for(int i = 1; i <= N; i++) {
      memset(vis, 0, sizeof(vis));
      if(dfs(i)) {
         ans++;
      }
    }

    cout << ans;

   return 0;
}
```
