---
layout: post
category: "PS"
title: "백준 13913 숨바꼭질 4"
author: thxwelchs
tags: ["백준", "BFS", "경로 추적", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2022-01-14T10:06:29.000Z"
draft: false
---

# 문제

수빈이는 점 `N`에, 동생은 점 `K`에 있다. 수빈이는 1초에 **걷기**(`X-1` 또는 `X+1`) 또는 **순간이동**(`2*X`)을 할 수 있다. 동생을 찾는 가장 빠른 시간과, 그때 **거쳐 간 위치들**을 출력하면 된다.

- **입력**: `N K`.
- **출력**: 1번째 줄에 최소 시간, 2번째 줄에 `N`에서 `K`까지 이동 경로(위치들).
- **제한**: `0 ≤ N, K ≤ 100,000`.

# 접근

최소 시간 자체는 가중치가 모두 1인 BFS로 구하면 된다. 이 문제의 핵심은 **경로까지 출력**하는 것이다.

그래서 각 칸을 처음 방문할 때 **어디서 왔는지(직전 위치)** 를 함께 기록해 둔다. `K`에 도착하면, 그 부모를 따라 `N`까지 거꾸로 거슬러 올라가며 위치를 모으고, 마지막에 뒤집어 출력하면 그게 경로다.

(아래 코드에서는 `vis[]`에 "직전 위치"를 저장한다. 시작점 `N`이나 위치 `0`에서 온 경우를 구분하려고 `-1`을 잠깐 표식으로 쓰는데, 역추적할 때 `0`으로 되돌려 처리한다.)

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/13913.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

typedef pair<int, int> pii;

int N, K;
int vis[100002];

void bfs()
{
    queue<pii> q;
    q.push({N, 0});
    vis[N] = -1;

    while (!q.empty())
    {
        int c = q.front().first;
        int d = q.front().second;
        q.pop();

        if (c == K)
        {

            vector<int> v;
            v.push_back(c);
            int p = vis[c];
            if(p == -1) 
                p = 0;

            while(p != N) {
                v.push_back(p);
                p = vis[p];
                if(p == -1) {
                    p = 0;
                }
            }
            v.push_back(N);

            cout << d << '\n';
            for(int i = v.size() - 1; i >= 0; i--) {
                if(v[i] < 0)
                    continue;

                cout << v[i] << ' ';
            }

            return;
        }

        int pWalk = c - 1;
        int nWalk = c + 1;
        int jump = c * 2;

        if (pWalk >= 0 && !vis[pWalk] && vis[pWalk] != -1)
        {
            q.push({pWalk, d + 1});
            vis[pWalk] = c == 0 ? -1 : c;
        }

        if (nWalk <= 100000 && !vis[nWalk] && vis[nWalk] != -1)
        {
            q.push({nWalk, d + 1});
            vis[nWalk] = c == 0 ? -1 : c;
        }

        if (jump <= 100000 && !vis[jump] && vis[jump] != -1)
        {
            q.push({jump, d + 1});
            vis[jump] = c == 0 ? -1 : c;
        }
    }
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);

    cin >> N >> K;

    if(N == K) {
        cout << 0 << '\n';
        cout << N;
        return;
    }

    bfs();

    return 0;
}
```
