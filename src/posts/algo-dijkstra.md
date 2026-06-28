---
layout: post
category: "PS"
title: "다익스트라 (Dijkstra) 정리"
author: thxwelchs
tags: ["알고리즘", "다익스트라", "그래프"]
image: /img/covers/ps-algorithm.jpg
date: "2018-07-08T14:24:35.000Z"
draft: false
---

# 다익스트라
어떤 그래프 G와 시작 정점 st가 주어질 때, st로부터 다른 모든 정점으로의 최단 경로 길이를 구하는 알고리즘.


이러한 특징으로 __시작점 고정 최단거리 알고리즘__ 이라고도 한다.

다익스트라 알고리즘은 매 단계마다 도달할 수 있는 정점 중에서 시작점으로부터의 거리가 가장 가까운 정점을 구해서 그 거리를 확정하는 방식으로 동작한다.

## 알고리즘 특징
다익스트라 알고리즘은 다음과 같은 특징을 가진다.
- 만약 __간선의 가중치(어떤 정점에서 정점으로 이동하는 비용)가 음수라면 다익스트라는 동작할 수 없다.__ (만약 음수의 가중치를 가진 간선 그래프에서 최단거리를 구할때에는 벨만포드 알고리즘을 사용할 수 있다.)

## 비효율적인 다익스트라
방문하지 않은 정점들 중에서 최단 거리를 가진 정점을 모두 뒤져보는 __선형 탐색__ 을 통해 찾는 방법, 이 작업은 `𝑂(𝑉)`시간이 소요된다.

- 따라서, 모든 정점에 대한 `O(V)` 최단 거리 정점 선택에 드는 비용 `O(V)`가 소요되므로, `O(V^2)`의 시간복잡도를 가진다. 
- 비효율적인 다익스트라 알고리즘의 전체 시간복잡도는 `O(V^2 + E)` 이지만 `O(E)`는 `O(V^2)`에 비해 상대적으로 작으므로 무시하여 `O(V^2)`가 된다.

## 효율적인 다익스트라
원소의 추가 및 조회/삭제 가 가능한 효율적인 자료구조인 Heap(Min Heap, Priority Queue)을 사용하여 최단거리를 찾는 방법.

- Heap에 있는 가장 작은 원소를 확인할때에는 `O(1)` 이 소요되지만, Heap에 원소를 추가할때에는 `O(log V)`이 소요되므로, 최단 거리 정점 선택 및 업데이트에 대해서는 `O(log V)` 시간이 소요된다.
- 따라서 모든 정점에 대한 최단거리 정점 선택 및 업데이트에 대한 비용은 `O(E log V)`가 된다.

## 동작 과정
1. 시작점에서 모든 정점까지의 거리를 초기화.
   2. 거리 초기화는 일반적으로 INF(`Integer.MAX_VALUE`)와 같은 존재할 수 없는 아주 큰값으로 설정 (최단거리를 찾는 알고리즘이기 때문에, 최단거리로 판단하지 않기 위해 최대한 큰값으로 설정해야 한다.)
2. 가장 가까운 정점을 선택하고 그 정점의 이웃(인접) 정점들의 거리를 __업데이트__
   3. 이 때 기존 거리보다 작은 경우에만 업데이트 한다.
3. 모든 정점을 방문할 때까지 반복.

![다익스트라예시그래프](/img/algo-dijkstra/다익스트라예시그래프.png)
### 동작 과정 예시
- A에서 시작
   -  A의 거리는 0, A에서 갈 수 있는 정점 B와 C.
   - A에서 B: 1 (업데이트: B=1)
   - A에서 C: 4 (업데이트: C=4)
- 가장 가까운 정점 B 선택
   - B의 거리는 1, B에서 갈 수 있는 정점 D와 C.
   - B에서 D: 1 + 2 = 3 (업데이트: D=3)
   - B에서 C: 1 + 2 = 3 (기존 C의 거리는 4이므로 업데이트: C=3)
- 가장 가까운 정점 D 선택
   - D의 거리는 3, D에서 갈 수 있는 정점 E.
   - D에서 E: 3 + 1 = 4 (업데이트: E=4)
- 가장 가까운 정점 C 선택
   - C의 거리는 3, C에서 갈 수 있는 정점 E.
   - C에서 E: 3 + 3 = 6 (기존 E의 거리는 4이므로 업데이트하지 않음)
- 가장 가까운 정점 E 선택
   - E의 거리는 4, 모든 정점을 방문했으므로 종료.

결과

|정점|거리|
|------|---|
|A|0|
|B|1|
|C|3|
|D|3|
|E|4|


### 동작 과정 시각화
![다익스트라 동작 과정 시각화](/img/algo-dijkstra/다익스트라.gif)

https://visualgo.net/en/sssp 에서 시뮬레이션 가능


다익스트라 기본 코드 구조
```cpp
#include <iostream>
#include <string>
#include <vector>
#include <queue>

using namespace std;

vector<pair<int, int>> a[7]; // 다익스트라 최단거리 테이블
int d[7];

// 1. 출발노드를 설정
// 2. 출발 노드를 기준으로 각 노드의 최소 비용을 저장
// 3. 방문하지 않은 노드 중에서 가장 비용이 적은 노드를 선택
//    - 인접노드를 N번만큼 탐색하여 최소값 찾는 방법
//    - Min Heap 우선순위큐를 활용, 하는 방법), C++의 priority_queue는 기본적으로 MaxHeap이기 때문에 음수로 부호를 변경하여 값을 삽입해주고 꺼낼때는 그 반대로 활용함으로써 MinHeap으로 활용할 수 있다.
// 4. 위 과정에서 3 ~ 4번을 반복
void dijkstar(int start) {
    d[start] = 0;
    priority_queue<pair<int, int> > pq; // first: 정점, second: 거리

    pq.push(make_pair(start, 0));

    while(!pq.empty()) {
        int current = pq.top().first;
        int distance = -pq.top().second;
        pq.pop();

        if(d[current] < distance) continue;
        for(int i = 0; i < a[current].size(); i++) {
            int next = a[current][i].first;

            int nextDistance = distance + a[current][i].second;

            if(nextDistance < d[next]) {
                d[next] = nextDistance;
                pq.push(make_pair(next, -nextDistance));
            }
        }
    }
}

int main() {
    
    return 0;
}
```
