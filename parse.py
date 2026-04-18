import pandas as pd
import json

file_path = r"C:\Users\User\Downloads\для хакатона расписание.xlsx"
try:
    xls = pd.ExcelFile(file_path)
    output = {"sheets": xls.sheet_names, "data": {}}
    for sheet in xls.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, header=None)
        # We need the first few rows to extract the classes
        # df.head(10).values.tolist() will dump 10 rows
        output["data"][sheet] = df.head(5).fillna("").values.tolist()
        
    with open("parsed_excel.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
except Exception as e:
    with open("parsed_excel.json", "w", encoding="utf-8") as f:
        json.dump({"error": str(e)}, f, ensure_ascii=False)
