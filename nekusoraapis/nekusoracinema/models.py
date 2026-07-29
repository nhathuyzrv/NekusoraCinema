import uuid
from enum import Enum
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q, UniqueConstraint
from django.utils import timezone
from slugify import slugify
from django_enum import EnumField


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ENUMS
class UserRole(Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"
    STAFF = "STAFF"
    MANAGER = "MANAGER"


class Gender(Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class StaffPosition(Enum):
    COUNTER_STAFF = "COUNTER_STAFF"
    CHECKER_STAFF = "CHECKER_STAFF"
    BRANCH_MANAGER = "BRANCH_MANAGER"
    SYSTEM_MANAGER = "SYSTEM_MANAGER"


class MovieAgeRating(Enum):
    P = "P"
    K = "K"
    T13 = "T13"
    T16 = "T16"
    T18 = "T18"


class MovieStatus(Enum):
    COMING_SOON = "COMING_SOON"
    NOW_SHOWING = "NOW_SHOWING"
    ENDED = "ENDED"


class ShowtimeStatus(Enum):
    SCHEDULED = "SCHEDULED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class ProductType(Enum):
    SINGLE = "SINGLE"
    COMBO = "COMBO"


class PromotionDiscountType(Enum):
    PERCENT = "PERCENT"
    FIXED_AMOUNT = "FIXED_AMOUNT"


class BookingStatus(Enum):
    HOLDING = "HOLDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class TicketStatus(Enum):
    HELD = "HELD"
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"


class PointTransactionType(Enum):
    EARN = "EARN"
    REDEEM = "REDEEM"
    ADJUST = "ADJUST"


class PaymentStatus(Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILURE"
    REFUNDED = "REFUNDED"


#TABLES
#Tài khoản người dùng
class User(AbstractUser):
    """
        Tài khoản chung cho toàn hệ thống, phân biệt bằng trường `role`.
        - CUSTOMER: khách hàng đặt vé
        - STAFF   : nhân viên quầy / soát vé tại chi nhánh
        - MANAGER : quản lý (quản lý phim, suất chiếu, khuyến mãi, nhân viên, báo cáo...)
    """
    email = models.EmailField(unique=True, null=False, blank=False)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    role = EnumField(UserRole, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = EnumField(Gender, null=True, blank=True)
    avatar = CloudinaryField(null=True, blank=True)

    loyalty_points = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role.value})"


class StaffProfile(BaseModel):
    """Thông tin nghiệp vụ riêng cho tài khoản Nhân viên / Quản lý."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    branch = models.ForeignKey("Branch", on_delete=models.SET_NULL, null=True, blank=True, related_name="staff_members")
    position = EnumField(StaffPosition)
    hire_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.position.value}"


#Vị trí - Chi nhánh - Phòng chiếu - Ghế
class Location(BaseModel):
    """Khu vực/tỉnh-thành mà khách hàng chọn đầu tiên (vd: TP.HCM, Hà Nội)."""

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Branch(BaseModel):
    """Rạp/chi nhánh cụ thể, thuộc một Location."""

    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="branches")
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15, blank=True)
    opening_time = models.TimeField(default="08:00")
    closing_time = models.TimeField(default="24:00")

    class Meta:
        verbose_name_plural = "Branches"

    def __str__(self):
        return f"{self.name} ({self.location.name})"


class ScreeningFormat(BaseModel):
    """Loại hình chiếu / ngôn ngữ: 2D Lồng tiếng, 2D Phụ đề, 3D, IMAX..."""

    code = models.CharField(max_length=20, unique=True)  # vd: 2D_LT, 2D_PD, 3D
    name = models.CharField(max_length=100)  # vd: "2D Lồng tiếng"

    def __str__(self):
        return self.name


class CinemaRoom(BaseModel):
    """Phòng chiếu thuộc một chi nhánh."""

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="rooms")
    name = models.CharField(max_length=50)  # vd: "RẠP 1"
    total_rows = models.PositiveSmallIntegerField(default=10)
    seats_per_row = models.PositiveSmallIntegerField(default=12)

    class Meta:
        unique_together = ("branch", "name")

    def __str__(self):
        return f"{self.branch.name} - {self.name}"


class Seat(BaseModel):
    """Một ghế vật lý cố định trong phòng chiếu (không đổi theo suất chiếu)."""

    room = models.ForeignKey(CinemaRoom, on_delete=models.CASCADE, related_name="seats")
    row_label = models.CharField(max_length=2)  # A, B, C... (tối đa 15 hàng)
    seat_number = models.PositiveSmallIntegerField()  # 1..12
    seat_code = models.CharField(max_length=10)  # vd: "A1" - sinh tự động = row_label+seat_number

    class Meta:
        unique_together = ("room", "row_label", "seat_number")
        ordering = ["room", "row_label", "seat_number"]

    def __str__(self):
        return f"{self.room} - {self.seat_code}"


#Phim
class Genre(BaseModel):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            slug = slugify(self.name, allow_unicode=False)
            self.slug = slug
        super().save(*args, **kwargs)


class Actor(BaseModel):
    name = models.CharField(max_length=150)
    photo = CloudinaryField(null=True, blank=True)

    def __str__(self):
        return self.name


class Movie(BaseModel):
    title = models.CharField(max_length=255)
    age_rating = EnumField(MovieAgeRating)
    duration = models.PositiveSmallIntegerField()
    release_date = models.DateField()
    country = models.CharField(max_length=100)
    director = models.CharField(max_length=150)
    description = RichTextField()
    poster = CloudinaryField(null=True, blank=True)
    trailer_url = models.URLField(null=True, blank=True)
    status = EnumField(MovieStatus, default=MovieStatus.COMING_SOON)
    genres = models.ManyToManyField(Genre, related_name="movies")
    actors = models.ManyToManyField(Actor, through="MovieActor", related_name="movies")
    slug = models.SlugField(max_length=280, unique=True, blank=True)

    class Meta:
        ordering = ["-release_date"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title, allow_unicode=False)
            slug = base
            if Movie.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{self.release_date.strftime('%Y-%m-%d')}"
            self.slug = slug
        super().save(*args, **kwargs)


class MovieActor(BaseModel):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    actor = models.ForeignKey(Actor, on_delete=models.CASCADE)
    character_name = models.CharField(max_length=150, blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ("movie", "actor")
        ordering = ["display_order"]


class Showtime(BaseModel):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="showtimes")
    room = models.ForeignKey(CinemaRoom, on_delete=models.CASCADE, related_name="showtimes")
    screening_format = models.ForeignKey(ScreeningFormat, on_delete=models.PROTECT)
    show_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    price = models.DecimalField(max_digits=10, decimal_places=0)
    status = EnumField(ShowtimeStatus, default=ShowtimeStatus.SCHEDULED)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="created_showtimes",
    )

    class Meta:
        unique_together = ("room", "show_date", "start_time")
        ordering = ["show_date", "start_time"]
        indexes = [models.Index(fields=["movie", "show_date"])]

    def __str__(self):
        return f"{self.movie.title} - {self.room} - {self.show_date} {self.start_time}"


#SẢN PHẨM BẮP NƯỚC (ĐƠN LẺ / COMBO)
class Product(BaseModel):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    image = CloudinaryField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=0)
    product_type = EnumField(ProductType)

    def __str__(self):
        return self.name


class ComboItem(BaseModel):
    combo = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="combo_items", limit_choices_to={"product_type": ProductType.COMBO.value})
    item = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="included_in_combos",limit_choices_to={"product_type": ProductType.SINGLE.value})
    quantity = models.PositiveSmallIntegerField(default=1)

    class Meta:
        unique_together = ("combo", "item")


#KHUYẾN MÃI
class Promotion(BaseModel):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    discount_type = EnumField(PromotionDiscountType)
    discount_value = models.DecimalField(max_digits=10, decimal_places=0)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(null=True, blank=True) #Để trống -> không giới hạn
    used_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.code} - {self.name}"


#ĐẶT VÉ (BOOKING)
def generate_booking_code():
    return uuid.uuid4().hex[:12].upper()


class Booking(BaseModel):
    """
    Một đơn đặt vé cho MỘT suất chiếu (nhiều ghế/nhiều sản phẩm bên trong).
    Đây cũng chính là "vé điện tử" tổng: booking_code dùng để sinh mã QR
    khách xuất trình tại rạp để vào xem (cho cả nhóm nhiều người đi cùng vé).
    """

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    showtime = models.ForeignKey(Showtime, on_delete=models.PROTECT, related_name="bookings")

    booking_code = models.CharField(max_length=20, unique=True, default=generate_booking_code)
    status = EnumField(BookingStatus, default=BookingStatus.HOLDING)

    seat_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    product_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    points_used = models.PositiveIntegerField(default=0)
    points_used_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    points_earned = models.PositiveIntegerField(default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)

    held_until = models.DateTimeField(help_text="Thời điểm hết hạn giữ ghế = created_at + 7 mins")
    confirmed_at = models.DateTimeField(null=True, blank=True)

    is_checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="checked_in_bookings", help_text="Nhân viên soát vé đã quét mã")

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["customer", "status", "created_at"])]

    def __str__(self):
        return self.booking_code


class Ticket(BaseModel):
    """
    Một vé = một ghế cụ thể trong một Booking.
    Ràng buộc: 1 ghế của 1 suất chiếu chỉ được giữ/đặt bởi 1 vé đang HELD/BOOKED
    tại một thời điểm (unique constraint có điều kiện bên dưới).
    """

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="tickets")
    # Denormalize showtime để có thể ràng buộc unique (showtime, seat) ở mức DB.
    showtime = models.ForeignKey(Showtime, on_delete=models.CASCADE, related_name="tickets")
    seat = models.ForeignKey(Seat, on_delete=models.PROTECT, related_name="tickets")
    price = models.DecimalField(max_digits=10, decimal_places=0)
    status = EnumField(TicketStatus, default=TicketStatus.HELD)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["showtime", "seat"],
                condition=Q(status__in=[TicketStatus.HELD.value, TicketStatus.BOOKED.value]),
                name="unique_active_seat_per_showtime",
            )
        ]

    def __str__(self):
        return f"{self.booking.booking_code} - {self.seat.seat_code}"


class BookingProduct(BaseModel):
    """Sản phẩm bắp nước/combo được chọn trong một Booking (snapshot giá lúc đặt)."""

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="booking_products")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveSmallIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=0)


class BookingPromotion(BaseModel):
    """Khuyến mãi được áp dụng cho 1 Booking (cho phép áp dụng nhiều mã cùng lúc)."""

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="booking_promotions")
    promotion = models.ForeignKey(Promotion, on_delete=models.PROTECT)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=0)

    class Meta:
        unique_together = ("booking", "promotion")


class PointTransaction(BaseModel):
    """Lịch sử tích/dùng điểm thành viên."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="point_transactions")
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name="point_transactions")
    points = models.IntegerField(help_text="Dương = cộng điểm, Âm = trừ điểm")
    transaction_type = EnumField(PointTransactionType)
    description = models.CharField(max_length=255, blank=True)


#THANH TOÁN
class PaymentMethod(BaseModel):
    code = models.CharField(max_length=30, unique=True)  # vd: BANK_QR, MOMO
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Payment(BaseModel):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="payment")
    method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    transaction_ref = models.CharField(max_length=100, blank=True, help_text="Mã giao dịch từ cổng thanh toán")
    status = EnumField(PaymentStatus, default=PaymentStatus.PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)


#ĐÁNH GIÁ PHIM (RATING)
class Rating(BaseModel):
    """
    Đánh giá phim từ 1-10 sao.
    Ràng buộc:
      - unique_together(user, movie): mỗi người chỉ có 1 rating/phim (có thể sửa).
      - verified_booking: tham chiếu đến 1 Booking đã CHECKED-IN của chính người
        dùng cho phim này, dùng để xác thực "đã từng xem phim" trước khi cho rating
        (kiểm tra logic ở tầng service/serializer).
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="ratings")
    verified_booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, help_text="Booking đã check-in dùng để chứng minh đủ điều kiện đánh giá.")
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ("user", "movie")

    def __str__(self):
        return f"{self.user.username} - {self.movie.title} - {self.score}/10"