# Flood-Resilient Rice Supply Chain Project

This repository contains a **five-notebook sequential machine learning and decision-support workflow** for combining two allowed datasets:

1. **Flood Prediction** — used to model natural hazard probability through `FloodProbability`.
2. **Rice Supply Chain in West Java Province, Indonesia** — used to analyze rice supply chain vulnerability across actors and regencies.

The core idea is **not** to merge the two datasets row-by-row. The datasets do not share a direct key such as date, coordinate, or identical location identifier. Instead, this project integrates them at the analytical framework level:

```text
Flood hazard prediction
+
Rice supply chain vulnerability
+
Stress-test sensitivity analysis
=
Flood-logistics intervention priority
```

No external dataset is used for training. External literature is used only to justify the methodology, decision rules, and interpretation framework.

---

## Project Objective

This project builds a scenario-based decision-support framework for flood-resilient rice supply chain planning in West Java.

The project answers three business questions:

| Method                                                 | Business Question                                                                  | Main Output                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------- |
| **Method 3 — Paper-grounded weak labeling**            | Which rice supply chain actors are financially and operationally vulnerable?       | `vulnerability_label`                       |
| **Method 5 — Stress-test sensitivity analysis**        | Which actor-region units are most likely to collapse under flood-stress scenarios? | `survive_under_stress`, `stress_risk_label` |
| **Method 1 — Hazard × vulnerability decision support** | Which actor-region units should be prioritized when flood risk increases?          | `priority_label`, `recommended_action`      |

---

## Repository Structure

```text
flood_rice_resilience_project/
├── 01_flood_rice_data_understanding_visualization.ipynb
├── 02_flood_rice_preprocessing_pseudo_labeling.ipynb
├── 03_flood_rice_model_training_evaluation.ipynb
├── 04_flood_stress_test_sensitivity_analysis.ipynb
├── 05_flood_logistics_decision_support.ipynb
├── data/
│   ├── README.md
│   └── raw/
│       ├── Flood Prediction.zip
│       └── Rice Supply Chain in West Java Province, Indonesia.zip
├── figures/
│   └── .gitkeep
├── models/
│   └── .gitkeep
├── outputs/
│   └── .gitkeep
├── requirements.txt
└── README.md
```

---

## Notebook Order

Run the notebooks in this exact order:

```text
01 → 02 → 03 → 04 → 05
```

Each notebook writes artifacts into `outputs/`, `figures/`, and `models/` for the next stage.

---

# 1. `01_flood_rice_data_understanding_visualization.ipynb`

## Purpose

This notebook performs data understanding, parsing, auditing, and exploratory visualization.

Main goals:

* Load and audit both raw datasets.
* Parse the rice supply chain Excel sheets from the ZIP file.
* Consolidate actor-level rice data into a unified format.
* Build early feature groups for flood risk and rice supply chain actors.
* Create focused visualizations that explain the problem, not just show generic plots.
* Export consolidated raw artifacts for downstream notebooks.

## Why the datasets are not merged row-wise

The flood dataset and rice dataset do not share a common row-level key. There is no shared date, coordinate, district code, or event identifier that allows direct observational merging.

Therefore, the integration is done through a risk framework:

```text
Flood dataset = hazard component
Rice supply chain dataset = vulnerability component
Stress test = resilience component
Decision support = intervention priority
```

## Main Outputs

```text
outputs/01_flood_raw.csv
outputs/01_rice_consolidated_raw.csv
outputs/01_rice_understanding.csv
outputs/01_rice_summary_by_actor_region.csv
outputs/01_feature_dictionary.csv
outputs/01_parser_audit.csv
```

## Main Visualizations

* `FloodProbability` distribution with threshold focus.
* Grouped flood pressure trend.
* Rice actor-region coverage heatmap.
* R/C ratio density with break-even reference.
* Vulnerable actor share.
* Regional R/C heatmap.

---

# 2. `02_flood_rice_preprocessing_pseudo_labeling.ipynb`

## Purpose

This notebook performs preprocessing, feature engineering, and **Method 3: Paper-grounded weak labeling**.

The rice dataset does not contain an externally validated vulnerability label. Therefore, this notebook creates an internal pseudo-label based on domain-grounded financial and operational indicators.

## Method 3 Business Question

```text
Which rice supply chain actors are financially and operationally vulnerable?
```

## Main Tasks

* Clean and standardize flood and rice datasets.
* Engineer rice supply chain indicators:

  * total cost,
  * revenue,
  * margin,
  * margin ratio,
  * cost/revenue ratio,
  * operational burden,
  * productivity proxy,
  * precipitation-related proxy where available.
* Create paper-grounded weak labels for supply chain vulnerability.
* Separate rule-based labeling from cluster-based audit.
* Export modeling-ready datasets.

## Labeling Principle

The rice vulnerability label is a **pseudo-label**, not a field-observed ground-truth label.

The label is generated from internal dataset features using domain-informed rules:

```text
financial infeasibility
+
margin pressure
+
operational burden
+
frontier inefficiency
+
precipitation stress
+
low utilization pressure
```

The following hard rules are treated as high-risk indicators:

```text
R/C < 1
margin < 0
cost > revenue
```

These rules indicate that the actor is below break-even or financially infeasible under the observed cost-revenue structure.

## Cluster Usage

Clustering is used only as an audit tool.

```text
Cluster support = audit only
Cluster support ≠ label source
Cluster support ≠ training feature
```

Cluster columns must not be used as operational model features in Notebook 03.

## Main Outputs

```text
outputs/02_flood_modeling_dataset.csv
outputs/02_rice_vulnerability_dataset.csv
outputs/02_actor_region_vulnerability.csv
outputs/02_flood_scenarios.csv
outputs/02_labeling_report.csv
outputs/02_data_quality_report.csv
outputs/02_feature_modeling_policy.csv
outputs/02_methodological_notes.md
outputs/02_rule_weight_reference_summary.csv
outputs/02_method3_labeling_functions.csv
outputs/02_method3_threshold_policy.csv
outputs/02_method3_label_source_report.csv
outputs/02_top_vulnerable_actor_region.csv
outputs/02_label_source_distribution.csv
outputs/02_rule_contribution_by_actor.csv
```

## Main Visualizations

* Rice vulnerability label distribution.
* Actor-region vulnerability heatmap.
* Top vulnerable actor-region ranking.
* Label source distribution.
* Rule contribution by actor.
* Cluster audit profile.

---

# 3. `03_flood_rice_model_training_evaluation.ipynb`

## Purpose

This notebook performs the main machine learning modeling stage.

Notebook 03 is intentionally kept as a **modeling-only notebook**. It does not perform stress testing and does not build the final decision-support matrix. Those are handled separately in Notebook 04 and Notebook 05.

## Main Modeling Tasks

### Flood Regression

Task:

```text
Regression
```

Target:

```text
FloodProbability
```

Purpose:

```text
Predict flood hazard probability from environmental, infrastructure, land-use, and governance-related features.
```

### Rice Vulnerability Classification

Task:

```text
Classification
```

Target:

```text
vulnerability_label
```

Purpose:

```text
Predict paper-grounded rice supply chain vulnerability labels from operational features.
```

Important note:

The rice vulnerability target is a pseudo-label from Method 3. Therefore, this model should be interpreted as an operational model that approximates the paper-grounded labeling framework, not as a model validated against external field-observed vulnerability labels.

## Model Candidates

### Flood Regression Models

```text
Dummy Mean
Ridge
Lasso
ElasticNet
Random Forest
Extra Trees
Hist Gradient Boosting
XGBoost
LightGBM
CatBoost
```

### Rice Classification Models

```text
Dummy Most Frequent
Logistic Regression
Decision Tree
Random Forest
Extra Trees
Hist Gradient Boosting
XGBoost
LightGBM
CatBoost
```

Optional booster models require additional packages:

```text
xgboost
lightgbm
catboost
```

## Leakage Control

Notebook 03 excludes non-operational and leakage-prone features from the rice vulnerability model, including:

```text
cluster support columns
cluster labels
rule score columns
final vulnerability score
hard-rule flags
label reason
label source
labeling function hits
target columns
administrative-only columns
```

The operational model should use only features that are available before labeling.

## Main Outputs

```text
outputs/03_flood_cv_results.csv
outputs/03_flood_holdout_metrics.csv
outputs/03_flood_holdout_predictions.csv
outputs/03_flood_full_predictions.csv
outputs/03_flood_feature_importance.csv
outputs/03_flood_scenario_summary.csv

outputs/03_rice_cv_results.csv
outputs/03_rice_holdout_metrics.csv
outputs/03_rice_holdout_predictions.csv
outputs/03_rice_full_predictions.csv
outputs/03_rice_feature_importance.csv

outputs/03_actor_region_model_summary.csv
outputs/03_model_selection_rationale.csv
outputs/03_operational_feature_list.csv
outputs/03_operational_excluded_features.csv
outputs/03_rice_error_by_actor.csv
outputs/03_rice_error_by_region.csv
outputs/03_rice_prediction_disagreements_top30.csv

models/03_final_flood_probability_model.joblib
models/03_final_rice_vulnerability_model.joblib
```

## Main Visualizations

* Flood regression cross-validation ranking.
* Flood actual vs predicted plot.
* Flood feature importance.
* Rice classification model comparison.
* Rice confusion matrix.
* Rice feature importance.
* Rice error analysis by actor and region.

---

# 4. `04_flood_stress_test_sensitivity_analysis.ipynb`

## Purpose

This notebook performs **Method 5: Stress-test sensitivity analysis**.

Notebook 04 does not train a supervised machine learning model. Instead, it evaluates how rice supply chain actors respond under flood-stress scenarios.

## Method 5 Business Question

```text
Which actor-region units are most likely to collapse under flood-stress scenarios?
```

## Main Idea

Method 5 estimates whether an actor-region unit can survive when cost and revenue conditions worsen under flood-stress scenarios.

The stress test recalculates:

```text
stressed cost
stressed revenue
stressed margin
stressed cost/revenue ratio
survival status
stress risk label
```

## Stress-Test Logic

The notebook uses a break-even perspective:

```text
survive if revenue > cost
fail if revenue <= cost
```

A resilience buffer is calculated to estimate how much cost increase the actor can tolerate before reaching break-even.

Example indicator:

```text
cost_shock_tolerance = (revenue - total_cost) / total_cost
```

If this value is low or negative, the actor has limited or no financial buffer.

## Scenario Interpretation

The stress scenarios are used as sensitivity analysis, not as causal estimates.

```text
Low stress
Medium stress
High stress
```

These stress levels are not claimed to represent observed flood damage. They are scenario-based shocks used to test supply chain resilience under worsening conditions.

## Main Outputs

```text
outputs/04_actor_unit_resilience_buffer.csv
outputs/04_actor_region_resilience_buffer.csv
outputs/04_stress_scenarios.csv
outputs/04_unit_stress_test_results.csv
outputs/04_actor_region_stress_summary.csv
outputs/04_stress_transition_matrix.csv
outputs/04_stress_response_curve_by_actor.csv
outputs/04_before_after_cost_revenue_by_actor.csv
outputs/04_method5_reference_policy.csv
outputs/04_method5_notes.md
```

## Main Visualizations

* High-stress fail share by actor.
* Actor-region break-even buffer heatmap.
* Top actor-region stress failures.
* Stress response curve from Low → Medium → High.
* Before vs after cost/revenue ratio.
* Break-even buffer distribution by actor.

---

# 5. `05_flood_logistics_decision_support.ipynb`

## Purpose

This notebook performs **Method 1: Hazard × vulnerability decision support**.

Notebook 05 combines outputs from Notebook 03 and Notebook 04 to create the final flood-logistics intervention priority.

## Method 1 Business Question

```text
Which actor-region units should be prioritized when flood risk increases?
```

## Main Idea

The final priority is based on three components:

```text
Flood hazard scenario
+
Rice supply chain vulnerability
+
Stress-test survival/failure status
```

This produces a practical decision-support output:

```text
priority_label
recommended_action
```

## Decision-Support Logic

The final framework follows the general risk interpretation:

```text
Risk increases when hazard is high and vulnerability is high.
```

Stress-test results are used to strengthen prioritization by identifying actor-region units that are not only vulnerable but also fail under stress.

## Main Outputs

```text
outputs/05_final_flood_logistics_priority.csv
outputs/05_high_priority_shortlist.csv
outputs/05_actor_region_recommended_actions.csv
outputs/05_priority_matrix_heatmap_values.csv
outputs/05_top10_intervention_priority.csv
outputs/05_stakeholder_action_summary.csv
outputs/05_decision_policy_reference.csv
outputs/05_method1_notes.md
```

## Main Visualizations

* Priority distribution by flood scenario.
* Top high-flood intervention priorities.
* High/Critical priority share by actor.
* Priority matrix heatmap.
* Top 10 intervention priority table.
* Stakeholder action summary.

---

## Setup

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install requirements:

```powershell
python -m pip install -r requirements.txt
```

Optional booster models for Notebook 03:

```powershell
python -m pip install xgboost lightgbm catboost
```

---

## Data Policy

This project follows the constraint:

```text
No external dataset is used for training.
```

The notebooks only use the two raw datasets included in `data/raw/`:

```text
data/raw/Flood Prediction.zip
data/raw/Rice Supply Chain in West Java Province, Indonesia.zip
```

External literature may be used conceptually in markdown to justify methodology, labeling logic, stress-test interpretation, and decision-support rules. However, no external rows, labels, prices, maps, rainfall records, flood records, or regional disaster records are added to the training data.

---

## Methodology Summary

## Flood Dataset

Task:

```text
Regression
```

Target:

```text
FloodProbability
```

Features include:

* Monsoon intensity
* Topography drainage
* River management
* Deforestation
* Urbanization
* Climate change
* Dams quality
* Siltation
* Agricultural practices
* Encroachments
* Drainage systems
* Coastal vulnerability
* Landslides
* Watersheds
* Deteriorating infrastructure
* Population score
* Wetland loss
* Inadequate planning
* Ineffective disaster preparedness
* Political factors

## Rice Supply Chain Dataset

Task:

```text
Pseudo-label classification and vulnerability analysis
```

Actors:

* Farmer
* Rice Miller
* Middlemen
* Wholesaler
* Retail

Regions:

* Garut
* Indramayu
* Karawang
* Subang
* Tasikmalaya

Engineered indicators include:

* Total cost
* Revenue
* Margin
* Margin ratio
* Cost/revenue ratio
* Operational burden
* Productivity proxy
* Frontier inefficiency proxy
* Precipitation-related proxy where available
* Vulnerability score
* Vulnerability label

---

## Domain Reference Policy

This project separates domain-grounded principles from internal calibrated thresholds.

## Domain-grounded principles

The following decisions are conceptually supported by domain literature:

| Decision                                                                           | Domain Basis                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| Weak labeling for rice vulnerability because no external ground-truth label exists | Weak supervision / programmatic labeling          |
| R/C < 1 as a financial infeasibility signal                                        | Benefit-cost / financial feasibility logic        |
| Negative margin as a high-risk signal                                              | Break-even and profitability logic                |
| Frontier-style efficiency comparison                                               | Data Envelopment Analysis / production efficiency |
| Cluster analysis as audit only                                                     | Cluster validation and silhouette analysis        |
| Stress testing under scenarios                                                     | Supply chain resilience and sensitivity analysis  |
| Hazard × vulnerability prioritization                                              | Disaster risk framework                           |

## Internal calibrated thresholds

The following numerical rules are used as internal policy thresholds and are not claimed as universal constants from literature:

| Component                      | Internal Threshold / Weight                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Method 3 rule weights          | financial infeasibility, margin pressure, operational burden, frontier inefficiency, precipitation stress, utilization pressure |
| Vulnerability score thresholds | Low / Medium / High vulnerability separation                                                                                    |
| Thin R/C buffer threshold      | internal buffer rule                                                                                                            |
| Margin ratio thresholds        | internal financial buffer rule                                                                                                  |
| Stress-test scenario shocks    | Low / Medium / High sensitivity grid                                                                                            |
| Priority score weights         | hazard, vulnerability, and stress-failure components                                                                            |
| Priority label thresholds      | Low / Moderate / High / Critical                                                                                                |

These internal thresholds are used to make the decision-support framework consistent and interpretable. They should be interpreted as calibrated analytical rules, not universal economic constants.

---

## Conceptual References Used in the Notebooks

The notebooks include conceptual references to support methodological decisions, such as:

* Weak supervision and programmatic labeling for pseudo-label construction.
* Benefit-cost and break-even logic for financial feasibility.
* Data Envelopment Analysis for frontier-style efficiency comparison.
* Supply chain resilience literature for stress-test interpretation.
* Disaster risk framework based on hazard and vulnerability.
* Silhouette analysis for cluster audit.

These references are used for methodological grounding only and do not introduce external training data.

---

## Interpretation Notes

* The flood model predicts `FloodProbability` from the flood dataset.
* The rice model predicts an internally generated vulnerability label.
* The rice vulnerability label is a pseudo-label, not externally validated ground truth.
* Cluster results are used only for audit and are not used as the primary label source or training feature.
* The stress-test notebook is a scenario-based sensitivity analysis, not a supervised machine learning model.
* The final decision-support matrix is a scenario-based risk prioritization tool, not a real-time disaster warning system.
* Because the flood dataset has no West Java-specific location key, flood risk is not claimed as a direct regency-level flood prediction.
* The combined output is best interpreted as:

```text
If flood hazard is high, which rice supply chain actor-region nodes should be prioritized based on their existing operational vulnerability and stress-test resilience?
```

---

## Recommended Execution

From the project root, open Jupyter and run:

```text
01_flood_rice_data_understanding_visualization.ipynb
02_flood_rice_preprocessing_pseudo_labeling.ipynb
03_flood_rice_model_training_evaluation.ipynb
04_flood_stress_test_sensitivity_analysis.ipynb
05_flood_logistics_decision_support.ipynb
```

Expected final decision-support outputs:

```text
outputs/05_final_flood_logistics_priority.csv
outputs/05_high_priority_shortlist.csv
outputs/05_actor_region_recommended_actions.csv
outputs/05_top10_intervention_priority.csv
outputs/05_stakeholder_action_summary.csv
```

---

## Final Output Interpretation

The final output should be read as a decision-support recommendation:

```text
Actor-region units with high vulnerability, high flood scenario exposure, and high stress-test failure rate should receive higher intervention priority.
```

Examples of possible recommended actions include:

* buffer stock preparation,
* backup supplier planning,
* alternative storage and route planning,
* milling capacity protection,
* retail price monitoring,
* distribution bottleneck monitoring,
* targeted continuity support for vulnerable actors.

This project does not claim to predict actual disaster damage or real-time rice shortages. It provides a structured, interpretable, and data-constrained framework for identifying rice supply chain nodes that require priority attention under flood-risk scenarios.
