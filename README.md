# Flood-Resilient Rice Supply Chain Decision Support

This repository contains a flood-resilient rice supply chain decision-support project for West Java, Indonesia.

Primary notebook:

```text
ai/notebooks/flood_resilient_rice_supply_chain_single_submission.ipynb
```

The notebook consolidates the earlier five-notebook workflow into one paper-style analytical pipeline. It covers flood hazard structure, rice supply-chain vulnerability, stress simulation, robustness checks, surrogate-model audit, and logistics intervention prioritization.

The final output is not a real-time flood forecasting system. It is a scenario-based decision-support framework for ranking actor-region rice supply chain units by vulnerability, flood-stress severity, simulated failure probability, regional historical flood exposure, actor role importance, and ranking robustness.

## Analytical Framing

The project combines:

- the provided `Flood Prediction` dataset as the flood hazard model input,
- the provided `Rice Supply Chain in West Java Province, Indonesia` dataset as the financial and operational vulnerability input,
- Open Data Jabar flood-event context as a regional exposure bridge,
- deterministic stress tests, Monte Carlo simulation, and Latin Hypercube Sampling,
- convergence, ablation, sensitivity, and decision-weight robustness checks,
- an optional ML surrogate model that emulates simulated failure behavior,
- transparent rule-based and simulation-enhanced logistics priority scoring.

The flood and rice datasets are not merged row by row because they do not share a common date, coordinate, event id, or identical location key. Integration happens through the methodological framework:

```text
Flood hazard structure
+ rice actor vulnerability
+ regional historical flood exposure
+ stress simulation
+ robustness checks
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
| Are the simulation and priority rankings stable? | LHS convergence, simulation-driver ablation, decision-component ablation, weight perturbation | `04_lhs_convergence_stability_summary.csv`, `05_priority_weight_robustness.csv` |

## Repository Structure

```text
flood_rice_resilience_project/
|-- app/
|   |-- app/
|   |-- public/
|   |-- src/
|   |-- package.json
|   `-- Dockerfile
|-- ai/
|   |-- notebooks/
|   |   |-- flood_resilient_rice_supply_chain_single_submission.ipynb
|   |   |-- 01_flood_rice_data_understanding_visualization.ipynb
|   |   |-- 02_flood_rice_preprocessing_pseudo_labeling.ipynb
|   |   |-- 03_flood_rice_model_training_evaluation.ipynb
|   |   |-- 04_flood_stress_test_sensitivity_analysis.ipynb
|   |   `-- 05_flood_logistics_decision_support.ipynb
|   |-- simulator/
|   |-- outputs/
|   |-- figures/
|   |-- models/
|   |   |-- 03_final_flood_probability_model.joblib
|   |   |-- 03_final_rice_vulnerability_model.joblib
|   |   `-- 04_failure_surrogate_model.joblib
|   |-- catboost_info/
|   `-- requirements-ai.txt
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
|-- docker-compose.yml
|-- DEPLOYMENT.md
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
python -m pip install -r ai/requirements-ai.txt
```

Then open the main notebook in VS Code, JupyterLab, or another Jupyter-compatible environment:

```text
ai/notebooks/flood_resilient_rice_supply_chain_single_submission.ipynb
```

Run all cells from top to bottom.

## Single Notebook Sections

The submission notebook is organized as:

1. Data understanding and external exposure bridge.
2. Preprocessing and Method 3 weak labeling.
3. Flood and rice model training and evaluation.
4. Method 5 stress-test simulation, Monte Carlo, LHS, convergence, ablation, sensitivity analysis, and surrogate-model audit.
5. Method 1 decision support, decision-score ablation, weight robustness, and final recommendations.
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
ai/outputs/05_lhs_enhanced_priority.csv
```

The surrogate output is an audit layer. It should not replace the LHS-enhanced priority table as the final recommendation source.

### Robustness Checks

The current notebook includes several checks to reduce the risk that the final ranking is an artifact of one sample draw or one exact policy-weight vector:

| Check | Purpose | Current takeaway |
| --- | --- | --- |
| Flood residual diagnostics | Inspect whether the flood regression has visible holdout residual structure | Supports the caution that the target is highly regular and likely formula-like |
| LHS convergence | Recompute high-stress actor failure probabilities at larger sample sizes | Actor rankings are stable from 100 to 1,000 samples |
| Simulation-driver ablation | Neutralize stress drivers such as cost shock, revenue shock, and exposure modifier | High-stress failure is driven mainly by stress-induced margin compression |
| Decision-score component ablation | Remove one priority component at a time and re-rank units | Vulnerability and flood scenario are the largest decision drivers |
| Decision-weight robustness | Perturb priority weights by +/-20% and track high-stress top-10 stability | The leading high-stress shortlist remains stable across 300 perturbed-weight runs |

Under the latest convergence summary, high-stress failure probabilities remain approximately stable by actor: Retail stays at 100%, Middlemen near 97%, Rice Miller near 97%, Wholesaler near 75%, and Farmer near 28%.

## Key Outputs

Data understanding and preprocessing:

- `ai/outputs/01_flood_raw.csv`
- `ai/outputs/01_rice_consolidated_raw.csv`
- `ai/outputs/01b_jabar_flood_exposure_by_region.csv`
- `ai/outputs/02_rice_vulnerability_dataset.csv`
- `ai/outputs/02_actor_region_vulnerability.csv`
- `ai/outputs/02_external_enrichment_policy.csv`

Modeling:

- `ai/outputs/03_flood_cv_results.csv`
- `ai/outputs/03_rice_cv_results.csv`
- `ai/outputs/03_model_selection_rationale.csv`
- `ai/outputs/03_final_model_summary.json`
- `ai/outputs/03_flood_feature_target_correlation.csv`
- `ai/outputs/03_flood_holdout_residual_diagnostics.csv`
- `ai/models/03_final_flood_probability_model.joblib`
- `ai/models/03_final_rice_vulnerability_model.joblib`

Stress simulation and surrogate audit:

- `ai/outputs/04_unit_stress_test_results.csv`
- `ai/outputs/04_actor_region_stress_summary.csv`
- `ai/outputs/04_monte_carlo_actor_region_summary.csv`
- `ai/outputs/04_lhs_actor_region_summary.csv`
- `ai/outputs/04_lhs_unit_results.csv`
- `ai/outputs/04_lhs_convergence_by_actor.csv`
- `ai/outputs/04_lhs_convergence_stability_summary.csv`
- `ai/outputs/04_lhs_simulation_ablation_by_component.csv`
- `ai/outputs/04_lhs_simulation_ablation_by_actor.csv`
- `ai/outputs/04_lhs_simulation_ablation_unit_results.csv`
- `ai/outputs/04_sensitivity_results.csv`
- `ai/outputs/04_surrogate_model_cv_results.csv`
- `ai/outputs/04_surrogate_holdout_metrics.csv`
- `ai/outputs/04_surrogate_prediction_summary.csv`
- `ai/models/04_failure_surrogate_model.joblib`

Decision support:

- `ai/outputs/05_final_flood_logistics_priority.csv`
- `ai/outputs/05_high_priority_shortlist.csv`
- `ai/outputs/05_actor_region_recommended_actions.csv`
- `ai/outputs/05_top10_intervention_priority.csv`
- `ai/outputs/05_monte_carlo_enhanced_priority.csv`
- `ai/outputs/05_lhs_enhanced_priority.csv`
- `ai/outputs/05_top10_lhs_priority.csv`
- `ai/outputs/05_lhs_priority_distribution_share.csv`
- `ai/outputs/05_lhs_priority_policy.csv`
- `ai/outputs/05_priority_component_ablation.csv`
- `ai/outputs/05_priority_component_ablation_unit_scores.csv`
- `ai/outputs/05_priority_weight_robustness.csv`
- `ai/outputs/05_priority_weight_robustness_rank_detail.csv`
- `ai/outputs/05_priority_weight_robustness_weight_samples.csv`
- `ai/outputs/05_stakeholder_action_summary.csv`

## Key Figures

The `ai/figures/` folder contains visual outputs for:

- flood target distribution and pressure trends,
- flood target correlation and residual diagnostics,
- rice actor-region coverage and vulnerability,
- model performance and feature importance,
- stress failure response curves,
- LHS convergence and simulation-driver ablation,
- Monte Carlo and LHS high-failure heatmaps,
- surrogate confusion matrix and feature importance,
- final Monte Carlo and LHS priority distributions,
- decision-score component ablation and weight-robustness diagnostics,
- top intervention priority rankings.

## Interpretation Boundaries

- The rice vulnerability label is a paper-grounded pseudo-label, not field-observed ground truth.
- The stress shock ranges are internal scenario assumptions, not causal flood-damage estimates.
- The surrogate model approximates simulated failure behavior, not observed disruption outcomes.
- The external Jabar flood-event bridge is a small regional exposure context layer, not a primary supervised training target.
- The decision weights are transparent policy assumptions, not fitted parameters; ablation and weight-robustness checks are used to inspect whether conclusions are stable.
- Because the flood and rice datasets do not share row-level temporal or geographic keys, final outputs are not district-date flood impact predictions.

The final decision-support question is:

```text
If flood hazard increases, which rice supply chain actor-region nodes should receive priority attention based on vulnerability, resilience buffer, simulated failure probability, regional exposure, and actor role?
```

## Recommended Final Tables

For most reporting or presentation use cases, start with:

- `ai/outputs/05_lhs_enhanced_priority.csv`
- `ai/outputs/05_top10_lhs_priority.csv`
- `ai/outputs/05_actor_region_recommended_actions.csv`
- `ai/outputs/05_stakeholder_action_summary.csv`
- `ai/outputs/05_priority_weight_robustness.csv`
- `ai/outputs/05_priority_component_ablation.csv`

The top LHS-enhanced priorities are dominated by downstream and intermediary nodes, especially Retail, Rice Miller, Wholesaler, and Middlemen units under high flood stress. Karawang receives additional priority because of its high historical flood exposure. The latest weight-robustness output keeps the leading high-stress units in the top-10 list across nearly all perturbed-weight runs, with the strongest units appearing in 100% of runs.
