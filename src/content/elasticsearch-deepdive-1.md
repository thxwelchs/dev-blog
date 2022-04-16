---
layout: post
category: "엔지니어링"
series: "ElasticSearch 딥다이브"
seriesOrder: 1
title: "ElasticSearch 딥다이브 - 1: 문서 모델과 매핑"
author: thxwelchs
tags: ["ElasticSearch", "매핑", "text", "nested"]
image: /img/covers/eng/elasticsearch-deepdive-1.png
date: "2022-04-16T10:51:53.000Z"
draft: false
---

최근에 새로운팀에 합류하면서, 주 DB를 ElasticSearch로 활용하게 되었습니다. RDBMS만 접해왔다보니 개념 숙지가 너무 어려웠습니다. "인덱스가 테이블인가? 매핑이 스키마고?" 하면서 관계형 모델로 자꾸 끼워 맞추다 오히려 더 헷갈리더라구요 😭💦 그래서 ES를 기초부터 저장 구조까지, 그리고 이왕이면 직접 구현해보는것까지 정리해보기로 했습니다. (아주 긴 시간이 소요될것 같습니다)

1편은 ES가 데이터를 다루는 방식, 그리고 그 데이터 구조를 어떻게 정의하는지에 대해 알아보고자 합니다.

# RDBMS와 ElasticSearch, 닮은 듯 다른 구조

처음엔 용어를 일대일로 대응시키고 싶어서, 저는 일단 이렇게 표로 정리해놓고 시작했습니다.

```text
RDBMS              ElasticSearch
─────────────────────────────────
Table          ≈   Index
Row            ≈   Document
Column         ≈   Field
Schema         ≈   Mapping
```

위와 같이 1:1 대응을 시켜놓고 보면 금방 모순적인 부분이 보이기 시작하는데요. 가장 큰 차이는 ES가 행이 아니라 문서(document)를 다룬다는 점입니다. 문서는 JSON 한 덩어리고, JSON이기 때문에 중첩객체나 배열도 들어갈 수 있습니다. 관계형처럼 정규화해서 여러 테이블로 쪼개는 게 아니라, 검색해서 응답으로 돌려줄 형태 그대로 한 문서에 담아두는 쪽에 가깝습니다.

조인도 마찬가지였습니다. ES에는 우리가 아는 테이블 조인이 사실상 없습니다. 그래서 관계형에서 하던 "정규화하고 조인" 습성을 그대로 활용하려고 하면 어려움이 있습니다 😅 오히려 필요한 데이터를 한 문서에 다 모으는, 그러니까 정규화에 집중되어있는 RDB와는 반대로 역정규화 설계가 자연스러웠습니다. 저는 이 차이를 피부로 와닿게 깨닫는데까지 꽤 시간이 걸렸던것 같습니다.

# 문서를 넣고 빼기, REST CRUD

ElasticSearch의 또 다른 큰 차이는 모든 조작이 HTTP REST로 이뤄진다는 거였습니다. 인덱스를 만들고 문서를 넣는 것도 그냥 HTTP 요청으로 이루어집니다. 따라서, RDB에서 데이터 명령을 하기위해 사용했던 SQL 문법이 아닌 조금 더 직관적인 Rest 방식을 거의 그대로 활용할수 있습니다.

```json
PUT /products/_doc/1
{
  "name": "사과",
  "price": 1000,
  "tags": ["과일", "신선식품"]
}
```

조회는 `GET /products/_doc/1`, 전체 교체는 같은 id로 다시 `PUT`, 일부 수정은 `POST /products/_update/1`, 삭제는 `DELETE /products/_doc/1`. id를 지정하면 `PUT`, ES가 id를 만들게 하려면 `POST /products/_doc`로 보냅니다. 여기서 알아둘 점 하나. 같은 id로 다시 넣는 건 "수정"이라기보다 새 버전으로 통째로 다시 색인되는 것에 가깝습니다. 이 부분은 저장 구조를 다루는 포스팅을 하게된다면 그 때 짚고 넘어가보겠습니다.

# 동적 매핑, 편하지만 또 위험한...

ES가 매력적으로 느껴진 건 매핑을 미리 안 만들어도 문서가 들어간다는 점이었습니다. 위에서 그냥 문서를 넣었는데, ES가 알아서 `name`은 문자열, `price`는 숫자로 타입을 추론해 매핑을 만들어줍니다. 이걸 동적 매핑(dynamic mapping)이라고 합니다. RDB에서는 테이블을 생성하지 않는 이상 Row INSERT가 불가한것에 아주 반하는 성격입니다.

편의를 제공할수도 있지만, 프로덕션 환경에서는 조심하지 않으면 정말 위험할수 있겠다라는 생각부터 들었습니다.

- 타입 추론이 늘 원하는 대로 되진 않습니다. `"price": "1000"`처럼 숫자를 리터럴로 보내면 문자열로 인식할 수 있습니다. 첫 문서 모양에 매핑이 좌우되는 셈입니다.
- 또 한 번 정해진 필드 타입은 못 바꿉니다. 나중에 "이건 숫자였어야 했는데"라고 후회가 들어서 변경하고 싶어도 변경할 수 없습니다. 결국 새 인덱스를 만들어 다시 넣는 재색인(reindex) 작업이 필요합니다.
- 필드가 통제 없이 늘어날수 있습니다. 들어오는 JSON에 새 키가 생길 때마다 필드가 추가되는데, 키가 가변적인 데이터를 그대로 받으면 필드 수가 폭발(mapping explosion)합니다. 필드 하나하나가 메모리·디스크 성능에 영향을 줄 수 있습니다.

그래서 동적 매핑은 상황에 맞추어 적절히 활용해야 할 것 같고, 운영 인덱스에서는 매핑을 명시적으로 잡는 게 안전한 것 같습니다. 다른 방법으로는, `dynamic`을 `strict`로 둬서 매핑에 없는 필드가 오면 거부하게 만들 수도 있습니다.

# 명시적 매핑, text냐 keyword냐

명시적 매핑은 뭘 정하는 걸까요? ES에서는 여러 필드 타입이 있지만, 그 중 문자열을 다룰때 필드 타입에는 text와 keyword가 존재합니다. 타입에 따라 쓰임이 전혀 달라지는 문자열 기준이 됩니다.

- `text`: 값을 분석기(analyzer)에 태워 단어로 쪼개 색인합니다. 전문 검색(full-text)용. `"사과 바나나"`가 `[사과, 바나나]`로 들어가 "사과"로 검색해도, 바나나로 검색해도 검색 범위에 포함됩니다.
- `keyword`: 쪼개지 않고 값 통째로 하나의 토큰입니다. 정확일치·정렬·집계용. `"사과 바나나"`는 통째로 하나라 사과나 바나나로는 검색범위에 포함되지 않습니다. 한 가지, 동적 매핑이 만드는 keyword엔 기본 `ignore_above: 256` 옵션이 적용되어 256자를 넘는 값은 색인이 통째로 생략됩니다. 긴 문자열을 keyword로 둬야 하는 경우는 주의가 필요합니다.

```json
PUT /products
{
  "mappings": {
    "properties": {
      "title":  { "type": "text" },
      "status": { "type": "keyword" }
    }
  }
}
```

그래서 "이 필드를 쪼개서 검색할 거냐(text), 통째로 매칭·정렬·집계할 거냐(keyword)"를 먼저 결정하고 매핑 구조를 설계하는것이 좋습니다. 상태값·카테고리·태그·ID처럼 정해진 값을 정확히 매칭·집계할 것들은 keyword, 제목·본문처럼 단어로 검색할 것들은 text로 해볼수 있겠죠? 한 가지 헷갈렸던 점은 keyword는 정렬·집계가 되는데 text는 기본적으로 안 된다는 거였습니다(이유는 추후 저장 구조를 다룰 때 정리해보겠습니다). 그럼 검색도 정렬도 하고 싶은 필드는 어떻게 할까요? 그게 바로 멀티 필드입니다.

# 한 필드를 두 모양으로, 멀티 필드

제목을 단어로 검색도 하고 제목 전체로 정렬도 하고 싶다면, 같은 값을 text와 keyword 두 가지로 동시에 색인해두면 됩니다. 이걸 멀티 필드(multi-fields)라고 부릅니다.

```json
PUT /products
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "fields": {
          "raw": { "type": "keyword" }
        }
      }
    }
  }
}
```

이러면 `title`은 분석된 text로 전문 검색에, `title.raw`는 같은 값을 통째로 가진 keyword라 정렬·집계·정확일치에 씁니다. 사실 ES가 문자열을 동적 매핑할 때 기본으로 `text` + `.keyword` 멀티 필드를 만들어주는데, 앞서 본 동적 매핑이 만든 게 바로 이 형태입니다. 직접 매핑을 설계할 땐 필요한 쪽만 두는 게 효율적일것 같습니다.

# 배열에서의 object와 nested 동작 차이

앞서 본 것처럼 ElasticSearch는 문서를 JSON으로 저장하기 때문에 중첩 객체도 그대로 들어갑니다. 그런데 객체 배열을 넣을 때 object와 nested의 차이를 모르면 검색 결과가 이상하게 나올 수 있습니다. 상품에 옵션 목록이 달려 있다고 해보겠습니다.

```json
{
  "name": "티셔츠",
  "options": [
    { "color": "red",  "size": "L" },
    { "color": "blue", "size": "M" }
  ]
}
```

기본값인 object 타입으로 두면 ES는 이 배열을 필드별로 평평하게(flatten) 펴버립니다. 즉 `options.color: ["red","blue"]`, `options.size: ["L","M"]`로 저장돼, 각 객체가 어떤 짝이었는지(빨강-L, 파랑-M)가 사라집니다. 그래서 "color=red 이면서 size=M"을 찾으면 그런 조합이 없는데도 이 문서가 검색범위에 포함되어버립니다. red도 있고 M도 있으니 따로따로는 맞으니까요. 처음 봤을 때 왜 이게 잡히지 싶었는데 이 flatten 때문이었습니다.

이걸 막으려면 nested 타입을 쓸 수있습니다. nested는 배열의 각 객체를 내부적으로 별도의 숨은 문서로 색인해서, 객체 안 필드의 짝(color-size)을 유지합니다.

```json
PUT /products
{
  "mappings": {
    "properties": {
      "options": {
        "type": "nested",
        "properties": {
          "color": { "type": "keyword" },
          "size":  { "type": "keyword" }
        }
      }
    }
  }
}
```

대신 장점만 있는것은 아닙니다. nested는 검색할 때 전용 `nested` 쿼리로 감싸야 하고, 각 객체가 숨은 문서로 색인되니 색인·검색 비용이 더 듭니다. 한 문서에 담는 nested 개수에도 기본 한도(`index.mapping.nested_objects.limit`, 기본 10000)가 있습니다. 그래서 "객체 안 필드들의 짝이 검색에 중요한가"를 기준으로, 중요하면 nested, 아니면 object로 골랐습니다.

# 실제 매핑 체험해보기

매핑 얘기를 글로만 적자니 영 미덥지가 않았습니다. ES 8.1.2 버전 도커 컨테이너 이미지를 활용하여 매핑을 직접 테스트 해보겠습니다.

> 참고로 8.0부터는 보안(TLS·인증)이 기본으로 켜져 있는데, 어차피 로컬에서 잠깐 확인하고 지울 거라 보안 설정까지 하는 건 배보다 배꼽이라 끄고 단일 노드로 띄웠습니다.

```bash
docker run -d --name es812 -p 9200:9200 \
  -e discovery.type=single-node \
  -e xpack.security.enabled=false \
  -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" \
  docker.elastic.co/elasticsearch/elasticsearch:8.1.2
```

먼저 동적 매핑. 숫자처럼 보이는 값을 따옴표로 보내면 어떻게 잡힐까요? `price`를 문자열 `"1000"`으로 넣고 매핑을 확인해봤습니다.

```json
PUT /dyn/_doc/1
{
  "name": "사과",
  "price": "1000"
}

GET /dyn/_mapping
→ "price": {
    "type": "text",
    "fields": {
      "keyword": { "type": "keyword", "ignore_above": 256 }
    }
  }
```

`price`가 숫자가 아니라 `text`(+`.keyword`)로 잡혔습니다. 첫 문서 생김새에 타입이 끌려간다는 게 이렇게 드러났습니다.

object와 nested의 거짓 매칭도 직접 재현해봤습니다. 위의 옵션 배열(`red-L`, `blue-M`)을 두 인덱스에 똑같이 넣고, "color=red 이면서 size=M"으로 검색했더니 이렇게 갈렸습니다.

```text
[object 타입]  hits.total = 1   (red-L, blue-M 뿐인데 잡힘 → 거짓 매칭)
[nested 타입]  hits.total = 0   (실제 그 짝이 없으니 정확히 0)
```

object는 필드가 평평하게 펴져 짝이 깨진다는 게 숫자로 확인됐습니다.

# 정리

ES는 행이 아니라 JSON 문서를 다루고, 조인 대신 비정규화로 설계하며, 조작은 REST로 합니다. 동적 매핑은 편하지만 타입 추론·타입 변경 불가·필드 폭발 때문에 운영에선 명시적 매핑이 안전했습니다. 문자열은 검색용 text와 정확일치·집계용 keyword로 가르고, 둘 다 필요하면 멀티 필드, 객체 배열의 짝이 중요하면 nested로 뒀습니다. 결국 매핑은 "이 필드를 어떻게 검색·정렬·집계할 것인가"를 미리 정하는 작업이었습니다.

# 참고

> [Elasticsearch Reference: Mapping](https://www.elastic.co/guide/en/elasticsearch/reference/8.1/mapping.html)
> [Elasticsearch Reference: Nested field type](https://www.elastic.co/guide/en/elasticsearch/reference/8.1/nested.html)
