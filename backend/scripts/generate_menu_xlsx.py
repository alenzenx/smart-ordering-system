from pathlib import Path

from openpyxl import Workbook


OUTPUT = Path("/app/generated_menu_100.xlsx")

COOKING_METHODS = [
    "炙燒",
    "香煎",
    "慢燉",
    "酥炸",
    "炭烤",
    "清炒",
    "煙燻",
    "椒香",
    "蜜汁",
    "蒜香",
]

MAIN_INGREDIENTS = [
    "嫩雞",
    "板腱牛",
    "梅花豬",
    "鮭魚",
    "鱸魚",
    "鮮蝦",
    "干貝",
    "花枝",
    "豆腐",
    "杏鮑菇",
]

SECONDARY_INGREDIENTS = [
    "松露野菇",
    "奶油玉米",
    "蒜味青花菜",
    "番茄羅勒",
    "南瓜起司",
    "剝皮辣椒",
    "黑胡椒洋蔥",
    "味噌奶香",
    "泰式檸香",
    "胡麻時蔬",
]

STYLES = [
    "燉飯",
    "義大利麵",
    "焗烤飯",
    "定食",
    "沙拉",
    "漢堡",
    "烏龍麵",
    "薄餅",
    "炒飯",
    "熱壓吐司",
]

ALLERGEN_OPTIONS = [
    "牛奶",
    "蛋",
    "花生",
    "堅果",
    "甲殼類",
    "魚類",
    "芝麻",
    "麩質",
    "大豆",
    "螺貝類",
]

PRICE_BASE = [120, 135, 150, 165, 180, 195, 210, 225, 240, 255]


def make_description(method: str, main: str, second: str) -> str:
    return (
        f"選用{method}{main}搭配{second}細火烹調，風味層次分明且口感飽滿，"
        "適合喜歡豐富滋味的顧客品嚐。"
    )


def build_rows() -> list[tuple[str, int, str, str]]:
    rows = []
    used_names = set()
    index = 0

    for method in COOKING_METHODS:
        for main in MAIN_INGREDIENTS:
            for second in SECONDARY_INGREDIENTS:
                style = STYLES[index % len(STYLES)]
                name = f"{method}{main}{second}{style}"
                if name in used_names:
                    continue

                used_names.add(name)
                allergens = "、".join(
                    sorted(
                        {
                            ALLERGEN_OPTIONS[index % len(ALLERGEN_OPTIONS)],
                            ALLERGEN_OPTIONS[(index + 3) % len(ALLERGEN_OPTIONS)],
                        }
                    )
                )
                price = PRICE_BASE[index % len(PRICE_BASE)] + (index // len(PRICE_BASE)) * 5
                description = make_description(method, main, second)
                rows.append((name, price, allergens, description))
                index += 1

                if len(rows) == 100:
                    return rows

    raise RuntimeError(f"只生成了 {len(rows)} 筆資料，未達 100 筆")


def main() -> None:
    rows = build_rows()
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "工作表1"

    worksheet.append(["菜品名稱", "菜品價格", "過敏原", "菜品介紹"])
    for row in rows:
        worksheet.append(row)

    worksheet.column_dimensions["A"].width = 26
    worksheet.column_dimensions["B"].width = 12
    worksheet.column_dimensions["C"].width = 18
    worksheet.column_dimensions["D"].width = 46

    workbook.save(OUTPUT)
    print(OUTPUT)
    print(rows[0])
    print(rows[-1])


if __name__ == "__main__":
    main()
