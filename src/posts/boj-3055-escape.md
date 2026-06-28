---
layout: post
category: "PS"
title: "백준 3055 탈출"
author: thxwelchs
tags: ["백준", "BFS", "시뮬레이션", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-11-07T11:44:21.000Z"
draft: false
---

# 문제

숲이 격자로 주어진다. 고슴도치 `S`는 비버굴 `D`로 가야 하는데, 물 `*`이 매 분 인접한 빈 칸으로 퍼진다. 고슴도치도 매 분 인접한 빈 칸으로 이동하며, **물이 찰 칸으로는 갈 수 없다.** 돌 `X`는 물도 고슴도치도 못 지난다. 비버굴에 도착하는 최소 시간을 구하면 된다.

- **입력**: 1번째 줄에 `R C`, 이어서 `R`줄의 격자(`.` 빈칸, `*` 물, `X` 돌, `D` 비버굴, `S` 고슴도치).
- **출력**: 비버굴에 도착하는 최소 시간. 못 가면 `KAKTUS`.
- **제한**: `1 ≤ R, C ≤ 50`.

# 접근

물과 고슴도치가 **같은 시계로 매 분 한 칸씩** 퍼진다. 그래서 두 개의 BFS를 같은 분 단위로 함께 돌린다.

매 분 순서가 중요하다.

1. **물을 먼저** 한 겹 확장한다. 인접한 빈 칸으로 번지되, 비버굴 `D`에는 물이 차지 않는다.
2. **그다음 고슴도치**를 한 겹 확장한다. 물이 된 칸·돌은 못 간다.

물을 먼저 처리하는 게 핵심이다. 이렇게 하면 "다음 순간 물이 될 칸으로는 들어갈 수 없다"는 규칙이 자연스럽게 지켜진다. 고슴도치가 움직이려는 시점엔 이미 그 칸이 물로 바뀌어 있으니까.

고슴도치가 비버굴에 닿는 순간의 분을 출력하고, 큐가 빌 때까지 못 닿으면 `KAKTUS`.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/b3055_탈출.cpp)

```cpp
#include<iostream>
#include<queue>
#include<stdio.h>
#include<stdlib.h>
#include<string.h>
#include<math.h>

using namespace std;

// 백준 3055 탈출
// https://www.acmicpc.net/problem/3055

const int MAX = 51;

int R, C;
char forest[MAX][MAX];
bool visit[MAX][MAX] = { false, };
queue<pair<int, int>> water;
queue<pair<int, int>> start;
int end_x, end_y;
int dx[4] = { 0, 0, -1, 1 };
int dy[4] = { -1, 1, 0 ,0 };

int BFS() {
	int cnt = 0;
	while (!start.empty()) {
		cnt++;
		int water_size = water.size();
		for (;water_size--;) {
			int x = water.front().first;
			int y = water.front().second;
			water.pop();

			for (int i = 0; i < 4; i++) {
				int nx = x + dx[i];
				int ny = y + dy[i];

				if (nx < 0 || nx >= R || ny < 0 || ny >= C) continue;
				if (forest[nx][ny] == 'X' || forest[nx][ny] == 'D' || forest[nx][ny] == '*') continue;
				water.push(make_pair(nx, ny));
				forest[nx][ny] = '*';
			}
		}

		int start_size = start.size();
		for (;start_size--;) {
			int x = start.front().first;
			int y = start.front().second;
			start.pop();

			visit[x][y] = true;
			if (x == end_x && y == end_y) {
				cout << cnt - 1 << endl;
				return 0;
			}

			for (int i = 0; i < 4; i++) {
				int nx = x + dx[i];
				int ny = y + dy[i];

				if (nx < 0 || nx >= R || ny < 0 || ny >= C) continue;
				if (forest[nx][ny] == 'X' || forest[nx][ny] == '*' || visit[nx][ny]) continue;
				visit[nx][ny] = true;
				start.push(make_pair(nx, ny));
			}
		}
	}
	cout << "KAKTUS" << endl;
	return 0;
}

int main() {
	ios::sync_with_stdio(false);
	cin.tie(NULL); cout.tie(NULL);
	cin >> R >> C;

	for (int i = 0; i < R; i++) {
		for (int j = 0; j < C; j++) {
			cin >> forest[i][j];
			if (forest[i][j] == 'S') start.push(make_pair(i, j));
			else if (forest[i][j] == 'D') { end_x = i; end_y = j; }
			else if (forest[i][j] == '*') water.push(make_pair(i, j));
		}
	}

	BFS();
	return 0;
}
```
