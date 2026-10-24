
import pytest

from app.analytics import calculate_metrics


def test_calculate_metrics():
    rows = [
        {
            "forecastGeneration": 120.0,
            "actualGeneration": 100.0,
        },
        {
            "forecastGeneration": 90.0,
            "actualGeneration": 100.0,
        },
        {
            "forecastGeneration": 150.0,
            "actualGeneration": 100.0,
        },
    ]

    metrics = calculate_metrics(rows)

    assert metrics["actualPeriods"] == 3
    assert metrics["forecastPeriods"] == 3
    assert metrics["matchedPeriods"] == 3
    assert metrics["mae"] == pytest.approx(26.6666666667)
    assert metrics["mbe"] == pytest.approx(20.0)


def test_missing_values_are_not_counted_as_matches():
    rows = [
        {
            "forecastGeneration": 120.0,
            "actualGeneration": 100.0,
        },
        {
            "forecastGeneration": None,
            "actualGeneration": 100.0,
        },
        {
            "forecastGeneration": 150.0,
            "actualGeneration": None,
        },
    ]

    metrics = calculate_metrics(rows)

    assert metrics["actualPeriods"] == 2
    assert metrics["forecastPeriods"] == 2
    assert metrics["matchedPeriods"] == 1
    assert metrics["mae"] == pytest.approx(20.0)
    assert metrics["mbe"] == pytest.approx(20.0)


def test_empty_rows_return_no_metrics():
    metrics = calculate_metrics([])

    assert metrics["actualPeriods"] == 0
    assert metrics["forecastPeriods"] == 0
    assert metrics["matchedPeriods"] == 0
    assert metrics["mae"] is None
    assert metrics["mbe"] is None
