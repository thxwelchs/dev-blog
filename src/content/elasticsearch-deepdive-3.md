---
layout: post
category: "엔지니어링"
series: "ElasticSearch 딥다이브"
seriesOrder: 3
title: "ElasticSearch 딥다이브 - 3: Query DSL과 스코어링"
author: thxwelchs
tags: ["ElasticSearch", "QueryDSL", "BM25", "검색"]
image: /img/covers/eng/elasticsearch-deepdive-3.png
date: "2022-09-17T13:12:24.000Z"
draft: false
---

[2편](/elasticsearch-deepdive-2/)에서 역색인이 만들어지는 과정을 봤습니다. 이제 그 위에서 검색을 해볼 차례인데요. 이번 편은 ES의 검색 언어인 Query DSL에서 제일 자주 쓰는 것들, match와 term의 차이, bool 쿼리, 그리고 결과 순서를 정하는 스코어링(BM25)을 봅니다.

# match와 term, 분석하느냐 마느냐

검색하다 제일 먼저 이해가 어려웠던 부분이 match와 term의 차이였습니다. 둘 다 "이 필드에서 이 값을 찾아줘"인데 동작이 미묘하게 다릅니다.

- `match`: 검색어도 분석기에 태운 뒤 검색합니다. 그래서 전문 검색에 씁니다.
- `term`: 검색어를 분석하지 않고 있는 그대로 term과 정확히 비교합니다. keyword·숫자·날짜 같은 정확일치에 씁니다.

이 차이를 모르면 자주 헷갈리는 함정이 있습니다. text 필드에 term을 쓰는 경우입니다. `"title": "Quick Brown"`을 표준 분석기로 색인하면 역색인엔 소문자 `quick`, `brown`이 들어가 있습니다. 그런데 `term`으로 `"Quick"`을 찾으면, term은 분석을 안 하니 대문자 그대로 `Quick`을 찾고, 역색인엔 소문자 `quick`만 있어서 안 잡힙니다.

```json
GET /articles/_search
{
  "query": {
    "term": { "title": "Quick" }
  }
}
```

분명 있는 단어인데 왜 0건이 나올까요? 색인된 term은 소문자인데 term 쿼리는 분석을 안 하기 때문입니다. 그래서 text 필드를 정확히 매칭할 일이 있으면 보통 멀티 필드의 `title.keyword`(1편)에 term을 걸거나, 전문 검색이면 match를 씁니다. 정리하면 분석된 text엔 match, 분석 안 한 keyword엔 term이 짝이었습니다.

# 복합 조건은 bool로 엮는다

조건이 하나면 위처럼 끝이지만, 실무 검색은 보통 여러 개를 겹쳐 씁니다. 이걸 엮는 게 bool 쿼리인데, 네 가지 절(clause)로 묶습니다.

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must":     [ { "match": { "name": "셔츠" } } ],
      "should":   [ { "match": { "name": "면" } } ],
      "must_not": [ { "term":  { "status": "sold_out" } } ],
      "filter":   [ { "range": { "price": { "lte": 30000 } } } ]
    }
  }
}
```

각 절의 역할이 처음엔 안 외워졌는데, 점수에 영향을 주는지로 묶으니 그제야 정리가 됐습니다.

- `must`: 반드시 만족해야 하고, 점수에 반영됩니다(AND).
- `should`: 만족하면 점수가 올라갑니다. 선택 조건(OR에 가까움).
- `must_not`: 만족하면 제외됩니다. 점수에 영향 없음.
- `filter`: 반드시 만족해야 하지만 점수에는 영향이 없습니다.

여기서 한 가지. must와 filter는 둘 다 "반드시"인데, 그럼 뭐가 다를까요? filter는 점수 계산을 안 하고 결과를 캐시할 수 있어 더 가볍습니다. 그래서 "연관성 점수가 필요한 조건"은 must, "그냥 거르기만 하면 되는 조건"(가격 범위, 카테고리, 상태값)은 filter에 두는 게 성능상 유리하기 때문에, 저는 정확일치 조건들은 거의 filter로 보내는 편입니다.

`should`에도 함정이 하나 있었습니다. `must`나 `filter`가 같이 있으면 `should`는 "맞으면 점수 가산" 정도라 하나도 안 맞아도 결과가 나오는데, `should`만 단독으로 쓰면 그중 최소 하나는 만족해야 합니다(`minimum_should_match`의 기본값이 상황에 따라 갈리는 거죠). 이걸 모르고 should를 사용하면 헷갈릴 수 있는 부분이었습니다.

# 점수는 어떻게 매겨지나, BM25

match로 검색하면 결과에 `_score`가 붙어 내려옵니다. 그럼 이 점수는 무슨 기준으로 정해질까요? 이 점수 순으로 정렬도 이루어지게 되는데, ES는 5.0부터 BM25를 기본 유사도로 활용하게 됩니다(그 전엔 TF-IDF였음). 이름은 거창하지만 잘 살펴보면 다음과 같습니다.

- 문서에 검색어가 많이 나올수록 점수가 오릅니다. 이게 term frequency인데, 무한정 오르진 않고 완만해집니다.
- 그 단어가 전체 문서에서 드물수록 점수가 큽니다. 흔한 단어는 변별력이 없으니까요. 이것을 인버스 도큐먼트 프리퀀시(inverse document frequency)라고 부릅니다.
- 문서가 너무 길면 약간 깎습니다. 긴 글은 단어가 많이 나오는 게 당연하니까요.

기본 파라미터는 `k1 = 1.2`, `b = 0.75`였습니다. k1은 term frequency가 점수에 기여하는 상한 느낌이고, b는 문서 길이 보정을 얼마나 줄지를 정합니다. 보통은 기본값으로 충분한 듯했고, 점수가 의도와 다를 때나 수정이 필요합니다.

점수가 왜 이렇게 나왔는지 궁금할 때, `explain`이라는 걸 활용하면 실행 계획을 통해 계산 과정을 그대로 살펴볼 수 있었습니다.

```json
GET /articles/_search
{
  "explain": true,
  "query": { "match": { "body": "사과" } }
}
```

term frequency, idf, 길이 보정이 각각 얼마였는지 분해해서 보여줍니다. "이 문서가 왜 위에 떴지", "왜 저 문서보다 점수가 낮지" 같은 의문이 들 때 `explain`을 활용해 실행 계획을 보는 것도 하나의 방법일 듯합니다.

# term은 0건, match는 1건

앞에서 말한 term-match 차이, 진짜 그렇게 갈릴까요? 8.1.2에 직접 넣어봤습니다. `title`을 text로 색인하고(`"Quick Brown"`), 대문자 그대로 term으로 찾을 때와 소문자로 match할 때를 각각 요청해서 결과를 보면,

```text
# term: 분석 안 함 (대문자 Quick 그대로 찾음)
GET /articles/_search  { "query": { "term":  { "title": "Quick" } } }
# match: 검색어도 분석됨 (quick 으로 매칭)
GET /articles/_search  { "query": { "match": { "title": "quick" } } }

[term  title=Quick]  hits.total = 0                       (역색인엔 소문자 quick뿐, term은 분석을 안 함)
[match title=quick]  hits.total = 1   _score = 0.2876821  (검색어도 분석돼 매칭됨)
```

term은 정말로 0건으로 검색되지 않는 것을 볼 수 있습니다. match로 잡힌 문서엔 `_score`가 붙어 내려오는데, 위에서 말한 BM25 점수가 이 경우엔 `0.2876821`로 찍혔습니다. 공식으로만 보던 게 실제 숫자 하나로 잡히니 한결 손에 잡혔습니다.

# 정리

match는 검색어를 분석해 전문 검색에, term은 분석 없이 정확일치에 씁니다. text에 term을 걸면 분석 불일치로 안 잡히니 주의해야 했음. 복합 조건은 bool로 엮되, 점수가 필요 없는 거르기는 filter로 보내 가볍게 했습니다. 순서는 BM25가 term frequency·idf·문서 길이로 매기고, `explain`으로 그 계산을 직접 확인할 수 있었습니다. 검색이 기대와 다르게 나올 땐 아마 이 셋 중 하나가 어긋난 경우가 많지 싶습니다.

# 참고

> [Elasticsearch Reference: Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/8.1/query-dsl.html)
> [Elasticsearch Reference: Boolean query](https://www.elastic.co/guide/en/elasticsearch/reference/8.1/query-dsl-bool-query.html)
