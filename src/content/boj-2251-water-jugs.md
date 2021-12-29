---
layout: post
category: "PS"
title: "백준 2251 물통"
author: thxwelchs
tags: ["백준", "BFS", "상태공간", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2021-12-29T10:33:26.000Z"
draft: false
---

# 문제

용량이 각각 `A`, `B`, `C`인 물통 셋이 있다. 처음엔 `C`만 가득 차 있고 `A`, `B`는 비어 있다. 한 물통에서 다른 물통으로, **받는 쪽이 가득 차거나 주는 쪽이 빌 때까지** 물을 부을 수 있다. **첫 번째 물통(`A`)이 비어 있을 때 세 번째 물통(`C`)에 담겨 있을 수 있는 물의 양**을 모두 구하면 된다.

- **입력**: `A B C`(세 물통의 용량).
- **출력**: `A`가 비었을 때 `C`에 가능한 물의 양을 오름차순으로 공백 구분 출력.
- **제한**: 각 용량 ≤ 200.

# 접근

세 물통의 물의 양 `(a, b, c)` 묶음을 하나의 **상태**로 본다. 한 상태에서 물을 한 번 부으면 다른 상태로 옮겨가니, 상태들을 노드로 두면 그래프 탐색(BFS) 문제가 된다.

부을 수 있는 경우는 6가지다: `A→B, A→C, B→A, B→C, C→A, C→B`. 각 부음은 "받는 쪽 가득 차거나 주는 쪽 빌 때까지"라 결과 상태가 딱 정해진다. 방문 배열 `vis[a][b][c]`로 같은 상태를 두 번 안 보게 한다.

BFS로 도달 가능한 모든 상태를 훑으면서, **`a == 0`인 상태를 만날 때마다 그때의 `c`를 답 목록에 모은다.** 마지막에 정렬·중복 제거해서 출력하면 끝.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/2251.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

typedef tuple<int, int, int> tiii;

int A, B, C;
int vis[201][201][201];
vector<int> ans;

// A -> B
// B -> A
// A -> C
// C -> A
// B -> C
// C -> B

pair<int, int> fill_water(int fromMax, int toMax, int from, int to)
{
   if (from + to > toMax)
   {
      return make_pair(from + to - toMax, toMax);
   }

   return make_pair(0, from + to);
}

void bfs()
{
   queue<tiii> q;

   q.emplace(0, 0, C);
   vis[0][0][C] = 1;

   while (!q.empty())
   {

      tiii t = q.front();
      q.pop();

      auto [a, b, c] = t; // structured binding

      if (!a)
      {
         ans.push_back(c);
      }

      pair<int, int> atob = fill_water(A, B, a, b);
      if (!vis[atob.first][atob.second][c])
      {
         q.emplace(atob.first, atob.second, c);
         vis[atob.first][atob.second][c] = 1;
      }
      pair<int, int> btoa = fill_water(B, A, b, a);
      if (!vis[btoa.second][btoa.first][c])
      {
         q.emplace(btoa.second, btoa.first, c);
         vis[btoa.second][btoa.first][c] = 1;
      }

      pair<int, int> atoc = fill_water(A, C, a, c);
      if (!vis[atoc.first][b][atoc.second])
      {
         q.emplace(atoc.first, b, atoc.second);
         vis[atoc.first][b][atoc.second] = 1;
      }
      pair<int, int> ctoa = fill_water(C, A, c, a);
      if (!vis[ctoa.second][b][ctoa.first])
      {
         q.emplace(ctoa.second, b, ctoa.first);
         vis[ctoa.second][b][ctoa.first] = 1;
      }

      pair<int, int> btoc = fill_water(B, C, b, c);
      if (!vis[a][btoc.first][btoc.second])
      {
         vis[a][btoc.first][btoc.second] = 1;
         q.emplace(a, btoc.first, btoc.second);
      }
      pair<int, int> ctob = fill_water(C, B, c, b);
      if (!vis[a][ctob.second][ctob.first])
      {
         vis[a][ctob.second][ctob.first] = 1;
         q.emplace(a, ctob.second, ctob.first);
      }
   }

   sort(ans.begin(), ans.end());
   ans.erase(unique(ans.begin(), ans.end()), ans.end());

   for (int n : ans)
   {
      cout << n << ' ';
   }
}

int main()
{
   cin.tie(NULL);
   cout.tie(NULL);

   cin >> A >> B >> C;

   bfs();

   return 0;
}
```
