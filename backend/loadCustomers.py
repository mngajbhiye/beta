import requests
import csv

API_URL = "http://127.0.0.1:8000/customer"
CSV_FILE = "./output.csv"


def create_customers_from_csv(csv_file: str = CSV_FILE) -> None:
    """Read customers from a CSV file and create them through the API."""

    created = 0
    failed = 0

    with open(csv_file, mode="r", newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)

        required_columns = {"FirstName", "MiddleName", "LastName", "Phone"}

        if not reader.fieldnames or not required_columns.issubset(reader.fieldnames):
            raise ValueError(
                f"CSV must contain these columns: {', '.join(sorted(required_columns))}"
            )

        for row_number, row in enumerate(reader, start=2):
            first_name = (row.get("FirstName") or "").strip()
            middle_name = (row.get("MiddleName") or "").strip()
            last_name = (row.get("LastName") or "").strip()
            phone = (row.get("Phone") or "").strip()

            name = " ".join(
                part for part in (first_name, middle_name, last_name) if part
            )

            if not name or not phone:
                print(f"Row {row_number}: Skipped — name or phone is missing.")
                failed += 1
                continue

            payload = {
                "name": name,
                "phone": phone,
                "address": None,
            }

            try:
                response = requests.post(API_URL, json=payload, timeout=15)

                if response.ok:
                    print(f"Row {row_number}: Created {name}")
                    created += 1
                else:
                    print(
                        f"Row {row_number}: Failed for {name} "
                        f"({response.status_code}): {response.text}"
                    )
                    failed += 1

            except requests.RequestException as error:
                print(f"Row {row_number}: Request failed for {name}: {error}")
                failed += 1

    print(f"\nImport complete. Created: {created}, Failed/Skipped: {failed}")


if __name__ == "__main__":
    create_customers_from_csv()
