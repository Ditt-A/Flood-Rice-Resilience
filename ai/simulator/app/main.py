from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .engine import SimulationEngine
from .schemas import RegionRequest, ScenarioComparisonRequest, SimulationRequest


app = FastAPI(
    title="Flood-Rice Resilience Simulation API",
    version="1.0.0",
    description="Deterministic, dataset-bounded calculations for the AI insight interface.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
engine = SimulationEngine()


def run(operation):
    try:
        return operation()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/health")
def health():
    return engine.health()


@app.get("/v1/catalog")
def catalog():
    return engine.catalog()


@app.post("/v1/region-snapshot")
def region_snapshot(request: RegionRequest):
    return run(lambda: engine.region_snapshot(request))


@app.post("/v1/scenario-comparison")
def scenario_comparison(request: ScenarioComparisonRequest):
    return run(lambda: engine.compare_scenarios(request))


@app.post("/v1/simulate")
def simulate(request: SimulationRequest):
    return run(lambda: engine.simulate(request))


@app.post("/v1/region-dashboard")
def region_dashboard(request: RegionRequest):
    return run(lambda: engine.dashboard(request))
