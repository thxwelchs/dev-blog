---
layout: post
category: "PS"
title: "너비 우선 탐색 (BFS) 정리"
author: thxwelchs
tags: ["알고리즘", "BFS", "그래프"]
image: /img/covers/ps-algorithm.jpg
date: "2018-05-13T10:02:31.000Z"
draft: false
---

# BFS (너비 우선 탐색)

시작 정점에서 **가까운 정점부터** 차례대로, 레벨 단위로 퍼져 나가며 탐색하는 방법. 큐(Queue)를 사용한다.

DFS가 한 갈래를 끝까지 파고드는 것과 반대로, BFS는 시작점에서 거리 1인 정점들을 모두 본 뒤 거리 2인 정점들을 보는 식으로 동심원처럼 넓혀 간다.

![BFS 동작 과정 - 가까운 정점부터 레벨 순으로 퍼져 나간다](/img/algo-bfs/bfs-v2.gif)

## 특징

- 큐에 넣을 때 `visited` 처리를 같이 해줘야 한다. 꺼낼 때 처리하면 같은 정점이 큐에 중복으로 들어가 비효율적이다.
- 가중치가 없는(혹은 모두 같은) 그래프에서 시작점부터 각 정점까지의 **최단 거리(간선 개수)** 를 보장한다. 이게 BFS의 가장 큰 무기다.
- 가중치가 제각각인 그래프의 최단거리는 BFS로 안 되고 다익스트라를 써야 한다.

## 시간복잡도

- 인접 리스트: `O(V + E)`
- 인접 행렬: `O(V^2)`

## 활용

- 미로/격자에서의 최단 거리 (가장 흔한 패턴)
- 레벨 단위로 무언가를 세야 하는 문제
- 0-1 BFS(가중치가 0/1뿐일 때 덱으로 변형) 같은 응용

## 기본 코드 구조

```cpp
#include <vector>
#include <queue>
using namespace std;

vector<int> adj[100001];
bool visited[100001];
int dist[100001];

void bfs(int start) {
    queue<int> q;
    q.push(start);
    visited[start] = true;

    while (!q.empty()) {
        int cur = q.front();
        q.pop();

        for (int next : adj[cur]) {
            if (!visited[next]) {
                visited[next] = true;
                dist[next] = dist[cur] + 1; // 최단 거리 갱신
                q.push(next);
            }
        }
    }
}
```
