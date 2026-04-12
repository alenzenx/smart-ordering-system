from django.urls import path

from .views import chat_with_gpt, import_menu_items_xlsx, menu_item_detail, menu_items, order_detail, orders

urlpatterns = [
    path("chat/", chat_with_gpt, name="chat-with-gpt"),
    path("menu-items/", menu_items, name="menu-items"),
    path("menu-items/import-xlsx/", import_menu_items_xlsx, name="menu-items-import-xlsx"),
    path("menu-items/<int:item_id>/", menu_item_detail, name="menu-item-detail"),
    path("orders/", orders, name="orders"),
    path("orders/<int:order_id>/", order_detail, name="order-detail"),
]
