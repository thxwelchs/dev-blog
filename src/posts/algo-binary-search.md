---
layout: post
category: "PS"
title: "이분 탐색 (Binary Search) 정리"
author: thxwelchs
tags: ["알고리즘", "이분 탐색"]
image: /img/covers/ps-algorithm.jpg
date: "2018-08-12T13:19:34.000Z"
draft: false
---

# 이분 탐색

**정렬된** 배열에서 탐색 범위를 절반씩 줄여 가며 원하는 값을 찾는 방법. 매번 후보가 반으로 줄어드니 `O(log N)`.

핵심 전제는 단조성(monotonicity) 이다. "어떤 기준값 이전은 전부 참, 이후는 전부 거짓"처럼 한 방향으로만 성질이 바뀌어야 절반을 버릴 수 있다.

![이분 탐색 동작 과정 - lo/hi/mid로 범위를 절반씩 줄여 값을 찾는다](/img/algo-binary-search/binary-search-v2.gif)

## 동작

- `lo`, `hi` 두 경계를 두고 `mid`를 본다.
- `mid`의 값과 목표를 비교해, 답이 있을 수 없는 절반을 통째로 버린다.
- `lo > hi`가 되면 종료.

## 주의할 점

단순해 보이는데 왜 자꾸 경계에서 틀릴까요?

- `mid = (lo + hi) / 2`는 `lo + hi`가 `int` 범위를 넘으면 **오버플로**가 난다. `mid = lo + (hi - lo) / 2`로 쓰는 습관.
- 경계 조건(`<`인지 `<=`인지, `mid`인지 `mid±1`인지)에서 무한 루프가 자주 난다. 직접 작은 예시로 손으로 돌려 확인하는 게 안전하다.

## lower_bound / upper_bound

- **lower_bound**: 찾는 값 **이상**이 처음 나오는 위치
- **upper_bound**: 찾는 값을 **초과**하는 값이 처음 나오는 위치

이 둘로 "값이 몇 개 있는지", "이 값이 들어갈 자리는 어디인지" 같은 걸 `O(log N)`에 구할 수 있다.

## 조건식(`>=` vs `>`)에 따라 탐색 방향이 갈린다. 직접 정리

이게 한동안 헷갈렸다. 같은 정렬 배열, 같은 `target`인데도 조건식을 `>=`로 두느냐 `>`로 두느냐에 따라 결과가 달라진다. 한참 손으로 돌려 보고 나서야 정리가 됐다.

핵심은 결국 "`mid`를 버릴 것인가, 답 후보로 남길 것인가" 한 가지다.

- `lo`: 탐색 범위 시작 인덱스
- `hi`: 탐색 범위 끝 인덱스
- `mid`: `lo + (hi - lo) / 2`

lower_bound (target 이상이 처음 나오는 위치). `>=` 조건

`arr[mid] >= target`이면, `mid` 자신도 답이 될 수 있으니 버리면 안 된다. 그래서 `mid`를 **포함한 채** 왼쪽으로 좁힌다(`hi = mid`). 아니라면(`arr[mid] < target`) `mid`는 확실히 답이 아니니 `lo = mid + 1`.

```cpp
// target 이상이 처음 나오는 위치
int lowerBound(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size(); // hi는 끝 다음 칸까지
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] >= target) hi = mid;     // mid도 후보 → 포함해서 왼쪽
        else lo = mid + 1;                    // mid는 탈락 → 오른쪽
    }
    return lo;
}
```

upper_bound (target 초과가 처음 나오는 위치). `>` 조건

위와 거의 같고, 등호 위치만 바뀐다. `arr[mid] > target`일 때 `hi = mid`. 즉 `>=`는 `target` 자신을 만나도 더 왼쪽으로 밀어(첫 등장 위치를 찾고), `>`는 `target` 자신은 통과시킨다(마지막 등장 **다음** 위치를 찾는다).

결국 등호(`=`)를 어느 쪽 조건에 붙이느냐가 방향을 정한다. 그리고 이 둘을 같이 쓰면 `[lower, upper)`가 곧 `target`이 등장하는 구간이고, 등장 횟수 = upper - lower 가 된다.

## 파라메트릭 서치

"최댓값을 구하라" 같은 최적화 문제를, "X가 가능한가?"라는 결정 문제로 바꿔서 그 X에 대해 이분 탐색하는 기법. 결정 문제의 답이 단조롭게(어느 지점부터 가능→불가능) 변할 때 쓴다. 나무 자르기, 랜선 자르기 류가 대표적이다.

## 기본 코드 구조

```cpp
// 정렬된 arr에서 target의 위치를 찾기 (없으면 -1)
int binarySearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```
