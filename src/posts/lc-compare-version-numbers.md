---
layout: post
category: "PS"
title: "[간만에 스터디] LeetCode Compare Version Numbers"
author: thxwelchs
tags: ["LeetCode", "문자열", "Java"]
image: /img/covers/ps-algorithm.jpg
date: "2024-06-30T14:33:02.000Z"
draft: false
---

# [Compare Version Numbers](https://leetcode.com/problems/compare-version-numbers/description/)

# 코드
```java
class Solution {
    public int compareVersion(String version1, String version2) {
        String[] v1s = version1.split("\\.");
        String[] v2s = version2.split("\\.");

        int i = 0;
        while (i < v1s.length || i < v2s.length) {
            int num1 = i < v1s.length ? Integer.parseInt(v1s[i]) : 0;
            int num2 = i < v2s.length ? Integer.parseInt(v2s[i]) : 0;

            if (num1 < num2) {
                return -1;
            } else if (num1 > num2) {
                return 1;
            }
            i++;
        }

        return 0;
    }
}
```

# 접근 및 풀이방법
- 각 버전에서 `.` 기준으로 파트를 나누어 파트별 문자열을 정수로 치환
- 정수로 치환한 버전의 파트별로 대소를 구분
- 대소 구분이 되지 않는다면 같은 버전으로 취급

> 전체 풀이 기록: [initi8ors/algorithm2024](https://github.com/initi8ors/algorithm2024/blob/main/011week/compare-version-numbers_lth.md)
