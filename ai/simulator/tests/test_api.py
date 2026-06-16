from fastapi.testclient import TestClient
import pytest

from simulator.app.main import app


client = TestClient(app)


def test_health_and_catalog():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["features"] == 34

    catalog = client.get("/v1/catalog")
    assert catalog.status_code == 200
    assert len(catalog.json()["features"]) == 34


def test_snapshot_is_dataset_bounded():
    response = client.post(
        "/v1/region-snapshot", json={"region": "Garut", "scenario": "High"}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["kind"] == "region_snapshot"
    assert payload["summary"]["units"] > 0
    assert 0 <= payload["summary"]["mean_failure_probability"] <= 1


def test_land_area_dependency_and_range_warning():
    response = client.post(
        "/v1/simulate",
        json={
            "region": "Garut",
            "scenario": "High",
            "actor": "Farmer",
            "mutations": [
                {"feature": "land_area_m2", "operation": "set", "value": 1_000_000}
            ],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["affected_units"] > 0
    assert payload["confidence"] == "low"
    assert any("outside the observed dataset range" in item for item in payload["warnings"])


def test_actor_incompatible_feature_is_rejected():
    response = client.post(
        "/v1/simulate",
        json={
            "region": "Garut",
            "scenario": "Medium",
            "actor": "Retail",
            "mutations": [
                {"feature": "land_area_m2", "operation": "set", "value": 5000}
            ],
        },
    )
    assert response.status_code == 422


def test_actor_specific_scope_is_distinct_from_regional_aggregate():
    actor_response = client.post(
        "/v1/region-snapshot",
        json={"region": "Tasikmalaya", "scenario": "High", "actor": "Farmer"},
    )
    aggregate_response = client.post(
        "/v1/scenario-comparison",
        json={"region": "Tasikmalaya"},
    )

    assert actor_response.status_code == 200
    assert aggregate_response.status_code == 200

    actor_payload = actor_response.json()
    aggregate_payload = aggregate_response.json()
    aggregate_high = next(
        row for row in aggregate_payload["rows"] if row["scenario"] == "High"
    )

    assert actor_payload["scope_label"] == "Actor-specific result"
    assert actor_payload["scope_detail"] == "Tasikmalaya - Farmer - High"
    assert aggregate_payload["scope_label"] == "Regional scenario aggregate comparison"
    assert aggregate_payload["scope_detail"] == "Tasikmalaya - all actors - Low/Medium/High"
    assert actor_payload["summary"]["mean_failure_probability"] == pytest.approx(0.197159)
    assert aggregate_high["failure_probability"] == pytest.approx(0.548648)


def test_low_scenario_saturation_is_warned():
    response = client.post(
        "/v1/scenario-comparison",
        json={"region": "Karawang", "actor": "Retail"},
    )

    assert response.status_code == 200
    payload = response.json()
    low = next(row for row in payload["rows"] if row["scenario"] == "Low")

    assert payload["scope_label"] == "Actor-specific scenario comparison"
    assert payload["scope_detail"] == "Karawang - Retail - Low/Medium/High"
    assert low["failure_probability"] == 1.0
    assert any("simulation saturation" in warning for warning in payload["warnings"])
    assert any("Low flood scenario is not a safe-state guarantee" in warning for warning in payload["warnings"])
