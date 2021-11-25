---
layout: post
category: "PS"
title: "백준 1941 소문난 칠공주"
author: thxwelchs
tags: ["백준", "백트래킹", "조합", "BFS", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-11-25T12:48:36.000Z"
draft: false
---

# 문제

`5 × 5` 격자에 학생 25명이 앉아 있다. 각 자리는 '이다솜파'(`S`) 또는 '임도연파'(`Y`)다. 다음 조건을 모두 만족하는 7명을 뽑는 **경우의 수**를 구하면 된다.

1. 7명이어야 한다.
2. 7명이 **가로·세로로 모두 인접해(하나로 연결되어)** 있어야 한다.
3. 그중 '이다솜파'(`S`)가 **4명 이상**이어야 한다.

- **입력**: 5줄, 각 줄에 `S`/`Y` 5글자.
- **출력**: 결성 가능한 경우의 수.

# 접근

격자가 5×5(25칸)로 작으니, **25칸 중 7칸을 고르는 모든 조합을 백트래킹으로** 만든다(`C(25,7) ≈ 48만`이라 충분하다).

조합 하나가 나올 때마다 두 가지를 검사한다.

- **연결성**: 고른 7칸 중 하나에서 BFS를 돌려, 고른 칸들만 밟고 7칸 전부에 도달할 수 있는지 본다(도달 = 하나로 연결).
- **이다솜파 수**: 7칸 중 `S`가 4개 이상인지 센다.

둘 다 만족하면 경우의 수를 하나 더한다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/1941.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

char arr[26];
int chk[26];
vector<int> v;
int dirY[4] = {-1, 0, 1, 0};
int dirX[4] = {0, 1, 0, -1};
int ans;

pair<int, int> to_pos(int n)
{
    n--;

    int y = n / 5;
    int x = n % 5;

    return make_pair(y + 1, x + 1);
}

int to_idx(int y, int x)
{
    return --y * 5 + x;
}

void check_ans()
{
    memset(chk, 0, sizeof(chk));
    queue<pair<int, int>> q;
    pair<int, int> pos = to_pos(v[0]);
    q.push(pos);
    chk[v[0]] = 1;
    
    while(!q.empty()) {
        pair<int, int> p = q.front();
        q.pop();
        int y = p.first, x = p.second;

        for(int i = 0; i < 4; i++) {
            int ny = y + dirY[i];
            int nx = x + dirX[i];

            if(ny < 1 || ny > 5 || nx < 1 || nx > 5) {
                continue;
            }

            // 조합 7개 중에 있고, 아직 방문안했으면 방문
            for(int j = 1; j < v.size(); j++) {
                int idx = to_idx(ny, nx);
                if(idx == v[j] && !chk[v[j]]) {
                    chk[v[j]] = 1;
                    q.push({ny, nx});
                }
            }
        }
    }

    int sevenPrincessCount = 0;
    int dasomCount = 0;
    for(int i : v) {
        sevenPrincessCount += chk[i];
        if(arr[i] == 'S') {
            dasomCount++;
        }
    }

    if(sevenPrincessCount == 7 &&  dasomCount >= 4) {
        ans++;
    }
}

void backtrack(int n)
{
    if (n > 7)
    {
        check_ans();
        return;
    }

    int start = 1;
    if (v.size())
    {
        start = v.back() + 1;
    }
    for (int i = start; i <= 25; i++)
    {
        v.push_back(i);
        backtrack(n + 1);
        v.pop_back();
    }
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);

    int idx = 0;
    for (int i = 1; i <= 5; i++)
    {
        string s;
        cin >> s;
        for (int j = 1; j <= 5; j++)
        {
            arr[++idx] = s[j - 1];
        }
    }

    backtrack(1);

    cout << ans;
    return 0;
}
```
