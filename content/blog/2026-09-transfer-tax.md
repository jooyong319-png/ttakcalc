---
title: 집 팔 때 양도소득세, 얼마나 내나요 — 보유기간·주택 수가 가릅니다
description: 양도소득세는 판 가격이 아니라 양도차익에 매기고, 얼마나 오래 보유했는지와 집이 몇 채인지에 따라 크게 달라집니다. 1세대 1주택 비과세부터 단기보유 세율, 2026년 다시 시작된 다주택 중과까지 조문 근거로 정리했습니다.
date: 2026-09-09
tags: [양도소득세, 부동산, 집팔때]
keyword: 양도소득세
calc: /calc/transfer-tax
calcLabel: 양도소득세 계산기
---

집을 팔면 양도소득세를 낼 수 있습니다. 그런데 판 가격이 곧 세금의 기준은 아닙니다. 결론부터 말하면 **양도소득세는 판 값에서 산 값과 필요경비를 뺀 "양도차익"에 매기고, 그 세율은 얼마나 오래 보유했는지와 집이 몇 채인지에 따라 크게 갈립니다.** 같은 집을 같은 값에 팔아도 상황에 따라 세금이 0원이 되기도, 차익의 절반을 넘기기도 합니다.

## 판 값이 아니라 '양도차익'에 매긴다

먼저 오해부터 풀어야 합니다. 양도소득세는 집을 판 금액 전체에 붙는 세금이 아닙니다. 판 값(양도가액)에서 살 때 든 값(취득가액)과 중개수수료·법무비 같은 필요경비를 뺀 차익에만 매깁니다.

| 단계 | 내용 |
| --- | --- |
| 양도가액 | 집을 판 금액 |
| − 취득가액 | 살 때 든 금액 |
| − 필요경비 | 취득세·중개수수료·자본적 지출 등 |
| = 양도차익 | 여기에 세금을 매긴다 |

그래서 오래 보유해 값이 많이 오른 집일수록 양도차익이 크고, 양도소득세도 커집니다. 반대로 산 값 그대로 팔았다면 차익이 없어 낼 세금도 없습니다.

## 1세대 1주택은 {{rates:transferTax.oneHouseExemptLimit|man}}까지 비과세

집 한 채만 가진 사람이 그 집을 팔 때는 웬만하면 세금이 없습니다. 1세대가 1주택을 일정 기간 이상 보유(조정대상지역이면 거주 요건도)한 뒤 팔면, 양도가액 {{rates:transferTax.oneHouseExemptLimit|man}}까지는 비과세이기 때문입니다. 소득세법 제89조 제1항 제3호가 정합니다.

{{rates:transferTax.oneHouseExemptLimit|man}}을 넘는 이른바 고가주택이라도 전체가 과세되는 게 아니라, {{rates:transferTax.oneHouseExemptLimit|man}}을 초과하는 부분에 해당하는 양도차익만 과세됩니다. 실거주 한 채를 팔아 갈아타는 대부분의 경우 양도소득세 부담이 크지 않은 이유가 여기 있습니다.

## 오래 보유하면 깎아준다 — 장기보유특별공제

과세되는 경우라도, 오래 보유했다면 양도차익에서 일정 비율을 빼줍니다. 이것이 장기보유특별공제입니다. 소득세법 제95조가 두 가지 표로 나눠 정합니다.

| 구분 | 공제 시작 | 연 공제율 | 한도 |
| --- | --- | --- | --- |
| 일반(3년 이상 보유) | 3년 | {{rates:transferTax.longTermGeneral.perYearRate|pct}} | {{rates:transferTax.longTermGeneral.maxRate|pct}} |
| 1세대 1주택 | 보유 3년·거주 2년 | 보유·거주 각 4% | 보유 {{rates:transferTax.longTermOneHouse.holdMaxRate|pct}}+거주 {{rates:transferTax.longTermOneHouse.liveMaxRate|pct}} |

일반 부동산은 3년째부터 해마다 {{rates:transferTax.longTermGeneral.perYearRate|pct}}씩, 15년을 채우면 {{rates:transferTax.longTermGeneral.maxRate|pct}}까지 빼줍니다. 1세대 1주택은 훨씬 후해서, 보유기간으로 최대 {{rates:transferTax.longTermOneHouse.holdMaxRate|pct}}에 거주기간으로 최대 {{rates:transferTax.longTermOneHouse.liveMaxRate|pct}}를 더해 차익의 최대 80%까지 공제받을 수 있습니다. 오래 살던 집일수록 양도소득세가 줄어드는 구조입니다.

## 짧게 갖고 팔면 세율이 뛴다

반대로 산 지 얼마 안 돼 파는 단기 양도는 세율이 크게 올라갑니다. 투기성 단타 거래를 무겁게 매기려는 취지입니다. 소득세법 제104조 제1항이 보유기간별 세율을 정합니다.

| 보유기간 | 세율 |
| --- | --- |
| {{rates:transferTax.shortTermRates.0.label}} | {{rates:transferTax.shortTermRates.0.rate|pct}} |
| {{rates:transferTax.shortTermRates.1.label}} | {{rates:transferTax.shortTermRates.1.rate|pct}} |
| 2년 이상 | 기본세율(6~45% 누진) |

1년도 안 돼 팔면 양도차익의 {{rates:transferTax.shortTermRates.0.rate|pct}}, 1~2년이면 {{rates:transferTax.shortTermRates.1.rate|pct}}입니다. 2년을 넘겨야 비로소 소득 구간별 기본세율(6~45%)로 내려옵니다. 여기에 양도소득세의 10%가 지방소득세로 더 붙습니다. 그래서 "언제 파느냐"가 세금을 가장 크게 가르는 변수입니다.

## 다주택 중과, 2026년 5월에 다시 시작됐다

집이 여러 채인 사람이 조정대상지역의 집을 팔 때는 기본세율에 중과세율이 얹힙니다. 이 중과는 2022년 5월부터 한시적으로 배제돼 왔는데, 그 배제가 끝나 **2026년 5월 10일 이후 양도분부터 다시 적용됩니다.** 소득세법 시행령 제167조의3이 배제 대상을 "2026년 5월 9일까지 양도하는 주택"으로 정했기 때문에, 그다음 날부터 원래대로 돌아온 것입니다.

| 경우 | 기본세율에 더하는 중과 |
| --- | --- |
| 조정대상지역 2주택 | +{{rates:transferTax.heavySurcharge.twoHouse|pct}}p |
| 조정대상지역 3주택 이상 | +{{rates:transferTax.heavySurcharge.threeOrMore|pct}}p |

기본세율에 2주택은 {{rates:transferTax.heavySurcharge.twoHouse|pct}}포인트, 3주택 이상은 {{rates:transferTax.heavySurcharge.threeOrMore|pct}}포인트를 더합니다. 다만 이 중과는 파는 집이 **조정대상지역에 있을 때만** 적용되고, 어느 지역이 조정대상지역인지는 정부가 수시로 바꿉니다. 파는 시점에 그 집이 조정대상지역인지 반드시 확인해야 하며, 이 글에서는 특정 지역이 대상이라고 단정하지 않습니다.

## 마지막으로 250만원을 빼준다

세율을 매기기 전, 양도차익(정확히는 각종 공제를 반영한 양도소득금액)에서 연 {{rates:transferTax.basicDeduction|man}}을 기본공제로 빼줍니다. 소득세법 제103조가 정한 양도소득 기본공제입니다. 한 해에 여러 건을 팔아도 사람마다 {{rates:transferTax.basicDeduction|man}}은 한 번만 적용됩니다.

## 내 경우엔 얼마인지 보려면

지금까지 봤듯 양도소득세는 양도차익이 얼마인지, 몇 년을 보유했는지, 1세대 1주택인지, 집이 몇 채인지가 겹겹이 맞물려 정해집니다. 손으로 어림하기 어려운 이유입니다. [양도소득세 계산기](/calc/transfer-tax)에 판 값과 산 값, 보유기간을 넣으면 양도차익부터 장기보유특별공제, 기본공제, 세율까지 어떤 순서로 적용되는지 한 줄씩 볼 수 있습니다.

> 여기 적은 세율과 공제는 소득세법이 정한 일반 규정입니다. 취득가액을 모르거나(상속·증여로 받은 집 등) 필요경비 인정 범위가 사안마다 달라지면 실제 세액이 크게 바뀝니다. 금액이 큰 세금이므로, 실제 신고 전에는 세무 상담을 받고 최종 금액은 국세청 홈택스에서 확인해 주세요.
