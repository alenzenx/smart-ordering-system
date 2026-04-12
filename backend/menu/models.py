from django.db import models


class MenuItem(models.Model):
    name = models.CharField("菜品名稱", max_length=120)
    description = models.TextField("菜品介紹", blank=True)
    price = models.DecimalField("菜品價格", max_digits=10, decimal_places=2)
    allergens = models.CharField("過敏原", max_length=255, blank=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "菜品"
        verbose_name_plural = "菜品"

    def __str__(self):
        return f"{self.name} (${self.price})"


class Order(models.Model):
    created_at = models.DateTimeField("建立時間", auto_now_add=True)
    total_price = models.DecimalField("總價", max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "訂單"
        verbose_name_plural = "訂單"

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField("數量")
    unit_price = models.DecimalField("單價", max_digits=10, decimal_places=2)
    line_total = models.DecimalField("小計", max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "訂單明細"
        verbose_name_plural = "訂單明細"

    def __str__(self):
        return f"Order #{self.order_id} - {self.menu_item.name}"
