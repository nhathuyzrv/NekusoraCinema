from rest_framework import pagination


class MovieItemPaginator(pagination.PageNumberPagination):
    page_size = 8

class RatingItemPaginator(pagination.PageNumberPagination):
    page_size = 8

class BookingItemPaginator(pagination.PageNumberPagination):
    page_size = 5

class ManageProductItemPaginator(pagination.PageNumberPagination):
    page_size = 10