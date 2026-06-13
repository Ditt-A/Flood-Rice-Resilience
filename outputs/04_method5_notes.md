# Method 5 Notes — Flood Stress-Test Sensitivity Analysis

This notebook is a scenario-based sensitivity analysis, not a causal forecast.

## Core principle

An actor-region unit is financially viable while revenue remains greater than cost. Therefore, the stress test estimates how much cost-side pressure the unit can absorb before reaching break-even.

## Data-derived buffers

- `cost_shock_tolerance = (revenue - cost) / cost`
- `revenue_drop_tolerance = (revenue - cost) / revenue`
- `combined_break_even_buffer = min(cost_shock_tolerance, revenue_drop_tolerance)`

These indicators use only values available in the rice supply chain dataset and predictions produced by Notebook 03.

## Scenario grid

Low, Medium, and High flood stress scenarios use 5%, 15%, and 30% cost-side shock grids. These are internal sensitivity thresholds, not observed causal estimates. They are used to compare actor-region units under consistent stress levels.

## Domain references

- Ponomarov & Holcomb (2009): supply chain resilience as preparedness and adaptive capability against disruptions.
- Wieland & Durach (2021): supply chain resilience as capacity to persist, adapt, or transform.
- Simchi-Levi, Wang, & Wei (2018): supply chain robustness and weak-point identification through flexibility, inventory, and resilience logic.
- Boardman et al. (2018): cost-benefit and break-even logic for financial feasibility.
