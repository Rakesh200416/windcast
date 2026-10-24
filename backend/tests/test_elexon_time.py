
from datetime import datetime, timezone

import pytest

from app.elexon import aggregate_actuals, parse_time


def test_parse_time_converts_utc_timestamp():
    result = parse_time("2026-01-01T12:30:00Z")

    assert result == datetime(
        2026, 1, 1, 12, 30, tzinfo=timezone.utc
    )


def test_parse_time_converts_offset_to_utc():
    result = parse_time("2026-01-01T14:30:00+02:00")

    assert result == datetime(
        2026, 1, 1, 12, 30, tzinfo=timezone.utc
    )


def test_aggregate_actuals_averages_two_half_hour_readings():
    records = [
        {
            "fuelType": "WIND",
            "startTime": "2026-01-01T10:00:00Z",
            "generation": 100,
        },
        {
            "fuelType": "WIND",
            "startTime": "2026-01-01T10:30:00Z",
            "generation": 120,
        },
    ]

    result = aggregate_actuals(records)

    hour = datetime(2026, 1, 1, 10, tzinfo=timezone.utc)
    assert result[hour] == pytest.approx(110.0)


def test_aggregate_actuals_ignores_incomplete_hour():
    records = [
        {
            "fuelType": "WIND",
            "startTime": "2026-01-01T10:00:00Z",
            "generation": 100,
        },
    ]

    result = aggregate_actuals(records)

    hour = datetime(2026, 1, 1, 10, tzinfo=timezone.utc)
    assert hour not in result


def test_aggregate_actuals_ignores_non_wind_records():
    records = [
        {
            "fuelType": "SOLAR",
            "startTime": "2026-01-01T10:00:00Z",
            "generation": 100,
        },
        {
            "fuelType": "SOLAR",
            "startTime": "2026-01-01T10:30:00Z",
            "generation": 120,
        },
    ]

    assert aggregate_actuals(records) == {}
