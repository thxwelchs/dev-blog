---
layout: post
category: "PS"
title: "프로그래머스 정수 삼각형"
author: thxwelchs
tags: ["프로그래머스", "DP", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-10-24T10:31:47.000Z"
draft: false
---

# 문제

숫자로 채워진 삼각형이 주어진다. 맨 위에서 시작해 아래로 내려가는데, 한 칸 내려갈 때는 **바로 아래 또는 아래 대각선**으로만 이동할 수 있다. 거쳐 간 숫자들의 합이 가장 큰 경로의 **합**을 구하면 된다.

- **입력**: 삼각형 `triangle`(2차원 배열).
- **출력**: 최대 경로 합.
- **제한**: 삼각형 높이 1 ~ 500, 각 숫자 0 ~ 9,999.

# 접근

전형적인 DP다. `dp[i][j]` 를 **`(i, j)` 칸까지 내려왔을 때의 최대 합**으로 둔다.

`(i, j)`로 올 수 있는 곳은 바로 위 `(i-1, j)`와 위 왼쪽 `(i-1, j-1)` 둘뿐이다. 그러니

`dp[i][j] = triangle[i][j] + max(dp[i-1][j], dp[i-1][j-1])`

맨 왼쪽 칸(`j == 0`)은 위 왼쪽이 없으니 `dp[i-1][j]`만 더한다. 맨 아랫줄의 `dp` 값들 중 가장 큰 게 답이다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/프로그래머스/p43105_정수삼각형.cpp)

```cpp
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// 프로그래머스 43105 정수삼각형
// https://programmers.co.kr/learn/courses/30/lessons/43105

int dp[501][501];

int solution(vector<vector<int>> triangle) {
    int answer = 0;
    dp[0][0] = triangle[0][0];
    int triangleLen = triangle.size();

    for(int i = 1; i < triangleLen; i++) {
        vector<int> t = triangle[i];
        for(int j = 0; j < t.size(); j++) {
            if(j > 0) {
                dp[i][j] = max(dp[i - 1][j] + t[j], dp[i - 1][j - 1] + t[j]);
            } else {
                dp[i][j] = dp[i - 1][j] + t[j];
            }
        }
    }

    for(int i = 0; i < triangleLen; i++) {
        int d = dp[triangleLen - 1][i];
        if(d > answer) answer = d;
    }

    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL); cout.tie(NULL);

    solution({
        {7},
        {3, 8},
        {8, 1, 0},
        {2, 7, 4, 4},
        {4, 5, 2, 6, 5}
    });
    
    return 0;
}
```
