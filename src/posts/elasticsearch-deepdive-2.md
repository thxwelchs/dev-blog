---
layout: post
category: "엔지니어링"
series: "ElasticSearch 딥다이브"
seriesOrder: 2
title: "ElasticSearch 딥다이브 - 2: 역색인과 텍스트 분석"
author: thxwelchs
tags: ["ElasticSearch", "역색인", "Analyzer", "Nori"]
image: /img/covers/eng/elasticsearch-deepdive-2.png
date: "2022-06-18T12:56:45.000Z"
draft: false
---

[1편](/elasticsearch-deepdive-1/)에서 문자열을 text로 두면 분석기에 태워 단어로 쪼갠다고 했습니다. 이번 편은 그 "쪼개고 저장하는" 과정을 들여다봅니다. 검색이 빠른 뿌리인 역색인(inverted index), 그리고 그걸 만드는 분석기(analyzer)입니다.

# 역색인, 검색을 빠르게 하는 자료구조

`LIKE '%사과%'`가 느린 이유는 단순합니다. 인덱스를 못 타고 모든 행의 문자열을 처음부터 끝까지 다 훑어야 하니까요. 이른바 풀스캔입니다. 행이 1만개면 1만번을 비교해야 하는 것입니다. ES는 색인할 때 미리 단어를 쪼개서 "이 단어가 어느 문서에 있는지"를 뒤집어 저장해둡니다. 이런 구조를 역색인이라고 부르는데, ES 검색이 빠른 건 결국 이 구조 때문에 그렇습니다.

보통 떠올리는 구조는 "문서 → 그 안의 단어들"입니다. forward index라고 합니다. 역색인은 이걸 뒤집어 "단어 → 그 단어가 든 문서들"로 둡니다. 책 뒤에 있는 인덱스랑 똑같은 발상이죠.

```text
doc1: "사과 바나나"
doc2: "사과 딸기"
doc3: "바나나 딸기"
```

이걸 색인하면 역색인은 이렇게 만들어집니다.

```text
term(단어)   →  postings(그 단어가 든 문서 목록)
─────────────────────────────────────────────
바나나        →  [doc1, doc3]
딸기          →  [doc2, doc3]
사과          →  [doc1, doc2]
```

왼쪽의 단어 목록을 term dictionary, 오른쪽의 문서 목록을 postings list라고 부릅니다. term은 정렬돼 있어서 "사과"로 검색하면 사전에서 빠르게 찾아 `[doc1, doc2]`를 바로 꺼냅니다. 문서를 전부 훑는 게 아니라 단어 하나로 답을 바로 집어오는 구조이기 때문에 빠를 수밖에 없는 것입니다.

# 그럼 RDB는 텍스트 검색을 못 할까?

여기서 짚고 갈 게 있습니다. "LIKE가 느리니 ES"라고만 하면, RDB에는 역색인 기능이 없나 싶을 수도 있지만 사실 RDB에도 역색인이 있습니다. MySQL은 `FULLTEXT` 인덱스(내부가 역색인), PostgreSQL은 `tsvector` + GIN 인덱스를 제공하고, MySQL은 한국어를 위해 ngram 파서(`WITH PARSER ngram`)도 5.7.6부터 제공됩니다. 그럼 RDB 역색인 구조와 ES 역색인 구조의 성능 차이는 없을까? 궁금해서 직접 재봤습니다.

같은 한국어 문서 20만 건(본문 평균 89자)을 MySQL과 ES에 똑같이 넣고 한 단어로 검색했습니다. 셋 다 19,018건이 잡혔고, 워밍업 후 쿼리 시간은 이렇게 갈렸습니다.

```text
방식                                  쿼리 시간(워밍업 후)
─────────────────────────────────────────────────
MySQL  LIKE '%단어%' (풀스캔)            약 117 ms
MySQL  FULLTEXT MATCH (ngram 역색인)     약 5 ms
ElasticSearch  match (역색인)           약 1 ms
```

맥북·도커에 20만 건, COUNT 쿼리 기준이라 절대값은 환경마다 다른데, 주목해보아야 할 건 자릿수입니다. 느린 건 LIKE의 풀스캔이지 "RDB라서"가 아니었습니다. FULLTEXT로 역색인을 태우면 MySQL도 ES와 같은 한 자릿수 ms대로 검색되는 걸 보아, 둘의 속도 차이가 크게 체감될 수준은 아닐 것 같았습니다. 게다가 LIKE는 데이터가 늘수록 선형으로 느려지지만, 역색인 구조의 둘은 규모가 커져도 거의 그대로입니다.

그럼 속도가 비슷한데 왜 ES를 쓸까요? 빠르기뿐 아니라, 다른 것에 그 차이가 있습니다. 형태소·동의어·커스텀 분석기 같은 텍스트 분석의 깊이라든가, BM25를 활용한 랭킹 튜닝이라든가, 샤딩·레플리카 등을 활용한 분산·확장 등이 제공되는 ES의 생태계가 텍스트 역색인 구조에서는 압도적이기 때문입니다. 그래서 검색이 가벼우면 FULLTEXT로도 충분히 가능하지 않을까 싶었고, 분석·랭킹·규모가 필요해질 때 ES를 고려해볼 수 있지 않을까 싶었습니다. "역색인이 있냐"가 아니라 "검색을 얼마나 정교하게, 크게 굴릴 거냐"가 진짜 갈림길인 것 같습니다.

# 단어로 쪼개는 과정, 분석기의 3단계

그럼 다시 ES가 단어를 쪼개 역색인하는 과정을 살펴보겠습니다. "사과 바나나" 같은 문장을 어떻게 term으로 쪼갤까요? 색인 시점에 ES가 텍스트를 분석(analysis)합니다. 분석기는 세 단계의 파이프라인으로 돼 있습니다.

```text
원문 ──> [character filter] ──> [tokenizer] ──> [token filter] ──> term들
```

- character filter: 글자 수준 전처리. HTML 태그 제거, 특정 문자 치환 같은 것.
- tokenizer: 텍스트를 토큰으로 쪼갬. 공백 기준이거나, 한국어라면 형태소 기준.
- token filter: 토큰을 다듬음. 소문자화, 불용어(stopword) 제거, 동의어 추가 같은 처리.

예를 들어 영어 표준 분석기로 (우리가 옛날 영어 교과서에서 보던) `"This is a Pen"`을 색인하면, 토큰화 뒤 소문자화를 거쳐 대략 `[this, is, a, pen]` 같은 term으로 들어갑니다.

여기서 제일 중요하게 와닿은 점 하나. 색인할 때 쓴 분석기와 검색할 때 쓰는 분석기가 맞아야 합니다. 색인은 소문자로 했는데 검색은 대문자 그대로 비교하면 term이 안 맞아 결과가 안 나오니까요. ES는 보통 색인용 분석기를 검색에도 같이 적용해주지만, 검색 분석기를 따로 지정할 수도 있어서 이게 어긋나면 "분명 있는데 검색이 안 되는" 상황이 생겼습니다. 색인은 한글 형태소 분석기로 해놓고 검색은 표준 분석기로 나가는 경우가 대표적입니다.

분석기가 실제로 어떻게 쪼개는지는 머릿속으로 짐작하지 말고 `_analyze`로 찍어보는 게 제일 확실합니다.

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "This is a Pen"
}
```

매핑이 의도대로 쪼개지는지, 검색이 왜 안 잡히는지 디버깅할 때 제일 먼저 보게 되는 도구였습니다.

# 한국어는 형태소 분석이 필요하다, Nori

한국어는 왜 또 다를까요? 공백만으로는 잘 안 쪼개집니다. "사과를"이라고 색인했는데 "사과"로 검색하면, 표준 분석기는 "사과를"을 통째로 토큰으로 잡아서 "사과"와 안 맞습니다. 조사가 붙어버리니까요. 그래서 한국어는 형태소 분석기를 따로 붙여야 했는데, ES 공식 플러그인이 Nori입니다.

```json
PUT /articles
{
  "settings": {
    "analysis": {
      "analyzer": {
        "korean": { "type": "nori" }
      }
    }
  },
  "mappings": {
    "properties": {
      "body": {
        "type": "text",
        "analyzer": "korean"
      }
    }
  }
}
```

Nori는 "사과를"을 "사과" + "를(조사)"로 분해해 조사를 떼고 "사과"를 term으로 남깁니다. 그래서 "사과"로 검색해도 잡히게 됩니다. Nori는 품사 태그를 달아주기 때문에, token filter로 특정 품사(조사·어미 같은)를 걸러내는 튜닝도 가능했습니다.

기본 제공 분석기로 부족할 때도 있습니다. 그땐 character filter·tokenizer·token filter를 골라 커스텀 분석기로 조립하면 됐어요. 예를 들어 Nori로 쪼개되 소문자화를 같이 먹이고 싶다면 이렇게 엮습니다.

```json
PUT /articles
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_korean": {
          "type": "custom",
          "tokenizer": "nori_tokenizer",
          "filter": ["lowercase", "nori_part_of_speech"]
        }
      }
    }
  }
}
```

조립하고 나면 또 `_analyze`로 의도대로 나오는지 확인해봐야 합니다. 분석기 설계가 결국 검색 품질을 좌우해서, 이 단계에 시간을 들이는 게 아깝지 않은 것 같았습니다.

# _analyze로 직접 확인

분석기는 머리로 그리지 말고 `_analyze`로 직접 확인해보는 게 직관적이고 빠릅니다. 1편에서 올려둔 8.1.2 노드에 영어 문장을 표준 분석기로 넣어봤더니,

```text
POST /_analyze
{
  "analyzer": "standard",
  "text": "I am the one who knocks"
}
→ [i, am, the, one, who, knocks]
```

전부 소문자로 바뀌었는데, `the`·`who` 같은 불용어가 그대로 남은 게 눈에 띕니다. 표준 분석기는 소문자화만 할 뿐 불용어를 빼진 않거든요. 불용어까지 걸러내고 싶으면 `english` 분석기 같은 걸 따로 써야 합니다. 한국어는 어떨까요? 이번엔 왕좌의 게임의 그 유명한 "Winter is coming", 그러니까 "겨울이 오고 있다"를 표준 분석기와 Nori로 각각 돌려봤습니다(Nori는 `bin/elasticsearch-plugin install analysis-nori` 후 재기동).

```text
[standard]  겨울이 오고 있다  →  [겨울이, 오고, 있다]   (조사·어미가 안 떨어짐)
[nori]      겨울이 오고 있다  →  [겨울, 오, 있]          (조사·어미 분리, 어간 추출)
```

표준 분석기로는 "겨울이"가 조사까지 붙은 채로 남아서, "겨울"로 검색하면 안 잡힙니다. 반면 Nori는 조사를 떼어 "겨울"을 term으로 남기니 "겨울"로 검색하면 걸립니다. 한국어에 형태소 분석기가 왜 필요한지가 이 한 줄로 드러난 셈입니다.

# 정리

역색인은 "단어 → 문서 목록"으로 뒤집어 둔 자료구조라 풀스캔 없이 단어를 바로 집습니다. 그 단어를 만드는 게 분석기이고, character filter → tokenizer → token filter의 3단계를 거칩니다. 색인·검색 분석기가 맞아야 하고, 한국어는 Nori 같은 형태소 분석기가 필요하며, 부족하면 커스텀으로 조립했음. 분석을 어떻게 하느냐가 검색이 잡히고 안 잡히고를 갈랐습니다.

# 참고

> [Elasticsearch Reference: Text analysis](https://www.elastic.co/guide/en/elasticsearch/reference/8.1/analysis.html)
> [Elasticsearch Plugins: Nori (Korean) analysis](https://www.elastic.co/guide/en/elasticsearch/plugins/8.1/analysis-nori.html)
