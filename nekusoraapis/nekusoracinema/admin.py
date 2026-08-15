from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django.contrib import admin
from django.utils.safestring import mark_safe
from django import forms
from nekusoracinema.models import *

class ImageViewAdmin(admin.ModelAdmin):
    image_fields = ['image']

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        for field in self.image_fields:
            view_name = f"view_{field}"
            if view_name not in readonly:
                readonly.append(view_name)
        return readonly

    def __getattr__(self, item):
        if item.startswith("view_"):
            field_name = item.replace("view_", "")
            if field_name in self.image_fields:
                def method(obj):
                    return self.render_image(obj, field_name)
                method.short_description = f"{field_name} preview"
                return method
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{item}'")

    def render_image(self, obj, field_name):
        image_attr = getattr(obj, field_name, None)
        if image_attr and hasattr(image_attr, 'url'):
            try:
                return mark_safe(f'<img src="{image_attr.url}" style="max-width: 200px; height: auto; border-radius: 6px;" />')
            except ValueError:
                pass
        return "Chưa có ảnh"

class MovieAdmin(ImageViewAdmin):
    image_fields = ['poster']
    list_display = ['id', 'title', 'view_poster']
    search_fields = ['title']
    list_filter = ['title']

    description = forms.CharField(widget=CKEditorUploadingWidget)
    class Meta:
        model = Movie
        fields = '__all__'

class MyAdminSite(admin.AdminSite):
    site_header = "Nekusora Cinema: Kết nối điện ảnh với bầu trời"

admin_site = MyAdminSite()
admin_site.register(User)
admin_site.register(Movie, MovieAdmin)