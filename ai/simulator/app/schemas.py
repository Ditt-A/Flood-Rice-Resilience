from typing import Literal

from pydantic import BaseModel, Field, field_validator


Region = Literal["Garut", "Indramayu", "Karawang", "Subang", "Tasikmalaya"]
Scenario = Literal["Low", "Medium", "High"]
Actor = Literal["Farmer", "Rice Miller", "Middlemen", "Wholesaler", "Retail"]


class RegionRequest(BaseModel):
    region: Region
    scenario: Scenario = "High"
    actor: Actor | None = None


class ScenarioComparisonRequest(BaseModel):
    region: Region
    actor: Actor | None = None


class Mutation(BaseModel):
    feature: str = Field(min_length=1)
    operation: Literal["set", "scale", "change_percent"] = "set"
    value: float

    @field_validator("value")
    @classmethod
    def finite_value(cls, value: float) -> float:
        if not float("-inf") < value < float("inf"):
            raise ValueError("Mutation value must be finite")
        return value


class SimulationRequest(RegionRequest):
    mutations: list[Mutation] = Field(min_length=1, max_length=8)
    simulations: int = Field(default=400, ge=100, le=2000)
