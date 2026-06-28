---
layout: post
category: "PS"
title: "백준 11725 트리의 부모 찾기"
author: thxwelchs
tags: ["백준", "트리", "DFS", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-07-01T10:15:22.000Z"
draft: false
---

# 문제

루트가 1번인 트리가 주어진다. 각 노드의 **부모 노드**를 찾아 2번 노드부터 순서대로 출력하면 된다.

- **입력**: 1번째 줄에 노드 수 `N`, 이어서 `N-1`개 줄에 연결된 두 정점.
- **출력**: 2번 노드부터 `N`번 노드까지 각 노드의 부모 번호(한 줄에 하나).
- **제한**: `2 ≤ N ≤ 100,000`.

# 접근

간선이 "연결된 두 정점"으로만 주어져서 어느 쪽이 부모인지 방향이 없다. 그래서 인접 리스트로 그래프를 만든 뒤, **루트 1번에서 출발해 탐색(DFS/BFS)** 하면서 방향을 정해준다.

탐색하다 처음 보는 인접 노드를 만나면, 그 노드의 부모는 **지금 내가 있는 노드**다. 루트에서 뻗어 나가며 내려가니, 먼저 도달한 쪽이 부모가 되는 게 자연스럽다. 방문 표시를 해두면 이미 부모가 정해진 노드로 되돌아가는 일도 막힌다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/11725.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

// 전형적인 트리의 부모를 찾는 문제, 아마 두고두고 쓰게 될듯?

const int MA = 100000;
int N;

vector<int> v[MA + 1];
int vis[MA + 1];
int par[MA + 1];

void dfs(int n) {
	for (int _n : v[n]) {
		if (vis[_n]) continue;
		vis[_n] = 1;
		par[_n] = n;
		dfs(_n);
	}
}

int main() {
	ios_base::sync_with_stdio(0);
	cin.tie(0); cout.tie(0);

	cin >> N;

	for (int i = 0; i < N - 1; i++) {
		int v1, v2;

		cin >> v1 >> v2;

		v[v1].push_back(v2);
		v[v2].push_back(v1);
	}

	vis[1] = 1;
	dfs(1);

	for (int i = 2; i <= N; i++) {
		cout << par[i] << '\n';
	}

	return 0;
}
```
