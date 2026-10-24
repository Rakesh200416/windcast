from app.elexon import get_january_data

result = get_january_data()

print("Metrics:")
print(result["metrics"])

print("\nFirst five records:")
for row in result["rows"][:5]:
    print(row)

print("\nLast five records:")
for row in result["rows"][-5:]:
    print(row)