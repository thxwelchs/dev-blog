---
layout: post
category: "PS"
title: "[간만에 스터디] LeetCode Next Permutation"
author: thxwelchs
tags: ["LeetCode", "구현", "Java"]
image: /img/covers/ps-algorithm.jpg
date: "2024-03-31T11:16:43.000Z"
draft: false
---

# [Next Permutation](https://leetcode.com/problems/next-permutation/)


# 코드 
```java
class Solution {
    public void nextPermutation(int[] nums) {
        // 1. 사전순 정렬이 만족되는 가장 첫번째 왼쪽 인덱스
        int i1 = nums.length - 2;
        while (i1 >= 0) {
            if (nums[i1] < nums[i1 + 1]) {
                break;
            }
            i1--;
        }

        // 1에서 찾은 값보다는 크면서 그 중에 가장 작은 값(원소)의 오른쪽 인덱스
        // ex) [1, 3, 5, 4, 2] --> 3보다 크면서 가장 작은 값은 4이므로 4의 인덱스를 찾아야함
        int i2 = nums.length - 1;
        while (i1 >= 0 && i2 > i1) {
            if (nums[i2] > nums[i1]) {
                break;
            }
            i2--;
        }

        System.out.println(String.format("left: %d, right: %d", i1, i2));

        // 다음 순열 기준을 만족시킬 첫번째 두 인덱스의 원소를 교환
        if (i1 >= 0) { // 1에서 못찾은 경우가 있을수도 있다.
            swap(nums, i1, i2);
        }

        // 위에서 교환한 인덱스 이외의 인덱스들은 모두 사전순으로 정렬되어 있어야 다음 순열을 만족하므로, 나머지들을 사전순으로 정렬
        // 만약 1에서 못찾았을 경우에는 그냥 전체를 다 사전순으로 만들어주면 된다
        int left = i1 + 1;
        int right = nums.length - 1;
        while (left < right) {
            ifLeftGreaterThanSwap(nums, left++, right--);
        }

        // System.out.println(Arrays.toString(nums));
    }

    private void ifLeftGreaterThanSwap(int[] nums, int left, int right) {
        if (nums[left] >= nums[right]) {
            swap(nums, left, right);
        }
    }

    private void swap(int[] nums, int left, int right) {
        int tmp = nums[left];
        nums[left] = nums[right];
        nums[right] = tmp;
    }
}
```

# 접근 및 풀이방법
- nums.length가 최대 100까지 가므로 실제 순열을 구하는 dfs 방식으로는 100! 까지 될 수 있기 때문에 불가능하다.
    - 뭔가.. 최대 N^2 까지 할 수 있도록 해봐야 하지 않을까? 최선은 N까지?

- 순열의 특성상 가능한 오른쪽에 있는 수를 교체해주면 바로 다음번의 경우의 수 순열이 된다.
  - 예를 들면 1,2,3,4 -> 1,2,**4,3**
    - 하지만 이런 아름다운 케이스만 존재하는것은 아니다.
  - 1,3,4,2 의 경우 1,4,2,3이 되어야 하는데, 이러한 경우까지 모두 고려해줄 수 있도록 가능한 오른쪽에 있는 수 중 현재 사전순 정렬이
  만족되는 가장 첫번째값을 찾고 그 값은 그보다 큰 값들 중 가장 작은 값과 교환해주면 된다. 
    - 대신 이때 교환한 인덱스 이후의 값들은 사전순으로 정렬되어 있어야 다음 순열이 될 수 있다.

> 전체 풀이 기록: [initi8ors/algorithm2024](https://github.com/initi8ors/algorithm2024/blob/main/002week/next-permutation_lth.md)
