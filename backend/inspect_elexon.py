
from app.elexon import (
    DELIVERY_START,
    DELIVERY_END,
    fetch_dataset,
    parse_time,
)

records = fetch_dataset(
    "FUELHH",
    DELIVERY_START,
    DELIVERY_END,
)

wind_records = [
    record
    for record in records
    if record.get("fuelType") == "WIND"
    and DELIVERY_START <= parse_time(record["startTime"]) < DELIVERY_END
]

print("Raw FUELHH records returned:", len(records))
print("January WIND records:", len(wind_records))
print("\nFirst 6 WIND records:")

for record in wind_records[:6]:
    print({
        "startTime": record.get("startTime"),
        "publishTime": record.get("publishTime"),
        "generation": record.get("generation"),
        "settlementDate": record.get("settlementDate"),
        "settlementPeriod": record.get("settlementPeriod"),
    })

print("\nBoundary check:")
for day in ("2026-01-01", "2026-01-31"):
    day_records = [
        record for record in wind_records
        if record["startTime"].startswith(day)
    ]
    print(
        day,
        "records:", len(day_records),
        "first:", min(
            (record["startTime"] for record in day_records),
            default="MISSING",
        ),
        "last:", max(
            (record["startTime"] for record in day_records),
            default="MISSING",
        ),
    )
