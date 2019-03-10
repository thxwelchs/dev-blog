---
layout: post
category: "PS"
title: "위상 정렬 (Topological Sort) 정리"
author: thxwelchs
tags: ["알고리즘", "위상 정렬", "그래프"]
image: /img/covers/ps-algorithm.jpg
date: "2019-03-10T14:52:14.000Z"
draft: false
---

# 위상 정렬

방향 그래프에서 선후 관계(A 다음에 B)를 어기지 않도록 정점들을 한 줄로 나열하는 것.

"선수 과목을 다 들어야 다음 과목을 듣는다", "이 작업이 끝나야 저 작업을 시작한다" 같은 순서 제약을 만족하는 순서를 구할 때 쓴다.

![위상 정렬 동작 과정 - 진입차수 0인 정점부터 차례로 빼낸다](/img/algo-topological-sort/topological-sort-v2.gif)

## 전제

- DAG(사이클 없는 방향 그래프) 에서만 가능하다. 사이클이 있으면 서로가 서로의 선행이 되어 순서를 정할 수 없다.
- 정답 순서가 **여러 개일 수 있다.**

## 방법 1: 진입차수 + 큐 (Kahn 알고리즘)

1. 각 정점의 **진입차수**(자기를 가리키는 간선 수)를 센다.
2. 진입차수가 0인 정점을 큐에 넣는다. (선행 조건이 없는 정점)
3. 큐에서 하나 꺼내 결과에 추가하고, 그 정점에서 나가는 간선을 제거하며 이웃의 진입차수를 줄인다.
4. 그 과정에서 진입차수가 0이 된 정점을 큐에 넣는다.
5. 큐가 빌 때까지 반복.

결과에 들어간 정점 수가 전체보다 적으면 → **사이클이 존재**한다는 뜻.

## 방법 2: DFS 후위 순회

DFS로 들어갔다가 빠져나오는 순간(후위)에 스택에 쌓고, 마지막에 스택을 뒤집으면 위상 순서가 된다.

## 시간복잡도

`O(V + E)`

## 기본 코드 구조 (Kahn)

```cpp
#include <vector>
#include <queue>
using namespace std;

vector<int> adj[100001];
int indegree[100001];

vector<int> topologicalSort(int n) {
    queue<int> q;
    for (int i = 1; i <= n; i++)
        if (indegree[i] == 0) q.push(i);

    vector<int> order;
    while (!q.empty()) {
        int cur = q.front();
        q.pop();
        order.push_back(cur);

        for (int next : adj[cur]) {
            if (--indegree[next] == 0) q.push(next);
        }
    }
    // order.size() < n 이면 사이클 존재
    return order;
}
```
