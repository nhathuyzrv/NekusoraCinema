from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django.contrib import admin
from django.utils.safestring import mark_safe
from django.urls import path
from django.template.response import TemplateResponse
from babel.numbers import format_decimal
from django.db.models import Sum, Count
from django.db.models.functions import ExtractMonth
from django import forms
from nekusoracinema.models import *
from nekusoracinema import serializers


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


def get_confirmed_bookings(year=None, month=None, branch_id=None, movie_id=None):
    query = Booking.objects.filter(active=True, status=BookingStatus.CONFIRMED)
    if year:
        query = query.filter(confirmed_at__year=year)
    if month:
        query = query.filter(confirmed_at__month=month)
    if branch_id:
        query = query.filter(showtime__room__branch_id=branch_id)
    if movie_id:
        query = query.filter(showtime__movie_id=movie_id)
    return query


class MyAdminSite(admin.AdminSite):
    site_header = "Nekusora Cinema: Kết nối điện ảnh với bầu trời"

    def get_urls(self):
        return [
            path('stats/overview/', self.stats_overview),
            path('stats/movies/', self.stats_movies),
            path('stats/branches/', self.stats_branches),
            path('stats/showtimes/', self.stats_showtimes),
        ] + super().get_urls()

    def get_filters(self, request):
        now = utils.get_timezone_now()
        year = request.GET.get('year')
        month = request.GET.get('month')
        branch_id = request.GET.get('branch_id')
        movie_id = request.GET.get('movie_id')

        year = int(year) if year and year.isdigit() else now.year
        month = int(month) if month and month.isdigit() and 1 <= int(month) <= 12 else None
        branch_id = int(branch_id) if branch_id and branch_id.isdigit() else None
        movie_id = int(movie_id) if movie_id and movie_id.isdigit() else None

        return year, month, branch_id, movie_id

    def base_context(self, active_tab, year, month, branch_id, movie_id):
        return {
            'active_tab': active_tab,
            'selected_year': year,
            'selected_month': month,
            'selected_branch_id': branch_id,
            'selected_movie_id': movie_id,
            'years': list(range(utils.get_timezone_now().year, utils.get_timezone_now().year - 5, -1)),
            'months': list(range(1, 13)),
            'branches': list(Branch.objects.values('id', 'name')),
            'movies': list(Movie.objects.values('id', 'title')),
        }

    def stats_overview(self, request):
        year, month, branch_id, movie_id = self.get_filters(request)
        query = get_confirmed_bookings(year, month, branch_id, movie_id)

        agg = query.aggregate(
            total_revenue=Sum('final_amount'),
            total_bookings=Count('id'),
            total_product_revenue=Sum('product_amount'),
            total_points_used=Sum('points_used'),
        )
        agg = {k: v or 0 for k, v in agg.items()}
        agg['total_tickets'] = Ticket.objects.filter(active=True, booking__in=query, status=TicketStatus.BOOKED).count()
        agg['total_promotions_used'] = BookingPromotion.objects.filter(active=True, booking__in=query).count()

        by_month = list(
            query.annotate(month=ExtractMonth('confirmed_at'))
            .values('month')
            .annotate(revenue=Sum('final_amount'), bookings=Count('id'))
            .order_by('month')
        )

        overview = serializers.StatsOverviewSerializer(agg).data
        revenue_by_month = serializers.StatsRevenueByMonthSerializer(by_month, many=True).data

        ctx = self.base_context('overview', year, month, branch_id, movie_id)
        formatted_overview = dict(overview)
        formatted_overview['total_revenue'] = format_decimal(agg['total_revenue'] or 0, format='#,##0', locale='vi_VN')
        formatted_overview['total_product_revenue'] = format_decimal(agg['total_product_revenue'] or 0, format='#,##0', locale='vi_VN')

        formatted_by_month = [
            {**r, 'revenue': format_decimal(r['revenue'] or 0, format='#,##0', locale='vi_VN'), 'revenue_raw': int(r['revenue'] or 0)}
            for r in revenue_by_month
        ]

        ctx.update({
            'overview': formatted_overview,
            'overview_raw': agg,
            'revenue_by_month': formatted_by_month,
            'no_data': not by_month,
        })
        return TemplateResponse(request, 'admin/stats.html', ctx)

    def stats_movies(self, request):
        year, month, branch_id, movie_id = self.get_filters(request)
        query = get_confirmed_bookings(year, month, branch_id, movie_id)

        by_movie = list(
            query.values(movie=models.F('showtime__movie__title'))
            .annotate(revenue=Sum('final_amount'), bookings=Count('id'))
            .order_by('-revenue')[:15]
        )

        data = serializers.StatsRevenueByMovieSerializer(by_movie, many=True).data

        ctx = self.base_context('movies', year, month, branch_id, movie_id)
        formatted_movie = [
            {**r, 'revenue': format_decimal(r['revenue'] or 0, format='#,##0', locale='vi_VN'), 'revenue_raw': int(r['revenue'] or 0)}
            for r in data
        ]

        ctx.update({
            'by_movie': formatted_movie,
            'no_data': not by_movie,
        })
        return TemplateResponse(request, 'admin/stats.html', ctx)

    def stats_branches(self, request):
        year, month, branch_id, movie_id = self.get_filters(request)
        query = get_confirmed_bookings(year, month, branch_id, movie_id)

        by_branch = list(
            query.values(branch=models.F('showtime__room__branch__name'))
            .annotate(revenue=Sum('final_amount'), bookings=Count('id'))
            .order_by('-revenue')
        )

        data = serializers.StatsRevenueByBranchSerializer(by_branch, many=True).data

        ctx = self.base_context('branches', year, month, branch_id, movie_id)
        formatted_branch = [
            {**r, 'revenue': format_decimal(r['revenue'] or 0, format='#,##0', locale='vi_VN'), 'revenue_raw': int(r['revenue'] or 0)}
            for r in data
        ]

        ctx.update({
            'by_branch': formatted_branch,
            'no_data': not by_branch,
        })
        return TemplateResponse(request, 'admin/stats.html', ctx)

    def stats_showtimes(self, request):
        year, month, branch_id, movie_id = self.get_filters(request)
        query = get_confirmed_bookings(year, month, branch_id, movie_id)

        by_showtime = list(
            query.values(
                st_id=models.F('showtime__id'),
                movie=models.F('showtime__movie__title'),
                branch=models.F('showtime__room__branch__name'),
                show_date=models.F('showtime__show_date'),
                start_time=models.F('showtime__start_time'),
            )
            .annotate(revenue=Sum('final_amount'), bookings=Count('id'), tickets=Count('booking_tickets'))
            .order_by('-revenue')[:20]
        )

        data = serializers.StatsRevenueByShowtimeSerializer(by_showtime, many=True).data

        ctx = self.base_context('showtimes', year, month, branch_id, movie_id)
        formatted_showtime = [
            {**r, 'revenue': format_decimal(r['revenue'] or 0, format='#,##0', locale='vi_VN')}
            for r in data
        ]

        ctx.update({
            'by_showtime': formatted_showtime,
            'no_data': not by_showtime,
        })
        return TemplateResponse(request, 'admin/stats.html', ctx)


admin_site = MyAdminSite()
admin_site.register(User)
admin_site.register(Movie, MovieAdmin)