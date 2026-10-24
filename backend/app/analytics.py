
def calculate_metrics(rows: list[dict]) -> dict:
    """Calculate forecast accuracy metrics from aligned hourly rows."""

    actual_periods = sum(
        row.get("actualGeneration") is not None
        for row in rows
    )

    forecast_periods = sum(
        row.get("forecastGeneration") is not None
        for row in rows
    )

    matched = [
        row for row in rows
        if row.get("forecastGeneration") is not None
        and row.get("actualGeneration") is not None
    ]

    errors = [
        float(row["forecastGeneration"]) - float(row["actualGeneration"])
        for row in matched
    ]

    absolute_errors = [abs(error) for error in errors]

    return {
        "actualPeriods": actual_periods,
        "forecastPeriods": forecast_periods,
        "matchedPeriods": len(matched),
        "mae": (
            sum(absolute_errors) / len(absolute_errors)
            if absolute_errors else None
        ),
        "mbe": (
            sum(errors) / len(errors)
            if errors else None
        ),
    }
