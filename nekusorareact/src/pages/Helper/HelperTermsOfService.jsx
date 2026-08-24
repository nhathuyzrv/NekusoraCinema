const SECTIONS = [
    { id: "chap-nhan", title: "1. Chấp nhận điều khoản" },
    { id: "tai-khoan", title: "2. Tài khoản & Thành viên" },
    { id: "dat-ve", title: "3. Quy định Đặt vé & Thanh toán" },
    { id: "do-tuoi", title: "4. Phân loại Độ tuổi & Kiểm tra" },
    { id: "quy-dinh-rap", title: "5. Tiêu chuẩn Cộng đồng & Quy định tại Rạp" },
    { id: "xu-ly-vi-pham", title: "6. Xử lý Vi phạm & Giới hạn Trách nhiệm" },
];

const HelperTermsOfService = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="text-center space-y-3 mb-10">
                <div className="badge badge-primary badge-outline gap-2 text-xs font-semibold">
                    Nekusora Cinema - Cập nhật lần cuối: 15/08/2026
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Điều khoản Dịch vụ
                </h1>
                <p className="text-base-content/70 max-w-2xl mx-auto text-sm leading-relaxed">
                    Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ đặt vé trực tuyến và tham gia trải nghiệm xem phim tại hệ thống Nekusora Cinema
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 hidden lg:block">
                    <div className="sticky top-20 bg-base-200/60 p-4 rounded-2xl border border-base-300">
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3 px-3">
                            Mục lục
                        </p>
                        <ul className="menu menu-sm w-full p-0 gap-1">
                            {SECTIONS.map((sec) => (
                                <li key={sec.id}>
                                    <a href={`#${sec.id}`} className="hover:text-primary transition-colors">
                                        {sec.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-8 text-sm leading-relaxed text-base-content/80">
                    <section id="chap-nhan" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">1. Chấp nhận điều khoản</h2>
                        <p>
                            Bằng việc đăng ký tài khoản, quý khách đồng ý tuân thủ các Điều khoản Dịch vụ này. Nếu quý khách không đồng ý với bất kỳ phần nào của điều khoản, vui lòng ngưng sử dụng dịch vụ của chúng tôi.
                        </p>
                    </section>

                    <section id="tai-khoan" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">2. Tài khoản & Thành viên</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Người dùng cần cung cấp chính xác họ tên, email, số điện thoại để đăng ký tài khoản và nhận vé điện tử.</li>
                            <li>Bạn có trách nhiệm bảo mật mật khẩu và tài khoản cá nhân của mình. Nekusora Cinema không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh do việc chia sẻ tài khoản cho bên thứ ba.</li>
                            <li>Điểm thành viên có hiệu lực 12 tháng kể từ ngày tích lũy và được quy đổi trực tiếp khi thanh toán đơn hàng theo tỷ lệ quy định.</li>
                        </ul>
                    </section>

                    <section id="dat-ve" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">3. Quy định Đặt vé & Thanh toán</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Thời gian giữ ghế:</strong> Hệ thống sẽ tiến hành giữ ghế trong vòng <strong>8 phút</strong> kể từ sau khi hoàn tất chọn ghế. Đơn hàng sẽ tự động bị hủy bỏ sau khi hết thời gian kể trên mà chưa hoàn tất thanh toán.</li>
                            <li><strong>Chính sách vé:</strong> Vé đã thanh toán thành công <strong>sẽ không được hoàn trả, đổi suất chiếu hoặc thay đổi vị trí ghế</strong>. Quý khách vui lòng kiểm tra kỹ thông tin phim, suất chiếu và vị trí ngồi trước khi xác nhận giao dịch.</li>
                            <li><strong>Chính sách thanh toán:</strong> Trong trường hợp phát sinh sự cố trừ tiền thành công nhưng chưa nhận được vé, vui lòng liên hệ CSKH để được hỗ trợ.</li>
                        </ul>
                    </section>

                    <section id="do-tuoi" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">4. Phân loại Độ tuổi</h2>
                        <p>
                            Nekusora Cinema áp dụng nghiêm ngặt quy định phân loại phim theo Luật Điện ảnh Việt Nam:
                        </p>
                        <div className="flex flex-col gap-2 my-2">
                            <div className="p-2 bg-base-200 rounded-lg px-4"><strong>P</strong>: Dành cho người xem ở mọi độ tuổi</div>
                            <div className="p-2 bg-base-200 rounded-lg px-4"><strong>K</strong>: Dành cho người xem dưới 13 tuổi và có người giám hộ đi kèm</div>
                            <div className="p-2 bg-base-200 rounded-lg px-4"><strong>T13</strong>: Dành cho người xem từ 13 tuổi trở lên</div>
                            <div className="p-2 bg-base-200 rounded-lg px-4"><strong>T16</strong>: Dành cho người xem từ 16 tuổi trở lên</div>
                            <div className="p-2 bg-base-200 rounded-lg px-4"><strong>T18</strong>: Dành cho người xem từ 18 tuổi trở lên</div>
                        </div>
                        <p className="text-error font-medium text-xs">
                            Nhân viên soát vé có quyền yêu cầu xuất trình CCCD trước khi vào phòng chiếu đối với một số phim yêu cầu về độ tuổi. Trong trường hợp đã thanh toán vé trước đó, rạp từ chối hoàn tiền nếu khán giả không đủ tuổi theo quy định.
                        </p>
                    </section>

                    <section id="quy-dinh-rap" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">5. Tiêu chuẩn Cộng đồng & Quy định tại Rạp</h2>
                        <p>
                            Ngoài các quy định kể trên, khách hàng vui lòng tuân thủ các quy định tại nơi công cộng, giữ gìn văn hóa ứng xử văn minh và lịch sự trong suốt thời gian sử dụng dịch vụ tại rạp. Chúng tôi nghiêm cấm mọi hành vi vi phạm tiêu chuẩn cộng đồng, bao gồm nhưng không giới hạn như:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Gây mất trật tự, chen lấn, sử dụng ngôn từ kích động, xúc phạm hoặc làm ảnh hưởng đến trải nghiệm xem phim của những người xung quanh.</li>
                            <li>Thực hiện các hành vi riêng tư quá đà, thiếu chuẩn mực trong phòng chiếu cũng như khu vực chung.</li>
                            <li>Mang đồ ăn/thức uống có mùi từ bên ngoài vào trong rạp.</li>
                            <li><strong>Nghiêm cấm hành vi</strong>: Quay lén, ghi âm, phát sóng trực tiếp (livestream) hoặc sao chép nội dung phim dưới mọi hình thức.</li>
                        </ul>
                    </section>

                    <section id="xu-ly-vi-pham" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">6. Xử lý Vi phạm & Giới hạn Trách nhiệm</h2>
                        <p>
                            Mọi trường hợp cố tình vi phạm nội quy rạp hoặc pháp luật hiện hành sẽ bị từ chối phục vụ, mời ra khỏi rạp ngay lập tức, hủy tư cách thành viên mà không hoàn tiền vé. Đối với hành vi quay lén phim, gây rối trật tự công cộng hoặc vi phạm pháp luật, Nekusora Cinema sẽ bàn giao vụ việc cho cơ quan chức năng xử lý theo đúng quy định của pháp luật.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HelperTermsOfService;