from django.contrib import admin
from nekusoracinema.models import *

class MyAdminSite(admin.AdminSite):
    site_header = "Nekusora Cinema - Kết nối điện ảnh với bầu trời"

admin_site = MyAdminSite()
admin_site.register(User)
admin_site.register(Movie)