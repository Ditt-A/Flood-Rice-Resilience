# Flood-Resilient Rice Supply Chain Decision Support

This repository contains a single-notebook submission for flood-resilient rice supply chain decision support in West Java, Indonesia.

Primary notebook:

```text
flood_resilient_rice_supply_chain_single_submission.ipynb
```

The notebook consolidates the earlier five-notebook workflow into one paper-style analytical pipeline. It covers flood hazard structure, rice supply-chain vulnerability, stress simulation, sensitivity analysis, surrogate-model audit, and logistics intervention prioritization.

The final output is not a real-time flood forecasting system. It is a scenario-based decision-support framework for ranking actor-region rice supply chain units by vulnerability, flood-stress severity, simulated failure probability, regional historical flood exposure, and actor role importance.

## Analytical Framing

The project combines:

- the provided `Flood Prediction` dataset as the flood hazard model input,
- the provided `Rice Supply Chain in West Java Province, Indonesia` dataset as the financial and operational vulnerability input,
- Open Data Jabar flood-event context as a regional exposure bridge,
- deterministic stress tests, Monte Carlo simulation, and Latin Hypercube Sampling,
- an optional ML surrogate model that emulates simulated failure behavior,
- transparent rule-based and simulation-enhanced logistics priority scoring.

The flood and rice datasets are not merged row by row because they do not share a common date, coordinate, event id, or identical location key. Integration happens through the methodological framework:

```text
Flood hazard structure
+ rice actor vulnerability
+ regional historical flood exposure
+ stress simulation
= logistics intervention priority
```

## Business Questions

The single submission notebook answers four business questions:

| Question | Method used | Main outputs |
| --- | --- | --- |
| Which rice supply-chain actors and regions are financially and operationally vulnerable? | Paper-grounded weak labeling and actor-region profiling | `vulnerability_label`, `02_actor_region_vulnerability.csv` |
| Which predictive models best learn the flood-probability and rice-vulnerability patterns? | K-fold model evaluation, holdout checks, leakage controls | `03_model_selection_rationale.csv`, trained `.joblib` models |
| Which actor-region units are most likely to fail under flood-stress scenarios? | Deterministic stress tests, Monte Carlo, LHS, sensitivity analysis | `04_unit_stress_test_results.csv`, `04_lhs_actor_region_summary.csv` |
| Which actor-region units should be prioritized for intervention when flood risk increases? | Hazard, vulnerability, failure probability, exposure, and role scoring | `05_lhs_enhanced_priority.csv`, `05_actor_region_recommended_actions.csv` |

## Repository Structure

```text
flood_rice_resilience_project/
|-- flood_resilient_rice_supply_chain_single_submission.ipynb
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
|-- outputs/
|-- figures/
|-- models/
|   |-- 03_final_flood_probability_model.joblib
|   |-- 03_final_rice_vulnerability_model.joblib
|   `-- 04_failure_surrogate_model.joblib
|-- catboost_info/
|-- requirements.txt
`-- README.md
```

The numbered notebooks are retained as modular source notebooks. The primary submission artifact is the single consolidated notebook.

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

Then open the main notebook in VS Code, JupyterLab, or another Jupyter-compatible environment:

```text
flood_resilient_rice_supply_chain_single_submission.ipynb
```

Run all cells from top to bottom.

## Single Notebook Sections

The submission notebook is organized as:

1. Data understanding and external exposure bridge.
2. Preprocessing and Method 3 weak labeling.
3. Flood and rice model training and evaluation.
4. Method 5 stress-test simulation, Monte Carlo, LHS, sensitivity analysis, and surrogate-model audit.
5. Method 1 decision support and final recommendations.
6. Final synthesis and bibliography.

## Data Inputs

Primary datasets:

- `data/raw/Flood Prediction.zip`
- `data/raw/Rice Supply Chain in West Java Province, Indonesia.zip`

External context:

- `data/external/jabar_flood_events_by_kabupaten_kota.csv`
- `data/external/jabar_flood_events_used_in_project.csv`
- `data/external/jabar_flood_exposure_by_region_for_project.csv`

The Open Data Jabar context is used as a small regional exposure bridge only. It is not used to create the Method 3 rice vulnerability label and is not used as an operational feature in the rice vulnerability classifier.

## Method Summary

### Method 3: Weak Labeling

The rice supply chain dataset does not contain an externally validated vulnerability label. The notebook creates a paper-grounded pseudo-label from transparent financial and operational rules, including:

- break-even feasibility,
- margin pressure,
- cost/revenue ratio,
- operational burden,
- actor-wise frontier inefficiency,
- precipitation stress proxies where available,
- utilization pressure.

Clustering is used only as an audit and interpretability layer. Cluster outputs, rule scores, hard-rule flags, label-construction fields, and administrative-only identifiers are excluded from the operational rice vulnerability model.

### Model Evaluation

Current generated model-selection artifacts report:

| Task | Target | Selected model | Notes |
| --- | --- | --- | --- |
| Flood regression | `FloodProbability` | Ridge | Selected by 5-fold KFold CV RMSE, with holdout and shuffled-target sanity checks |
| Rice vulnerability classification | `vulnerability_label` | Random Forest | Selected by 5-fold StratifiedKFold score using macro F1 and balanced accuracy |
| Simulation surrogate | `fail_under_stress` | Logistic Regression | Emulates simulated failure output, not observed real-world disruption |

The flood target appears highly structured and likely formula-like with respect to its input features, so the flood model is interpreted as learning the dataset's hazard-probability structure rather than forecasting real flood events.

### Method 5: Stress Simulation

The stress-test layer estimates whether actor-region units remain financially viable under flood-stress scenarios.

Core logic:

```text
survive if revenue > cost
fail if revenue <= cost
```

The current LHS stress ranges are:

| Scenario | Cost shock range | Revenue shock range |
| --- | --- | --- |
| Low | 2% to 8% | 1% to 5% |
| Medium | 8% to 22% | 4% to 12% |
| High | 15% to 45% | 8% to 25% |

Sensitivity analysis shows that simulated failure is driven mainly by base cost/revenue ratio, combined break-even buffer, and vulnerability score. Shock assumptions matter, but the baseline financial position of each actor-region unit dominates failure behavior.

### Method 1: Decision Support

The final decision layer combines vulnerability, flood scenario severity, LHS failure probability, historical Jabar flood exposure, and actor role.

Current LHS-enhanced priority weights:

| Component | Weight |
| --- | ---: |
| Vulnerability | 0.35 |
| Flood scenario | 0.25 |
| LHS failure probability | 0.25 |
| Historical Jabar flood exposure | 0.10 |
| Actor role weight | 0.05 |

The recommended final simulation-based output is:

```text
outputs/05_lhs_enhanced_priority.csv
```

The surrogate output is an audit layer. It should not replace the LHS-enhanced priority table as the final recommendation source.

## Key Outputs

Data understanding and preprocessing:

- `outputs/01_flood_raw.csv`
- `outputs/01_rice_consolidated_raw.csv`
- `outputs/01b_jabar_flood_exposure_by_region.csv`
- `outputs/02_rice_vulnerability_dataset.csv`
- `outputs/02_actor_region_vulnerability.csv`
- `outputs/02_external_enrichment_policy.csv`

Modeling:

- `outputs/03_flood_cv_results.csv`
- `outputs/03_rice_cv_results.csv`
- `outputs/03_model_selection_rationale.csv`
- `outputs/03_final_model_summary.json`
- `models/03_final_flood_probability_model.joblib`
- `models/03_final_rice_vulnerability_model.joblib`

Stress simulation and surrogate audit:

- `outputs/04_unit_stress_test_results.csv`
- `outputs/04_actor_region_stress_summary.csv`
- `outputs/04_monte_carlo_actor_region_summary.csv`
- `outputs/04_lhs_actor_region_summary.csv`
- `outputs/04_lhs_unit_results.csv`
- `outputs/04_sensitivity_results.csv`
- `outputs/04_surrogate_model_cv_results.csv`
- `outputs/04_surrogate_holdout_metrics.csv`
- `outputs/04_surrogate_prediction_summary.csv`
- `models/04_failure_surrogate_model.joblib`

Decision support:

- `outputs/05_final_flood_logistics_priority.csv`
- `outputs/05_high_priority_shortlist.csv`
- `outputs/05_actor_region_recommended_actions.csv`
- `outputs/05_top10_intervention_priority.csv`
- `outputs/05_monte_carlo_enhanced_priority.csv`
- `outputs/05_lhs_enhanced_priority.csv`
- `outputs/05_top10_lhs_priority.csv`
- `outputs/05_lhs_priority_distribution_share.csv`
- `outputs/05_lhs_priority_policy.csv`
- `outputs/05_stakeholder_action_summary.csv`

## Key Figures

The `figures/` folder contains visual outputs for:

- flood target distribution and pressure trends,
- rice actor-region coverage and vulnerability,
- model performance and feature importance,
- stress failure response curves,
- Monte Carlo and LHS high-failure heatmaps,
- surrogate confusion matrix and feature importance,
- final Monte Carlo and LHS priority distributions,
- top intervention priority rankings.

## Interpretation Boundaries

- The rice vulnerability label is a paper-grounded pseudo-label, not field-observed ground truth.
- The stress shock ranges are internal scenario assumptions, not causal flood-damage estimates.
- The surrogate model approximates simulated failure behavior, not observed disruption outcomes.
- The external Jabar flood-event bridge is a small regional exposure context layer, not a primary supervised training target.
- Because the flood and rice datasets do not share row-level temporal or geographic keys, final outputs are not district-date flood impact predictions.

The final decision-support question is:

```text
If flood hazard increases, which rice supply chain actor-region nodes should receive priority attention based on vulnerability, resilience buffer, simulated failure probability, regional exposure, and actor role?
```

## Recommended Final Tables

For most reporting or presentation use cases, start with:

- `outputs/05_lhs_enhanced_priority.csv`
- `outputs/05_top10_lhs_priority.csv`
- `outputs/05_actor_region_recommended_actions.csv`
- `outputs/05_stakeholder_action_summary.csv`

The top LHS-enhanced priorities are dominated by downstream and intermediary nodes, especially Retail, Rice Miller, Wholesaler, and Middlemen units under high flood stress. Karawang receives additional priority because of its high historical flood exposure.
