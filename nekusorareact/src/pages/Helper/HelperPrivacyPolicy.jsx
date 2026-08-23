const PRIVACY_SECTIONS = [
    { id: "thu-thap", title: "1. Thông tin thu thập" },
    { id: "muc-dich", title: "2. Mục đích sử dụng" },
    { id: "chia-se", title: "3. Chia sẻ thông tin đối tác" },
    { id: "bao-mat", title: "4. Lưu trữ & Bảo mật" },
    { id: "quyen-han", title: "5. Quyền của người dùng" },
    { id: "lien-he", title: "6. Thông tin liên hệ" },
];

const HelperPrivacyPolicy = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="text-center space-y-3 mb-10">
                <div className="badge badge-primary badge-outline gap-2 text-xs font-semibold">
                    Nekusora Cinema - Cập nhật lần cuối: 15/08/2026
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Chính sách Bảo mật
                </h1>
                <p className="text-base-content/70 max-w-2xl mx-auto text-sm leading-relaxed">
                    Nekusora Cinema cam kết tôn trọng và bảo vệ tối đa quyền riêng tư cũng như dữ liệu cá nhân của khách hàng khi sử dụng nền tảng của chúng tôi
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 hidden lg:block">
                    <div className="sticky top-20 bg-base-200/60 p-4 rounded-2xl border border-base-300">
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3 px-3">
                            Mục lục
                        </p>
                        <ul className="menu menu-sm w-full p-0 gap-1">
                            {PRIVACY_SECTIONS.map((sec) => (
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
                    <section id="thu-thap" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">1. Thông tin thu thập</h2>
                        <p>Để phục vụ quá trình đặt vé và chăm sóc khách hàng, chúng tôi thu thập các thông tin bao gồm:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Thông tin cá nhân cơ bản:</strong> Họ tên, số điện thoại, địa chỉ email, ngày tháng năm sinh.</li>
                            <li><strong>Thông tin giao dịch:</strong> Lịch sử đặt vé, mã đơn hàng, loại ghế chọn, dịch vụ bắp nước đi kèm.</li>
                            <li><strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại thiết bị, hệ điều hành và nhật ký hoạt động trên web/app.</li>
                        </ul>
                    </section>

                    <section id="muc-dich" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">2. Mục đích sử dụng thông tin</h2>
                        <p>Dữ liệu của quý khách được sử dụng nhằm các mục đích hợp pháp sau:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Xác nhận và phát hành mã vé điện tử gửi qua email.</li>
                            <li>Tích điểm thành viên, áp dụng mã giảm giá và gửi quà tặng sinh nhật.</li>
                            <li>Xử lý yêu cầu hỗ trợ, giải quyết khiếu nại hoặc sự cố thanh toán.</li>
                            <li>Gửi thông báo về các suất chiếu đặc biệt, phim mới.</li>
                        </ul>
                    </section>

                    <section id="chia-se" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">3. Chia sẻ thông tin với bên thứ ba</h2>
                        <div className="py-1">
                            <strong>Cam kết:</strong> <span>Nekusora Cinema cam kết tuyệt đối không bán, kinh doanh hoặc trao đổi thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.</span>
                        </div>
                        <p>Thông tin chỉ được chia sẻ trong các trường hợp cần thiết:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Cổng thanh toán đối tác:</strong> Như MoMo hay Ngân hàng để thực hiện xác thực và xử lý giao dịch.</li>
                            <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu bằng văn bản từ các cơ quan nhà nước có thẩm quyền theo quy định của pháp luật Việt Nam.</li>
                        </ul>
                    </section>

                    <section id="bao-mat" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">4. Lưu trữ & Bảo mật dữ liệu</h2>
                        <p>
                            Dữ liệu được lưu trữ an toàn trên các máy chủ có mã hóa SSL/TLS và chuẩn bảo mật tiên tiến. Chúng tôi thực hiện các biện pháp quản lý nghiêm ngặt để ngăn chặn việc truy cập, thay đổi hoặc rò rỉ dữ liệu trái phép.
                        </p>
                    </section>

                    <section id="quyen-han" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">5. Quyền của người dùng</h2>
                        <p>Theo quy định bảo vệ dữ liệu cá nhân, bạn có toàn quyền:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Kiểm tra, cập nhật hoặc điều chỉnh thông tin cá nhân trong phần Thông tin tài khoản.</li>
                            <li>Yêu cầu tạm khóa hoặc xóa hoàn toàn tài khoản và dữ liệu khỏi hệ thống Nekusora.</li>
                            <li>Từ chối nhận các email quảng cáo/marketing bất kỳ lúc nào thông qua liên kết hủy đăng ký ở cuối email.</li>
                        </ul>
                    </section>

                    <section id="lien-he" className="card bg-base-100 border border-base-300 p-6 space-y-3 scroll-m-20">
                        <h2 className="text-lg font-bold text-base-content">6. Thông tin liên hệ ban quản trị</h2>
                        <p>Nếu có thắc mắc về Chính sách bảo mật hoặc yêu cầu xử lý dữ liệu cá nhân, vui lòng liên hệ:</p>
                        <div className="p-3 bg-base-200 rounded-xl space-y-1 text-xs">
                            <p><strong>Bộ phận Hỗ trợ Khách hàng Nekusora Cinema</strong></p>
                            <p>Email: <a href="mailto:support.nekusoracinema@gmail.com" className="text-primary underline">support.nekusoracinema@gmail.com</a></p>
                            <p>Hotline: xxxx xxxx (8:00 - 22:00 hằng ngày)</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HelperPrivacyPolicy;