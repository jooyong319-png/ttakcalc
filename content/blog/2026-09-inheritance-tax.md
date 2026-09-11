---
title: 상속세, 5억까지는 안 낸다는데 정말인가요 — 일괄공제와 배우자공제
description: 상속세는 물려받은 재산 전부가 아니라 공제를 빼고 남은 금액에만 매깁니다. 배우자가 없어도 최소 5억, 배우자가 있으면 대개 10억까지는 세금이 나오지 않는 이유를 조문 근거로 정리했습니다.
date: 2026-09-11
tags: [상속세, 상속, 상속세및증여세법]
keyword: 상속세
calc: /calc/inheritance-tax
calcLabel: 상속세 계산기
---

상속세는 물려받은 재산 **전부**에 매기는 것이 아니라, 정해진 공제를 빼고 남은 금액에만 매깁니다. 그래서 "5억까지는 안 낸다"는 말이 나옵니다. 배우자 없이 자녀만 상속받는 경우라도 최소 {{rates:inheritanceTax.lumpSumDeduction|man}}(일괄공제)까지는 과세가액에서 빠지고, 배우자가 살아 있으면 배우자공제가 더해져 대개 10억원 안팎까지는 상속세가 나오지 않습니다. 재산이 그 아래라면 신고는 하되 낼 세금은 0원인 경우가 많습니다.

바꿔 말하면, 상속세를 이해하는 핵심은 세율이 아니라 **공제가 얼마까지 되느냐**입니다. 세율은 증여세와 똑같은 조문을 쓰기 때문에 사실상 공제 구조가 상속세의 부담을 가릅니다. 아래에서 누가 언제까지 내는지, 공제가 어떻게 쌓이는지 순서대로 봅니다.

## 누가, 언제까지 내나

상속세는 재산을 물려받은 상속인(또는 유증을 받은 수유자)이 냅니다. 신고·납부 기한은 **상속개시일(사망일)이 속하는 달의 말일부터 6개월 이내**입니다(상속세 및 증여세법 제67조). 예를 들어 3월 중 사망했다면 3월 말일부터 6개월, 즉 9월 말까지가 기한입니다. 피상속인이나 상속인이 외국에 주소를 둔 경우에는 이 기간이 9개월로 늘어납니다. 기한을 넘기면 무신고 가산세가 붙으므로, 낼 세금이 있는지 애매하더라도 기한 안에 확인하는 편이 안전합니다.

## 공제 — 일괄공제 5억이 기준선

상속재산에서 빼주는 공제에는 여러 종류가 있는데, 대부분의 사람에게 실제로 작동하는 것은 **일괄공제**입니다. 방식은 이렇습니다. 기초공제 {{rates:inheritanceTax.basicDeduction|man}}(제18조)에 자녀·미성년자·연로자 등 인적공제(제20조)를 더한 금액과, {{rates:inheritanceTax.lumpSumDeduction|man}} 중 **큰 쪽**을 선택합니다(제21조). 인적공제 합계가 크지 않은 보통의 상속에서는 {{rates:inheritanceTax.lumpSumDeduction|man}}이 더 크므로 일괄공제를 쓰게 됩니다.

인적공제(제20조)의 주요 항목은 아래와 같습니다. 이 값들은 계산기와 같은 데이터에서 불러오므로 법이 바뀌면 함께 갱신됩니다.

| 인적공제 항목 | 공제액 |
| --- | --- |
| 자녀 1명당 | {{rates:inheritanceTax.childDeduction|man}} |
| 미성년자(19세까지) 1명당·1년당 | {{rates:inheritanceTax.minorPerYear|man}} |
| 65세 이상 연로자 1명당 | {{rates:inheritanceTax.elderlyDeduction|man}} |

다만 배우자가 단독으로 상속받는 경우에는 일괄공제를 쓸 수 없고 기초공제와 인적공제만 적용합니다(제21조 제2항). 자녀 없이 배우자 혼자 상속받는 흔치 않은 경우이니, 대부분은 일괄공제 {{rates:inheritanceTax.lumpSumDeduction|man}}을 기본선으로 생각하면 됩니다.

## 배우자공제 — 최소 5억, 최대 30억

배우자가 살아 있으면 위의 일괄공제와 **별도로** 배우자 상속공제가 더해집니다(제19조). 이것이 상속세와 증여세가 크게 갈리는 지점입니다. 배우자가 실제로 상속받은 금액이 없거나 {{rates:inheritanceTax.spouseMin|man}} 미만이어도 {{rates:inheritanceTax.spouseMin|man}}은 공제하고, 실제로 더 많이 받았다면 배우자 법정상속분 상당액과 {{rates:inheritanceTax.spouseMax|man}} 중 작은 금액까지 공제합니다.

그래서 배우자와 자녀가 함께 상속받는 전형적인 경우, 일괄공제 {{rates:inheritanceTax.lumpSumDeduction|man}}에 배우자공제 최소 {{rates:inheritanceTax.spouseMin|man}}을 더해 10억원 안팎까지는 상속세 과세표준이 0이 되는 일이 많습니다. "10억까지는 상속세 걱정 안 해도 된다"는 통념은 여기서 나온 것입니다. 다만 배우자공제를 법정상속분 한도까지 온전히 받으려면 신고기한 다음 날부터 9개월 안에 배우자 몫으로 상속재산을 실제 분할해야 하므로, 상속인끼리 분할 협의를 미루지 않는 것이 중요합니다.

## 금융재산이 있으면 추가로

상속재산에 예금·주식 같은 금융재산이 있으면 별도의 금융재산 상속공제가 있습니다(제22조). 순금융재산의 {{rates:inheritanceTax.financial.rate|pct}}를 공제하되, 최소 {{rates:inheritanceTax.financial.floor|man}}, 최대 {{rates:inheritanceTax.financial.cap|man}}까지입니다. 부동산은 시가 평가가 어렵고 금융재산은 액수가 그대로 드러나 상대적으로 불리해질 수 있어, 그 차이를 일부 메워 주는 취지의 공제입니다.

## 세율 — 증여세와 같은 구간

공제를 모두 빼고 남은 과세표준에 세율을 매깁니다. 상속세 세율은 증여세와 **같은 조문**(제26조)을 쓰므로 세율표가 똑같습니다. 낮은 구간부터 초과분에만 해당 세율이 붙는 누진 구조입니다.

| 과세표준 | 세율 | 누진공제 |
| --- | --- | --- |
| {{rates:giftTax.brackets.0.upTo|man}} 이하 | {{rates:giftTax.brackets.0.rate|pct}} | – |
| {{rates:giftTax.brackets.0.upTo|man}} 초과 {{rates:giftTax.brackets.1.upTo|man}} 이하 | {{rates:giftTax.brackets.1.rate|pct}} | {{rates:giftTax.brackets.1.deduction|man}} |
| {{rates:giftTax.brackets.1.upTo|man}} 초과 {{rates:giftTax.brackets.2.upTo|man}} 이하 | {{rates:giftTax.brackets.2.rate|pct}} | {{rates:giftTax.brackets.2.deduction|man}} |
| {{rates:giftTax.brackets.2.upTo|man}} 초과 {{rates:giftTax.brackets.3.upTo|man}} 이하 | {{rates:giftTax.brackets.3.rate|pct}} | {{rates:giftTax.brackets.3.deduction|man}} |
| {{rates:giftTax.brackets.3.upTo|man}} 초과 | {{rates:giftTax.brackets.4.rate|pct}} | {{rates:giftTax.brackets.4.deduction|man}} |

과세표준에 세율을 곱한 뒤 그 줄의 누진공제를 빼면 산출세액이 됩니다. 공제 덕분에 과세표준이 0으로 떨어지면 세율을 곱할 것이 없어 상속세도 0원입니다. 재산 규모와 상속인 구성을 넣어 내 경우의 상속세가 얼마인지 보려면 아래 계산기를 쓰면 됩니다.

## 신고하면 깎아주는 것

기한 안에 스스로 신고하면 산출세액의 3%를 깎아주는 신고세액공제가 있습니다(제69조). 반대로 기한을 넘기면 무신고·납부지연 가산세가 붙으므로, 낼 세금이 있다면 기한 안에 신고하는 편이 언제나 유리합니다. 낼 상속세가 0원이더라도, 나중에 부동산 취득 자금 출처를 소명해야 할 상황을 대비해 상속 사실을 신고로 남겨 두는 경우가 많습니다.

> 이 글은 일반적인 기준을 정리한 것으로, 실제 상속세는 재산의 평가액, 사전증여 합산, 동거주택·가업상속 같은 특례에 따라 크게 달라질 수 있습니다. 큰 금액이라면 신고 전에 세무 전문가나 관할 세무서에 확인하시기 바랍니다.
