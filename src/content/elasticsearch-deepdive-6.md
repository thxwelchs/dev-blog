---
layout: post
category: "엔지니어링"
series: "ElasticSearch 딥다이브"
seriesOrder: 6
title: "ElasticSearch 딥다이브 - 6: 역색인을 Java로 직접 만들어보기"
author: thxwelchs
tags: ["ElasticSearch", "역색인", "BM25", "Java"]
image: /img/covers/eng/elasticsearch-deepdive-6.png
date: "2023-02-18T14:20:05.000Z"
draft: false
---

[5편](/elasticsearch-deepdive-5/)까지 ES를 "쓰는 사람" 입장에서 역색인부터 분산까지 정리해보고 많은 부분을 명확히 이해할 수 있었습니다. 그러다 보니 직접 역색인 구조를 Java로 구현해보면 어떨까? 라는 생각이 들었습니다. 그래서 마지막 편은 그 핵심(역색인 자료구조 + 분석기 + BM25)을 Java로 직접 만들어보기로 했습니다. 아무래도 직접 구현을 해보면 더 피부로 와닿게 느껴지는 부분도 있을 것 같다는 생각이 들었는데, 시간이 이렇게 생각보다 많이 소요될 줄은 몰랐습니다. 😅

환경은 JDK 17(LTS), 테스트는 JUnit 5, 벤치마크는 JMH로 했습니다.

# 무엇을 만들 것인가

어디까지 만들지 고민을 좀 했는데, 현실적으로 ES 구성을 다 구현할 수는 없을 것 같고, 최대한 단순화된 구조로 2~3편에서 본 걸 최소한으로만 추리기로 했습니다.

- 분석기: 텍스트를 토큰으로 쪼개고 소문자화(2편의 tokenizer + lowercase만 흉내).
- 역색인: "단어 → 그 단어가 든 문서 목록(postings)"으로 뒤집어 저장.
- BM25: 검색 결과에 점수를 매겨 정렬(3편).
- 비교용 풀스캔 검색기: 역색인 없이 모든 문서를 훑는 방식(RDB의 `LIKE '%word%'`에 해당).

마지막의 풀스캔을 같이 둔 건, "역색인이 정말 빠른가"를 같은 데이터로 재보기 위해서입니다.

# 분석기부터

제일 단순합니다. 공백으로 쪼개고 소문자로 바꾸는 게 전부입니다.

```java
public class Analyzer {

    public List<String> analyze(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return tokens;
        }
        for (String raw : text.trim().split("\\s+")) {
            if (!raw.isEmpty()) {
                tokens.add(raw.toLowerCase());
            }
        }
        return tokens;
    }
}
```

실제 ES analyzer는 character filter·tokenizer·token filter의 파이프라인이지만, 여기선 핵심만 구현해보기 위해 추렸습니다. 색인할 때도, 검색할 때도 이 분석기를 똑같이 거쳐야 term이 맞는다는 점(2편)이 코드로도 그대로 구현되게 되었습니다.

# 역색인 자료구조

핵심입니다. `단어 → (문서 id → 그 문서에서의 등장 횟수)` 형태로 뒤집어 담습니다. 등장 횟수(term frequency)와 문서 길이를 같이 들고 있어야 나중에 BM25를 계산할 수 있어서, 그것도 함께 모읍니다.

```java
public class InvertedIndex {

    // term -> (docId -> 그 문서에서의 등장 횟수)
    private final Map<String, Map<Integer, Integer>> postings = new HashMap<>();

    // docId -> 그 문서의 토큰 수(길이)
    private final Map<Integer, Integer> docLengths = new HashMap<>();

    private final Analyzer analyzer = new Analyzer();
    private final BM25Similarity similarity = new BM25Similarity();
    private long totalLength = 0;

    public void add(int docId, String text) {
        List<String> tokens = analyzer.analyze(text);
        docLengths.put(docId, tokens.size());
        totalLength += tokens.size();
        for (String term : tokens) {
            Map<Integer, Integer> docFreqs = postings.computeIfAbsent(term, key -> new HashMap<>());
            docFreqs.merge(docId, 1, Integer::sum);
        }
    }
}
```

문서를 넣을 때마다 토큰을 쪼개 postings를 채웁니다. "사과"가 doc1, doc2에 있으면 `postings["사과"] = {1: 횟수, 2: 횟수}`가 되는 식입니다. 이게 2편에서 그림으로 봤던 "단어 → 문서 목록"을 그대로 자료구조로 옮긴 셈입니다.

그럼 검색은 어떻게 빨라질까요? 풀스캔처럼 모든 문서를 훑는 게 아니라, `postings`에서 그 단어를 바로 꺼내면 후보 문서가 손에 들어옵니다. 맵 조회 한 번이라 문서 수가 늘어도 이 단계는 느려지지 않습니다.

# BM25로 점수 매기기

후보 문서를 꺼냈으면 순서는 어떻게 정할까요? 3편에서 본 BM25를 그대로 옮겼습니다. idf는 드문 단어일수록 크고, tf는 많이 나올수록 오르되 완만해지며, 긴 문서는 약간 깎입니다.

```java
public class BM25Similarity {

    private final double k1 = 1.2;
    private final double b = 0.75;

    // 드문 단어일수록 큰 값. Lucene식 BM25 idf.
    public double idf(int totalDocs, int docFreq) {
        return Math.log(1.0 + (totalDocs - docFreq + 0.5) / (docFreq + 0.5));
    }

    // tf 포화 + 문서 길이 정규화
    public double tfNorm(int termFreq, int docLength, double averageLength) {
        double norm = k1 * (1 - b + b * (docLength / averageLength));
        return (termFreq * (k1 + 1)) / (termFreq + norm);
    }
}
```

검색은 이 둘을 합칩니다. 쿼리의 각 단어로 postings를 꺼내고, 문서마다 `idf * tfNorm`을 더해 점수를 만든 뒤 높은 순으로 정렬합니다. 여기 나오는 `documentCount()`와 `averageLength()`는 모아둔 문서 수와 평균 길이를 돌려주는 간단한 메서드라 따로 안 실었습니다.

```java
public List<Hit> search(String query) {
    List<String> terms = analyzer.analyze(query);
    Map<Integer, Double> scores = new HashMap<>();
    int n = documentCount();
    double avgdl = averageLength();

    for (String term : terms) {
        Map<Integer, Integer> docFreqs = postings.getOrDefault(term, Map.of());
        int df = docFreqs.size();
        if (df == 0) {
            continue;
        }
        double idf = similarity.idf(n, df);
        for (Map.Entry<Integer, Integer> entry : docFreqs.entrySet()) {
            int docId = entry.getKey();
            int tf = entry.getValue();
            int docLen = docLengths.get(docId);
            scores.merge(docId, idf * similarity.tfNorm(tf, docLen, avgdl), Double::sum);
        }
    }

    List<Hit> hits = new ArrayList<>();
    scores.forEach((docId, score) -> hits.add(new Hit(docId, score)));
    hits.sort((left, right) -> Double.compare(right.score(), left.score()));
    return hits;
}
```

여기까지가 ES match 쿼리(3편)의 뼈대입니다. 분석 → postings 조회 → BM25 → 정렬.

# 테스트로 확인하기

테스트코드로 자료구조와 점수 규칙을 하나씩 검증해봤습니다.

```java
@Test
void 역색인은_단어를_문서목록으로_뒤집어_저장한다() {
    InvertedIndex index = new InvertedIndex();
    index.add(1, "사과 바나나");
    index.add(2, "사과 딸기");
    index.add(3, "바나나 딸기");

    assertThat(index.postingsFor("사과").keySet()).containsExactlyInAnyOrder(1, 2);
    assertThat(index.postingsFor("바나나").keySet()).containsExactlyInAnyOrder(1, 3);
}

@Test
void 검색어가_많이_나온_문서가_점수가_높다() {
    InvertedIndex index = new InvertedIndex();
    index.add(1, "사과");
    index.add(2, "사과 사과 사과");

    List<Hit> hits = index.search("사과");
    assertThat(hits.get(0).docId()).isEqualTo(2);
}
```

BM25의 성질은 별도로 검증했습니다. idf가 드문 단어에서 크다는 것, tf가 오를수록 점수가 오르되 증가폭이 줄어든다(포화)는 것, 같은 빈도면 긴 문서가 점수가 낮다는 것 정도로 진행했습니다.

```java
@Test
void tf가_오르면_점수가_오르되_완만해진다() {
    double one = bm25.tfNorm(1, 10, 10.0);
    double two = bm25.tfNorm(2, 10, 10.0);
    double three = bm25.tfNorm(3, 10, 10.0);
    assertThat(two).isGreaterThan(one);
    assertThat(three).isGreaterThan(two);
    assertThat(two - one).isGreaterThan(three - two);   // 증가폭이 줄어든다
}
```

제일 신경 쓰였던 건 역색인 결과가 풀스캔과 정확히 같은지 대조하는 테스트였습니다. 빠른 길(역색인)과 느린 길(풀스캔)이 같은 문서 집합을 내놓아야 비로소 "빠르기만 한 게 아니라 맞기도 하다"가 되니까요.

```java
@Test
void 역색인과_풀스캔이_같은_문서집합을_찾는다() {
    // ... 2000개 문서를 양쪽에 똑같이 넣고 ...
    Set<Integer> fromIndex = index.search("포도").stream().map(Hit::docId).collect(toSet());
    Set<Integer> fromScan = new HashSet<>(linear.search("포도"));
    assertThat(fromIndex).isEqualTo(fromScan);
}
```

전체 14개를 돌리니 다 통과했습니다.

```text
AnalyzerTest        > 공백으로_쪼개고_소문자화한다()              PASSED
BM25Test            > 드문_단어가_흔한_단어보다_idf가_크다()       PASSED
BM25Test            > tf가_오르면_점수가_오르되_완만해진다()        PASSED
InvertedIndexTest   > 역색인은_단어를_문서목록으로_뒤집어_저장한다()  PASSED
InvertedIndexTest   > 검색어가_많이_나온_문서가_점수가_높다()        PASSED
InvertedIndexTest   > 역색인과_풀스캔이_같은_문서집합을_찾는다()      PASSED
...                                                          (14개 전부 PASSED)
```

# 풀스캔과 벤치마크

마지막으로 진짜 궁금했던 것. 역색인이 풀스캔보다 정말 빠를까요? 2편에서 MySQL로 LIKE vs FULLTEXT를 재봤는데, 이번엔 직접 구현한 코드로도 같은 비교를 해보았습니다. 같은 데이터(문서 20만 건, 한 건당 단어 30개)를 역색인과 풀스캔에 똑같이 넣고, JMH로 검색 한 번의 평균 시간을 쟀습니다.

```text
Benchmark                              Mode  Cnt      Score      Error  Units
SearchBenchmark.invertedIndexSearch    avgt    3   1752.242 ± 305.734  us/op
SearchBenchmark.linearScanSearch       avgt    3  40996.729 ± 382.060  us/op
```

역색인은 약 1.75ms, 풀스캔은 약 41ms. 같은 검색에 **약 23배** 차이가 났습니다. 역색인 쪽 1.75ms에는 후보 문서들의 BM25 점수 계산과 정렬까지 포함돼 있는데도 그렇습니다. 풀스캔은 20만 건의 본문을 매번 처음부터 끝까지 훑으니 데이터가 늘수록 그만큼 더 느려지고, 역색인은 단어로 후보만 바로 꺼내니 그 격차가 벌어지는 것 같았습니다.

재미있는 건 이 격차가 2편의 MySQL 벤치마크(LIKE 117ms vs FULLTEXT 5ms, 약 23배)와 같은 배수였다는 점입니다. 숫자가 딱 맞아떨어진 건 우연이겠지만, 결국 MySQL FULLTEXT든, ES든, 직접 만든 이 장난감 정도의 구현 코드이든 "역색인이라 빠른" 원리는 같았습니다. 빠르기의 본질은 결국 자료구조에 있다는 걸 다시 한번 깨닫는 순간이었습니다.

> 물론 이건 아주 극히 일부분의 구현으로만 이루어진, 정확하지 않은 장난스러운 벤치마크입니다. 맥북·단일 스레드·JMH 기본 설정이고, 실제 Lucene은 postings 압축·skip list·캐시 같은 정교한 최적화가 들어가 있어 차원이 다르겠지만.. "왜 빠른가"의 근원적인 원리를 직접 구현해보는 데에 의미가 있었던 것 같습니다.

# 시리즈를 마치며

여섯 편에 걸쳐 ES를 매핑부터 분석, 검색, 저장 구조, 분산까지 따라가고, 마지막엔 그 핵심을 직접 만들어 테스트와 벤치마크로 확인까지 해봤습니다. 직접 구현해보니 글로 정리할 때보다 확실히 또렷해졌습니다. 역색인은 결국 "단어 → 문서 목록"으로 뒤집어 둔 맵 하나였고, BM25는 idf에 tf·문서 길이 보정을 곱한 식이었으며, 검색은 그 둘을 잇는 짧은 흐름이었음.

ES를 처음 열었을 때 막막했던 게, 안을 이만큼 들여다보고 나니 "그래서 이렇게 동작하는구나"가 꽤 보이는 듯합니다. 물론 실제 Lucene은 이보다 훨씬 정교하겠지만, 적어도 출발점이 된 듯한 느낌입니다.

# 참고

> [Apache Lucene: BM25Similarity](https://lucene.apache.org/core/9_0_0/core/org/apache/lucene/search/similarities/BM25Similarity.html)
> [JMH (Java Microbenchmark Harness)](https://github.com/openjdk/jmh)
