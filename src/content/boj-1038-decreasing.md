---
layout: post
category: "PS"
title: "백준 1038 감소하는 수"
author: thxwelchs
tags: ["백준", "백트래킹", "조합", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2022-01-11T13:31:59.000Z"
draft: false
---

# 문제

높은 자리에서 낮은 자리로 갈수록 숫자가 **계속 작아지는** 수를 감소하는 수라 한다(예: `321`, `950`은 감소하는 수, `322`·`958`은 아니다). 한 자리 수와 `0`도 감소하는 수다. **`N`번째 감소하는 수**를 구하면 된다.

- **입력**: `N`.
- **출력**: `N`번째(0번째부터 셈) 감소하는 수. 없으면 `-1`.
- **제한**: `0 ≤ N ≤ 1,000,000`.

# 접근

감소하는 수는 사실 **`{0,1,…,9}`에서 자릿수를 골라 큰 것부터 늘어놓은 것**과 같다. 즉 숫자 집합 하나가 감소하는 수 하나에 대응한다. 그래서 총 개수는 `2^10 - 1 = 1023`개뿐이다(빈 집합 제외). `N`이 `1023` 이상이면 그런 수가 없으니 `-1`.

개수가 1023개로 적으니 **백트래킹으로 전부 만들어** 정렬하면 된다. 자릿수를 추가할 때 **직전 자리보다 작은 숫자만** 붙이면(9부터 0까지 내림차순으로 탐색) 항상 감소하는 수가 만들어진다. 길이 1짜리부터 10짜리까지 모두 생성해 모은 뒤, 정렬해서 `N`번째를 출력한다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/1038.cpp)

```cpp
#include <bits/stdc++.h>

using namespace std;

int N;
vector<int> v;
vector<long long> lv;

long long get_decreasing_number()
{
    long long e = 1;
    long long s = 0;
    for (int i = v.size() - 1; i >= 0; i--)
    {
        s += ((long long)v[i]) * e;
        e *= 10;
    }

    return s;
}

void backtrack(int idx, int n)
{
    if (idx >= n)
    {
        lv.push_back(get_decreasing_number());
        return;
    }

    for (int i = 9; i >= 0; i--)
    {
        // 전에 봤던 숫자 (더 큰 자릿수의 숫자)가 추가하려는 숫자보다 작거나 같으면 넘어간다
        if (v.size() && v.back() <= i)
            continue;

        v.push_back(i);
        backtrack(idx + 1, n);
        v.pop_back();
    }
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);

    cin >> N;

    if (N > 1022)
    {
        cout << -1;
        return 0;
    }

    for (int i = 10; i >= 1; i--)
    {
        v.clear();
        backtrack(0, i);
    }

    sort(lv.begin(), lv.end());

    cout << lv[N];

    return 0;
}
```
