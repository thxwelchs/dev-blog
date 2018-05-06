---
layout: post
category: "PS"
title: "깊이 우선 탐색 (DFS) 정리"
author: thxwelchs
tags: ["알고리즘", "DFS", "그래프"]
image: /img/covers/ps-algorithm.jpg
date: "2018-05-06T10:14:44.000Z"
draft: false
---

# DFS (깊이 우선 탐색)

그래프나 트리에서 한 정점을 시작으로, 갈 수 있는 곳까지 **최대한 깊이** 들어갔다가 더 갈 곳이 없으면 직전 갈림길로 되돌아와 다른 길을 탐색하는 방법.

되돌아오는(backtrack) 동작이 핵심이라, 재귀 호출 스택(또는 명시적 스택)으로 자연스럽게 구현된다.

![DFS 동작 과정 - 한 갈래를 끝까지 내려갔다가 막히면 되돌아온다](/img/algo-dfs/dfs-v2.gif)

## 특징

- 한 번 방문한 정점을 다시 방문하지 않도록 `visited` 배열로 관리한다. (안 그러면 사이클에서 무한 루프)
- **방문 순서**가 BFS와 다르다. 가까운 정점부터가 아니라, 한 갈래를 끝까지 파고든다.
- 재귀로 구현하면 코드가 짧지만, 정점 수가 많으면(수십만 이상) **스택 오버플로**가 날 수 있어 명시적 스택으로 바꾸기도 한다.

## 시간복잡도

- 인접 리스트: 모든 정점과 간선을 한 번씩 보므로 `O(V + E)`
- 인접 행렬: 각 정점마다 모든 정점을 확인하므로 `O(V^2)`

## 활용

- 연결 요소(Connected Component) 개수 세기
- 사이클 존재 여부 판정
- 백트래킹(순열/조합/부분집합 생성)의 뼈대
- 위상 정렬(후위 순회 기반)

## 기본 코드 구조

```cpp
#include <vector>
using namespace std;

vector<int> adj[100001]; // 인접 리스트
bool visited[100001];

void dfs(int cur) {
    visited[cur] = true;
    // cur 정점 처리

    for (int next : adj[cur]) {
        if (!visited[next]) {
            dfs(next);
        }
    }
}
```
