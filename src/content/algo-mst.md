---
layout: post
category: "PS"
title: "최소 신장 트리 (MST) 정리"
author: thxwelchs
tags: ["알고리즘", "MST", "그래프"]
image: /img/covers/ps-algorithm.jpg
date: "2019-05-12T12:15:08.000Z"
draft: false
---

# 최소 신장 트리 (MST)

연결된 가중치 그래프에서, 모든 정점을 잇되 사이클 없이(즉 트리로) 연결하는 부분 그래프 중에서 **간선 가중치의 합이 최소**인 것.

정점이 V개면 간선은 정확히 V-1개를 쓴다. "모든 도시를 최소 비용으로 도로 연결" 같은 문제의 전형이다.

## 크루스칼 (Kruskal)

**간선** 중심. 욕심내서 싼 간선부터 고른다.

1. 모든 간선을 가중치 오름차순으로 정렬한다.
2. 싼 간선부터 보면서, **사이클을 만들지 않으면** 채택한다.
3. 사이클 판정은 **유니온 파인드**로 한다. (양 끝 정점이 이미 같은 집합이면 채택 시 사이클)
4. 간선 V-1개를 고르면 끝.

시간복잡도는 간선 정렬이 지배해 `O(E log E)`.

![크루스칼 동작 과정 - 싼 간선부터 보며 사이클이 안 생기면 채택한다](/img/algo-mst/kruskal-v2.gif)

## 프림 (Prim)

**정점** 중심. 한 정점에서 시작해 트리를 키워 나간다.

1. 시작 정점을 트리에 넣는다.
2. 트리에 연결된 간선 중 **가장 싼 간선**으로 새 정점을 트리에 추가한다.
3. 모든 정점이 트리에 들어올 때까지 반복.

우선순위 큐로 구현하면 `O(E log V)`.

## 크루스칼과 프림 선택 기준

그럼 크루스칼과 프림 중 무엇을 골라야 할까?

- 간선이 적은(희소) 그래프 → 크루스칼이 무난
- 간선이 많은(밀집) 그래프 → 프림이 유리할 수 있음

## 기본 코드 구조 (크루스칼)

```cpp
#include <vector>
#include <algorithm>
using namespace std;

struct Edge {
    int u, v, cost;
    bool operator<(const Edge& o) const { return cost < o.cost; }
};

int parent[100001];
int find(int x) {
    return parent[x] == x ? x : parent[x] = find(parent[x]);
}

int kruskal(int n, vector<Edge>& edges) {
    for (int i = 1; i <= n; i++) parent[i] = i;
    sort(edges.begin(), edges.end());

    int total = 0, used = 0;
    for (auto& e : edges) {
        if (find(e.u) == find(e.v)) continue; // 사이클이면 스킵
        parent[find(e.u)] = find(e.v);
        total += e.cost;
        if (++used == n - 1) break;
    }
    return total;
}
```
