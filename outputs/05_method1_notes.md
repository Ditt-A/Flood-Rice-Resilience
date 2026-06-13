# Method 1 Notes — Hazard × Vulnerability Decision Support

This notebook is a decision-support layer, not a new supervised model.

## Why no new model?

The final priority label is not observed ground truth. It is a policy-style decision layer built from:

1. predicted flood hazard scenario,
2. predicted rice supply-chain vulnerability, and
3. stress-test survival / fail-share from Method 5.

Training another model to predict this label would only replicate the rule matrix and make the process less transparent.

## Domain grounding

The decision framework follows disaster-risk logic: risk emerges from the interaction of hazard with exposure, vulnerability, and capacity. In this project:

- flood scenario = hazard,
- rice actor-region unit = exposed supply-chain node,
- vulnerability label = financial/operational vulnerability,
- stress fail share = low resilience / low buffer,
- priority label = intervention priority.

## Limitation

Because the flood and rice datasets do not share a common geographic or temporal key, this notebook does not claim actual flood impact prediction for a specific district/date. It is a scenario-based risk-prioritization framework.
