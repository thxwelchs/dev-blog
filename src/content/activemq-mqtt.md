---
layout: post
category: "엔지니어링"
title: "ActiveMQ로 MQTT를 받아보기 - 프로토콜 다리 놓기"
author: thxwelchs
tags: ["ActiveMQ", "MQTT", "메시징", "JMS"]
image: /img/covers/eng/activemq-mqtt.png
date: "2021-07-13T13:26:20.000Z"
draft: false
---

[지난번](/mqtt-basics/) 가벼운 메세지를 처리하는데 최적화된 MQTT프로토콜에 대해서 다뤘었는데요. 이번에는 MQTT 경량 프로토콜 안에서 실제로 메세지를 받아 보관하고 나눠주는 브로커를 살펴보겠습니다.

실은 MQTT 브로커의 종류로는 다음과 같이 여러가지가 있습니다.

- Mosquitto: 가장 널리 쓰이는 경량 전용 브로커. 작고 단순해서 임베디드나 소규모 환경에 많이 씁니다.
- HiveMQ: 엔터프라이즈 지향의 상용 MQTT 브로커.
- EMQ X: 대규모 동시 접속에 강점이 있는 분산 브로커.
- RabbitMQ: 원래 AMQP 브로커인데 플러그인으로 MQTT도 받을 수 있습니다.
- ActiveMQ: 자바 진영의 JMS 브로커인데 MQTT를 포함한 여러 프로토콜을 같이 지원합니다.

이 중에서 저는 ActiveMQ를 살펴보려고 하는데, Java 생태계에서 JMS 브로커로 익숙하기도 하고 MQTT까지 호환된다는 점이 흥미로워 보였기 때문입니다.

# ActiveMQ는 원래 JMS 브로커다

먼저 정리하고 넘어가면, Apache ActiveMQ는 태생이 JMS(Java Message Service) 브로커입니다. 자바 진영의 메시징 표준 API를 구현한 메시지 미들웨어로, 큐(queue)와 토픽(topic)을 두고 메시지를 중개합니다.

그런데 ActiveMQ를 들여다보다 알게 된 게, 이 브로커는 여러 프로토콜을 동시에 받아들일 수 있다는 거였습니다. 설정 파일에서 transport connector를 열어두면 한 브로커가 OpenWire(ActiveMQ 기본), AMQP, STOMP, 그리고 **MQTT**까지 각기 다른 포트로 동시에 수신합니다.

```xml
<!-- activemq.xml - 프로토콜별로 포트를 연다 -->
<transportConnectors>
    <transportConnector name="openwire" uri="tcp://0.0.0.0:61616"/>
    <transportConnector name="mqtt"     uri="mqtt://0.0.0.0:1883"/>
    <transportConnector name="stomp"    uri="stomp://0.0.0.0:61613"/>
</transportConnectors>
```

여기서 흥미로운 그림이 그려집니다. 센서는 MQTT(1883)로 던지고, 그걸 소비하는 자바 백엔드는 JMS(OpenWire)로 꺼내는 구성이 가능해집니다. 프로토콜이 다른 두 세계를 한 브로커가 다리처럼 이어주는 셈입니다.

## 잠깐, JMS는 또 무엇....?

JMS(Java Message Service)는 자바 진영의 표준 메시징 API인데, 메시지를 보내는 쪽(producer)과 받는 쪽(consumer)이 브로커를 통해 큐(queue, 1:1)나 토픽(topic, 1:N)으로 주고받게 해주는 규약입니다. 즉 JMS는 특정 제품이 아니라 인터페이스이고, ActiveMQ 같은 구현체가 그 규약을 따릅니다.

> 처음엔 이 구조가 왜 좋은지 잘 와닿지 않았는데, 생각해보니 기기 쪽은 MQTT가 사실상 표준인데 그를 구현할 백엔드 애플리케이션에서는 그와 비슷한 행위나 목적에 대해 추상화된 인터페이스가 있으면 유연하게 확장할수 있을것 같았습니다. 그 간극을 애플리케이션 코드로 변환하지 않고 브로커가 흡수해주는 거였습니다.

# MQTT토픽과 JMS토픽은 다르다

MQTT에도 토픽이라는 개념이 있고 JMS 인터페이스에도 토픽이라는 개념이 있습니다. 하지만 이 토픽이라는 용어는 같지만 미묘한 차이점이 있습니다. 가장 헷갈렸던 부분인데, ActiveMQ는 그 사이에서 **이름과 와일드카드를 변환**합니다.

- 계층 구분자: MQTT는 `/`, JMS는 `.` 를 씁니다. 그래서 MQTT `home/livingroom/temp` 는 ActiveMQ 안에서 JMS 토픽 `home.livingroom.temp` 로 매핑됩니다.
- 와일드카드: MQTT의 한 단계 `+` 와 그 아래 전부 `#` 는, JMS 쪽에서는 각각 `*` 와 `>` 에 대응됩니다.

이걸 모르고 자바 쪽에서 MQTT 토픽 이름 그대로 구독하려다 한참 헤매기 좋은 지점이기도 했습니다.

# MQTT QoS와 JMS 전달 보장은 어떻게 매핑될까

[MQTT 글](/mqtt-basics/)에서 MQTT의 QoS 규약에 대해 살펴봤는데, ActiveMQ에서 구현되는것은 JMS의 전달보장과 연결됩니다.

JMS에도 전달을 보장하기 위한 규약들이 있습니다. 메시지를 디스크에 남길지 정하는 delivery mode(persistent / non-persistent)가 있고, 받은 쪽이 잘 받았다고 확인해주는 acknowledge 모드(AUTO_ACKNOWLEDGE, CLIENT_ACKNOWLEDGE, DUPS_OK_ACKNOWLEDGE), 더 강하게는 트랜잭션 세션까지 둘 수 있습니다. 이 위에서 MQTT QoS가 다음처럼 매핑됩니다.

- MQTT **QoS 0** 메시지는 보통 JMS의 **non-persistent**(메모리에만, 브로커 재시작 시 소실)로 취급됩니다.
- MQTT **QoS 1·2** 메시지는 **persistent**로 저장됩니다. ActiveMQ는 기본적으로 **KahaDB**라는 파일 기반 저장소에 메시지를 기록해, 브로커가 재시작해도 살아남게 합니다.

여기서 각각의 장단점과, 상황에 맞는 선택 기준이 어느 정도 보입니다. 신뢰성을 높이려고 QoS를 올리면 그만큼 디스크에 쓰는 비용이 따라오고, 처리량은 떨어집니다. MQTT 단에서 QoS를 고르는 결정이 브로커의 저장 비용으로 그대로 이어진다는 걸, 두 개념을 숙지하니 좀 더 이해해볼수있었습니다.

# 오프라인 기기와 durable subscription

또 하나 실무에서 바로 부딪힐 만한 지점. 구독자가 잠깐 꺼져 있는 동안 온 메시지는 어떻게 될까요?

기본 토픽 구독은 **구독자가 붙어 있는 동안만** 메시지를 받습니다. 꺼져 있던 사이의 메시지는 놓칩니다. 이걸 막으려면 durable subscription(영속 구독)이 필요합니다. 브로커가 그 구독자 몫의 메시지를 따로 쌓아뒀다가, 다시 접속하면 밀린 걸 건네줍니다.

MQTT 쪽에서는 이를 위해 **clean session** 플래그를 활용해볼수 있습니다. clean session을 끄고(`cleanSession=false`) 같은 client id로 다시 붙으면, 브로커가 그 세션의 밀린 메시지를 이어서 줍니다. 모바일처럼 연결이 들쭉날쭉한 클라이언트에서 "잠깐 끊겨도 메시지를 안 놓치게" 하려면 이 설정을 고려해볼 수 있을것 같습니다.

# Classic이냐 Artemis냐

작성 시점(2021년) 기준으로 ActiveMQ는 두 개의 종류가 있습니다. 오래된 ActiveMQ "Classic"(5.x, 현재 5.16대) 과, 차세대로 다시 쓰인 ActiveMQ Artemis(2.x) 입니다. Artemis는 비동기 I/O 기반으로 처리량이 더 높고 지향하는 방향인것 같고.. 다만 설정 운영 노하우와 자료들은 아직 클래식쪽의 자료가 더 많아보입니다. 둘 다 MQTT를 지원하니, 새롭게 시작하는 프로젝트에서는 Artemis를 고려해봐도 좋을것 같다는 생각이 들었습니다.

# 정리

ActiveMQ를 MQTT 브로커로 쓰는 그림의 핵심은 결국 "한 브로커가 여러 프로토콜의 다리 역할을 한다" 였습니다. 기기는 MQTT로, 자바 백엔드 생태계에서는 JMS로: 그 사이의 토픽 이름·와일드카드·전달 보장을 브로커가 변환해줍니다. 다만 그 편리함의 대가로, MQTT QoS ↔ JMS persistence ↔ durable subscription이 어떻게 맞물리는지를 직접 챙겨야 했고, 그 지점이 곧 신뢰성과 비용을 정해야 한다는 것이었습니다.

# 참고

> [Apache ActiveMQ: MQTT](https://activemq.apache.org/mqtt.html)
> [Apache ActiveMQ Artemis Documentation](https://activemq.apache.org/components/artemis/documentation/)
