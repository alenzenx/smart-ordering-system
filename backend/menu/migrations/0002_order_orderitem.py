from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("menu", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="建立時間")),
                ("total_price", models.DecimalField(decimal_places=2, max_digits=10, verbose_name="總價")),
            ],
            options={
                "verbose_name": "訂單",
                "verbose_name_plural": "訂單",
                "ordering": ["-created_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(verbose_name="數量")),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10, verbose_name="單價")),
                ("line_total", models.DecimalField(decimal_places=2, max_digits=10, verbose_name="小計")),
                (
                    "menu_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="order_items",
                        to="menu.menuitem",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="menu.order",
                    ),
                ),
            ],
            options={
                "verbose_name": "訂單明細",
                "verbose_name_plural": "訂單明細",
            },
        ),
    ]
