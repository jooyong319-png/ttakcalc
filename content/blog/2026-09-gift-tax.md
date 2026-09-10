---
title: 증여세, 누가 얼마부터 내나요 — 관계별 공제와 10년 합산
description: 증여세는 재산을 받은 사람이 내고, 10년 동안 같은 사람에게서 받은 금액을 합쳐 관계별 공제 한도를 넘는 부분에만 매깁니다. 배우자·자녀 공제와 세율 구간을 조문 근거로 정리했습니다.
date: 2026-09-10
tags: [증여세, 증여, 상속세및증여세법]
keyword: 증여세
calc: /calc/gift-tax
calcLabel: 증여세 계산기
---

증여세는 재산을 **받은 사람(수증자)**이 냅니다. 준 사람이 아니라 받은 사람입니다. 그리고 받은 금액 전부에 매기는 것이 아니라, 관계별로 정해진 공제 한도를 넘는 부분에만 매깁니다. 부모가 성인 자녀에게 준 돈이라면 {{rates:giftTax.deductions.3.amount|man}}까지는 공제되어 증여세가 나오지 않고, 그 위로만 세금이 붙습니다.

한 가지 더 중요한 규칙이 있습니다. 이 공제 한도는 한 번 준 금액이 아니라 **10년 동안 같은 관계에서 받은 금액을 합쳐** 따집니다. 올해 받은 것에 지난 10년치 증여를 더해 한도를 넘으면, 넘은 만큼이 과세 대상입니다. 나눠서 조금씩 준다고 피할 수 있는 구조가 아니라는 뜻입니다(상속세 및 증여세법 제53조).

## 누가 얼마까지 공제되나

거주자가 증여를 받을 때, 준 사람과의 관계에 따라 아래 금액을 증여세 과세가액에서 뺍니다. 이 표의 금액은 계산기와 같은 데이터에서 불러온 값이라 법이 바뀌면 함께 갱신됩니다.

| 준 사람과의 관계 | 10년간 공제 한도 |
| --- | --- |
| 배우자 | {{rates:giftTax.deductions.0.amount|man}} |
| 직계존속(부모·조부모) | {{rates:giftTax.deductions.1.amount|man}} |
| 직계존속 → 미성년자 | {{rates:giftTax.deductions.2.amount|man}} |
| 직계비속(자녀·손주) | {{rates:giftTax.deductions.3.amount|man}} |
| 기타 친족(4촌 이내 혈족·3촌 이내 인척) | {{rates:giftTax.deductions.4.amount|man}} |

배우자에게서 받는 경우 한도가 {{rates:giftTax.deductions.0.amount|man}}으로 가장 큽니다. 부모가 미성년 자녀에게 주는 경우에는 성인일 때보다 낮은 {{rates:giftTax.deductions.2.amount|man}}까지만 공제됩니다. 4촌 이내 혈족이나 3촌 이내 인척 같은 기타 친족은 {{rates:giftTax.deductions.4.amount|man}}, 아무 관계가 없는 타인에게서 받으면 공제가 없습니다. 이 한도들을 10년 단위로 다시 계산한다는 점이 증여세를 이해하는 핵심입니다.

## 세율 — 상속세와 같은 구간

공제를 빼고 남은 과세표준에 세율을 매깁니다. 증여세 세율은 상속세와 같은 조문(상속세 및 증여세법 제56조가 제26조 세율을 가져다 씁니다)을 쓰기 때문에 상속세율과 똑같습니다. 낮은 구간부터 높은 구간까지 초과분에만 해당 세율이 붙는 누진 구조입니다.

| 과세표준 | 세율 | 누진공제 |
| --- | --- | --- |
| {{rates:giftTax.brackets.0.upTo|man}} 이하 | {{rates:giftTax.brackets.0.rate|pct}} | – |
| {{rates:giftTax.brackets.0.upTo|man}} 초과 {{rates:giftTax.brackets.1.upTo|man}} 이하 | {{rates:giftTax.brackets.1.rate|pct}} | {{rates:giftTax.brackets.1.deduction|man}} |
| {{rates:giftTax.brackets.1.upTo|man}} 초과 {{rates:giftTax.brackets.2.upTo|man}} 이하 | {{rates:giftTax.brackets.2.rate|pct}} | {{rates:giftTax.brackets.2.deduction|man}} |
| {{rates:giftTax.brackets.2.upTo|man}} 초과 {{rates:giftTax.brackets.3.upTo|man}} 이하 | {{rates:giftTax.brackets.3.rate|pct}} | {{rates:giftTax.brackets.3.deduction|man}} |
| {{rates:giftTax.brackets.3.upTo|man}} 초과 | {{rates:giftTax.brackets.4.rate|pct}} | {{rates:giftTax.brackets.4.deduction|man}} |

누진공제는 계산을 간단히 하려고 쓰는 값입니다. 과세표준에 세율을 곱한 뒤 그 줄의 누진공제를 빼면 산출세액이 됩니다. 예를 들어 과세표준이 {{rates:giftTax.brackets.1.upTo|man}}이면 {{rates:giftTax.brackets.1.rate|pct}}를 곱하고 {{rates:giftTax.brackets.1.deduction|man}}을 빼는 식입니다. 관계·금액을 넣어 내 경우의 증여세가 얼마인지 보려면 아래 계산기를 쓰면 됩니다.

## 신고와 납부, 그리고 신고하면 깎아주는 것

증여세는 증여받은 날이 속하는 달의 말일부터 **3개월 이내**에 수증자가 신고·납부합니다(상속세 및 증여세법 제68조). 이 기한 안에 스스로 신고하면 산출세액의 {{rates:giftTax.filingCreditRate|pct}}를 깎아주는 신고세액공제가 있습니다(상속세 및 증여세법 제69조). 반대로 기한을 넘기면 무신고·납부지연 가산세가 붙으므로, 낼 세금이 있다면 기한 안에 신고하는 편이 언제나 유리합니다.

한도 이하라 낼 증여세가 0원이더라도, 나중에 자금 출처를 소명해야 할 상황을 대비해 신고해 두는 경우가 많습니다. 특히 부동산 취득이나 대출 상환처럼 큰돈이 오간 흔적은 뒤에 확인될 수 있어, 증여 사실을 신고로 남겨 두면 분쟁을 줄일 수 있습니다.

## 혼인·출산 증여재산공제

직계존속에게서 받는 경우, 위의 일반 공제와 **별도로** 적용되는 혼인·출산 공제가 있습니다. 혼인신고일 전후 2년 이내 또는 자녀 출생·입양일부터 2년 이내에 직계존속에게서 증여를 받으면 1억원을 추가로 공제합니다(상속세 및 증여세법 제53조의2). 예를 들어 결혼을 앞두고 부모에게서 지원을 받는다면, 직계비속 공제 {{rates:giftTax.deductions.3.amount|man}}에 이 혼인 공제를 더해 그만큼 증여세 없이 받을 수 있습니다. 요건과 기간이 정해져 있으니 해당한다면 신고 때 함께 챙기는 것이 좋습니다.

> 이 글은 일반적인 기준을 정리한 것으로, 실제 증여세는 재산의 평가액, 과거 증여 이력, 창업자금·가업승계 같은 특례에 따라 달라질 수 있습니다. 큰 금액이라면 신고 전에 세무 전문가나 관할 세무서에 확인하시기 바랍니다.
