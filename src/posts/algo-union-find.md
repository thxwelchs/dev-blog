---
layout: post
category: "PS"
title: "유니온 파인드 (Union-Find) 정리"
author: thxwelchs
tags: ["알고리즘", "유니온 파인드", "자료구조"]
image: /img/covers/ps-algorithm.jpg
date: "2019-01-13T10:03:43.000Z"
draft: false
---

# 유니온 파인드 (서로소 집합)

여러 원소가 어떤 집합에 속하는지를 관리하면서, 두 연산을 빠르게 처리하는 자료구조.

- **find(x)**: x가 속한 집합의 대표(루트)를 찾는다.
- **union(a, b)**: a가 속한 집합과 b가 속한 집합을 하나로 합친다.

각 집합을 트리로 표현하고, 루트가 그 집합의 대표가 된다. "두 원소가 같은 집합인가?"는 두 루트가 같은지로 판단한다.

![유니온 파인드 동작 과정 - union 연산으로 서로소 집합들이 합쳐진다](/img/algo-union-find/union-find-v2.gif)

## 두 가지 최적화

그냥 쓰면 트리가 한쪽으로 늘어지는데, 어떻게 막을까?

그냥 구현하면 트리가 한쪽으로 길게 늘어져 `find`가 `O(N)`이 될 수 있다. 두 최적화를 같이 쓴다.

- 경로 압축(Path Compression): `find` 도중 거쳐 간 노드들을 루트에 직접 매달아, 다음 `find`를 빠르게 한다.
- 합치기 최적화(Union by Rank/Size): 합칠 때 작은(낮은) 트리를 큰 트리 밑에 붙여 높이가 커지는 걸 막는다.

둘을 함께 쓰면 한 연산이 사실상 상수 시간(`O(α(N))`, α는 아커만 함수의 역함수로 거의 4 이하)에 가깝다.

## 활용

- 두 원소의 연결 여부 판정
- 그래프의 연결 요소 개수
- **크루스칼 MST**에서 사이클 판정
- 사이클 존재 여부 검사

## 기본 코드 구조

```cpp
int parent[100001];

void init(int n) {
    for (int i = 1; i <= n; i++) parent[i] = i; // 처음엔 자기 자신이 루트
}

int find(int x) {
    if (parent[x] == x) return x;
    return parent[x] = find(parent[x]); // 경로 압축
}

void unite(int a, int b) {
    a = find(a);
    b = find(b);
    if (a != b) parent[a] = b;
}
```
