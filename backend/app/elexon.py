
from datetime import datetime, timedelta, timezone

import requests

from app.analytics import calculate_metrics


BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

# January 2026 delivery window, expressed in UTC.
DELIVERY_START = datetime(2026, 1, 1, tzinfo=timezone.utc)
DELIVERY_END = datetime(2026, 2, 1, tzinfo=timezone.utc)

# Assumption: select the latest forecast published by 12:00 UTC
# on the day before delivery. Confirm against the assignment requirements.
DECISION_HOUR_UTC = 12


def fetch_dataset(
    dataset: str,
    start: datetime,
    end: datetime,
) -> list[dict]:
    """Fetch Elexon records filtered by publication time."""
    response = requests.get(
        f"{BASE_URL}/{dataset}/stream",
        params={
            "publishDateTimeFrom": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        timeout=60,
    )
    response.raise_for_status()

    data = response.json()

    if not isinstance(data, list):
        raise ValueError(f"Unexpected response for {dataset}")

    return data


def parse_time(value: str) -> datetime:
    """Parse an ISO timestamp and convert it to UTC."""
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        raise ValueError(f"Timestamp has no timezone: {value}")

    return parsed.astimezone(timezone.utc)


def aggregate_actuals(
    actual_records: list[dict],
) -> dict[datetime, float]:
    """
    Group half-hourly WIND generation records into hourly averages.

    Only hours with exactly two valid half-hourly readings are included.
    The averaging method should be confirmed against the source data
    definition and assignment requirements.
    """
    actual_half_hours: dict[datetime, list[float]] = {}

    for record in actual_records:
        if record.get("fuelType") != "WIND":
            continue

        start_time = parse_time(record["startTime"])

        if not DELIVERY_START <= start_time < DELIVERY_END:
            continue

        generation = record.get("generation")

        if generation is None:
            continue

        hour_start = start_time.replace(
            minute=0,
            second=0,
            microsecond=0,
        )

        actual_half_hours.setdefault(hour_start, []).append(
            float(generation)
        )

    return {
        hour: sum(values) / 2
        for hour, values in actual_half_hours.items()
        if len(values) == 2
    }


def get_january_data() -> dict:
    """Retrieve January wind data and calculate forecast accuracy."""

    # Include surrounding publication dates for forecasts published
    # before January delivery begins.
    publication_start = DELIVERY_START - timedelta(days=3)
    publication_end = DELIVERY_END + timedelta(days=3)

    actual_records = fetch_dataset(
        "FUELHH",
        DELIVERY_START,
        publication_end,
    )

    forecast_records = fetch_dataset(
        "WINDFOR",
        publication_start,
        publication_end,
    )

    # Aggregate actual generation once using the helper function.
    actuals = aggregate_actuals(actual_records)

    # Select the latest eligible forecast for each delivery hour.
    latest_forecasts: dict[datetime, dict] = {}

    for record in forecast_records:
        start_time = parse_time(record["startTime"])
        publish_time = parse_time(record["publishTime"])

        if not DELIVERY_START <= start_time < DELIVERY_END:
            continue

        generation = record.get("generation")

        if generation is None:
            continue

        # Assumed cutoff: 12:00 UTC on the previous calendar day.
        delivery_midnight = start_time.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        cutoff = (
            delivery_midnight
            - timedelta(days=1)
            + timedelta(hours=DECISION_HOUR_UTC)
        )

        if publish_time > cutoff:
            continue

        previous = latest_forecasts.get(start_time)

        if (
            previous is None
            or publish_time > previous["publish_time"]
        ):
            latest_forecasts[start_time] = {
                "publish_time": publish_time,
                "generation": float(generation),
            }

    # Include hours present in either dataset so missing values
    # remain visible rather than being silently discarded.
    rows = []

    for start_time in sorted(set(latest_forecasts) | set(actuals)):
        forecast = latest_forecasts.get(start_time)
        actual = actuals.get(start_time)

        forecast_value = (
            forecast["generation"]
            if forecast is not None
            else None
        )

        error = (
            forecast_value - actual
            if forecast_value is not None and actual is not None
            else None
        )

        rows.append(
            {
                "startTime": start_time.isoformat(),
                "publishTime": (
                    forecast["publish_time"].isoformat()
                    if forecast is not None
                    else None
                ),
                "forecastGeneration": forecast_value,
                "actualGeneration": actual,
                "error": error,
            }
        )

    metrics = calculate_metrics(rows)

    return {
        "metrics": metrics,
        "rows": rows,
    }
