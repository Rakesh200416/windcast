
from datetime import date
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.elexon import get_january_data

app = FastAPI(
    title="WindCast API",
    description="UK wind generation forecast analytics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def load_data():
    """Cache the historical dataset for this backend process."""
    return get_january_data()


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "application": "WindCast"}


@app.get("/api/analytics")
def analytics():
    try:
        result = load_data()
        return {
            "month": "2026-01",
            "resolution": "hourly",
            "decisionCutoff": "12:00 UTC on the previous day",
            "assumption": (
                "Illustrative cutoff; confirm the actual client deadline."
            ),
            "metrics": result["metrics"],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to load Elexon analytics: {exc}",
        ) from exc


@app.get("/api/observations")
def observations(
    delivery_date: date = Query(
        default=date(2026, 1, 1),
        alias="date",
    ),
):
    if delivery_date < date(2026, 1, 1) or delivery_date > date(2026, 1, 31):
        raise HTTPException(
            status_code=400,
            detail="Select a date between January 1 and January 31, 2026.",
        )

    try:
        result = load_data()
        selected = [
            row for row in result["rows"]
            if row["startTime"][:10] == delivery_date.isoformat()
        ]

        return {
            "date": delivery_date.isoformat(),
            "resolution": "hourly",
            "count": len(selected),
            "observations": selected,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to load Elexon observations: {exc}",
        ) from exc
