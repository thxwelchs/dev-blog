---
layout: post
category: "PS"
title: "[간만에 스터디] LeetCode Two Sum"
author: thxwelchs
tags: ["LeetCode", "해시", "Java"]
image: /img/covers/ps-algorithm.jpg
date: "2024-03-24T13:01:35.000Z"
draft: false
---

# Two Sum
https://leetcode.com/problems/two-sum/description/

3번만에 품 (분명히 몇년전에 알고리즘 공부를 한참 할때에도 몇번씩이나 풀어봤던 문제인데 역시나 오랜만에 다시 하려니 다시 백지가 된것 같다)

# 코드
```java
class Solution {
    public int[] twoSum(int[] nums, int target) {

        int size = nums.length;
        
        // key: nums.value, value: nums.index
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < size; i++) {
            map.put(nums[i], i);
        }

        for(int i = 0; i < size; i++) {
            int diff = target - nums[i];
            Integer j = map.get(diff);

            if(j != null && i != j) {
                return new int[]{i, j};
            }
        }

        // 답이 무조건 존재하는 입력만 있다고 했기 때문에, 도달 불가능
        return new int[]{0, 0};
    }
}
```

# 풀이 방법
HashMap에 각 Value, Index를 기록해놓고  O(1) 만에 각 원소를 target과의 차이를 보면?
최종적으로 입력에 대한 모든 수의 합이 되는 곳을 O(N)만에 풀 수 있다!

# 그 외 접근시도 방법
정렬 후 투포인터 (실패)
- 음수가 존재하는 이유로 투포인터 단조증가성(포인터를 움직일 기준이 모호?)이 보장되지 않아서 실패

```java
    class Node implements Comparable<Node> {
        int value;
        int index;

        public Node(int value, int index) {
            this.value = value;
            this.index = index;
        }

        @Override
        public int compareTo(Node o) {
            return this.value - o.value;
        }
    }

    public int[] twoSum(int[] nums, int target) {

        int size = nums.length;
        Node[] n = new Node[size];
        for (int i = 0; i < size; i++) {
            n[i] = new Node(nums[i], i);
        }

        Arrays.sort(n);

        int i = 0;
        int j = 1;
        int sum = n[i].value + n[j].value;
        while(true) {
            if(sum < target) {
                j++;
                sum += n[j].value;
            } else if(sum > target) {
                sum -= n[i].value;
                i++;
            } else  {
                break;
//                return new int[]{n[i].index, n[j].index};
            }
        }

        return new int[]{n[i].index, n[j].index};
    }
```

> 전체 풀이 기록: [initi8ors/algorithm2024](https://github.com/initi8ors/algorithm2024/blob/main/001week/two-sum_lth.md)
