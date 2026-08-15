# -*- coding: utf-8 -*-
import random
import sys
import string
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from urllib.parse import quote

from django.apps import apps
from django.contrib.auth import get_user_model
from django.utils import timezone

print(">>> Bắt đầu sinh dữ liệu mẫu...")

# 0. TRA CỨU MODEL / ENUM
def find_model(name):
    for m in apps.get_models():
        if m.__name__ == name:
            return m
    raise LookupError(
        f"Không tìm thấy model '{name}'. Hãy chắc chắn app chứa models.py "
        f"đã được thêm vào INSTALLED_APPS và đã migrate."
    )


User = get_user_model()
Movie = find_model("Movie")
_models_module = sys.modules[Movie.__module__]


def E(name):
    return getattr(_models_module, name)


UserRole = E("UserRole")
Gender = E("Gender")
StaffPosition = E("StaffPosition")
MovieAgeRating = E("MovieAgeRating")
MovieStatus = E("MovieStatus")
ShowtimeStatus = E("ShowtimeStatus")
ProductType = E("ProductType")
PromotionDiscountType = E("PromotionDiscountType")
BookingStatus = E("BookingStatus")
TicketStatus = E("TicketStatus")
PointTransactionType = E("PointTransactionType")
PaymentStatus = E("PaymentStatus")

StaffProfile = find_model("StaffProfile")
Location = find_model("Location")
Branch = find_model("Branch")
ScreeningFormat = find_model("ScreeningFormat")
CinemaRoom = find_model("CinemaRoom")
Seat = find_model("Seat")
Genre = find_model("Genre")
Actor = find_model("Actor")
MovieActor = find_model("MovieActor")
Showtime = find_model("Showtime")
Product = find_model("Product")
ComboItem = find_model("ComboItem")
Promotion = find_model("Promotion")
Booking = find_model("Booking")
Ticket = find_model("Ticket")
BookingProduct = find_model("BookingProduct")
BookingPromotion = find_model("BookingPromotion")
PromotionUsage = find_model("PromotionUsage")
PointTransaction = find_model("PointTransaction")
PaymentMethod = find_model("PaymentMethod")
Payment = find_model("Payment")
Rating = find_model("Rating")

NOW = timezone.now()
TODAY = timezone.localdate()

# 1. CONFIG
NUM_EXTRA_CUSTOMERS = 500
NUM_EXTRA_STAFF = 25
NUM_EXTRA_MANAGERS = 4

ROOMS_PER_BRANCH = 4
SHOWTIME_DAYS_BEFORE_TODAY = 7
SHOWTIME_DAYS_AFTER_TODAY = 14
ROOMS_SAMPLED_PER_SHOWDAY = 6
SHOWTIMES_PER_ROOM_PER_DAY = 3

TARGET_BOOKINGS = 5000

random.seed()

print(f"    Ngày hiện tại dùng để tính trạng thái phim/suất chiếu: {TODAY.isoformat()}")

# 2. UTILS
SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ",
            "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"]
MALE_MIDDLE = ["Văn", "Hữu", "Minh", "Thành", "Đức", "Quang", "Anh", "Bá", "Công", "Xuân"]
FEMALE_MIDDLE = ["Thị", "Ngọc", "Thanh", "Kim", "Hồng", "Diễm", "Bích", "Thu", "Ánh", "Mỹ"]
MALE_GIVEN = ["Nam", "Bình", "Cường", "Dũng", "Đạt", "Hùng", "Khánh", "Long", "Phong",
              "Quân", "Sơn", "Tài", "Thắng", "Tuấn", "Việt", "Huy", "Đăng", "Kiên", "Phúc", "Toàn"]
FEMALE_GIVEN = ["Anh", "Chi", "Dung", "Giang", "Hà", "Hoa", "Huyền", "Lan", "Linh", "Mai",
                "Nga", "Nhung", "Oanh", "Phương", "Quỳnh", "Thảo", "Trang", "Uyên", "Vy", "Yến"]


def generate_random_name():
    gender = random.choice([Gender.MALE, Gender.FEMALE])
    surname = random.choice(SURNAMES)
    if gender == Gender.MALE:
        middle = random.choice(MALE_MIDDLE)
        given = random.choice(MALE_GIVEN)
    else:
        middle = random.choice(FEMALE_MIDDLE)
        given = random.choice(FEMALE_GIVEN)
    last_name = f"{surname} {middle}"
    first_name = given
    return first_name, last_name, gender


_used_phones = set(
    User.objects.exclude(phone_number__isnull=True).exclude(phone_number="")
    .values_list("phone_number", flat=True)
)


def random_phone():
    while True:
        p = "0" + random.choice(["3", "5", "7", "8", "9", "1", "2", "4", "6"]) + "".join(random.choices(string.digits, k=8))
        if p not in _used_phones:
            _used_phones.add(p)
            return p


def random_dob():
    start = date(1965, 1, 1)
    end = date(2007, 12, 31)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def trailer_url_for(title):
    base = "https://www.youtube.com/results?search_query="
    max_len = 200
    query = f"{title} trailer"
    url = base + quote(query)
    while len(url) > max_len and len(query) > 3:
        query = query[:-1]
        url = base + quote(query)
    return url


# 3. LOCATION - BRANCH - SCREENING FORMAT - ROOM - SEAT
print(">>> [1/10] Tạo Location & Branch...")

LOCATION_NAMES = [
    "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
    "Nha Trang", "Vũng Tàu", "Huế", "Đà Lạt", "Biên Hòa",
]

STREET_NAMES = [
    "Nguyễn Huệ", "Lê Lợi", "Trần Hưng Đạo", "Hai Bà Trưng", "Nguyễn Trãi",
    "Lý Thường Kiệt", "Phan Chu Trinh", "Điện Biên Phủ", "Cách Mạng Tháng 8",
    "Nguyễn Văn Linh", "Võ Văn Kiệt", "Hoàng Diệu",
]

locations = {}
for name in LOCATION_NAMES:
    loc, _ = Location.objects.get_or_create(name=name)
    locations[name] = loc

BRANCHES_PER_LOCATION = 2
branches = []
for loc_name, loc in locations.items():
    for i in range(1, BRANCHES_PER_LOCATION + 1):
        street = random.choice(STREET_NAMES)
        branch_name = f"Nekusora Cinema {loc_name} {i}"
        branch, _ = Branch.objects.get_or_create(
            location=loc,
            name=branch_name,
            defaults=dict(
                address=f"{random.randint(1, 350)} {street}, {loc_name}",
                phone_number="028" + "".join(random.choices(string.digits, k=7)),
                opening_time=time(8, 0),
                closing_time=time(23, 59),
            ),
        )
        branches.append(branch)

print(f"    -> {len(locations)} location, {len(branches)} branch.")

print(">>> [2/10] Tạo ScreeningFormat, PaymentMethod, CinemaRoom, Seat...")

FORMATS = [
    ("2D_PD", "2D Phụ đề"),
    ("2D_LT", "2D Lồng tiếng"),
    ("3D", "3D"),
    ("IMAX", "IMAX"),
    ("4DX", "4DX"),
]

FORMAT_SURCHARGE = {
    "2D_PD": Decimal(0),
    "2D_LT": Decimal(0),
    "3D":    Decimal(30000),
    "IMAX":  Decimal(50000),
    "4DX":   Decimal(80000),
}

def calc_ticket_price(show_date, screening_format_code):
    weekday = show_date.weekday()
    if weekday == 1:
        base = Decimal(60000)
    elif weekday in (5, 6):
        base = Decimal(90000)
    else:
        base = Decimal(80000)
    return base + FORMAT_SURCHARGE.get(screening_format_code, Decimal(0))

screening_formats = []
for code, name in FORMATS:
    fmt, _ = ScreeningFormat.objects.get_or_create(code=code, defaults=dict(name=name))
    screening_formats.append(fmt)

PAYMENT_METHODS = [
    ("BANK_QR", "Chuyển khoản / QR ngân hàng"),
    ("MOMO", "Ví MoMo"),
    ("ZALOPAY", "Ví ZaloPay"),
    ("VISA_MASTER", "Thẻ Visa/Mastercard"),
]
payment_methods = []
for code, name in PAYMENT_METHODS:
    pm, _ = PaymentMethod.objects.get_or_create(code=code, defaults=dict(name=name))
    payment_methods.append(pm)

rooms = []
seats_by_room = {}
seat_bulk = []
for branch in branches:
    for i in range(1, ROOMS_PER_BRANCH + 1):
        total_rows = random.choice([8, 9, 10, 11, 12])
        seats_per_row = random.choice([10, 11, 12, 13, 14])
        room, created = CinemaRoom.objects.get_or_create(
            branch=branch,
            name=f"RẠP {i}",
            defaults=dict(total_rows=total_rows, seats_per_row=seats_per_row),
        )
        rooms.append(room)
        existing_seats = list(Seat.objects.filter(room=room))
        if existing_seats:
            seats_by_room[room.id] = existing_seats
            continue
        room_seats = []
        for r in range(room.total_rows):
            row_label = string.ascii_uppercase[r]
            for n in range(1, room.seats_per_row + 1):
                room_seats.append(Seat(
                    room=room, row_label=row_label, seat_number=n,
                    seat_code=f"{row_label}{n}",
                    active=True, created_at=NOW, updated_at=NOW,
                ))
        seat_bulk.extend(room_seats)
        seats_by_room[room.id] = room_seats

if seat_bulk:
    Seat.objects.bulk_create(seat_bulk, batch_size=1000)
    for room in rooms:
        seats_by_room[room.id] = list(Seat.objects.filter(room=room))

total_seats = sum(len(v) for v in seats_by_room.values())
print(f"    -> {len(rooms)} phòng chiếu, {total_seats} ghế.")

# 4. GENRE - ACTOR
print(">>> [3/10] Tạo Genre & Actor...")

GENRE_NAMES = [
    "Hành động", "Kinh dị", "Hài", "Tâm lý", "Hoạt hình", "Phiêu lưu",
    "Khoa học viễn tưởng", "Tình cảm", "Trinh thám", "Chính kịch",
    "Nhạc kịch", "Thần thoại", "Gia đình", "Siêu anh hùng", "Cổ trang", "Bí ẩn",
]
genres = {}
for name in GENRE_NAMES:
    g, _ = Genre.objects.get_or_create(name=name)
    genres[name] = g

ACTOR_NAMES = [
    "Pedro Pascal", "Robert Downey Jr.", "Chris Evans", "Zendaya", "Tom Holland",
    "Timothée Chalamet", "Florence Pugh", "Jason Momoa", "Josh Brolin",
    "Rebecca Ferguson", "Anya Taylor-Joy", "Tom Hanks", "Tim Allen", "Joan Cusack",
    "Milly Alcock", "Dwayne Johnson", "Kevin Hart", "Jack Black", "Karen Gillan",
    "Matt Damon", "Anne Hathaway", "Charlize Theron", "Emily Blunt", "Josh O'Connor",
    "Colin Firth", "Jessie Buckley", "Christian Bale", "Samara Weaving",
    "Neve Campbell", "Vanessa Kirby", "Joseph Quinn", "Thu Trang", "Ngọc Thuận",
    "Hồng Ánh", "Hứa Vĩ Văn", "Đức Khuê", "Liên Bỉnh Phát", "Miu Lê", "Trấn Thành",
]
actors = {}
for name in ACTOR_NAMES:
    a, _ = Actor.objects.get_or_create(name=name)
    actors[name] = a

print(f"    -> {len(genres)} genre, {len(actors)} actor.")

# 5. MOVIE + MOVIEACTOR
print(">>> [4/10] Tạo Movie...")

MOVIES = [
    dict(title="Doraemon: Nobita Và Lâu Đài Dưới Đáy Biển", director="Ayumu Watanabe",
         country="Nhật Bản", duration=100, age_rating=MovieAgeRating.P,
         release_date=date(2026, 5, 22), genres=["Hoạt hình", "Phiêu lưu", "Gia đình"],
         cast=[], desc="Nobita và nhóm bạn tình cờ bước vào một thế giới bí ẩn nằm sâu dưới đáy đại dương, "
                       "nơi các cậu phải cùng nhau khám phá và bảo vệ vương quốc cổ xưa khỏi hiểm họa đang rình rập."),
    dict(title="Mandalorian & Grogu", director="Jon Favreau",
         country="Mỹ", duration=130, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 5, 22), genres=["Khoa học viễn tưởng", "Phiêu lưu", "Hành động"],
         cast=["Pedro Pascal"], desc="Din Djarin cùng cậu học trò nhỏ Grogu tiếp tục hành trình xuyên thiên hà, "
                                     "đối mặt với tàn dư của Đế Chế trong lúc Cộng Hòa Mới đang gượng dậy sau chiến tranh."),
    dict(title="Kumanthong Indonesia: Quỷ Song Thai", director="Rocky Soraya",
         country="Indonesia", duration=95, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 5, 8), genres=["Kinh dị"],
         cast=[], desc="Một gia đình vướng vào lời nguyền tâm linh liên quan tới cặp song sinh và nghi lễ Kumanthong, "
                       "kéo theo chuỗi sự kiện rùng rợn không lối thoát."),
    dict(title="Lúc Đó Tôi Đã Chuyển Sinh Thành Slime: Nước Mắt Đại Dương", director="Yasuhito Kikuchi",
         country="Nhật Bản", duration=110, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 5, 8), genres=["Hoạt hình", "Phiêu lưu", "Khoa học viễn tưởng"],
         cast=[], desc="Rimuru và đồng đội đối mặt với nhân vật bí ẩn Yura, người đe dọa phá vỡ thế cân bằng "
                       "mà họ đã dày công xây dựng, mở ra một chương phiêu lưu mới đầy kịch tính."),
    dict(title="Quỷ Nhập Tràng 2", director="Trần Hữu Tấn",
         country="Việt Nam", duration=105, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 3, 13), genres=["Kinh dị"],
         cast=[], desc="Phần tiếp theo khai thác sâu hơn truyền thuyết dân gian về hiện tượng quỷ nhập tràng, "
                       "với những bí mật dòng họ bị chôn giấu nhiều thế hệ."),
    dict(title="Cú Nhảy Kỳ Diệu", director="Dean Kelly",
         country="Mỹ", duration=96, age_rating=MovieAgeRating.P,
         release_date=date(2026, 3, 13), genres=["Hoạt hình", "Gia đình", "Phiêu lưu"],
         cast=[], desc="Cô gái yêu động vật Mabel dùng công nghệ đặc biệt để hóa thân thành một chú hải ly, "
                       "từ đó nhìn thế giới tự nhiên bằng góc nhìn hoàn toàn mới và học cách bảo vệ nó."),
    dict(title="Cô Dâu!", director="Maggie Gyllenhaal",
         country="Mỹ", duration=118, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 3, 13), genres=["Kinh dị", "Thần thoại", "Chính kịch"],
         cast=["Jessie Buckley", "Christian Bale"],
         desc="Phiên bản làm mới của huyền thoại Frankenstein, xoay quanh sinh vật được tạo ra và người bạn đời "
              "kỳ lạ của hắn giữa xã hội đầy định kiến."),
    dict(title="Tứ Hổ Đại Náo", director="Prachya Pinkaew",
         country="Thái Lan", duration=120, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 3, 27), genres=["Hành động", "Thần thoại"],
         cast=[], desc="Bốn tên cướp sở hữu năng lực tà thuật bị cuốn vào cuộc truy lùng kho vàng thất lạc thời "
                       "Thế chiến II, châm ngòi cho một huyền thoại hành động đẫm máu."),
    dict(title="Tài", director="Phan Gia Nhật Linh",
         country="Việt Nam", duration=115, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 4, 30), genres=["Tâm lý", "Hài"],
         cast=["Hồng Ánh", "Hứa Vĩ Văn", "Đức Khuê", "Liên Bỉnh Phát", "Miu Lê"],
         desc="Một nhóm bạn cùng tham gia trò chơi trong bữa tiệc đêm, để rồi cuộc chơi tưởng vô hại dần biến "
              "thành cuộc chiến sinh tồn đầy bất ngờ và kịch tính."),
    dict(title="Trò Chơi Của Quỷ 2", director="Matt Bettinelli-Olpin, Tyler Gillett",
         country="Mỹ", duration=105, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 4, 3), genres=["Kinh dị", "Hài"],
         cast=["Samara Weaving"], desc="Grace trở lại đối đầu với một gia tộc quái dị khác, nơi luật chơi tử thần "
                                       "một lần nữa được đặt ra ngay trong đêm tân hôn."),
    dict(title="Ánh Dương Của Mẹ", director="Chung Meng-Hung",
         country="Đài Loan", duration=108, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 4, 3), genres=["Tâm lý", "Gia đình"],
         cast=[], desc="Câu chuyện cảm động về tình mẫu tử giữa một người mẹ đơn thân và đứa con trong hành "
                       "trình vượt qua biến cố gia đình."),
    dict(title="Dịch Vụ Giao Hàng Của Phù Thủy Kiki", director="Hayao Miyazaki",
         country="Nhật Bản", duration=103, age_rating=MovieAgeRating.P,
         release_date=date(2026, 4, 10), genres=["Hoạt hình", "Phiêu lưu", "Gia đình"],
         cast=[], desc="Cô bé phù thủy 13 tuổi Kiki rời gia đình để tự lập tại một thị trấn ven biển, mở dịch vụ "
                       "giao hàng bằng chổi bay cùng chú mèo đen Jiji."),
    dict(title="Takhon: Quỷ Đội Lốt Người", director="Kongkiat Komesiri",
         country="Thái Lan", duration=98, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 4, 10), genres=["Kinh dị"],
         cast=[], desc="Một thế lực siêu nhiên đội lốt người len lỏi vào cuộc sống thường nhật, gieo rắc nỗi "
                       "sợ hãi cho cả một cộng đồng nhỏ."),
    dict(title="Hành Trình Của Moana", director="Thomas Kail",
         country="Mỹ", duration=135, age_rating=MovieAgeRating.P,
         release_date=date(2026, 7, 10), genres=["Phiêu lưu", "Nhạc kịch", "Gia đình"],
         cast=[], desc="Phiên bản người đóng của hành trình vượt đại dương huyền thoại, tái hiện cuộc phiêu lưu "
                       "của Moana với quy mô hoành tráng và âm nhạc quen thuộc được làm mới."),
    dict(title="Minions & Quái Vật", director="Kyle Balda",
         country="Mỹ", duration=92, age_rating=MovieAgeRating.P,
         release_date=date(2026, 7, 1), genres=["Hoạt hình", "Hài", "Gia đình"],
         cast=[], desc="Bầy Minion tinh nghịch vô tình đánh thức một sinh vật khổng lồ, kéo theo hàng loạt tình "
                       "huống hài hước và náo loạn khắp nơi."),
    dict(title="Thám Tử Lừng Danh Conan: Thiên Thần Sa Ngã Trên Xa Lộ", director="Chika Nagaoka",
         country="Nhật Bản", duration=110, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 7, 18), genres=["Hoạt hình", "Trinh thám", "Hành động"],
         cast=[], desc="Conan và các cộng sự phải phá một vụ án ly kỳ liên quan tới loạt vụ tai nạn bí ẩn xảy "
                       "ra liên tiếp trên xa lộ."),
    dict(title="Running Man Việt Nam Mùa 3: Con Rối Tự Do", director="Nguyễn Trọng Khoa",
         country="Việt Nam", duration=100, age_rating=MovieAgeRating.K,
         release_date=date(2026, 1, 24), genres=["Hài", "Phiêu lưu"],
         cast=[], desc="Dàn nghệ sĩ quen thuộc bước vào loạt thử thách mới đầy bất ngờ, mang đến tiếng cười và "
                       "kịch tính xuyên suốt hành trình."),
    dict(title="Bố Già Trở Lại", director="Trấn Thành",
         country="Việt Nam", duration=128, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 1, 30), genres=["Tâm lý", "Hài", "Gia đình"],
         cast=["Trấn Thành"], desc="Ba Sang cùng gia đình nhỏ của mình tiếp tục đối mặt với những va vấp đời "
                                   "thường, xen lẫn tiếng cười và những giọt nước mắt ấm áp tình thân."),
    dict(title="Finnick: Quái Xù Tinh Nghịch", director="Robert Chandler",
         country="Mỹ", duration=90, age_rating=MovieAgeRating.P,
         release_date=date(2026, 1, 30), genres=["Hoạt hình", "Gia đình"],
         cast=[], desc="Chú quái vật lông xù Finnick lạc vào thế giới loài người và phải học cách hòa nhập "
                       "trong lúc tìm đường trở về nhà."),
    dict(title="Chiến Nam: Ve Sầu Thoát Xác", director="Bùi Thạc Chuyên",
         country="Việt Nam", duration=112, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 1, 30), genres=["Hành động"],
         cast=[], desc="Một cựu chiến binh buộc phải trở lại con đường cũ để bảo vệ những người thân yêu khỏi "
                       "thế lực ngầm đang trỗi dậy."),
    dict(title="Ai Thương Ai Mến", director="Nhất Trung",
         country="Việt Nam", duration=118, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 1, 16), genres=["Tâm lý", "Tình cảm"],
         cast=["Thu Trang", "Ngọc Thuận"],
         desc="Hai Mến, người phụ nữ miền Tây gánh trên vai nợ nần và trách nhiệm gia đình, tình cờ gặp gỡ "
              "chàng công tử Khả trong hành trình vừa ngọt ngào vừa nhiều nước mắt."),
    dict(title="Lời Nguyền Hoàng Kim", director="Victor Vũ",
         country="Việt Nam", duration=130, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 2, 17), genres=["Trinh thám", "Cổ trang", "Hành động"],
         cast=[], desc="Phần tiếp theo trong vũ trụ trinh thám cổ trang, nơi một lời nguyền cổ xưa dẫn lối các "
                       "nhân vật vào chuỗi bí ẩn đan xen quá khứ và hiện tại."),
    dict(title="Thám Tử Lừng Danh Conan: Quả Bom Chọc Trời", director="Chika Nagaoka",
         country="Nhật Bản", duration=108, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 1, 23), genres=["Hoạt hình", "Trinh thám", "Hành động"],
         cast=[], desc="Một âm mưu đánh bom nhắm vào tòa tháp cao nhất thành phố buộc Conan phải chạy đua với "
                       "thời gian để ngăn chặn thảm họa."),
    dict(title="Thư Tình Gửi Ngoại", director="Lam Hồng Xuân",
         country="Trung Quốc", duration=120, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 8, 7),
         genres=["Tâm lý", "Gia đình", "Tình cảm"],
         cast=[], desc="Lấy bối cảnh từ thập niên 1950 đến hiện tại, phim kể về Diệp Thục Nhu — người phụ nữ "
                       "từ bỏ cuộc sống đủ đầy để theo người mình yêu. Biến cố lịch sử khiến đôi vợ chồng chia cắt "
                       "suốt nhiều thập kỷ, và người vợ không biết chữ chỉ có thể gửi nỗi nhớ qua những lá thư "
                       "nhờ người đọc hộ. Người cháu Hiểu Vĩ lặng lẽ sang Thái Lan tìm ông nội và dần khám phá "
                       "câu chuyện về tình yêu, lòng thủy chung vượt qua nửa thế kỷ. Tựa quốc tế 'Dear You' đạt "
                       "doanh thu 2 tỷ NDT và điểm 9.1/10 trên Douban."),
    dict(title="Ma Xưởng Hòm", director="Awi Suryadi",
         country="Indonesia", duration=98, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 8, 7),
         genres=["Kinh dị"],
         cast=[], desc="Risa tưởng đã thoát khỏi thế giới tâm linh sau khi từ bỏ khả năng nhìn thấy ma. "
                       "Thế nhưng em gái cô trở thành mục tiêu của một oán linh mang nỗi hận từ bi kịch hôn nhân, "
                       "buộc Risa phải trải qua năm cái chết để gặp lại năm người bạn ma cũ nhằm giải cứu em. "
                       "Đây là phần kết của loạt phim Danur đình đám từ Indonesia."),
    dict(title="Uma Musume: Pretty Derby - Khởi Đầu Kỷ Nguyên Mới", director="Yamamoto Ken",
             country="Nhật Bản", duration=108, age_rating=MovieAgeRating.P,
             release_date=date(2026, 8, 7),
             genres=["Hoạt hình"],
             cast=[], desc="Jungle Pocket (hay còn được gọi là Pokke) là một Umamusume tự do, nhiệt huyết, quyết tâm bước vào "
                           "đấu trường Twinkle Series sau khi được truyền cảm hứng từ màn thể hiện thần sầu của Fuji Kiseki."),
    dict(title="Ngày Tàn Của Phố Oak", director="David Robert Mitchell",
         country="Mỹ", duration=112, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 8, 14),
         genres=["Khoa học viễn tưởng", "Bí ẩn", "Kinh dị"],
         cast=["Anne Hathaway"],
         desc="Cuộc sống gia đình Platt đảo lộn khi cả khu phố Oak bị cuốn vào hiện tượng bí ẩn, dịch chuyển "
              "đến vùng đất hoàn toàn xa lạ và đầy hiểm nguy. Ba thành viên gia đình phải sinh tồn, lần theo "
              "manh mối để giải đáp nguyên nhân thảm họa, trong khi sự thật họ khám phá ra vượt ngoài "
              "sức tưởng tượng."),
    dict(title="Sợi Chỉ Đỏ", director="Hàm Trần",
         country="Việt Nam", duration=105, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 8, 14),
         genres=["Kinh dị"],
         cast=[], desc="Một kẻ cuồng tín phát hiện trên trán xuất hiện con mắt thứ ba, tin rằng mình được trao "
                       "sứ mệnh thu thập linh hồn tội lỗi và gây ra hàng loạt vụ sát nhân. Một cô bé mang lời "
                       "nguyền nhìn thấy người khuất và một podcaster siêu nhiên bị cuốn vào chuỗi sự kiện rùng "
                       "rợn, dần được kết nối bởi sợi chỉ đỏ bí ẩn. Tác phẩm kinh dị tâm linh mới nhất của "
                       "đạo diễn Hàm Trần."),
    dict(title="PAW Patrol: Phim Khủng Long", director="Cal Brunker",
         country="Mỹ", duration=92, age_rating=MovieAgeRating.P,
         release_date=date(2026, 8, 14),
         genres=["Hoạt hình", "Phiêu lưu", "Gia đình"],
         cast=[], desc="Cơn bão bí ẩn cuốn đội cún cứu hộ PAW Patrol đến hòn đảo nhiệt đới nơi khủng long "
                       "vẫn sinh sống. Cả nhóm gặp Rex, chuyên gia am hiểu khủng long, và phải đối đầu với "
                       "Thị trưởng Humdinger đang khai thác tài nguyên đảo, vô tình đánh thức núi lửa khổng lồ. "
                       "Biệt đội cún dũng cảm thực hiện sứ mệnh giải cứu quy mô lớn."),
    dict(title="Nghỉ Hè Sợ Nghỉ Hưu", director="Huỳnh Lập",
         country="Việt Nam", duration=100, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 8, 21),
         genres=["Hài", "Gia đình"],
         cast=["Hồng Ánh", "Hứa Vĩ Văn", "Huỳnh Lập"],
         desc="Chàng trai Gen Z Trí Bình về quê nghỉ hè thăm ông nội — cựu chiến binh Thời sống đơn độc "
              "với những ký ức chiến tranh. Khoảng cách thế hệ khiến hai ông cháu liên tục nảy sinh mâu thuẫn, "
              "trong khi những hiện tượng tâm linh kỳ lạ xảy ra xung quanh ông nội dần hé lộ bí mật và "
              "giúp cậu thấu hiểu sự hy sinh của thế hệ đi trước."),
    dict(title="Insidious: Quỷ Quyệt Ranh Giới Vô Định", director="Jacob Chase",
         country="Mỹ", duration=108, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 8, 21),
         genres=["Kinh dị"],
         cast=[], desc="Gemma, người mẹ đơn thân sống cùng con gái Maya trong ngôi nhà thời thơ ấu, phát hiện "
                       "mình có khả năng bước vào Cõi Vô Định. Mỗi lần trở về, cô vô tình mang theo thực thể "
                       "đáng sợ sang thế giới thực. Khi mối nguy vượt tầm kiểm soát, Gemma phải đóng cánh cửa "
                       "giữa hai thế giới trước khi những người thân trở thành nạn nhân tiếp theo."),
    dict(title="Shin Cậu Bé Bút Chì: Kỳ Nghỉ Yêu Quái Của Tớ", director="Masaki Watanabe",
         country="Nhật Bản", duration=95, age_rating=MovieAgeRating.P,
         release_date=date(2026, 8, 21),
         genres=["Hoạt hình", "Phiêu lưu", "Gia đình"],
         cast=[], desc="Mùa hè năm nay gia đình Nohara về quê ông nội tại Akita. Một sự kiện kỳ lạ đưa Shin "
                       "cùng cả gia đình lạc vào Xứ Sở Yêu Quái bí ẩn, nơi con người chưa từng đặt chân. "
                       "Giữa những sinh vật kỳ lạ và thử thách bất ngờ, Shin phát huy sự lém lỉnh để cùng "
                       "gia đình tìm đường trở về."),
    dict(title="Avengers: Doomsday", director="Anthony Russo, Joe Russo",
         country="Mỹ", duration=165, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 12, 18), genres=["Hành động", "Khoa học viễn tưởng", "Siêu anh hùng"],
         cast=["Robert Downey Jr.", "Chris Evans", "Pedro Pascal", "Vanessa Kirby", "Joseph Quinn"],
         desc="Liên minh siêu anh hùng lớn nhất từ trước đến nay hợp lực đối đầu Doctor Doom, hiểm họa có thể "
              "định đoạt số phận của toàn vũ trụ."),
    dict(title="Toy Story 5", director="Andrew Stanton",
         country="Mỹ", duration=100, age_rating=MovieAgeRating.P,
         release_date=date(2026, 6, 19), genres=["Hoạt hình", "Gia đình", "Hài"],
         cast=["Tom Hanks", "Tim Allen", "Joan Cusack"],
         desc="Nhóm đồ chơi quen thuộc của Andy giờ đây phải cạnh tranh sự chú ý của Bonnie với một chiếc máy "
              "tính bảng, khơi lại câu chuyện về tình bạn và sự gắn bó."),
    dict(title="The Odyssey", director="Christopher Nolan",
         country="Mỹ", duration=150, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 7, 17), genres=["Chính kịch", "Phiêu lưu"],
         cast=["Matt Damon", "Anne Hathaway", "Charlize Theron", "Tom Holland", "Zendaya"],
         desc="Chuyển thể sử thi Hy Lạp cổ đại về hành trình trở về nhà đầy gian truân của người anh hùng "
              "Odysseus sau cuộc chiến thành Troy."),
    dict(title="Dune: Messiah", director="Denis Villeneuve",
         country="Mỹ", duration=170, age_rating=MovieAgeRating.T16,
         release_date=date(2026, 12, 11), genres=["Khoa học viễn tưởng", "Chính kịch"],
         cast=["Timothée Chalamet", "Zendaya", "Florence Pugh", "Josh Brolin", "Rebecca Ferguson", "Anya Taylor-Joy"],
         desc="Paul Atreides đối mặt với hệ quả quyền lực của chính mình khi đế chế mới do anh dựng nên bắt "
              "đầu bộc lộ những rạn nứt nguy hiểm."),
    dict(title="Jumanji: Open World", director="Jake Kasdan",
         country="Mỹ", duration=120, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 12, 11), genres=["Phiêu lưu", "Hành động", "Hài"],
         cast=["Dwayne Johnson", "Kevin Hart", "Jack Black", "Karen Gillan"],
         desc="Nhóm bạn cũ một lần nữa bị hút vào thế giới trò chơi Jumanji, lần này rộng lớn và khó lường "
              "hơn bao giờ hết."),
    dict(title="Disclosure Day", director="Steven Spielberg",
         country="Mỹ", duration=125, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 6, 12), genres=["Khoa học viễn tưởng", "Bí ẩn"],
         cast=["Emily Blunt", "Josh O'Connor", "Colin Firth"],
         desc="Một sự kiện bất thường liên quan tới vật thể bay không xác định làm đảo lộn cuộc sống của một "
              "nhóm nhân vật, mở ra chuỗi bí ẩn khó lường."),
    dict(title="Supergirl", director="Craig Gillespie",
         country="Mỹ", duration=130, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 6, 26), genres=["Siêu anh hùng", "Hành động", "Khoa học viễn tưởng"],
         cast=["Milly Alcock"], desc="Kara Zor-El, người em họ của Superman, bước ra ánh sáng để tìm lại bản "
                                    "sắc riêng giữa trách nhiệm bảo vệ Trái Đất."),
    dict(title="Spider-Man: Brand New Day", director="Destin Daniel Cretton",
         country="Mỹ", duration=140, age_rating=MovieAgeRating.T13,
         release_date=date(2026, 7, 31), genres=["Siêu anh hùng", "Hành động"],
         cast=["Tom Holland", "Zendaya"], desc="Peter Parker bước vào chương mới của cuộc đời khi phải cân "
                                              "bằng giữa cuộc sống thường nhật và trọng trách người nhện."),
    dict(title="Scream 7", director="Kevin Williamson",
         country="Mỹ", duration=110, age_rating=MovieAgeRating.T18,
         release_date=date(2026, 2, 27), genres=["Kinh dị"],
         cast=["Neve Campbell"], desc="Sidney Prescott trở lại đối đầu với một Ghostface mới, khi quá khứ đẫm "
                                    "máu của thị trấn Woodsboro một lần nữa bị khơi dậy."),
]


def compute_status(release_date):
    if release_date > TODAY:
        return MovieStatus.COMING_SOON
    if release_date >= TODAY - timedelta(days=60):
        return MovieStatus.NOW_SHOWING
    return MovieStatus.ENDED


movies = []
for md in MOVIES:
    movie, created = Movie.objects.get_or_create(
        title=md["title"],
        defaults=dict(
            director=md["director"], duration=md["duration"],
            release_date=md["release_date"], country=md["country"],
            description=md["desc"], trailer_url=trailer_url_for(md["title"]),
            age_rating=md["age_rating"], status=compute_status(md["release_date"]),
        ),
    )
    if not created:
        movie.status = compute_status(md["release_date"])
        movie.save(update_fields=["status"])
    movie.genres.set([genres[g] for g in md["genres"] if g in genres])
    for i, actor_name in enumerate(md["cast"]):
        if actor_name in actors:
            MovieActor.objects.get_or_create(
                movie=movie, actor=actors[actor_name],
                defaults=dict(character_name="", display_order=i),
            )
    movies.append(movie)

print(f"    -> {len(movies)} phim đã được tạo/cập nhật.")

now_showing_movies = [m for m in movies if m.status == MovieStatus.NOW_SHOWING]
coming_soon_movies = [m for m in movies if m.status == MovieStatus.COMING_SOON]
print(f"    -> Đang chiếu: {len(now_showing_movies)} | Sắp chiếu: {len(coming_soon_movies)} "
      f"| Đã kết thúc: {len(movies) - len(now_showing_movies) - len(coming_soon_movies)}")

# 6. PRODUCT (BẮP NƯỚC) + COMBO
print(">>> [5/10] Tạo Product (bắp nước) & Combo...")

SINGLE_PRODUCTS = [
    ("Bắp rang bơ (S)", 39000), ("Bắp rang bơ (M)", 49000), ("Bắp rang bơ (L)", 59000),
    ("Bắp phô mai", 55000), ("Bắp caramel", 55000), ("Coca-Cola (L)", 35000),
    ("Pepsi (L)", 35000), ("Sprite (L)", 35000), ("Nước suối Aquafina", 20000),
    ("Trà đào", 39000), ("Trà xanh", 35000), ("Hotdog phô mai", 45000),
    ("Khoai tây chiên", 45000), ("Cánh gà chiên (3 miếng)", 65000),
    ("Snack Oishi", 15000), ("Nachos phô mai", 59000), ("Cà phê sữa đá", 39000),
]
single_products = {}
for name, price in SINGLE_PRODUCTS:
    p, _ = Product.objects.get_or_create(
        name=name, product_type=ProductType.SINGLE,
        defaults=dict(description=f"{name} - phục vụ tại quầy bắp nước.", price=Decimal(price)),
    )
    single_products[name] = p

COMBOS = [
    ("Combo 1 Đơn", 79000, [("Bắp rang bơ (M)", 1), ("Coca-Cola (L)", 1)]),
    ("Combo 2 Đôi", 129000, [("Bắp rang bơ (L)", 1), ("Coca-Cola (L)", 2)]),
    ("Combo 3 Nhóm", 179000, [("Bắp rang bơ (L)", 2), ("Coca-Cola (L)", 4)]),
    ("Combo Couple Phô Mai", 149000, [("Bắp phô mai", 1), ("Pepsi (L)", 2)]),
    ("Combo Family Deluxe", 259000, [("Bắp rang bơ (L)", 2), ("Coca-Cola (L)", 4), ("Cánh gà chiên (3 miếng)", 1)]),
    ("Combo Trà Đào Bắp Caramel", 99000, [("Bắp caramel", 1), ("Trà đào", 1)]),
    ("Combo Snack Đêm Khuya", 89000, [("Snack Oishi", 2), ("Coca-Cola (L)", 1)]),
    ("Combo Fast & Full", 139000, [("Hotdog phô mai", 1), ("Khoai tây chiên", 1), ("Sprite (L)", 1)]),
]
combo_products = {}
for name, price, items in COMBOS:
    combo, created = Product.objects.get_or_create(
        name=name, product_type=ProductType.COMBO,
        defaults=dict(description=f"{name} - ưu đãi hơn khi mua lẻ.", price=Decimal(price)),
    )
    combo_products[name] = combo
    if created:
        for item_name, qty in items:
            ComboItem.objects.get_or_create(
                combo=combo, item=single_products[item_name], defaults=dict(quantity=qty)
            )

all_products = list(single_products.values()) + list(combo_products.values())
print(f"    -> {len(single_products)} sản phẩm đơn, {len(combo_products)} combo.")

# 7. PROMOTION
print(">>> [6/10] Tạo Promotion...")

PROMOTIONS = [
    ("WELCOME50", "Chào mừng thành viên mới", PromotionDiscountType.PERCENT, 50, 0, 50000, 500, 1),
    ("MEMBER10", "Ưu đãi thành viên 10%", PromotionDiscountType.PERCENT, 10, 100000, 30000, None, 3),
    ("STUDENT15", "Ưu đãi học sinh sinh viên", PromotionDiscountType.PERCENT, 15, 50000, 20000, 1000, 2),
    ("SUMMER2026", "Khuyến mãi hè 2026", PromotionDiscountType.FIXED_AMOUNT, 30000, 100000, None, 2000, 2),
    ("TET2026", "Ưu đãi Tết Nguyên Đán 2026", PromotionDiscountType.PERCENT, 20, 150000, 60000, 800, 1),
    ("FLASH20", "Flash sale 20%", PromotionDiscountType.PERCENT, 20, 0, 40000, 300, 1),
    ("WEEKDAY30K", "Giảm 30K ngày thường", PromotionDiscountType.FIXED_AMOUNT, 30000, 80000, None, None, 5),
    ("COMBO50K", "Giảm 50K khi mua combo", PromotionDiscountType.FIXED_AMOUNT, 50000, 150000, None, 600, 2),
    ("BIRTHDAY", "Quà sinh nhật thành viên", PromotionDiscountType.PERCENT, 100, 0, 100000, 100, 1),
    ("VIP2026", "Ưu đãi khách hàng VIP", PromotionDiscountType.PERCENT, 25, 200000, 80000, 400, 3),
    ("NEWMOVIE", "Ưu đãi phim mới ra mắt", PromotionDiscountType.FIXED_AMOUNT, 20000, 60000, None, None, 3),
    ("WEEKEND15", "Giảm 15% cuối tuần", PromotionDiscountType.PERCENT, 15, 100000, 35000, None, 4),
    ("GROUP4", "Ưu đãi nhóm từ 4 vé", PromotionDiscountType.FIXED_AMOUNT, 40000, 250000, None, 500, 2),
    ("FIRSTBOOK", "Ưu đãi đặt vé lần đầu qua app", PromotionDiscountType.PERCENT, 30, 0, 45000, 1000, 1),
    ("LOYALTY5", "Tri ân khách hàng thân thiết", PromotionDiscountType.PERCENT, 5, 50000, 15000, None, None),
]
promotions = []
for code, name, dtype, value, min_amt, max_amt, usage_limit, per_user_limit in PROMOTIONS:
    promo, _ = Promotion.objects.get_or_create(
        code=code,
        defaults=dict(
            name=name, description=name, discount_type=dtype, discount_value=Decimal(value),
            min_order_amount=Decimal(min_amt), max_discount_amount=Decimal(max_amt) if max_amt else None,
            start_date=NOW - timedelta(days=90), end_date=NOW + timedelta(days=180),
            usage_limit=usage_limit, used_count=0,
            per_user_limit=per_user_limit if per_user_limit is not None else 9999,
        ),
    )
    promotions.append(promo)

print(f"    -> {len(promotions)} promotion.")

# 8. USER (CUSTOMER / STAFF / MANAGER)
print(">>> [7/10] Tạo thêm User (customer/staff/manager)...")

DEFAULT_PASSWORD = "Sample@1234"

existing_customers = list(User.objects.filter(role=UserRole.CUSTOMER))
existing_staff = list(User.objects.filter(role=UserRole.STAFF))
existing_managers = list(User.objects.filter(role=UserRole.MANAGER))
print(f"    -> User có sẵn: {len(existing_customers)} customer, {len(existing_staff)} staff, "
      f"{len(existing_managers)} manager.")

next_customer_idx = User.objects.filter(username__startswith="khach").count() + 1
new_customers = []
for i in range(NUM_EXTRA_CUSTOMERS):
    first, last, gender = generate_random_name()
    idx = next_customer_idx + i
    username = f"khach{idx:04d}"
    if User.objects.filter(username=username).exists():
        continue
    u = User.objects.create_user(
        username=username, email=f"{username}@gmail.com", password=DEFAULT_PASSWORD,
        first_name=first, last_name=last, role=UserRole.CUSTOMER,
        phone_number=random_phone(), date_of_birth=random_dob(), gender=gender,
        loyalty_points=0,
    )
    new_customers.append(u)

next_staff_idx = User.objects.filter(username__startswith="nhanvien").count() + 1
new_staff = []
for i in range(NUM_EXTRA_STAFF):
    first, last, gender = generate_random_name()
    idx = next_staff_idx + i
    username = f"nhanvien{idx:03d}"
    if User.objects.filter(username=username).exists():
        continue
    u = User.objects.create_user(
        username=username, email=f"{username}@nekusora.vn", password=DEFAULT_PASSWORD,
        first_name=first, last_name=last, role=UserRole.STAFF,
        phone_number=random_phone(), date_of_birth=random_dob(), gender=gender,
    )
    new_staff.append(u)

next_manager_idx = User.objects.filter(username__startswith="quanly").count() + 1
new_managers = []
for i in range(NUM_EXTRA_MANAGERS):
    first, last, gender = generate_random_name()
    idx = next_manager_idx + i
    username = f"quanly{idx:02d}"
    if User.objects.filter(username=username).exists():
        continue
    u = User.objects.create_user(
        username=username, email=f"{username}@nekusora.vn", password=DEFAULT_PASSWORD,
        first_name=first, last_name=last, role=UserRole.MANAGER,
        phone_number=random_phone(), date_of_birth=random_dob(), gender=gender,
        is_staff=True,
    )
    new_managers.append(u)

customers = existing_customers + new_customers
staff_users = existing_staff + new_staff
manager_users = existing_managers + new_managers

for u in staff_users:
    StaffProfile.objects.get_or_create(
        user=u, defaults=dict(
            branch=random.choice(branches),
            position=random.choice([StaffPosition.COUNTER_STAFF, StaffPosition.CHECKER_STAFF]),
            hire_date=TODAY - timedelta(days=random.randint(30, 1500)),
        ),
    )
for u in manager_users:
    StaffProfile.objects.get_or_create(
        user=u, defaults=dict(
            branch=random.choice(branches),
            position=random.choice([StaffPosition.BRANCH_MANAGER, StaffPosition.SYSTEM_MANAGER]),
            hire_date=TODAY - timedelta(days=random.randint(365, 2500)),
        ),
    )

print(f"    -> Tổng: {len(customers)} customer, {len(staff_users)} staff, {len(manager_users)} manager.")

checkin_staff = staff_users or manager_users
creator_users = manager_users or staff_users or customers

# ------------------------------------------------------------------------- #
# 9. SHOWTIME
# ------------------------------------------------------------------------- #

print(">>> [8/10] Tạo Showtime...")

SHOW_TIME_SLOTS = [time(9, 0), time(11, 15), time(13, 30), time(16, 0),
                    time(18, 30), time(20, 45), time(22, 30)]


def build_showtimes_for_movie(movie, day_range):
    created_showtimes = []
    for day_offset in day_range:
        show_date = TODAY + timedelta(days=day_offset)
        sampled_rooms = random.sample(rooms, k=min(ROOMS_SAMPLED_PER_SHOWDAY, len(rooms)))
        for room in sampled_rooms:
            times_today = random.sample(SHOW_TIME_SLOTS, k=min(SHOWTIMES_PER_ROOM_PER_DAY, len(SHOW_TIME_SLOTS)))
            for start_t in times_today:
                fmt = random.choice(screening_formats)
                price = calc_ticket_price(show_date, fmt.code)
                end_minutes = start_t.hour * 60 + start_t.minute + movie.duration + 15
                end_t = time((end_minutes // 60) % 24, end_minutes % 60)
                if show_date < TODAY:
                    status = ShowtimeStatus.COMPLETED
                else:
                    status = ShowtimeStatus.SCHEDULED
                st, created = Showtime.objects.get_or_create(
                    room=room, show_date=show_date, start_time=start_t,
                    defaults=dict(
                        movie=movie, screening_format=fmt, end_time=end_t,
                        price=Decimal(price), status=status,
                        created_by=random.choice(creator_users),
                    ),
                )
                if created:
                    created_showtimes.append(st)
    return created_showtimes


all_showtimes = []
for movie in now_showing_movies:
    day_range = range(-SHOWTIME_DAYS_BEFORE_TODAY, SHOWTIME_DAYS_AFTER_TODAY + 1)
    all_showtimes.extend(build_showtimes_for_movie(movie, day_range))

for movie in coming_soon_movies:
    days_until_release = (movie.release_date - TODAY).days
    if 0 < days_until_release <= 10:
        day_range = range(days_until_release, days_until_release + 3)
        all_showtimes.extend(build_showtimes_for_movie(movie, day_range))

print(f"    -> {len(all_showtimes)} showtime mới được tạo (chưa tính showtime có sẵn).")

all_showtimes_qs = list(Showtime.objects.select_related("room", "movie").all())
print(f"    -> Tổng cộng hệ thống hiện có {len(all_showtimes_qs)} showtime.")

# ------------------------------------------------------------------------- #
# 10. BOOKING - TICKET - BOOKING_PRODUCT - BOOKING_PROMOTION - PAYMENT - POINT
# ------------------------------------------------------------------------- #

print(">>> [9/10] Tạo Booking, Ticket, Payment, PointTransaction...")

existing_booking_count = Booking.objects.count()
remaining_target = max(0, TARGET_BOOKINGS - existing_booking_count)
if existing_booking_count:
    print(f"    -> Đã có sẵn {existing_booking_count} booking từ lần chạy trước, "
          f"sẽ tạo thêm tối đa {remaining_target} booking để đạt mốc TARGET_BOOKINGS={TARGET_BOOKINGS}.")

booking_count = 0
point_tx_bulk = []
rating_candidates = []
promotion_usage_bulk_count = 0

random.shuffle(all_showtimes_qs)

for st in all_showtimes_qs:
    if booking_count >= remaining_target:
        break

    room_seats = seats_by_room.get(st.room_id) or list(Seat.objects.filter(room_id=st.room_id))
    if not room_seats:
        continue

    taken_seat_ids = set(
        Ticket.objects.filter(
            showtime=st, status__in=[TicketStatus.HELD, TicketStatus.BOOKED]
        ).values_list("seat_id", flat=True)
    )
    available_seats = [s for s in room_seats if s.id not in taken_seat_ids]
    if not available_seats:
        continue

    is_past = st.show_date < TODAY
    occupancy_ratio = random.uniform(0.35, 0.85) if is_past else random.uniform(0.05, 0.45)
    num_bookings_for_showtime = max(1, int(len(room_seats) * occupancy_ratio / 2.3))

    random.shuffle(available_seats)

    for _ in range(num_bookings_for_showtime):
        if booking_count >= remaining_target or not available_seats:
            break

        num_seats = random.choice([1, 1, 2, 2, 2, 3, 4])
        chosen_seats = [available_seats.pop() for _ in range(min(num_seats, len(available_seats)))]
        if not chosen_seats:
            break

        customer = random.choice(customers)
        seat_amount = st.price * len(chosen_seats)

        chosen_products = []
        product_amount = Decimal(0)
        if random.random() < 0.55:
            for _ in range(random.randint(1, 2)):
                prod = random.choice(all_products)
                qty = random.randint(1, 2)
                subtotal = prod.price * qty
                chosen_products.append((prod, qty, subtotal))
                product_amount += subtotal

        applied_promo = None
        discount_amount = Decimal(0)
        gross = seat_amount + product_amount
        if random.random() < 0.2:
            eligible_promos = [p for p in promotions if gross >= p.min_order_amount]
            if eligible_promos:
                applied_promo = random.choice(eligible_promos)
                if applied_promo.discount_type == PromotionDiscountType.PERCENT:
                    discount_amount = gross * Decimal(applied_promo.discount_value) / Decimal(100)
                else:
                    discount_amount = Decimal(applied_promo.discount_value)
                if applied_promo.max_discount_amount:
                    discount_amount = min(discount_amount, applied_promo.max_discount_amount)
                discount_amount = min(discount_amount, gross)

        final_amount = gross - discount_amount
        points_earned = int(final_amount // 10000)

        if is_past:
            status = random.choices(
                [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
                weights=[85, 10, 5],
            )[0]
        else:
            status = random.choices(
                [BookingStatus.CONFIRMED, BookingStatus.HOLDING],
                weights=[70, 30],
            )[0]

        created_at = timezone.make_aware(
            datetime.combine(st.show_date - timedelta(days=random.randint(0, 20)),
                             time(random.randint(8, 22), random.randint(0, 59)))
        ) if is_past else NOW - timedelta(hours=random.randint(0, 72))
        confirmed_at = created_at + timedelta(
            minutes=random.randint(1, 6)) if status == BookingStatus.CONFIRMED else None
        is_checked_in = is_past and status == BookingStatus.CONFIRMED and random.random() < 0.8
        checked_in_at = (timezone.make_aware(datetime.combine(st.show_date, st.start_time)) + timedelta(
            minutes=random.randint(-15, 5))) if is_checked_in else None

        booking = Booking.objects.create(
            customer=customer, showtime=st, status=status,
            seat_amount=seat_amount, product_amount=product_amount,
            discount_amount=discount_amount, points_used=0, points_used_amount=Decimal(0),
            points_earned=points_earned if status == BookingStatus.CONFIRMED else 0,
            final_amount=final_amount,
            held_until=created_at + timedelta(minutes=7),
            confirmed_at=confirmed_at,
            is_checked_in=is_checked_in,
            checked_in_at=checked_in_at,
            checked_in_by=random.choice(checkin_staff) if is_checked_in and checkin_staff else None,
            created_at=created_at, updated_at=confirmed_at or created_at,
        )
        booking_count += 1

        ticket_status = TicketStatus.CANCELLED if status == BookingStatus.CANCELLED else (
            TicketStatus.BOOKED if status == BookingStatus.CONFIRMED else TicketStatus.HELD
        )
        for seat in chosen_seats:
            Ticket.objects.create(
                booking=booking, showtime=st, seat=seat, price=st.price,
                status=ticket_status, created_at=created_at, updated_at=created_at,
            )

        for prod, qty, subtotal in chosen_products:
            BookingProduct.objects.create(
                booking=booking, product=prod, quantity=qty,
                unit_price=prod.price, subtotal=subtotal,
                created_at=created_at, updated_at=created_at,
            )

        if applied_promo:
            BookingPromotion.objects.get_or_create(
                booking=booking,
                defaults=dict(
                    promotion=applied_promo,
                    discount_amount=discount_amount,
                    created_at=created_at, updated_at=created_at,
                ),
            )

        if status == BookingStatus.CONFIRMED:
            method = random.choice(payment_methods)
            pay_status = random.choices(
                [PaymentStatus.SUCCESS, PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.REFUNDED],
                weights=[88, 4, 4, 4],
            )[0]
            Payment.objects.create(
                booking=booking, method=method, amount=final_amount,
                transaction_ref=("TXN" + "".join(random.choices(string.digits, k=10))),
                status=pay_status,
                paid_at=confirmed_at if pay_status == PaymentStatus.SUCCESS else None,
                contact_email=customer.email,
                created_at=created_at, updated_at=confirmed_at or created_at,
            )
            if points_earned:
                point_tx_bulk.append(PointTransaction(
                    user=customer, booking=booking, points=points_earned,
                    transaction_type=PointTransactionType.EARN,
                    description=f"Tích điểm từ đơn {booking.booking_code}",
                    created_at=created_at, updated_at=created_at,
                ))
            if applied_promo:
                PromotionUsage.objects.create(
                    promotion=applied_promo,
                    user=customer,
                    booking=booking,
                    created_at=created_at, updated_at=created_at,
                )
                promotion_usage_bulk_count += 1

        if is_checked_in:
            rating_candidates.append((customer, st.movie, booking))

if point_tx_bulk:
    PointTransaction.objects.bulk_create(point_tx_bulk, batch_size=1000)

from django.db.models import F
from collections import defaultdict
earned_map = defaultdict(int)
for tx in point_tx_bulk:
    earned_map[tx.user_id] += tx.points
for user_id, pts in earned_map.items():
    User.objects.filter(pk=user_id).update(loyalty_points=F("loyalty_points") + pts)

print(f"    -> {booking_count} booking, {len(point_tx_bulk)} point transaction, {promotion_usage_bulk_count} promotion usage.")

# ------------------------------------------------------------------------- #
# 11. RATING
# ------------------------------------------------------------------------- #

print(">>> [10/10] Tạo Rating...")

RATING_COMMENTS = [
    "Phim hay, kỹ xảo đẹp, đáng xem!", "Nội dung ổn nhưng nhịp phim hơi chậm.",
    "Diễn xuất tốt, cốt truyện cuốn hút.", "Âm thanh và hình ảnh rất chất lượng.",
    "Không như kỳ vọng nhưng vẫn giải trí tốt.", "Xem cùng gia đình rất phù hợp.",
    "Twist cuối phim khá bất ngờ.", "Rạp chiếu tốt, phim cũng hay.",
    "Sẽ xem lại lần nữa nếu có dịp.", "Một trong những phim hay nhất mình xem năm nay.",
    "Kịch bản hơi dự đoán được nhưng tổng thể ổn.", "Cảm xúc, đáng đồng tiền bát gạo.",
]

seen_pairs = set(Rating.objects.values_list("user_id", "movie_id"))
rating_bulk = []
random.shuffle(rating_candidates)
for customer, movie, booking in rating_candidates:
    key = (customer.id, movie.id)
    if key in seen_pairs:
        continue
    if random.random() > 0.6:
        continue
    seen_pairs.add(key)
    rating_bulk.append(Rating(
        user=customer, movie=movie, verified_booking=booking,
        score=random.randint(5, 10), comment=random.choice(RATING_COMMENTS),
        created_at=NOW - timedelta(days=random.randint(0, 30)), updated_at=NOW,
    ))

if rating_bulk:
    Rating.objects.bulk_create(rating_bulk, batch_size=1000)

print(f"    -> {len(rating_bulk)} rating.")

# ------------------------------------------------------------------------- #
# TỔNG KẾT
# ------------------------------------------------------------------------- #

print("\n================= TỔNG KẾT DỮ LIỆU =================")
print(f"Location            : {Location.objects.count()}")
print(f"Branch               : {Branch.objects.count()}")
print(f"CinemaRoom           : {CinemaRoom.objects.count()}")
print(f"Seat                 : {Seat.objects.count()}")
print(f"ScreeningFormat      : {ScreeningFormat.objects.count()}")
print(f"Genre                : {Genre.objects.count()}")
print(f"Actor                : {Actor.objects.count()}")
print(f"Movie                : {Movie.objects.count()}")
print(f"MovieActor           : {MovieActor.objects.count()}")
print(f"Showtime             : {Showtime.objects.count()}")
print(f"Product              : {Product.objects.count()}")
print(f"ComboItem            : {ComboItem.objects.count()}")
print(f"Promotion            : {Promotion.objects.count()}")
print(f"User (customer)      : {User.objects.filter(role=UserRole.CUSTOMER).count()}")
print(f"User (staff)         : {User.objects.filter(role=UserRole.STAFF).count()}")
print(f"User (manager)       : {User.objects.filter(role=UserRole.MANAGER).count()}")
print(f"StaffProfile         : {StaffProfile.objects.count()}")
print(f"Booking              : {Booking.objects.count()}")
print(f"Ticket               : {Ticket.objects.count()}")
print(f"BookingProduct       : {BookingProduct.objects.count()}")
print(f"BookingPromotion     : {BookingPromotion.objects.count()}")
print(f"PromotionUsage       : {PromotionUsage.objects.count()}")
print(f"PointTransaction     : {PointTransaction.objects.count()}")
print(f"PaymentMethod        : {PaymentMethod.objects.count()}")
print(f"Payment              : {Payment.objects.count()}")
print(f"Rating               : {Rating.objects.count()}")
print("======================================================")
print(f"Mật khẩu mặc định cho toàn bộ user mới tạo: {DEFAULT_PASSWORD}")
print(">>> HOÀN TẤT sinh dữ liệu mẫu.")