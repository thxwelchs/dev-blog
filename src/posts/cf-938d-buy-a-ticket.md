---
layout: post
category: "PS"
title: "코드포스 938D Buy a Ticket"
author: thxwelchs
tags: ["코드포스", "다익스트라", "그래프", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-07-15T12:10:23.000Z"
draft: false
---

# 문제

도시가 N개 있고, 양방향 기찻길이 M개 있다(`i`번째 길은 `u`↔`v`를 비용 `w`로 잇는다). 각 도시 `i`에는 콘서트 티켓 값 `a_i`가 있다. **각 도시 `i`마다**, 어떤 도시 `j`로 가서(머물러도 됨) 콘서트를 보고 다시 `i`로 돌아오는 데 드는 최소 비용을 구하면 된다.

- **입력**: 1번째 줄에 `N M`. 다음 `M`줄에 `u v w`(기찻길). 그다음 줄에 콘서트 비용 `a_1 … a_N`.
- **출력**: 도시 `1`부터 `N`까지 각각의 최소 비용을 공백으로 구분해 출력.
- **제한**: `N, M ≤ 200,000`, 비용은 크므로 `long long`(최대 약 10^12).

# 접근

도시 `j`에서 콘서트를 보고 `i`로 돌아온다 = `i → j` 왕복 이동 비용 + `j`의 콘서트 비용. 모든 도시 각각에 대해 이걸 최소화해야 하니, 여러 시작점에서의 최단경로 같은 문제다.

여러 시작점이 필요할 땐 **가상의 슈퍼 시작 정점(0번)** 을 만든다. 0번을 각 도시 `i`와 잇되, 그 간선 비용을 **콘서트 비용 `a_i`** 로 둔다. 그리고 기찻길은 왕복이라 비용을 **`2w`** 로 둔다. 그러면 0번에서 다익스트라를 한 번 돌리는 것만으로, 각 도시까지의 최단 거리 = "어딘가서 콘서트 보고 왕복하는 최소 비용"이 된다.

핵심은 두 가지를 그래프 가중치로 녹인 것이다. 콘서트 비용은 슈퍼소스→도시 간선에, 왕복 이동은 `2w`에.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/codeforces/buy_a_ticket.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

// 여러 시작 정점에 대해 최단경로가 필요 할 땐? 임의의 시작정점을 만들고, 각 원래 시작정점들과 연결시켜준 채로, 임의의 시작정점으로부터의 다익스트라 진행
// 여기서는 콘서트 비용이 각 정점에 대해 비용이 발생하므로, 임의의 시작정점에서 원래의 시작정점으로의 간선에 콘서트 비용을 추가해준다.

typedef long long ll;

const int MA = 2e5 + 1;
const ll INF = 2e17 + 100;
typedef pair<int, ll> pill;
typedef pair<ll, int> plli;

int N, M;
ll W[MA];
ll dist[MA];
vector<pill> g[MA];

void dij() {
    priority_queue<plli, vector<plli>, greater<plli>> pq;
    // 임의의 시작정점 0, (초기비용, 0 에서 0으로 가는 비용은 0)
    pq.emplace(0, 0);

    while(!pq.empty()) {
        plli p = pq.top(); pq.pop();

        ll hdist = p.first;
        int here = p.second;

        if(hdist > dist[here]) {
            continue;
        }

        for(int i = 0; i < g[here].size(); i++) {
            pill tp = g[here][i];
            int there = tp.first;
            ll weight = tp.second;

            if(dist[there] > dist[here] + weight) {
                dist[there] = dist[here] + weight;
                pq.emplace(dist[there], there);
            }
        }
    }
}

int main() {
   ios::sync_with_stdio(false);
   cin.tie(NULL); cout.tie(NULL);

   cin >> N >> M;

   for(int i = 0; i < M; i++) {
       int u, v;
       ll w;
       cin >> u >> v >> w;

       g[u].emplace_back(v, w * 2);
       g[v].emplace_back(u, w * 2); // u -> v에 애초에 왕복 이동 비용을 설정해주었는데 역방향도 해주어야 하는가? 
   }

   for(int i = 1; i <= N; i++) {
       cin >> W[i];
       g[0].emplace_back(i, W[i]);
       g[i].emplace_back(0, W[i]);
   }

   for(int i = 1; i <= N; i++) {
       dist[i] = INF;
   }

   dij();

   for(int i = 1; i <= N; i++) {
       cout << dist[i] << ' ';
   }

   return 0;
}
```
