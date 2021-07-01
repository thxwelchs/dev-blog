---
layout: post
category: "PS"
title: "백준 16118 달빛여우"
author: thxwelchs
tags: ["백준", "다익스트라", "그래프", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-07-01T12:19:23.000Z"
draft: false
---

# 문제

그루터기 N개가 오솔길 M개로 이어져 있다(각 길의 길이 `d`). **여우**는 1번 그루터기에서 출발해 모든 길을 같은 속도로 달린다. **늑대**도 1번에서 출발하지만, 오솔길을 지날 때마다 **빠르게(2배속) ↔ 느리게(0.5배속)** 를 번갈아 달린다. 각 그루터기에 대해 **여우가 늑대보다 먼저 도착**할 수 있는 곳이 몇 개인지 구하면 된다.

- **입력**: 1번째 줄에 `N M`, 이어서 `M`줄에 `a b d`(오솔길과 길이).
- **출력**: 여우가 늑대보다 먼저 도착하는 그루터기 수.
- **제한**: `2 ≤ N ≤ 4,000`, `1 ≤ M ≤ 100,000`, 길이 `d`는 짝수.

# 접근

속도가 0.5배·2배로 갈리면 시간에 소수(`d/2`)가 생긴다. 그래서 **모든 시간을 2배로 스케일**해 정수로만 다룬다.

- **여우**: 길 하나 = `2d` 시간. 평범한 다익스트라 한 번.
- **늑대**: "빠름/느림" **상태**를 같이 들고 다녀야 한다. 빠르면 그 길은 `d`(= `2d`의 절반), 느리면 `4d`(= `2d`의 두 배)가 걸리고, 길을 하나 지날 때마다 상태가 토글된다. 그래서 `dist2[그루터기][상태]` 로 상태를 하나 더 둔 다익스트라를 돌린다.

마지막으로, 각 그루터기 `i`에서 **여우 최단 `dist[i]` < 늑대 최단 `min(dist2[i][0], dist2[i][1])`** 이면 여우가 이긴 것이니 세어 준다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/16118.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

typedef pair<int, int> pii;

struct Node {
	int d, n, s;
};

struct cmp {
	bool operator()(Node a, Node b) {
		return a.d > b.d;
	}
};

int N, M;
const int INF = 2e9;

int dist[4001];
int dist2[4001][2];

vector<pii> g[4001];
vector<pii> g2[4001][2];

void dijkstra() {
	priority_queue<pii, vector<pii>, greater<pii>> pq;
	pq.emplace(0, 1);

	while (!pq.empty()) {
		pii p = pq.top(); pq.pop();

		int hd = p.first, hh = p.second;

		if (hd > dist[hh]) 
			continue;

		for (int i = 0; i < g[hh].size(); i++) {
			pii th = g[hh][i];

			int tt = th.first, td = th.second;

			if (dist[tt] > dist[hh] + td) {
				dist[tt] = dist[hh] + td;
				pq.emplace(dist[tt], tt);
			}
		}
	}
}

void dijkstra2() {
	priority_queue<Node, vector<Node>, cmp> pq;
	pq.push({ 0, 1, 0 });

	while (!pq.empty()) {
		Node node = pq.top(); pq.pop();

		int hd = node.d, hh = node.n, hs = node.s;

		if (hd > dist2[hh][hs])
			continue;

		int ns = 1 - hs;

		for (int i = 0; i < g2[hh][hs].size(); i++) {
			pii th = g2[hh][hs][i];

			int tt = th.first, td = th.second;

			if (dist2[tt][ns] > dist2[hh][hs] + td) {
				dist2[tt][ns] = dist2[hh][hs] + td;
				pq.push({ dist2[tt][ns], tt, ns });
			}
		}
	}
}

int main() {
	ios_base::sync_with_stdio(0);
	cin.tie(0);
	cout.tie(0);

	cin >> N >> M;

	for (int i = 0; i < M; i++) {
		int a, b, d;
		cin >> a >> b >> d;

		g[a].push_back({ b, d * 2 });
		g[b].push_back({ a, d * 2 });

		g2[a][0].push_back({ b, d });
		g2[a][1].push_back({ b, d * 4 });
		g2[b][0].push_back({ a, d });
		g2[b][1].push_back({ a, d * 4 });
	}

	dist2[1][1] = INF;
	for (int i = 2; i <= N; i++) {
		dist[i] = INF;
		dist2[i][0] = INF;
		dist2[i][1] = INF;
	}

	dijkstra();
	dijkstra2();

	int ans = 0;
	for (int i = 2; i <= N; i++) {
		if (dist[i] < min(dist2[i][0], dist2[i][1])) {
			ans++;
		}
	}

	cout << ans;
	
	return 0;
}
```
