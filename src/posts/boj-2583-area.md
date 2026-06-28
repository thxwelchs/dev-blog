---
layout: post
category: "PS"
title: "백준 2583 영역 구하기"
author: thxwelchs
tags: ["백준", "BFS", "flood fill", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-12-30T11:47:02.000Z"
draft: false
---

# 문제

`M × N` 모눈종이에 `K`개의 직사각형을 칠한다. 칠하지 않은 나머지 부분이 **몇 개의 분리된 영역**으로 나뉘는지, 그리고 각 영역의 넓이가 얼마인지 구하면 된다.

- **입력**: 1번째 줄에 `M N K`, 이어서 `K`줄에 직사각형의 왼쪽 아래 `(x, y)`와 오른쪽 위 `(x, y)`.
- **출력**: 1번째 줄에 영역의 개수, 2번째 줄에 각 영역의 넓이를 **오름차순**으로.
- **제한**: `M, N, K ≤ 100`. 좌표는 왼쪽 아래가 `(0,0)`, 오른쪽 위가 `(N, M)`.

# 접근

전형적인 **영역 세기(flood fill)** 문제다.

먼저 직사각형들을 격자에 칠해 둔다. 그다음 **아직 칠하지 않은 칸**을 찾을 때마다 거기서 BFS로 연결된 칸을 전부 따라가며 한 덩어리를 이룬다. BFS 한 번 = 영역 하나이므로, BFS를 시작한 횟수가 영역 개수이고, 그때 방문한 칸 수가 그 영역의 넓이다.

주의할 건 좌표계다. 문제는 왼쪽 아래가 원점인데 배열은 위에서 아래로 인덱싱하니, 직사각형을 칠할 때 행을 뒤집어 변환해 줘야 한다(아래 코드의 `si = M - max(ly, ry)` 부분). 마지막에 넓이들을 정렬해 출력한다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/b2583_영역구하기.cpp)

```cpp
#include<bits/stdc++.h>

using namespace std;

// 백준 2583 영역 구하기
// https://www.acmicpc.net/problem/2583

int M, N, K;
int arr[100][100];
bool v[100][100];
int dy[4] = {-1, 0, 1, 0};
int dx[4] = {0, 1, 0, -1};
vector<int> a;
queue<pair<int, int> > q;

int bfs(int y, int x) {
    int c = 0;
    q.push(make_pair(y, x));
    v[y][x] = true;
    while(!q.empty()) {
        int cy = q.front().first;
        int cx = q.front().second;
        q.pop();
        c++;

        for(int i = 0; i < 4; i++) {
            int ny = cy + dy[i];
            int nx = cx + dx[i];
            if(ny < 0 || ny > M - 1 || nx < 0 || nx > N - 1 || v[ny][nx] || arr[ny][nx]) continue;
            v[ny][nx] = true;
            q.push(make_pair(ny, nx));
        }
    }

    return c;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL); cout.tie(NULL);

    cin >> M >> N >> K;

    for(int i = 0; i < K; i++) {
        int lx, ly, rx, ry;
        cin >> lx >> ly >> rx >> ry;

        int si = M - max(ly, ry);
        int ei = si + abs(ly - ry);

        int sj = min(lx, rx);
        int ej = max(lx, rx);

        for(int j = si; j < ei; j++) {
            for(int k = sj; k < ej; k++) {
                arr[j][k] = 1;
            }
        }
    }

    int cnt = 0;

    for(int i = 0; i < M; i++) {
        for(int j = 0; j < N; j++) {
            if(v[i][j] || arr[i][j]) continue;
            v[i][j] = true;
            cnt++;
            a.push_back(bfs(i, j));
        }
    }

    sort(a.begin(), a.end());

    cout << cnt << '\n';
    for(int i = 0; i < a.size(); i++) {
        cout << a[i] << ' ';
    }
    
    return 0;
}
```
