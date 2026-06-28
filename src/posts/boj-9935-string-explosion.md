---
layout: post
category: "PS"
title: "백준 9935 문자열 폭발"
author: thxwelchs
tags: ["백준", "스택", "자료구조", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-09-05T13:54:44.000Z"
draft: false
---

# 문제

문자열에 "폭발 문자열"이 들어 있으면 그 부분이 사라지고, 남은 양쪽이 다시 붙는다. 이 폭발은 더 이상 터질 게 없을 때까지 연쇄적으로 일어난다. 모든 폭발이 끝난 뒤 남은 문자열을 구하면 된다.

- **입력**: 1번째 줄에 문자열, 2번째 줄에 폭발 문자열.
- **출력**: 폭발이 끝난 뒤 남은 문자열. 남은 게 없으면 `FRULA`.
- **제한**: 문자열 길이 ≤ 1,000,000, 폭발 문자열 길이 ≤ 36, 둘 다 영문 대소문자와 숫자로만 이루어짐.

# 접근

폭발은 연쇄적이다. 한 번 터져서 양쪽이 붙으면 거기서 또 터질 수 있다. 그래서 매번 문자열 전체를 다시 훑어 폭발 문자열을 찾는 식으로 풀면, 최악엔 문자열을 몇 번이고 다시 스캔하게 돼서 길이가 100만일 때 시간 초과가 난다.

**스택**으로 한 번만 훑으면 된다. 문자를 앞에서부터 하나씩 스택에 쌓되, 쌓을 때마다 **스택의 맨 위 (폭발 문자열 길이)개가 폭발 문자열과 같은지** 본다. 같으면 그만큼 스택에서 빼낸다(pop). 이렇게 하면 "빼낸 뒤 위아래가 붙어서 또 터지는" 연쇄 폭발이 자연스럽게 처리된다. 스택 맨 위는 항상 "현재까지 살아남은 문자열의 끝"이니까.

코드에서는 `char` 배열을 스택으로 쓰고 `j`를 스택 꼭대기로 삼았다. 새 문자를 넣은 뒤, 끝 글자가 폭발 문자열의 마지막 글자와 같고 길이가 충분하면 뒤에서부터 폭발 문자열과 비교하고, 전부 맞으면 `j`를 폭발 문자열 길이만큼 줄여 한 번에 제거한다. 마지막에 남은 게 없으면 `FRULA`.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/백준/b9935_문자열폭발.cpp)

```cpp
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// 백준 9935 문자열 폭발
// https://www.acmicpc.net/problem/9935

using namespace std;

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(NULL); cout.tie(NULL);
    string N, P;
    char a[1000000];

    cin >> N >> P;

    int strSize = N.size(), bombSize = P.size();

    int j = 0;
    int count = 0;
    for(int i = 0; i < strSize; i++) {
        a[j++] = N[i];

        if (a[j - 1] == P[bombSize - 1] && j >= bombSize) {

            int o = 0;
            bool isAllMatch = true;
            for (int x = bombSize - 1; x >= 0; x--) {
                if (a[j - 1 - (bombSize - 1 - x)] != P[x]) {
                    isAllMatch = false;
                    break;
                }
            }

            if (isAllMatch) {
                count++;
                j -= bombSize;
            }
        }
    }
    if(count * bombSize == strSize) {
        cout << "FRULA";
        return 0;
    }

    for(int i = 0; i < strSize - count * bombSize; i++) {
        cout << a[i];
    }

    return 0;
}
```
