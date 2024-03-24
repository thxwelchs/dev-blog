---
layout: post
category: "PS"
title: "[간만에 스터디] LeetCode LRU Cache"
author: thxwelchs
tags: ["LeetCode", "자료구조", "연결 리스트", "Java"]
image: /img/covers/ps-algorithm.jpg
date: "2024-03-24T12:31:47.000Z"
draft: false
---

# 문제

[LRU Cache](https://leetcode.com/problems/lru-cache/description/): `capacity`만큼만 담는 캐시를 설계한다. `get`/`put` 모두 평균 **O(1)** 이어야 하고, 용량이 꽉 찬 상태에서 새 키를 넣으면 **가장 오래 안 쓴(LRU)** 항목을 버린다.

- `LRUCache(capacity)`: 용량을 정해 초기화.
- `int get(int key)`: 있으면 값을 반환(그리고 최근 사용으로 갱신), 없으면 `-1`.
- `void put(int key, int value)`: 넣거나 갱신(최근 사용으로). 용량 초과 시 LRU 제거.
- **제한**: `1 ≤ capacity ≤ 3000`, `0 ≤ key ≤ 10^4`, `0 ≤ value ≤ 10^5`, 호출 최대 `2·10^5`회.

# 풀이 방법

Doubly Linked List의 특성을 이용해서 가장 안쓴 캐시를 제거하고, 최신 캐신을 갱신한다.
`put`, `get`의 시간복잡도는 O(1)이어야 하기 때문에, 배열을 이용한 방법은 최소 O(N)이 걸리므로
참조형 선형 자료구조인 LinkedList를 사용해본다.

Singly가 아닌 Doubly를 선택한 이유는 최근 캐시로 갱신도 가능해야 하며, 가장 오래된 캐시를 제거할수도 있어야 하기 때문에
두개의 포인터를 가진 Doubly를 선택

또한, 캐시의 최대크기 제한이 있기 때문에, 갱신해야 할 캐시가 존재하는지 여부(`get`)도 O(1)만에 수행하기 위해
주소 직접접근이 가능한 주소를가진 배열(`cacheTable`)을 이용한다.

# 처음 시도, 엣지케이스 통과 못함

약 3~4번 정도 수정에 수정을 거쳤으나 엣지케이스를 통과하지 못했던 코드. (`cacheTable`로 직접 접근 + 직접 짠 이중 연결 리스트)

```java
class LRUCache {
    static class Node {
        public static final Node HEAD = new Node(-1, -1);
        public static final Node TAIL = new Node(-2, -2);
        int key;
        int value;
        Node prev;
        Node next;

        public Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    // key: cache key
    // value: Node
    Node[] cacheTable = new Node[10001];

    // Node, head(prev맨끝) 에 가까울수록 오래된 캐시
    Node cacheHead;
    // Node, tail(next맨끝) 에 가까울수록 최근 캐시
    Node cacheTail;
    int size;
    int capacity;

    public LRUCache(int capacity) {
        this.size = 0;
        this.capacity = capacity;
        cacheHead = Node.HEAD;
        cacheTail = Node.TAIL;
        cacheHead.next = cacheTail;
        cacheTail.prev = cacheHead;
    }

    public int get(int key) {
        Node cachedNode = cacheTable[key];
        if (cachedNode != null) {
            put(key, cachedNode.value);
            return cachedNode.value;
        }

        return -1;
    }

    public void put(int key, int value) {
        // 최신 캐시 업데이트
        if (cacheTable[key] != null) {
            Node node = cacheTable[key];
            if (node.value != value) {
                // 가장 안쓴 캐시 제거
                // head <-> node.prev <-> node <-> node.next <-> tail
                node.prev.next = node.next;
                node.next.prev = node.prev;
                cacheTable[key] = null;

                // head <-> node.prev <-> node <-> node.next <-> tail
                Node newNode = new Node(key, value);
                cacheTail.prev.next = newNode;
                newNode.prev = cacheTail.prev;
                newNode.next = cacheTail;
                cacheTable[key] = newNode;
                return;
            }

            node.prev.next = node.next;
            node.next.prev = node.prev;

            cacheTail.prev.next = node;
            node.prev = cacheTail.prev;
            node.next = cacheTail;
            cacheTail.prev = node;
            return;
        }

        // 최신 캐시 추가
        Node newNode = new Node(key, value);
        if (size < capacity) {
            // head <-> newNode <-> tail
            cacheTail.prev.next = newNode;
            newNode.prev = cacheTail.prev;
            newNode.next = cacheTail;
            cacheTail.prev = newNode;
            size++;
        }
        // 가장 안쓴 캐시 제거 & 최신 캐시로 갱신
        else {
            // 가장 안쓴 캐시 제거
            // head <-> oldCache <-> oldCache.next <-> tail
            Node oldCache = cacheHead.next;
            oldCache.next.prev = cacheHead;
            cacheHead.next = oldCache.next;
            cacheTable[oldCache.key] = null;

            // head <-> node.prev <-> node <-> node.next <-> tail
            cacheTail.prev.next = newNode;
            newNode.prev = cacheTail.prev;
            newNode.next = cacheTail;
        }
        cacheTable[key] = newNode;
    }

    private void printCache() {
        Node node = cacheHead;
        System.out.print("head -> ");
        while (node != null) {
            System.out.print(node.key + "-> ");
            node = node.next;
        }
        System.out.print("tail");
        System.out.println();
    }
}
```

# 해결한 코드

`HashMap` + 이중 연결 리스트를, `addToHead` / `removeNode` / `removeTail` 헬퍼로 분리해 깔끔하게 다시 짠 버전. 포인터 연결을 헬퍼 한 곳에서만 다루니 실수가 사라졌다.

```java
class Node {
    int key;
    int value;
    Node prev;
    Node next;

    Node(int key, int value) {
        this.key = key;
        this.value = value;
    }
}

class LRUCache {
    int capacity;
    HashMap<Integer, Node> map;
    Node head;
    Node tail;

    LRUCache(int capacity) {
        this.capacity = capacity;
        map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            removeNode(node);
            addToHead(node);
            return node.value;
        }
        return -1;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            removeNode(node);
            addToHead(new Node(key, value));
        } else {
            if (map.size() == capacity) {
                Node node = removeTail();
                map.remove(node.key);
            }
            addToHead(new Node(key, value));
        }
    }

    private void addToHead(Node node) {
        Node next = head.next;
        node.prev = head;
        node.next = next;
        head.next = node;
        next.prev = node;
        map.put(node.key, node);
    }

    private void removeNode(Node node) {
        Node prev = node.prev;
        Node next = node.next;
        prev.next = next;
        next.prev = prev;
    }

    private Node removeTail() {
        Node node = tail.prev;
        removeNode(node);
        return node;
    }
}
```

> 전체 풀이 기록: [initi8ors/algorithm2024](https://github.com/initi8ors/algorithm2024/blob/main/001week/lru-cache_lth.md)
