---
layout: post
category: "PS"
title: "[간만에 스터디] LeetCode Path With Minimum Effort"
author: thxwelchs
tags: ["LeetCode", "다익스트라", "Java"]
image: /img/covers/ps-algorithm.jpg
date: "2024-06-08T14:30:20.000Z"
draft: false
---

# [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/description/)

# 코드
```java
class Solution {
    private static final int[][] dir = {
            {-1, 0}, // ☝️
            {0, 1}, // 👉
            {1, 0}, // 👇
            {0, -1} // 👈
    };
    private int[][] graph;
    private int my;
    private int mx;
    /**
     * 다익스트라 최소 비용 테이블 (시작정점에서 해당 목적지까지의 최소 비용 저장)
     * e.g.) [5][5] = (시작정점 [0][0] -> 목적지[5][5] 까지의 최소비용)
     */
    private int[][] dijkstraTable;

    private final static class Node implements Comparable<Node> {
        int effort;
        int y;
        int x;

        Node(int effort, int y, int x) {
            this.effort = effort;
            this.y = y;
            this.x = x;
        }

        // 거리비용 기반 Min Heap 으로 설정하기 위한 조건
        @Override
        public int compareTo(Node o) {
            return this.effort - o.effort;
        }
    }

    public int minimumEffortPath(int[][] heights) {
        graph = heights;
        my = graph.length;
        mx = graph[0].length;
        dijkstraTable = new int[my][mx];

        dijkstra();

        return dijkstraTable[my - 1][mx - 1];
    }

    private void dijkstra() {
        // 다익스트라 시작 정점
        Node start = new Node(0, 0, 0);

        PriorityQueue<Node> pq = new PriorityQueue<>();
        pq.offer(start);

        for (int i = 0; i < my; i++) {
            for (int j = 0; j < mx; j++) {
                dijkstraTable[i][j] = Integer.MAX_VALUE;
            }
        }

        // 자신의 비용은 0으로 설정
        dijkstraTable[0][0] = 0;

        while (!pq.isEmpty()) {
            Node cur = pq.poll();
            // 현재 노드의 비용이 이미 저장된 최소비용보다 크다면 무시
            if (dijkstraTable[cur.y][cur.x] < cur.effort) {
                continue;
            }

            // 현재 노드의 상하좌우 노드를 탐색
            for (int i = 0; i < 4; i++) {
                int ny = cur.y + dir[i][0];
                int nx = cur.x + dir[i][1];

                // 그래프 범위 밖
                if (ny < 0 || ny >= my || nx < 0 || nx >= mx) {
                    continue;
                }

                // 다음 노드까지의 비용
                // 문제에서 요구하는 maximum absolute difference(최대 절대 높이 차이)를 경로에서 유지하기 위해
                int curAndNextDiffDistance = Math.abs(graph[ny][nx] - graph[cur.y][cur.x]);

                int nextEffort = Math.max(cur.effort, curAndNextDiffDistance);

                // 다음 노드까지의 비용이 더 작다면 갱신
                if (nextEffort < dijkstraTable[ny][nx]) {
                    dijkstraTable[ny][nx] = nextEffort;
                    pq.offer(new Node(nextEffort, ny, nx));
                }
            }
        }
    }
}
```

# 접근 및 풀이방법
- minimum effort(최소 노력)을 구하기 위해 다익스트라 알고리즘 활용
- 경로상 최소 노력(최대 절대 높이 차이)를 유지하기 위해 이전에 구했던 최소 노력과 현재 노드와 다음 노드의 높이 차이 중 큰 값을 선택하여 다음 노드까지의 비용을 계산

> 전체 풀이 기록: [initi8ors/algorithm2024](https://github.com/initi8ors/algorithm2024/blob/main/009week/path-with-minimum-effort_lth.md)
