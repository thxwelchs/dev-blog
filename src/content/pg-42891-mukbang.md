---
layout: post
category: "PS"
title: "프로그래머스 무지의 먹방 라이브"
author: thxwelchs
tags: ["프로그래머스", "그리디", "정렬", "C++"]
image: /img/covers/ps-algorithm.jpg
date: "2020-08-30T14:32:18.000Z"
draft: false
---

# 문제

회전판에 음식 N개가 `1`번부터 놓여 있다. 무지는 `1`번부터 한 음식을 **1초** 먹고 다음 번호로 넘어가며, 마지막 번호 다음엔 다시 `1`번으로 돈다. 이미 다 먹은 음식은 건너뛴다. 먹기 시작한 지 `k`초가 지난 순간 방송이 끊겼을 때, 재개하면 **몇 번 음식부터** 먹어야 하는지 구하면 된다.

- **입력**: `food_times`(각 음식을 다 먹는 데 걸리는 시간, 번호 순), `k`(끊긴 시각).
- **출력**: `k`초 후 다시 먹어야 할 음식 번호. `k`초 안에 모두 먹었으면 `-1`.
- **제한**: `food_times` 길이 ≤ 200,000, 원소 ≤ 100,000,000. `k`가 매우 클 수 있어 `long long`.

# 접근

1초씩 시뮬레이션하면 `k`가 수조 단위까지 가므로 시간 초과다. **한 바퀴씩 묶어서** 처리해야 한다.

음식을 **걸리는 시간 오름차순으로 정렬**한다. 그러면 가장 적게 걸리는 음식이 가장 먼저 사라지므로, "지금 남아 있는 음식들을 다 같이 한 겹씩 먹는" 양을 한 번에 계산할 수 있다.

- 현재 단계에서 한 겹 더 먹는 데 드는 양 = `(이번 음식 시간 - 이전 시간) × 남은 음식 수`.
- 이 양이 `k` 이하면, 그만큼 통째로 빼고(이 음식은 다 먹힘) 다음 음식으로 간다.
- `k`보다 크면, 바로 그 구간에서 방송이 끊긴 것이다. 남은 음식들을 **원래 번호 순서로** 다시 정렬한 뒤, `k % (남은 음식 수)` 번째 음식이 답이다.

# 풀이

> 전체 코드: [thxwelchs/algorithm](https://github.com/thxwelchs/algorithm/blob/master/프로그래머스/p42891_무지의먹방라이브.cpp)

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;
typedef long long ll;

// 프로그래머스 42891 무지의 먹방라이브 
// https://www.welcomekakao.com/learn/courses/30/lessons/42891

struct Food {
	int time;
	int index;
};

bool timeComparator(Food a, Food b) {
	return a.time < b.time;
}

bool indexComparator(Food a, Food b) {
	return a.index < b.index;
}

int solution(vector<int> food_times, long long k) {
	int n = food_times.size();
	vector<Food> foods(n);

	// 음식을 먹는데 걸리는 시간, 음식의 번호를 각 원소마다 매겨준다.
	for(int i = 0; i < n; i++) {
		foods[i] = {food_times[i], i + 1};
	}

	// 음식시간 기준으로 오름차순하여 정렬 해놓는다.
	// k까지 도달할 때까지 여러 음식시간들을 한번에 처리하기 위함이다. (정렬 해놓아야 같은 시간이 걸리는 음식들은 한번에 처리가 가능하다.)
	sort(foods.begin(), foods.end(), timeComparator);

	int prev = 0;
	vector<Food>::iterator it;
	for(it = foods.begin(); it != foods.end(); ++it, --n) {
		// loop i마다 반드시 하나 이상의 음식을 모두 먹는다.

		int time = it -> time, index = it -> index;

		// 현재 존재하는 음식들 중 먹을 수 있는 음식의 최대 갯수
		// 현재 음식시간으로 정렬되어져 있는 음식 배열 기준에서 최대 한번에 처리 할 수 있는 음식 갯수를 뜻한다.
		ll eats = (ll) (time - prev) * n;

		// 먹을 수 있는 음식 갯수가 존재하지 않으면, 그냥 넘어간다.
		if(eats== 0) continue;

		// 만약 먹을 수 있는 음식 갯수가 k에 도달하지 않는 갯수라면 한번에 모두 처리한다.
		if(eats <= k) {
			// 처리 후에 k를 먹은 음식 갯수만큼 차감해주고 나머지 k만큼만 또 진행한다.
			k -= eats;
			prev = time;
		} else {
			// 먹을 수 있는 음식이 k만큼 도달 할 수 있는 경우, 즉 네트워크 지연이 발생한 음식이 있는 구간
			k %= n;

			// k 번째 위치만큼 이동한 다음 음식번호를 지정하기 위해 다시 인덱스 기준으로 오름차순 정렬한다.
			sort(it, foods.end(), indexComparator);

			// 현재 위치에서 k번째 위치만큼 이동한 음식을 먹으면 된다. 
			// [3, 1, 3, 4] 음식이 있을 때 k가 3이라면 4번째 음식부터 바로 먹으면 되는 것이다.
			return (it + k) -> index;
		}
	}

	return -1;
}

int main() {
	// int answer = solution({3, 1, 2}, 5);
	int answer = solution({7, 3, 1, 2, 4, 3, 1, 2}, 9);
	cout << answer << endl;
	
	return 0;
}
```
