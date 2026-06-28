---
layout: post
category: "PS"
title: "백준 4991 로봇 청소기"
author: thxwelchs
tags: ["백준", "BFS", "TSP", "순열", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-08-27T14:27:58.000Z"
draft: false
---

# 문제

방이 격자로 주어진다. 로봇 청소기 `o`가 한 칸에 있고, 더러운 칸 `*`이 여러 개, 빈 칸 `.`, 가구(벽) `x`가 있다. 로봇은 상하좌우로 한 칸씩(1분) 움직이며 가구는 지날 수 없다. **모든 더러운 칸을 청소하는 데 드는 최소 이동 횟수**를 구하면 된다.

- **입력**: 여러 테스트케이스. 각 케이스 첫 줄에 너비 `w`·높이 `h`, 이어서 `h`줄의 격자(`.` 빈칸, `*` 더러운 칸, `o` 로봇, `x` 가구). 마지막 줄 `0 0`으로 종료.
- **출력**: 케이스마다 모든 칸을 청소하는 최소 이동 횟수, 도달 못 하는 더러운 칸이 있으면 `-1` 한 줄.
- **제한**: `w, h ≤ 20`, 더러운 칸은 최대 10개.

# 접근

"한 칸씩 움직여 모든 더러운 칸을 도는 최소 거리"는 결국 **어떤 순서로 더러운 칸을 방문하느냐**의 문제다. 외판원(TSP)과 같은 꼴이다.

두 단계로 나눴다.

1. **거리 미리 구하기**: 격자에서 두 지점 사이 최단 거리는 BFS면 된다. 로봇과 더러운 칸들에 번호를 매기고(로봇 = 0번), 모든 쌍 `(i, j)`의 최단 거리를 BFS로 구해 `dis[i][j]`에 저장한다. 벽 `x`는 못 지나가고, 도달 불가면 `-1`.
2. **순서 정하기**: 이제 격자는 잊어도 된다. "로봇(0)에서 출발해 더러운 칸을 전부 한 번씩 방문하는 최소 합"만 구하면 된다. 더러운 칸이 최대 10개라, 방문 순서의 **순열**을 모두 돌려 `dis` 합이 최소인 걸 찾는다.

함정 하나. 순열을 도는 중 어느 구간 거리가 `-1`(도달 불가)이면 그 순서는 불가능하니 버리고, 끝까지 전부 불가능하면 그 케이스의 답은 `-1`이다.

(더러운 칸이 더 많았다면 순열 대신 비트마스킹 DP로 TSP를 풀어야 하지만, 여기선 10개 이하라 순열로도 충분했다.)

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/b4991_로봇청소기.cpp)

```cpp
#include <iostream>
#include <string>
#include <queue>
#include <vector>

using namespace std;

// 백준 4991 로봇청소기
// https://www.acmicpc.net/problem/4991


struct Cleaning {
    int w; // 열 (너비)
    int h; // 행 (높이)
    int d; // 최소거리(답)
    char a[20][20]; // 청소정보 행렬
};

// BFS로 시작지점(로봇청소기 or 더러운 칸)과 타겟지점(더러운 칸)의 최소거리를 찾는다
int BFS(int start[], int target[], Cleaning c) {
    queue<vector<int> > q;
    q.push({start[0], start[1]});
    int d[20][20] = {0};

    // 만약 타겟지점에 도달하지 못 할 경우 -1
    int result = -1;

    while(!q.empty()) {
        int i = q.front()[0];
        int j = q.front()[1];
        if(i == target[0] && j == target[1]) {
            result = d[i][j];
            break;
        }
        q.pop();

        // 상
        if(i > 0 && c.a[i - 1][j] != 'x' && d[i - 1][j] == 0) {
            d[i - 1][j] = d[i][j] + 1;
            q.push({i - 1, j});
        }
        // 하
        if(i < c.h - 1 && c.a[i + 1][j] != 'x' && d[i + 1][j] == 0) {
            d[i + 1][j] = d[i][j] + 1;
            q.push({i + 1, j});
        }
        // 좌
        if(j > 0 && c.a[i][j - 1] != 'x' && d[i][j - 1] == 0) {
            d[i][j - 1] = d[i][j] + 1;
            q.push({i, j - 1});
        }
        // 우
        if(j < c.w - 1 && c.a[i][j + 1] != 'x' && d[i][j + 1] == 0) {
            d[i][j + 1] = d[i][j] + 1;
            q.push({i, j + 1});
        }
    }

    return result;
}

// 각 더러운 칸끼리의 최소거리를 구하기 위해 DFS로 순열을 구한다.
void permutation(int arr[], int p[], bool visited[], int n, int r, int depth, int dis[11][11], Cleaning *c) {

    if(depth == r) {
        // 첫번째 합은 로봇 청소기(0번 인덱스)와 순열의 부분집합 중 첫번째 더러운 칸이다.
        int sum = dis[0][p[0]];

        // 순열의 부분집합 중 두번째 더러운 칸 부터는 합을 구한다.
        for(int i = 1; i < r; i++) {
            int d = dis[p[i - 1]][p[i]];
            if(d == -1) {
                c -> d = -1;
                return;
            }
            sum += dis[p[i - 1]][p[i]];
        }

        // 합이 이전에 구했던 합보다 작으면 최소값이므로 저장
        if(c -> d == 0 || sum < c -> d) c -> d = sum;

        return;
    }

    for (int i = 0; i < n; i++) {
        if(!visited[i]) {
            visited[i] = true;
            p[depth] = arr[i];
            permutation(arr, p, visited, n, r, depth + 1, dis, c);
            visited[i] = false;
        }
    }
}

int main() {
    vector<Cleaning> cleanings;

    while (true) {
        int w, h;
        cin >> w >> h;

        if(w == 0 && h == 0) break;

        struct Cleaning c;
        c.w = w;
        c.h = h;

        char a[20][20];
        for(int i = 0; i < h; i++) {
            cin >> c.a[i];
        }

        cleanings.push_back(c);
    }

    for(auto &&c : cleanings) {
        int dirty = 0;

        // 로봇청소기, 더러운칸의 위치값에 색인값을 부여하기 위해 위치값을 배열에 저장
        int t[11][2] = {0};

        for(int i = 0; i < c.h; i++) {
            for(int j = 0; j < c.w; j++) {
                if(c.a[i][j] == '*') {
                    t[++dirty][0] = i;
                    t[dirty][1] = j;
                } else if(c.a[i][j] == 'o') {
                    // 출발은 로봇청소기로부터 해야하므로 0번째 인덱스에 저장
                    t[0][0] = i;
                    t[0][1] = j;
                }
            }
        }

        // 로봇청소기 or 더러운칸 -> 더러운칸 으로 가기 위한 최소거리를 저장할 2d 배열
        // dis[i][j] = i 부터 j까지의 최소거리
        // 각 인덱스(i,j)는 위 t 2d 배열에 색인한 순서대로
        int dis[11][11] = {0};
        for(int i = 0; i < dirty + 1; i++) {
            for(int j = 0; j < dirty + 1; j++) {
                if(j > i) {
                    dis[i][j] = BFS(t[i], t[j], c);
                } else {
                    dis[i][j] = dis[j][i];
                }
            }
        }

        int arr[10];
        int p[10];
        bool visited[10];
        for(int i = 0; i < dirty; i++) {
            arr[i] = i + 1;
        }

        permutation(arr, p, visited, dirty, dirty, 0, dis, &c);

        cout << c.d << endl;
    }



    return 0;
}
```
