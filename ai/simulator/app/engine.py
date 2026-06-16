from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from .schemas import Mutation, RegionRequest, ScenarioComparisonRequest, SimulationRequest


PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", Path(__file__).resolve().parents[3]))
OUTPUTS = PROJECT_ROOT / "ai" / "outputs"
MODELS = PROJECT_ROOT / "ai" / "models"

REGIONS = ["Garut", "Indramayu", "Karawang", "Subang", "Tasikmalaya"]
ACTORS = ["Farmer", "Rice Miller", "Middlemen", "Wholesaler", "Retail"]
SCENARIOS = ["Low", "Medium", "High"]
DERIVED_FEATURES = {
    "total_cost",
    "output_value",
    "margin",
    "cost_revenue_ratio",
    "operational_burden_ratio",
    "precipitation_stress_raw",
    "operational_cost",
    "quantity_proxy",
    "margin_ratio",
    "cost_per_quantity_proxy",
    "output_per_quantity_proxy",
}

ACTOR_CONFIG = {
    "Farmer": {
        "costs": [
            "land_lease_value_idr",
            "labor_cost_idr",
            "seed_purchase_value_idr",
            "fertilizer_purchase_value_idr",
            "pesticide_purchase_value_idr",
            "equipment_rent_value_idr",
        ],
        "outputs": ["production_value_idr"],
        "quantities": ["land_area_m2"],
        "precipitation": [],
    },
    "Rice Miller": {
        "costs": [
            "value_of_milled_grains_idr",
            "labor_cost_idr",
            "supporting_equipment_cost_idr",
        ],
        "outputs": [
            "nilaiberashasilgiling",
            "total_revenue_of_milling_machine_idr",
        ],
        "quantities": ["amount_of_milled_rice_kg", "number_of_machines"],
        "precipitation": [],
    },
    "Middlemen": {
        "costs": [
            "total_rice_purchase_idr",
            "building_rent_cost_idr",
            "labor_cost_idr",
            "supporting_equipment_cost_idr",
        ],
        "outputs": ["value_of_rice_sold_idr"],
        "quantities": ["total_rice_purchase_kg"],
        "precipitation": ["total_precipitation_pct", "precipitation_quality_pct"],
    },
    "Wholesaler": {
        "costs": [
            "value_of_rice_purchase_idr",
            "building_rent_cost_idr",
            "labor_cost_idr",
            "supporting_equipment_cost_idr",
        ],
        "outputs": ["value_of_rice_sold_idr"],
        "quantities": [],
        "precipitation": ["precipitation_quality_pct"],
    },
    "Retail": {
        "costs": [
            "value_of_rice_purchase_idr",
            "building_rent_cost_idr",
            "labor_cost_idr",
            "supporting_equipment_cost_idr",
        ],
        "outputs": ["value_of_rice_sold_idr"],
        "quantities": [],
        "precipitation": ["precipitation_quality_pct"],
    },
}

FEATURE_UNITS = {
    "actor": "category",
    "region": "category",
    "total_cost": "IDR",
    "output_value": "IDR",
    "margin": "IDR",
    "cost_revenue_ratio": "ratio",
    "operational_burden_ratio": "ratio",
    "precipitation_stress_raw": "normalized score",
    "land_area_m2": "m2",
    "land_lease_value_idr": "IDR",
    "labor_cost_idr": "IDR",
    "seed_purchase_value_idr": "IDR",
    "fertilizer_purchase_value_idr": "IDR",
    "pesticide_purchase_value_idr": "IDR",
    "equipment_rent_value_idr": "IDR",
    "production_value_idr": "IDR",
    "number_of_machines": "unit",
    "value_of_milled_grains_idr": "IDR",
    "amount_of_milled_rice_kg": "kg",
    "supporting_equipment_cost_idr": "IDR",
    "nilaiberashasilgiling": "IDR",
    "total_revenue_of_milling_machine_idr": "IDR",
    "total_rice_purchase_kg": "kg",
    "total_rice_purchase_idr": "IDR",
    "building_rent_cost_idr": "IDR",
    "value_of_rice_sold_idr": "IDR",
    "total_precipitation_pct": "percent",
    "precipitation_quality_pct": "percent",
    "value_of_rice_purchase_idr": "IDR",
    "operational_cost": "IDR",
    "quantity_proxy": "actor-specific quantity",
    "margin_ratio": "ratio",
    "cost_per_quantity_proxy": "IDR per quantity",
    "output_per_quantity_proxy": "IDR per quantity",
}

SOURCES = [
    "ai/outputs/02_rice_vulnerability_dataset.csv",
    "ai/outputs/04_monte_carlo_stress_ranges.csv",
    "ai/outputs/05_monte_carlo_enhanced_priority.csv",
    "ai/models/03_final_rice_vulnerability_model.joblib",
]
SATURATION_WARNING = (
    "A 100% failure probability represents simulation saturation under the project's "
    "stress-sampling assumptions, not guaranteed real-world collapse."
)
LOW_SCENARIO_SATURATION_WARNING = (
    "Low flood scenario is not a safe-state guarantee: actor-region fragility and "
    "negative stressed margin can saturate failure even under Low stress."
)


def _safe_div(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    return numerator.div(denominator.replace(0, np.nan)).replace([np.inf, -np.inf], np.nan)


def _number(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    return round(float(value), 6)


def _label_priority(score: float) -> str:
    if score >= 0.78:
        return "Critical"
    if score >= 0.58:
        return "High"
    if score >= 0.35:
        return "Moderate"
    return "Low"


def _label_probability(value: float) -> str:
    if value >= 0.75:
        return "Critical"
    if value >= 0.50:
        return "High"
    if value >= 0.25:
        return "Moderate"
    return "Low"


def _scope(region: str, scenario: str | None, actor: str | None, comparison: bool = False) -> tuple[str, str]:
    if comparison:
        if actor:
            return "Actor-specific scenario comparison", f"{region} - {actor} - Low/Medium/High"
        return "Regional scenario aggregate comparison", f"{region} - all actors - Low/Medium/High"
    if actor:
        return "Actor-specific result", f"{region} - {actor} - {scenario}"
    return "Regional scenario aggregate", f"{region} - all actors - {scenario}"


def _has_saturation(summary: dict[str, Any] | None = None, rows: list[dict[str, Any]] | None = None) -> bool:
    if summary:
        values = [summary.get("mean_failure_probability")]
        values.extend((row.get("failure_probability") for row in summary.get("actors", [])))
        if any(isinstance(value, (int, float)) and value >= 0.9995 for value in values):
            return True
    if rows:
        return any(
            isinstance(row.get("failure_probability"), (int, float))
            and row["failure_probability"] >= 0.9995
            for row in rows
        )
    return False


def _has_low_saturation(scenario: str | None = None, rows: list[dict[str, Any]] | None = None) -> bool:
    if rows:
        return any(
            row.get("scenario") == "Low"
            and isinstance(row.get("failure_probability"), (int, float))
            and row["failure_probability"] >= 0.9995
            for row in rows
        )
    return scenario == "Low"


def _warnings_with_saturation(
    warnings: list[str],
    summary: dict[str, Any] | None = None,
    rows: list[dict[str, Any]] | None = None,
    scenario: str | None = None,
) -> list[str]:
    result = list(warnings)
    if _has_saturation(summary=summary, rows=rows):
        result.append(SATURATION_WARNING)
        if _has_low_saturation(scenario=scenario, rows=rows):
            result.append(LOW_SCENARIO_SATURATION_WARNING)
    return result


@dataclass
class ModelState:
    rice: Any | None
    flood: Any | None
    errors: dict[str, str]


class SimulationEngine:
    def __init__(self) -> None:
        self.data = pd.read_csv(OUTPUTS / "02_rice_vulnerability_dataset.csv")
        self.priority = pd.read_csv(OUTPUTS / "05_monte_carlo_enhanced_priority.csv")
        self.ranges = pd.read_csv(OUTPUTS / "04_monte_carlo_stress_ranges.csv").set_index(
            "flood_scenario"
        )
        self.features = (
            pd.read_csv(OUTPUTS / "03_operational_feature_list.csv")["operational_feature"]
            .astype(str)
            .tolist()
        )
        self.models = self._load_models()
        self.numeric_features = [feature for feature in self.features if feature not in {"actor", "region"}]

    def _load_models(self) -> ModelState:
        loaded: dict[str, Any] = {}
        errors: dict[str, str] = {}
        for name, path in {
            "rice": MODELS / "03_final_rice_vulnerability_model.joblib",
            "flood": MODELS / "03_final_flood_probability_model.joblib",
        }.items():
            try:
                loaded[name] = joblib.load(path)
            except Exception as exc:  # health endpoint exposes a sanitized diagnostic
                errors[name] = f"{type(exc).__name__}: {str(exc)[:180]}"
                loaded[name] = None
        return ModelState(rice=loaded["rice"], flood=loaded["flood"], errors=errors)

    def health(self) -> dict[str, Any]:
        ready = self.models.rice is not None and self.models.flood is not None
        return {
            "status": "ok" if ready else "degraded",
            "rows": len(self.data),
            "features": len(self.features),
            "models": {
                "rice_vulnerability": self.models.rice is not None,
                "flood_probability": self.models.flood is not None,
            },
            "errors": self.models.errors,
        }

    def catalog(self) -> dict[str, Any]:
        feature_rows = []
        for feature in self.features:
            observed = self.data[feature].dropna() if feature in self.data else pd.Series(dtype=float)
            numeric_observed = (
                pd.to_numeric(observed, errors="coerce").dropna()
                if feature not in {"actor", "region"}
                else pd.Series(dtype=float)
            )
            feature_rows.append(
                {
                    "name": feature,
                    "unit": FEATURE_UNITS.get(feature, "value"),
                    "mutable": feature not in {"actor", "region"},
                    "kind": "filter" if feature in {"actor", "region"} else (
                        "derived" if feature in DERIVED_FEATURES else "observed"
                    ),
                    "observed_min": _number(numeric_observed.min()) if not numeric_observed.empty else None,
                    "observed_max": _number(numeric_observed.max()) if not numeric_observed.empty else None,
                    "actors": self._actors_for_feature(feature),
                }
            )
        return {
            "kind": "feature_catalog",
            "title": "Operational feature catalog",
            "regions": REGIONS,
            "actors": ACTORS,
            "scenarios": SCENARIOS,
            "features": feature_rows,
            "mutation_operations": ["set", "scale", "change_percent"],
            "notes": [
                "actor and region are filters, not mutable numeric features",
                "out-of-range values are allowed but return a low-confidence warning",
                "derived financial features are solved through underlying costs or outputs",
            ],
            "sources": SOURCES,
        }

    def _actors_for_feature(self, feature: str) -> list[str]:
        if feature in DERIVED_FEATURES or feature in {"actor", "region"}:
            return ACTORS
        return [
            actor
            for actor, config in ACTOR_CONFIG.items()
            if feature in config["costs"] + config["outputs"] + config["quantities"] + config["precipitation"]
        ]

    def _select(self, region: str, actor: str | None = None) -> pd.DataFrame:
        selected = self.data[self.data["region"].eq(region)].copy()
        if actor:
            selected = selected[selected["actor"].eq(actor)].copy()
        if selected.empty:
            raise ValueError(f"No dataset rows match region={region!r}, actor={actor!r}")
        return selected

    def _predict_vulnerability(self, frame: pd.DataFrame) -> np.ndarray:
        if self.models.rice is None:
            fallback = frame["final_vulnerability_score"].fillna(0.5).clip(0, 1)
            return fallback.to_numpy(dtype=float)
        matrix = frame[self.features].copy()
        probabilities = self.models.rice.predict_proba(matrix)
        classes = list(getattr(self.models.rice, "classes_", []))
        high_index = next(
            (index for index, label in enumerate(classes) if "high" in str(label).lower()),
            probabilities.shape[1] - 1,
        )
        return probabilities[:, high_index].astype(float)

    def _recompute(self, frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy()
        for actor, indices in result.groupby("actor").groups.items():
            config = ACTOR_CONFIG[actor]
            costs = result.loc[indices, config["costs"]].fillna(0).sum(axis=1)
            outputs = result.loc[indices, config["outputs"]].fillna(0).sum(axis=1)
            quantities = result.loc[indices, config["quantities"]].fillna(0).sum(axis=1)
            operational_cols = [
                col for col in config["costs"] if "purchase" not in col and "milled_grains" not in col
            ]
            operational = result.loc[indices, operational_cols].fillna(0).sum(axis=1)
            result.loc[indices, "total_cost"] = costs
            result.loc[indices, "output_value"] = outputs
            result.loc[indices, "margin"] = outputs - costs
            result.loc[indices, "cost_revenue_ratio"] = _safe_div(costs, outputs)
            result.loc[indices, "operational_cost"] = operational
            result.loc[indices, "operational_burden_ratio"] = _safe_div(operational, outputs)
            result.loc[indices, "quantity_proxy"] = quantities
            result.loc[indices, "margin_ratio"] = _safe_div(outputs - costs, outputs)
            result.loc[indices, "cost_per_quantity_proxy"] = _safe_div(costs, quantities)
            result.loc[indices, "output_per_quantity_proxy"] = _safe_div(outputs, quantities)
            precip = config["precipitation"]
            if precip:
                normalized = result.loc[indices, precip].astype(float)
                result.loc[indices, "precipitation_stress_raw"] = normalized.mean(axis=1) / 100.0
        return result

    @staticmethod
    def _target(series: pd.Series, mutation: Mutation) -> pd.Series:
        if mutation.operation == "set":
            return pd.Series(mutation.value, index=series.index, dtype=float)
        if mutation.operation == "scale":
            return series.astype(float) * mutation.value
        return series.astype(float) * (1 + mutation.value / 100.0)

    @staticmethod
    def _scale_columns(
        frame: pd.DataFrame, indices: pd.Index, columns: list[str], factors: pd.Series
    ) -> None:
        for column in columns:
            valid = frame.loc[indices, column].notna()
            valid_indices = indices[valid]
            frame.loc[valid_indices, column] = (
                frame.loc[valid_indices, column].astype(float) * factors.loc[valid_indices]
            )

    def _apply_mutation(
        self, frame: pd.DataFrame, mutation: Mutation
    ) -> tuple[pd.DataFrame, list[str], int]:
        feature = mutation.feature
        if feature not in self.numeric_features:
            raise ValueError(f"Unknown or non-mutable feature: {feature}")
        result = frame.copy()
        applicable_actors = self._actors_for_feature(feature)
        indices = result.index[result["actor"].isin(applicable_actors)]
        if len(indices) == 0:
            raise ValueError(f"Feature {feature} is not applicable to the selected actor rows")
        warnings: list[str] = []

        for actor, actor_indices in result.loc[indices].groupby("actor").groups.items():
            config = ACTOR_CONFIG[actor]
            old = result.loc[actor_indices, feature].astype(float) if feature in result else pd.Series(index=actor_indices)
            if feature == "land_area_m2":
                target = self._target(old, mutation)
                factors = _safe_div(target, old).fillna(1.0)
                result.loc[actor_indices, feature] = target
                linked = config["costs"] + config["outputs"]
                self._scale_columns(result, actor_indices, linked, factors)
            elif feature == "number_of_machines":
                target = self._target(old, mutation)
                factors = _safe_div(target, old).fillna(1.0)
                result.loc[actor_indices, feature] = target
                linked = [
                    "supporting_equipment_cost_idr",
                    "amount_of_milled_rice_kg",
                    "nilaiberashasilgiling",
                    "total_revenue_of_milling_machine_idr",
                ]
                self._scale_columns(result, actor_indices, linked, factors)
            elif feature in config["quantities"]:
                target = self._target(old, mutation)
                factors = _safe_div(target, old).fillna(1.0)
                result.loc[actor_indices, feature] = target
                self._scale_columns(result, actor_indices, config["costs"] + config["outputs"], factors)
            elif feature in config["costs"] + config["outputs"] + config["precipitation"]:
                valid = old.notna()
                valid_indices = actor_indices[valid]
                result.loc[valid_indices, feature] = self._target(old.loc[valid_indices], mutation)
            else:
                result = self._apply_derived(result, actor_indices, actor, mutation)

        result = self._recompute(result)
        observed = self.data.loc[self.data["actor"].isin(applicable_actors), feature].dropna()
        if not observed.empty:
            resulting = result.loc[indices, feature].dropna()
            if not resulting.empty and (
                resulting.min() < observed.min() or resulting.max() > observed.max()
            ):
                warnings.append(
                    f"{feature} is outside the observed dataset range "
                    f"[{observed.min():.4g}, {observed.max():.4g}]; treat this result as low confidence."
                )
        return result, warnings, len(indices)

    def _apply_derived(
        self, frame: pd.DataFrame, indices: pd.Index, actor: str, mutation: Mutation
    ) -> pd.DataFrame:
        result = self._recompute(frame)
        config = ACTOR_CONFIG[actor]
        current = result.loc[indices, mutation.feature].astype(float)
        target = self._target(current, mutation)

        if mutation.feature in {"total_cost", "operational_cost"}:
            source = result.loc[indices, mutation.feature].astype(float)
            factors = _safe_div(target, source).fillna(1.0)
            columns = config["costs"] if mutation.feature == "total_cost" else [
                col for col in config["costs"] if "purchase" not in col and "milled_grains" not in col
            ]
            self._scale_columns(result, indices, columns, factors)
        elif mutation.feature == "output_value":
            factors = _safe_div(target, result.loc[indices, "output_value"]).fillna(1.0)
            self._scale_columns(result, indices, config["outputs"], factors)
        elif mutation.feature == "margin":
            desired_output = result.loc[indices, "total_cost"] + target
            factors = _safe_div(desired_output, result.loc[indices, "output_value"]).fillna(1.0)
            self._scale_columns(result, indices, config["outputs"], factors)
        elif mutation.feature == "cost_revenue_ratio":
            desired_cost = target * result.loc[indices, "output_value"]
            factors = _safe_div(desired_cost, result.loc[indices, "total_cost"]).fillna(1.0)
            self._scale_columns(result, indices, config["costs"], factors)
        elif mutation.feature == "margin_ratio":
            desired_output = _safe_div(result.loc[indices, "total_cost"], 1 - target)
            factors = _safe_div(desired_output, result.loc[indices, "output_value"]).fillna(1.0)
            self._scale_columns(result, indices, config["outputs"], factors)
        elif mutation.feature == "operational_burden_ratio":
            desired_operational = target * result.loc[indices, "output_value"]
            current_operational = result.loc[indices, "operational_cost"]
            factors = _safe_div(desired_operational, current_operational).fillna(1.0)
            columns = [
                col for col in config["costs"] if "purchase" not in col and "milled_grains" not in col
            ]
            self._scale_columns(result, indices, columns, factors)
        elif mutation.feature == "quantity_proxy":
            factors = _safe_div(target, result.loc[indices, "quantity_proxy"]).fillna(1.0)
            self._scale_columns(result, indices, config["quantities"], factors)
        elif mutation.feature == "cost_per_quantity_proxy":
            desired_cost = target * result.loc[indices, "quantity_proxy"]
            factors = _safe_div(desired_cost, result.loc[indices, "total_cost"]).fillna(1.0)
            self._scale_columns(result, indices, config["costs"], factors)
        elif mutation.feature == "output_per_quantity_proxy":
            desired_output = target * result.loc[indices, "quantity_proxy"]
            factors = _safe_div(desired_output, result.loc[indices, "output_value"]).fillna(1.0)
            self._scale_columns(result, indices, config["outputs"], factors)
        elif mutation.feature == "precipitation_stress_raw":
            for column in config["precipitation"]:
                result.loc[indices, column] = target * 100.0
        else:
            raise ValueError(f"Unsupported derived feature mutation: {mutation.feature}")
        return result

    def _monte_carlo(
        self, frame: pd.DataFrame, scenario: str, simulations: int = 400
    ) -> pd.DataFrame:
        row = self.ranges.loc[scenario]
        rng = np.random.default_rng(2026)
        n_units = len(frame)
        cost_shock = rng.triangular(
            row.cost_shock_min, row.cost_shock_mode, row.cost_shock_max, size=(n_units, simulations)
        )
        revenue_shock = rng.triangular(
            row.revenue_shock_min,
            row.revenue_shock_mode,
            row.revenue_shock_max,
            size=(n_units, simulations),
        )
        exposure = frame["historical_flood_exposure_score"].fillna(0).to_numpy(dtype=float)
        modifier = 1 + 0.10 * exposure[:, None]
        stressed_cost = frame["total_cost"].to_numpy(dtype=float)[:, None] * (1 + cost_shock * modifier)
        stressed_revenue = frame["output_value"].to_numpy(dtype=float)[:, None] * (
            1 - revenue_shock * modifier
        )
        margins = stressed_revenue - stressed_cost
        result = frame[["actor", "region"]].copy()
        result["failure_probability"] = (margins <= 0).mean(axis=1)
        result["expected_stressed_margin"] = margins.mean(axis=1)
        result["p05_stressed_margin"] = np.quantile(margins, 0.05, axis=1)
        result["p95_stressed_margin"] = np.quantile(margins, 0.95, axis=1)
        return result

    def _summary(self, frame: pd.DataFrame, scenario: str, simulations: int = 400) -> dict[str, Any]:
        mc = self._monte_carlo(frame, scenario, simulations)
        vulnerability = self._predict_vulnerability(frame)
        hazard = {"Low": 0.20, "Medium": 0.55, "High": 1.0}[scenario]
        enriched = mc.copy()
        enriched["vulnerability_probability"] = vulnerability
        enriched["exposure"] = frame["historical_flood_exposure_score"].fillna(0).to_numpy(float)
        enriched["priority_score"] = (
            0.35 * enriched["vulnerability_probability"]
            + 0.30 * hazard
            + 0.25 * enriched["failure_probability"]
            + 0.10 * enriched["exposure"]
        ).clip(0, 1)
        actor_rows = []
        for actor, group in enriched.groupby("actor"):
            actor_rows.append(
                {
                    "actor": actor,
                    "units": int(len(group)),
                    "failure_probability": _number(group["failure_probability"].mean()),
                    "vulnerability_probability": _number(group["vulnerability_probability"].mean()),
                    "priority_score": _number(group["priority_score"].mean()),
                    "priority_label": _label_priority(float(group["priority_score"].mean())),
                    "expected_stressed_margin": _number(group["expected_stressed_margin"].mean()),
                }
            )
        mean_failure = float(enriched["failure_probability"].mean())
        mean_score = float(enriched["priority_score"].mean())
        return {
            "units": int(len(frame)),
            "actors": sorted(actor_rows, key=lambda item: item["priority_score"], reverse=True),
            "mean_failure_probability": _number(mean_failure),
            "failure_label": _label_probability(mean_failure),
            "mean_vulnerability_probability": _number(enriched["vulnerability_probability"].mean()),
            "mean_priority_score": _number(mean_score),
            "priority_label": _label_priority(mean_score),
            "median_margin": _number(frame["margin"].median()),
            "mean_margin": _number(frame["margin"].mean()),
            "expected_stressed_margin": _number(enriched["expected_stressed_margin"].mean()),
            "p05_stressed_margin": _number(enriched["p05_stressed_margin"].mean()),
            "p95_stressed_margin": _number(enriched["p95_stressed_margin"].mean()),
        }

    def region_snapshot(self, request: RegionRequest) -> dict[str, Any]:
        selected = self._select(request.region, request.actor)
        summary = self._summary(selected, request.scenario)
        scope_label, scope_detail = _scope(request.region, request.scenario, request.actor)
        return {
            "kind": "region_snapshot",
            "title": f"{request.region} - {request.scenario} flood scenario",
            "region": request.region,
            "scenario": request.scenario,
            "actor_filter": request.actor,
            "scope_label": scope_label,
            "scope_detail": scope_detail,
            "summary": summary,
            "visualizations": [
                {
                    "type": "bar",
                    "title": "Failure probability by actor",
                    "x": "actor",
                    "y": "failure_probability",
                    "data": summary["actors"],
                },
                {
                    "type": "action_list",
                    "title": "Operational focus",
                    "data": self._actions(request.region, request.scenario, request.actor),
                },
            ],
            "warnings": _warnings_with_saturation(
                [
                    "Scenario results are sensitivity estimates, not observed flood damage attribution."
                ],
                summary=summary,
                scenario=request.scenario,
            ),
            "sources": SOURCES,
        }

    def compare_scenarios(self, request: ScenarioComparisonRequest) -> dict[str, Any]:
        selected = self._select(request.region, request.actor)
        scope_label, scope_detail = _scope(request.region, None, request.actor, comparison=True)
        rows = []
        for scenario in SCENARIOS:
            summary = self._summary(selected, scenario)
            rows.append(
                {
                    "scenario": scenario,
                    "failure_probability": summary["mean_failure_probability"],
                    "priority_score": summary["mean_priority_score"],
                    "priority_label": summary["priority_label"],
                    "expected_stressed_margin": summary["expected_stressed_margin"],
                }
            )
        return {
            "kind": "scenario_comparison",
            "title": (
                f"Scenario comparison for {request.region} - {request.actor}"
                if request.actor
                else f"Scenario comparison for {request.region}"
            ),
            "region": request.region,
            "actor_filter": request.actor,
            "scope_label": scope_label,
            "scope_detail": scope_detail,
            "rows": rows,
            "visualizations": [
                {
                    "type": "comparison",
                    "title": "Low to high flood stress",
                    "x": "scenario",
                    "series": ["failure_probability", "priority_score"],
                    "data": rows,
                }
            ],
            "warnings": _warnings_with_saturation(
                [
                    "Shock ranges are internal triangular sensitivity assumptions from the project method."
                ],
                rows=rows,
            ),
            "sources": SOURCES,
        }

    def simulate(self, request: SimulationRequest) -> dict[str, Any]:
        baseline_frame = self._recompute(self._select(request.region, request.actor))
        simulated_frame = baseline_frame.copy()
        warnings: list[str] = []
        affected = 0
        for mutation in request.mutations:
            simulated_frame, mutation_warnings, count = self._apply_mutation(
                simulated_frame, mutation
            )
            warnings.extend(mutation_warnings)
            affected = max(affected, count)
        baseline = self._summary(baseline_frame, request.scenario, request.simulations)
        simulated = self._summary(simulated_frame, request.scenario, request.simulations)
        deltas = {
            "failure_probability": _number(
                simulated["mean_failure_probability"] - baseline["mean_failure_probability"]
            ),
            "priority_score": _number(
                simulated["mean_priority_score"] - baseline["mean_priority_score"]
            ),
            "mean_margin": _number(simulated["mean_margin"] - baseline["mean_margin"]),
            "expected_stressed_margin": _number(
                simulated["expected_stressed_margin"] - baseline["expected_stressed_margin"]
            ),
        }
        if not warnings:
            warnings.append(
                "Simulation is within observed feature bounds, but remains a model-based counterfactual."
            )
        scope_label, scope_detail = _scope(request.region, request.scenario, request.actor)
        return {
            "kind": "feature_simulation",
            "title": f"Counterfactual simulation for {request.region}",
            "region": request.region,
            "scenario": request.scenario,
            "actor_filter": request.actor,
            "scope_label": scope_label,
            "scope_detail": scope_detail,
            "affected_units": affected,
            "mutations": [mutation.model_dump() for mutation in request.mutations],
            "baseline": baseline,
            "simulated": simulated,
            "deltas": deltas,
            "confidence": "low" if any("outside" in warning for warning in warnings) else "bounded",
            "visualizations": [
                {
                    "type": "comparison",
                    "title": "Baseline versus simulated",
                    "data": [
                        {
                            "label": "Baseline",
                            "failure_probability": baseline["mean_failure_probability"],
                            "priority_score": baseline["mean_priority_score"],
                        },
                        {
                            "label": "Simulated",
                            "failure_probability": simulated["mean_failure_probability"],
                            "priority_score": simulated["mean_priority_score"],
                        },
                    ],
                },
                {
                    "type": "bar",
                    "title": "Simulated actor risk",
                    "x": "actor",
                    "y": "failure_probability",
                    "data": simulated["actors"],
                },
            ],
            "warnings": _warnings_with_saturation(
                warnings,
                summary=simulated,
                scenario=request.scenario,
            ),
            "sources": SOURCES,
        }

    def dashboard(self, request: RegionRequest) -> dict[str, Any]:
        rows = self.priority[
            self.priority["region"].eq(request.region)
            & self.priority["flood_scenario"].eq(request.scenario)
        ].copy()
        if request.actor:
            rows = rows[rows["actor"].eq(request.actor)]
        rows = rows.sort_values("monte_carlo_priority_rank")
        queue = [
            {
                "rank": int(row.monte_carlo_priority_rank),
                "actor": row.actor,
                "priority_label": row.monte_carlo_enhanced_priority_label,
                "priority_score": _number(row.monte_carlo_enhanced_priority_score),
                "failure_probability": _number(row.mean_failure_probability),
                "recommended_action": row.recommended_action,
            }
            for row in rows.itertuples()
        ]
        snapshot = self.region_snapshot(request)
        return {
            "kind": "region_dashboard",
            "title": f"{request.region} operational dashboard",
            "region": request.region,
            "scenario": request.scenario,
            "actor_filter": request.actor,
            "scope_label": snapshot["scope_label"],
            "scope_detail": snapshot["scope_detail"],
            "kpis": snapshot["summary"],
            "queue": queue,
            "visualizations": snapshot["visualizations"],
            "dashboard_url": f"/?region={request.region}&scenario={request.scenario}",
            "warnings": snapshot["warnings"],
            "sources": SOURCES,
        }

    def _actions(self, region: str, scenario: str, actor: str | None) -> list[dict[str, Any]]:
        rows = self.priority[
            self.priority["region"].eq(region)
            & self.priority["flood_scenario"].eq(scenario)
        ].copy()
        if actor:
            rows = rows[rows["actor"].eq(actor)]
        rows = rows.sort_values("monte_carlo_priority_rank").head(5)
        return [
            {
                "actor": row.actor,
                "priority": row.monte_carlo_enhanced_priority_label,
                "action": row.recommended_action,
            }
            for row in rows.itertuples()
        ]
