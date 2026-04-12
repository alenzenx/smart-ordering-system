USE smart_ordering;

SELECT id, name, description, price, allergens
FROM menu_menuitem;

INSERT INTO menu_menuitem (name, description, price, allergens)
VALUES ('經典牛肉堡', '厚切牛肉排搭配生菜與番茄', 220.00, '麩質、乳製品');

UPDATE menu_menuitem
SET price = 240.00,
    allergens = '麩質、乳製品、蛋'
WHERE id = 1;

DELETE FROM menu_menuitem
WHERE id = 1;

