# Flood-Resilient Rice Supply Chain Project

This repository contains a five-notebook machine learning and decision-support workflow for flood-resilient rice supply chain planning in West Java, Indonesia.

The project combines:

- the provided `Flood Prediction` dataset as the flood hazard model input,
- the provided `Rice Supply Chain in West Java Province, Indonesia` dataset as the financial and operational vulnerability input,
- Open Data Jabar flood-event context as a regional exposure bridge only,
- stress-test and Monte Carlo sensitivity analysis for resilience and intervention prioritization.

The flood and rice datasets are not merged row by row because they do not share a common date, coordinate, event id, or identical location key. Integration happens at the analytical scenario level:

```text
Flood hazard prediction
+ rice supply chain vulnerability
+ stress-test and Monte Carlo resilience analysis
+ regional exposure context
= flood-logistics intervention priority
```

## Current Project Scope

The current version implements three linked methods:

| Method | Business question | Main output |
| --- | --- | --- |
| Method 3: paper-grounded weak labeling | Which rice supply chain actors are financially and operationally vulnerable? | `vulnerability_label` |
| Method 5: stress-test sensitivity analysis | Which actor-region units are most likely to fail under flood-stress scenarios? | `survive_under_stress`, `stress_risk_label`, Monte Carlo failure probability |
| Method 1: hazard x vulnerability decision support | Which actor-region units should be prioritized when flood risk increases? | `priority_label`, `recommended_action`, Monte Carlo enhanced priority |

## Repository Structure

```text
flood_rice_resilience_project/
|-- 01_flood_rice_data_understanding_visualization.ipynb
|-- 02_flood_rice_preprocessing_pseudo_labeling.ipynb
|-- 03_flood_rice_model_training_evaluation.ipynb
|-- 04_flood_stress_test_sensitivity_analysis.ipynb
|-- 05_flood_logistics_decision_support.ipynb
|-- data/
|   |-- README.md
|   |-- raw/
|   |   |-- Flood Prediction.zip
|   |   |-- Flood Prediction/
|   |   |-- Rice Supply Chain in West Java Province, Indonesia.zip
|   |   `-- Rice Supply Chain in West Java Province, Indonesia/
|   `-- external/
|       |-- jabar_flood_events_by_kabupaten_kota.csv
|       |-- jabar_flood_events_used_in_project.csv
|       `-- jabar_flood_exposure_by_region_for_project.csv
|-- figures/
|-- models/
|   |-- 03_final_flood_probability_model.joblib
|   `-- 03_final_rice_vulnerability_model.joblib
|-- outputs/
|-- catboost_info/
|-- requirements.txt
`-- README.md
```

## Setup

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the project requirements:

```powershell
python -m pip install -r requirements.txt
```

Then open the notebooks in JupyterLab, VS Code, or another Jupyter-compatible environment.

## Execution Order

Run the notebooks in this order:

```text
01 -> 02 -> 03 -> 04 -> 05
```

Each notebook writes artifacts to `outputs/`, `figures/`, and, for trained models, `models/`.

## Notebook Pipeline

### 1. Data Understanding and Visualization

Notebook: `01_flood_rice_data_understanding_visualization.ipynb`

Purpose:

- Load and audit the flood and rice raw datasets.
- Parse the rice Excel workbook from the ZIP archive.
- Consolidate actor-level rice data into a unified table.
- Create the project context manifest and feature dictionary.
- Build initial visual diagnostics for flood pressure and rice supply chain structure.
- Prepare the Open Data Jabar flood exposure bridge for the five rice regions.

Important outputs include:

- `outputs/01_flood_raw.csv`
- `outputs/01_rice_consolidated_raw.csv`
- `outputs/01_rice_summary_by_actor_region.csv`
- `outputs/01_feature_dictionary.csv`
- `outputs/01_project_context.json`
- `outputs/01b_jabar_flood_events_rice_regions.csv`
- `outputs/01b_jabar_flood_exposure_by_region.csv`

### 2. Preprocessing and Method 3 Weak Labeling

Notebook: `02_flood_rice_preprocessing_pseudo_labeling.ipynb`

Purpose:

- Clean and standardize flood and rice modeling datasets.
- Engineer financial and operational rice supply chain indicators.
- Build paper-grounded weak labels for vulnerability.
- Use clustering as an audit layer only.
- Export leakage-control policy files for Notebook 03.
- Preserve external flood context as downstream exposure context only.

The rice vulnerability label is a pseudo-label, not an externally observed ground-truth label. It is built from transparent rules such as break-even feasibility, margin pressure, operating burden, frontier inefficiency, precipitation stress proxies, and utilization pressure.

Important outputs include:

- `outputs/02_flood_modeling_dataset.csv`
- `outputs/02_rice_vulnerability_dataset.csv`
- `outputs/02_actor_region_vulnerability.csv`
- `outputs/02_feature_modeling_policy.csv`
- `outputs/02_external_enrichment_policy.csv`
- `outputs/02_external_jabar_flood_context_by_region.csv`
- `outputs/02_methodological_notes.md`
- `outputs/02_top_vulnerable_actor_region.csv`

### 3. Model Training and Evaluation

Notebook: `03_flood_rice_model_training_evaluation.ipynb`

Purpose:

- Train and evaluate the flood regression model for `FloodProbability`.
- Train and evaluate the rice operational vulnerability classifier.
- Keep Notebook 03 modeling-only, without stress testing or final decision-support scoring.
- Export full predictions, fold-level validation results, feature importance, and trained model files.

Current selected models:

| Task | Target | Selected model | Validation role |
| --- | --- | --- | --- |
| Flood regression | `FloodProbability` | Ridge | 5-fold KFold plus holdout and shuffled-target sanity check |
| Rice classification | `vulnerability_label` | Random Forest | 5-fold StratifiedKFold plus holdout sanity check |

The model zoo includes linear models, tree ensembles, histogram gradient boosting, XGBoost, LightGBM, and CatBoost. The rice operational model uses 34 operational features and excludes cluster columns, rule scores, label-construction fields, hard-rule flags, and administrative-only columns.

Important outputs include:

- `outputs/03_flood_cv_results.csv`
- `outputs/03_flood_cv_fold_results.csv`
- `outputs/03_flood_target_structure_audit.csv`
- `outputs/03_flood_target_shuffle_sanity_check.csv`
- `outputs/03_flood_holdout_metrics.csv`
- `outputs/03_flood_full_predictions.csv`
- `outputs/03_rice_cv_results.csv`
- `outputs/03_rice_cv_fold_results.csv`
- `outputs/03_rice_holdout_metrics.csv`
- `outputs/03_rice_full_predictions.csv`
- `outputs/03_actor_region_model_summary.csv`
- `outputs/03_final_model_summary.json`
- `models/03_final_flood_probability_model.joblib`
- `models/03_final_rice_vulnerability_model.joblib`

### 4. Method 5 Stress-Test and Monte Carlo Sensitivity

Notebook: `04_flood_stress_test_sensitivity_analysis.ipynb`

Purpose:

- Estimate whether actor-region units remain financially viable under flood-stress scenarios.
- Calculate break-even buffers and stress-failure outcomes.
- Run Monte Carlo stress simulations for uncertainty-aware failure probabilities.
- Add regional historical flood exposure as a modifier for downstream decision support.

Core break-even logic:

```text
survive if revenue > cost
fail if revenue <= cost
```

The deterministic stress grid uses low, medium, and high scenarios. The current Monte Carlo ranges are:

| Scenario | Cost shock range | Revenue shock range |
| --- | --- | --- |
| Low | 2% to 8% | 1% to 5% |
| Medium | 8% to 22% | 4% to 12% |
| High | 15% to 45% | 8% to 25% |

Important outputs include:

- `outputs/04_actor_unit_resilience_buffer.csv`
- `outputs/04_actor_region_resilience_buffer.csv`
- `outputs/04_unit_stress_test_results.csv`
- `outputs/04_actor_region_stress_summary.csv`
- `outputs/04_stress_transition_matrix.csv`
- `outputs/04_monte_carlo_unit_results.csv`
- `outputs/04_monte_carlo_actor_region_summary.csv`
- `outputs/04_monte_carlo_failure_probability_by_actor.csv`
- `outputs/04_monte_carlo_top_actor_region_failures.csv`
- `outputs/04_monte_carlo_stress_ranges.csv`
- `outputs/04_method5_notes.md`

### 5. Method 1 Decision Support

Notebook: `05_flood_logistics_decision_support.ipynb`

Purpose:

- Combine flood hazard, rice vulnerability, stress-test survival, Monte Carlo failure probability, and historical flood exposure context.
- Produce rule-based and Monte Carlo enhanced priority outputs.
- Translate priority results into stakeholder-oriented recommended actions.

The Monte Carlo enhanced priority policy currently uses:

| Component | Weight |
| --- | ---: |
| Vulnerability component | 0.35 |
| Hazard component | 0.30 |
| Monte Carlo failure component | 0.25 |
| External exposure component | 0.10 |

Important outputs include:

- `outputs/05_final_flood_logistics_priority.csv`
- `outputs/05_high_priority_shortlist.csv`
- `outputs/05_actor_region_recommended_actions.csv`
- `outputs/05_top10_intervention_priority.csv`
- `outputs/05_stakeholder_action_summary.csv`
- `outputs/05_monte_carlo_enhanced_priority.csv`
- `outputs/05_top10_monte_carlo_priority.csv`
- `outputs/05_monte_carlo_priority_distribution_share.csv`
- `outputs/05_monte_carlo_priority_policy.csv`
- `outputs/05_monte_carlo_top10_component_contribution.csv`
- `outputs/05_decision_support_manifest.json`

## Data Policy

The two primary project datasets are stored in `data/raw/`:

- `Flood Prediction.zip`
- `Rice Supply Chain in West Java Province, Indonesia.zip`

The project also includes Open Data Jabar flood-event context in `data/external/`. This external context is not used to create the Method 3 rice vulnerability label and is not used as an operational feature in the rice vulnerability classifier. It is used downstream as a regional exposure bridge, stress-test modifier, and decision-support tie-breaker.

External literature is used conceptually to justify weak labeling, break-even logic, stress testing, and disaster-risk framing. External rows, labels, prices, maps, or observations are not treated as supervised training labels for the rice vulnerability model.

## Interpretation Boundaries

- The flood model predicts `FloodProbability` from the provided flood dataset.
- The rice model predicts an internally generated pseudo-label.
- The rice vulnerability label is not externally validated field truth.
- Clustering is used only for audit and interpretability.
- The stress test is scenario-based sensitivity analysis, not a causal damage estimate.
- The Monte Carlo layer estimates uncertainty-aware failure and priority patterns under internal shock ranges.
- Because the flood and rice datasets do not share a direct temporal or geographic key, the final outputs are not real-time district-level flood impact predictions.

The final decision-support question is:

```text
If flood hazard increases, which rice supply chain actor-region nodes should receive priority attention based on vulnerability, resilience buffer, failure probability, and regional exposure context?
```

## Key Final Outputs

For most decision-support use cases, start with:

- `outputs/05_final_flood_logistics_priority.csv`
- `outputs/05_high_priority_shortlist.csv`
- `outputs/05_actor_region_recommended_actions.csv`
- `outputs/05_top10_intervention_priority.csv`
- `outputs/05_monte_carlo_enhanced_priority.csv`
- `outputs/05_top10_monte_carlo_priority.csv`
- `outputs/05_stakeholder_action_summary.csv`

Recommended actions may include buffer stock preparation, backup supplier planning, alternative storage and route planning, milling capacity protection, retail price monitoring, distribution bottleneck monitoring, and targeted continuity support for vulnerable actors.
