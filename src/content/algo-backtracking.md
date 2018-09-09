---
layout: post
category: "PS"
title: "백트래킹 (Backtracking) 정리"
author: thxwelchs
tags: ["알고리즘", "백트래킹", "DFS"]
image: /img/covers/ps-algorithm.jpg
date: "2018-09-09T10:12:12.000Z"
draft: false
---

# 백트래킹

가능한 모든 경우를 DFS로 하나씩 만들어 보되, 더 진행해도 답이 될 수 없다고 판단되는 순간 그 가지를 포기하고 되돌아가는 방법.

완전 탐색(brute force)과 뼈대는 같지만, "여기서 더 가봐야 소용없다"를 미리 잘라내는 **가지치기(pruning)** 가 더해진 것이 핵심이다. 가지치기를 얼마나 잘하느냐가 곧 성능이다.

![백트래킹 동작 과정 - 4-Queen에서 퀸을 놓다 막히면 되돌아간다](/img/algo-backtracking/backtracking-v2.gif)

## 동작

1. 현재 상태에서 선택지를 하나 고른다.
2. 그 선택이 조건을 위배하지 않으면 다음 단계로 내려간다(재귀).
3. 끝까지 내려가 답을 완성하면 기록한다.
4. 막히면(또는 더 볼 필요가 없으면) 선택을 취소하고(상태 복구) 다른 선택지를 시도한다.

이 "선택 → 진행 → 취소(복구)"가 백트래킹의 기본 리듬이다.

## 활용

- 순열, 조합, 부분집합 생성
- N-Queen(같은 행/열/대각선에 놓을 수 없다는 조건으로 가지치기)
- 스도쿠, 미로 경로 탐색 등 제약 조건이 있는 완전 탐색

## 시간복잡도

기본적으로 경우의 수가 지수적/팩토리얼로 늘어난다. 다만 가지치기가 잘 먹히면 실제 탐색하는 가지 수가 크게 줄어, 이론상 한계보다 훨씬 빠르게 끝나는 경우가 많다.

## 기본 코드 구조 (순열 생성)

```cpp
#include <vector>
using namespace std;

int n;
bool used[10];
vector<int> seq;

void permutation(int depth) {
    if (depth == n) {
        // seq 완성 - 처리
        return;
    }

    for (int i = 1; i <= n; i++) {
        if (used[i]) continue; // 가지치기: 이미 쓴 수

        used[i] = true;
        seq.push_back(i);

        permutation(depth + 1);

        seq.pop_back();   // 선택 취소
        used[i] = false;  // 상태 복구
    }
}
```
