from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="MenuItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, verbose_name="菜品名稱")),
                ("description", models.TextField(blank=True, verbose_name="菜品介紹")),
                ("price", models.DecimalField(decimal_places=2, max_digits=10, verbose_name="菜品價格")),
                ("allergens", models.CharField(blank=True, max_length=255, verbose_name="過敏原")),
            ],
            options={
                "verbose_name": "菜品",
                "verbose_name_plural": "菜品",
                "ordering": ["id"],
            },
        ),
    ]

