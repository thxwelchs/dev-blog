---
layout: post
category: "PS"
title: "프로그래머스 불량 사용자"
author: thxwelchs
tags: ["프로그래머스", "백트래킹", "비트마스킹", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-09-01T12:58:31.000Z"
draft: false
---

# 문제

응모자 아이디 목록 `user_id`와, 일부 글자를 `*`로 가린 불량 사용자 패턴 목록 `banned_id`가 주어진다. 각 `banned_id` 패턴에 맞는 `user_id`를 하나씩 배정해 만들 수 있는 **제재 아이디 목록의 경우의 수**를 구하면 된다. 단, 순서만 다르고 구성이 같은 목록은 하나로 센다.

- **입력**: `user_id`(응모자 목록), `banned_id`(가려진 패턴 목록).
- **출력**: 가능한 제재 아이디 목록의 경우의 수.
- **제한**: `user_id` 크기 1 ~ 8, 각 아이디 길이 1 ~ 8. (매칭은 **길이가 같고**, 각 글자가 같거나 패턴이 `*`일 때 성립.)

# 접근

`banned_id`가 최대 8개, `user_id`도 8개라 **백트래킹(순열)** 으로 다 해볼 수 있다. `banned_id`를 순서대로 보며, 각 패턴에 매칭되는 `user_id`를 아직 안 쓴 것 중에서 하나씩 골라 끝까지 배정한다.

매칭 판정은 단순하다. 길이가 같고, 모든 자리에서 `글자가 같거나 패턴이 *` 이면 매칭.

문제의 핵심 함정은 **중복 제거**다. `{0, 1, 3}`을 고르든 `{1, 0, 3}`을 고르든 같은 목록이라 한 번만 세야 한다. 그래서 고른 `user_id`의 **인덱스들을 비트마스크 정수로** 만들어(예: 0·1·3번 → `0b1011`) `set`에 넣는다. 순서가 달라도 비트마스크는 같아져 자동으로 중복이 제거되니, `set`의 크기가 곧 답이다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/프로그래머스/p64064_불량사용자.cpp)

```cpp
#include <string>
#include <vector>
#include <unordered_set>

using namespace std;

// 프로그래머스 64064 불량사용자
// https://programmers.co.kr/learn/courses/30/lessons/64064

unordered_set<int> set;
// 순열 중 순서가 뒤바뀐 것이 중복제거가 안되므로 중복제거를 한 뒤에 갯수를 세어주어야 한다. set은 중복허용이 안되므로 set의 size가 즉 답이 되는 것
// 중복이 되는 경우의 예: {frodo, crodo, abc123}, {crodo, frodo, abc123}
// 2중 string set으로 중복제거를 할 수도 있지만, 각 user_id의 index를 기준으로 BIT OR 연산한 결과 또한 중복이라는 것을 보장 할 수 있기에 이렇게 해결하기로 함
// frodo = user_id[0], crodo = user_id[1], abc123 = user_id[3] 라고 봤을 때 user_id의 최대 길이는 8이므로, 총 8비트(int 255) 의 기준으로 각 비트가 1인 값이 user_id의 index라고 했을 때
//  0000 1011 가 되어 11이 된다. 즉 013 순서이든 103 순서이든 bit 연산을 하면 11이 되므로 set으로 저장시 중복제거가 된다.


void permutation(vector<string> arr, vector<string> p, vector<string> target, bool visited[], int n, int r, int depth, int bit) {
    // banned_id 총 길이만큼의 모든 순열을 구한 뒤, 제재 아이디에 매치가 되는지 검사 한다. 
    if(depth == r) {
        bool check = true;
        for(int i = 0; i < r; i++) {
            // 길이 자체가 다르다면 제재 아이디에 매치 될 수 없다.
            if(p[i].size() != target[i].size()) {
                return;
            }

            // 순열로 구한 모든 문자열이 제재 아이디에 매치 되는지 확인
            for (int j = 0; j < p[i].size(); j++){
                check = check && (p[i][j] == target[i][j] || target[i][j] == '*');
                if(!check) return;
            }
        }

        // 중복 제거를 위한 bit flag로 계산한 유일한 int값을 set에 삽입
        set.emplace(bit);
        return;
    }

    for (int i = 0; i < n; i++) {
        if(!visited[i]) {
            visited[i] = true;
            p[depth] = arr[i];
            // user_id의 index 만큼 시프트 연산으로 밀어넣어 bit 변수의 bit flag를 유효한 값으로 설정한다.
            permutation(arr, p, target, visited, n, r, depth + 1, (bit | 1 << i));
            visited[i] = false;
        }
    }
}

int solution(vector<string> user_id, vector<string> banned_id) {
    vector<string> output(8);
    bool visited[8] = {};
    permutation(user_id, output, banned_id, visited, user_id.size(), banned_id.size(), 0, 0);
    
    return set.size();
}
```
