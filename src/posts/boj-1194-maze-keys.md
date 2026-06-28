---
layout: post
category: "PS"
title: "백준 1194 달이 차오른다, 가자"
author: thxwelchs
tags: ["백준", "BFS", "비트마스킹", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-06-30T10:25:54.000Z"
draft: false
---

# 문제

미로를 탈출하는 최소 이동 횟수를 구한다. 빈 곳 `.`은 지날 수 있고 벽 `#`은 못 지난다. 열쇠 `a`~`f`는 밟으면 줍고, 문 `A`~`F`는 **대응하는 열쇠가 있어야** 지날 수 있다. 시작 `0`에서 출구 `1`로 가면 된다.

- **입력**: 1번째 줄에 `N M`(세로·가로), 이어서 `N`줄의 미로.
- **출력**: 탈출 최소 이동 횟수. 탈출 불가면 `-1`.
- **제한**: `1 ≤ N, M ≤ 50`.

# 접근

기본은 가중치 1짜리 BFS다. 하지만 그냥 좌표만으로 방문 처리하면 안 된다. **어떤 열쇠를 가졌느냐**에 따라 같은 칸이라도 갈 수 있는 길이 달라지기 때문이다.

그래서 상태에 "보유 열쇠"를 포함시킨다. 열쇠는 `a`~`f` 6종뿐이니 **비트마스크**로 표현하면 `0`~`63`(2^6)으로 충분하다. 방문 배열을 `vis[y][x][열쇠상태]`로 두면, 같은 칸이라도 열쇠 조합이 다르면 다른 상태로 따로 탐색된다.

이동 규칙은 BFS 안에서 처리한다. 문 `A`~`F`는 해당 비트가 켜져 있어야 통과하고, 열쇠 `a`~`f`를 밟으면 비트를 켠 새 상태로 큐에 넣는다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/1194.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

int N, M;
char arr[51][51];
int vis[51][51][64];
// 방문을 하긴 하되.. y, x 뿐만 아니라 어떤 key를 가진 상태로 방문하는지까지 체크되어야 한다.
// 1 1 1 1 1 1 (63) key 보유 표현
// a b c d e f
int dirY[4] = { -1, 0, 1, 0};
int dirX[4] = { 0, 1, 0, -1};
queue<tuple<int, int, int>> q;

void bfs() {
    while(!q.empty()) {
        tuple<int, int, int> t = q.front();
        q.pop();

        int y = get<0>(t);
        int x = get<1>(t);
        int key = get<2>(t);

        if(arr[y][x] == '1') {
            cout << vis[y][x][key] - 1;
            return;
        } 

        for(int i = 0; i < 4; i++) {
            int ny = y + dirY[i];
            int nx = x + dirX[i];

            if(ny < 0 || ny >= N || nx < 0 || nx >= M) continue;
            if(vis[ny][nx][key]) continue;
            if(arr[ny][nx] == '#') continue;

            // key를 보유하고 있지 않다면 다음 경로로 탐색할 수 없다.
            if(arr[ny][nx] >= 'A' && arr[ny][nx] <= 'F' && !(key & (1 << (arr[ny][nx] - 'A')))) continue;

            int nextKey = key;

            // key를 만나면 해당 key까지 보유한 상태로 갱신하고, 다음 경로로 탐색
            if(arr[ny][nx] >= 'a' && arr[ny][nx] <= 'f') {
                nextKey = key | (1 << (arr[ny][nx] - 'a'));
            } 

            vis[ny][nx][nextKey] = vis[y][x][key] + 1;
            q.push({ny, nx, nextKey});
        }
    }

    cout << -1;
}

int main() {
   ios::sync_with_stdio(false);
   cin.tie(NULL); cout.tie(NULL);

   cin >> N >> M;

   for(int i = 0; i < N; i++) {
       for(int j = 0; j < M; j++) {
           cin >> arr[i][j];

           if(arr[i][j] == '0') {
               q.push({i, j, 0});
               vis[i][j][0] = 1;
           }
       }
   }

   bfs();

   return 0;
}
```
