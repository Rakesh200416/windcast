
import requests

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

params = {
    "publishDateTimeFrom": "2026-01-01T00:00:00Z",
    "publishDateTimeTo": "2026-02-01T00:00:00Z",
}

for dataset in ["FUELHH", "WINDFOR"]:
    url = f"{BASE_URL}/{dataset}/stream"

    print(f"\n--- Testing {dataset} ---")

    try:
        response = requests.get(url, params=params, timeout=60)
        print("HTTP status:", response.status_code)
        response.raise_for_status()

        records = response.json()

        print("Total records:", len(records))

        if records:
            print("First record:", records[0])
            print("Last record:", records[-1])

            delivery_dates = sorted({
                r.get("startTime", "")[:10]
                for r in records
                if r.get("startTime")
            })

            print("Earliest delivery date:", delivery_dates[0])
            print("Latest delivery date:", delivery_dates[-1])

            if dataset == "FUELHH":
                wind = [
                    r for r in records
                    if r.get("fuelType") == "WIND"
                ]
                print("Wind actual records:", len(wind))
        else:
            print("No records returned.")

    except (requests.RequestException, ValueError) as error:
        print("Error:", error)
