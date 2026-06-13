# Notebook 02 Methodological Notes — Method 3

## Labeling stance

The rice supply chain dataset has no externally validated target label for vulnerability. Therefore, this notebook uses **Method 3: paper-grounded weak labeling**. Domain rules create transparent pseudo labels, while clustering is used only as support/audit.

## Literature-grounded rules

1. **Weak supervision** — Ratner et al. (2017) justify using rule-based labeling functions when hand labels are unavailable.
2. **DEA / DMU efficiency** — Charnes, Cooper, and Rhodes (1978) and Banker, Charnes, and Cooper (1984) motivate relative efficiency benchmarking among comparable decision-making units. This notebook implements a lightweight actor-wise frontier proxy, not exact LP DEA.
3. **R/C feasibility** — agricultural project / farm feasibility logic treats revenue lower than cost as financially infeasible. Therefore `R/C < 1` is a hard high-vulnerability rule.
4. **Margin health** — negative or thin margin indicates low buffer against disruption.
5. **Operational burden** — high operating cost relative to output weakens the ability to absorb shocks.
6. **Supply chain resilience** — resilience literature emphasizes persistence/adaptation under disruptions, so financially and operationally weak nodes are treated as less resilient under flood-related stress.
7. **Cluster support** — Rousseeuw (1987) motivates silhouette-based cluster validation. Here clustering audits structure only and does not define the target.

## Rule weights

| rule_component                |   weight |   mean_score | domain_decision                                              | reference_logic                                               |
|:------------------------------|---------:|-------------:|:-------------------------------------------------------------|:--------------------------------------------------------------|
| financial_infeasibility_score |     0.35 |     0.474587 | Hardest soft component: below break-even and thin R/C buffer | Agricultural financial feasibility / R-C / benefit-cost logic |
| margin_pressure_score         |     0.25 |     0.476557 | Financial buffer against disruption                          | Margin health / shock absorption                              |
| operational_burden_score      |     0.15 |     0.217459 | Operating-cost pressure in supply chain node                 | Supply chain efficiency and operating burden                  |
| frontier_inefficiency_score   |     0.1  |     0.632381 | DEA-style relative frontier inefficiency                     | Charnes et al. (1978); Banker et al. (1984)                   |
| precipitation_stress_score    |     0.1  |     0.418602 | Environmental stress proxy where available                   | Flood/disruption exposure proxy available in dataset          |
| low_utilization_pressure      |     0.05 |     0.564338 | Asset/quantity utilization proxy                             | Farm/processing/distribution utilization logic                |

## Labeling functions

| labeling_function            | condition                                | label_signal         |   priority | domain_basis                                  |
|:-----------------------------|:-----------------------------------------|:---------------------|-----------:|:----------------------------------------------|
| lf_below_break_even          | rc_ratio < 1.00                          | High Vulnerability   |          1 | R/C feasibility: revenue below cost           |
| lf_negative_margin           | margin < 0                               | High Vulnerability   |          2 | Negative margin: no financial buffer          |
| lf_high_composite_pressure   | final_vulnerability_score >= 0.62        | High Vulnerability   |          3 | Internal calibrated high composite pressure   |
| lf_thin_rc_buffer            | 1.00 <= rc_ratio < 1.15                  | Medium Vulnerability |          4 | Revenue covers cost but with thin buffer      |
| lf_thin_margin_buffer        | 0 <= margin_ratio < 0.10                 | Medium Vulnerability |          5 | Positive but thin margin buffer               |
| lf_medium_composite_pressure | 0.40 <= final_vulnerability_score < 0.62 | Medium Vulnerability |          6 | Internal calibrated medium composite pressure |

## Label thresholds

| decision_level      | condition                                                    | label_effect         | domain_basis                                                |
|:--------------------|:-------------------------------------------------------------|:---------------------|:------------------------------------------------------------|
| Hard rule           | rc_ratio < 1.00                                              | High Vulnerability   | R/C feasibility: revenue below cost / below break-even      |
| Hard rule           | margin < 0                                                   | High Vulnerability   | Negative margin means no financial buffer before disruption |
| Soft composite rule | rule score >= 0.62                                           | High Vulnerability   | Internal calibrated threshold after hard financial rules    |
| Soft buffer rule    | rc_ratio < 1.15 OR margin_ratio < 0.10 OR rule score >= 0.40 | Medium Vulnerability | Thin financial/operational buffer                           |
| Default             | otherwise                                                    | Low Vulnerability    | Positive financial and operational buffer                   |

The score thresholds are internal calibrated decision thresholds. They are not claimed as universal constants from prior literature. Hard financial conditions such as `R/C < 1` and negative margin dominate before soft composite thresholds are used.

## Cluster leakage prevention

Cluster outputs are kept only for audit and interpretability. The following columns are marked as audit-only and must be excluded from the operational model in Notebook 03:

| 0                      |
|:-----------------------|
| vulnerability_cluster  |
| cluster_support_score  |
| cluster_support_label  |
| rule_cluster_agreement |
| cluster_support_gap    |

## Operational feature policy

`rc_ratio` is marked as redundant and excluded from the operational model because `cost_revenue_ratio` carries the inverse information and is easier to interpret for vulnerability: cost greater than revenue indicates financial pressure.

## Data policy

External papers are used only for methodological justification. No external dataset, labels, prices, maps, rainfall records, or region-level disaster observations are used for training.
