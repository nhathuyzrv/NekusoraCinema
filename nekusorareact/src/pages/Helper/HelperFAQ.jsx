const FAQ_DATA = [
    {
        category: "Đặt vé & Thanh toán",
        items: [
            {
                q: "Tôi có thể đặt vé bằng những cách nào?",
                a: "Bạn có thể đặt vé trực tiếp tại quầy rạp, hoặc đặt trực tuyến qua website và ứng dụng Nekusora Cinema. Đặt online giúp bạn chọn ghế trước, không cần xếp hàng và nhận vé điện tử qua email ngay sau khi thanh toán thành công.",
            },
            {
                q: "Những phương thức thanh toán nào được chấp nhận?",
                a: "Nekusora Cinema chấp nhận thanh toán qua ví điện tử MoMo, chuyển khoản ngân hàng và QR Pay (PayOS). Thanh toán tại quầy hỗ trợ thêm tiền mặt và thẻ ngân hàng nội địa / quốc tế.",
            },
            {
                q: "Tôi có thể hủy hoặc đổi vé sau khi đặt không?",
                a: "Vé đã thanh toán không được hoàn trả hoặc đổi suất chiếu. Vui lòng kiểm tra kỹ tên phim, suất chiếu, ngày giờ và vị trí ghế trước khi xác nhận thanh toán. Trong trường hợp lỗi hệ thống, vui lòng liên hệ CSKH để được hỗ trợ.",
            },
            {
                q: "Vé điện tử sử dụng như thế nào khi vào rạp?",
                a: "Sau khi đặt vé thành công, mã QR sẽ được gửi đến email của bạn. Bạn chỉ cần xuất trình mã QR này tại cổng soát vé, nhân viên sẽ quét và bạn vào phòng chiếu trực tiếp, không cần đổi vé giấy.",
            },
            {
                q: "Tôi đã thanh toán thành công nhưng không nhận được vé, phải làm gì?",
                a: "Vui lòng kiểm tra hộp thư rác trước. Nếu vẫn không thấy, hãy liên hệ hotline Nekusora Cinema trong giờ hoạt động (8:00 - 22:00) và cung cấp số điện thoại đăng ký tài khoản để được tra cứu và cấp lại mã vé.",
            },
            {
                q: "Thời gian giữ ghế khi đặt vé là bao lâu?",
                a: "Sau khi chọn ghế, hệ thống sẽ giữ chỗ cho bạn trong vòng 10 phút. Nếu chưa hoàn tất thanh toán trong thời gian này, ghế sẽ được tự động trả về và bạn cần chọn lại từ đầu.",
            },
            {
                q: "Tôi chưa biết cách đặt vé",
                a: `Hãy ghé mục "Hướng dẫn đặt vé" ở cuối trang để xem hướng dẫn. Mọi thao tác trong chế độ hướng dẫn không ảnh hưởng đến kết quả thực sự.`,
            },
        ],
    },
    {
        category: "Tài khoản & Thành viên",
        items: [
            {
                q: "Làm thế nào để tạo tài khoản Nekusora?",
                a: "Nhấn vào 'Đăng ký' trên website hoặc ứng dụng, điền thông tin cá nhân (họ tên, email, số điện thoại) và xác thực qua OTP nhằm đảm bảo tính toàn vẹn khi đặt vé. Tài khoản được tạo miễn phí và bạn sẽ trở thành thành viên cơ bản.",
            },
            {
                q: "Tôi quên mật khẩu phải làm sao?",
                a: "Chọn 'Quên mật khẩu' tại trang đăng nhập, nhập email đăng ký và làm theo hướng dẫn trong email đặt lại mật khẩu. Nếu không nhận được email trong vài phút, hãy kiểm tra mục spam hoặc liên hệ hỗ trợ.",
            },
            {
                q: "Quyền lợi của thành viên Nekusora là gì?",
                a: "Thành viên tích điểm sau mỗi giao dịch (1 điểm cho mỗi 10.000đ chi tiêu). Điểm tích lũy có thể quy đổi để giảm giá vé và bắp nước. Ngoài ra, thành viên được hưởng ưu đãi vào ngày sinh nhật, thứ Ba giảm giá hàng tuần, và thông báo sớm về các suất chiếu đặc biệt.",
            },
            {
                q: "Điểm thành viên được quy đổi như thế nào?",
                a: "Cứ 2 điểm tích lũy tương đương 1.000đ giảm giá. Bạn có thể dùng điểm để giảm trực tiếp vào hóa đơn khi đặt vé online, tối đa theo số điểm hiện có trong tài khoản tại thời điểm thanh toán.",
            },
            {
                q: "Điểm thành viên có hết hạn không?",
                a: "Điểm thành viên có hiệu lực trong vòng 12 tháng kể từ ngày tích lũy. Bạn sẽ nhận được thông báo qua email trước khi điểm hết hạn để kịp thời sử dụng.",
            },
        ],
    },
    {
        category: "Ghế & Phòng chiếu",
        items: [
            {
                q: "Tôi có thể chọn ghế cụ thể khi đặt vé không?",
                a: "Có. Khi đặt vé online, bạn sẽ thấy sơ đồ phòng chiếu trực quan với đầy đủ thông tin về ghế còn trống, ghế đang được giữ và ghế đã đặt. Bạn chủ động chọn vị trí mình muốn trước khi thanh toán.",
            },
            {
                q: "Quy tắc chọn ghế có gì cần lưu ý không?",
                a: "Hệ thống không cho phép tạo khoảng trống 1 ghế lẻ giữa các ghế đã chọn hoặc ở bên trái / bên phải dãy. Điều này nhằm tránh tình trạng 1 ghế bị bỏ trống lẻ loi, gây bất tiện cho khán giả khác. Nếu lựa chọn không hợp lệ, hệ thống sẽ thông báo để bạn điều chỉnh.",
            },
            {
                q: "Nekusora có những loại ghế đặc biệt nào?",
                a: "Hiện tại Nekusora cung cấp ghế thường (Standard), ghế đôi Sweetbox dành cho cặp đôi, và ghế VIP với không gian rộng hơn ở khu vực trung tâm phòng chiếu. Giá vé tương ứng với từng loại ghế sẽ được hiển thị rõ trên sơ đồ.",
            },
            {
                q: "Tôi nên ngồi vị trí nào để có trải nghiệm tốt nhất?",
                a: "Các dãy ghế trung tâm thường cho góc nhìn và âm thanh tốt nhất. Nếu bạn bị cận, hãy chọn hàng gần màn hình hơn. Nếu bị viễn, chọn hàng phía sau để màn hình nằm gọn trong tầm nhìn.",
            },
        ],
    },
    {
        category: "Giá vé & Khuyến mãi",
        items: [
            {
                q: "Nekusora có các loại vé ưu đãi nào?",
                a: "Nekusora cung cấp vé ưu đãi cho: học sinh / sinh viên (có tiến hành xác minh), trẻ em (cao từ 0,7m đến 1,3m), người cao tuổi (từ 55 tuổi trở lên), và suất chiếu sớm. Thành viên còn được hưởng thêm ưu đãi vào thứ Ba hàng tuần.",
            },
            {
                q: "Mã khuyến mãi áp dụng như thế nào?",
                a: "Tại bước xác nhận đơn hàng, nhập mã khuyến mãi vào ô tương ứng và nhấn 'Áp dụng'. Chiết khấu sẽ được trừ trực tiếp vào tổng hóa đơn. Mỗi đơn chỉ áp dụng một mã khuyến mãi và một lần quy đổi điểm.",
            },
            {
                q: "Tôi có thể dùng đồng thời mã khuyến mãi và điểm thành viên không?",
                a: "Có. Bạn có thể kết hợp mã khuyến mãi và điểm thành viên trong cùng một đơn hàng. Hệ thống sẽ tính chiết khấu từ mã trước, sau đó trừ thêm giá trị điểm quy đổi vào tổng còn lại.",
            },
            {
                q: "Vé đặt qua app có giá khác so với mua trực tiếp tại quầy không?",
                a: "Giá vé cơ bản là như nhau. Tuy nhiên, khi đặt qua app hoặc website, bạn có thể hưởng thêm các ưu đãi liên kết với ví điện tử, ngân hàng đối tác, hoặc mã khuyến mãi độc quyền online mà quầy không áp dụng.",
            },
        ],
    },
    {
        category: "Bắp & Đồ uống",
        items: [
            {
                q: "Tôi có thể đặt bắp nước kèm vé online không?",
                a: "Có. Sau bước chọn ghế, hệ thống sẽ cho phép bạn thêm bắp rang và đồ uống vào đơn. Combo sẽ được chuẩn bị sẵn và bạn chỉ cần nhận tại quầy khi đến rạp, không cần xếp hàng mua riêng.",
            },
            {
                q: "Tôi có thể mang đồ ăn từ bên ngoài vào rạp không?",
                a: "Nekusora không khuyến khích và không hỗ trợ khách hàng mang đồ ăn có mùi hoặc đồ ăn từ nơi khác vào phòng chiếu. Rạp có đa dạng lựa chọn bắp rang, đồ uống và snack tại quầy phục vụ bạn trước và trong suất chiếu.",
            },
        ],
    },
    {
        category: "Quy định tại rạp",
        items: [
            {
                q: "Tôi cần đến rạp trước bao lâu?",
                a: "Nên đến rạp ít nhất 15 phút trước giờ chiếu để soát vé và ổn định chỗ ngồi. Cửa phòng chiếu thường đóng sau khi phim bắt đầu 10 phút và muộn hơn có thể không được vào.",
            },
            {
                q: "Phim được chiếu có phụ đề hay lồng tiếng không?",
                a: "Tùy từng suất chiếu. Thông tin định dạng sẽ được hiển thị rõ khi bạn chọn suất chiếu.",
            },
            {
                q: "Trẻ em có được vào xem phim có giới hạn độ tuổi không?",
                a: "Không. Phim được phân loại theo độ tuổi (P - Phổ biến, T13 - tối thiểu 13 tuổi, T16 - tối thiểu 16 tuổi, T18 - tối thiểu 18 tuổi) và rạp sẽ tiến hành xác minh độ tuổi của bạn qua đối chiếu CCCD. Khán giả chưa đủ tuổi theo phân loại sẽ không được vào phòng chiếu, kể cả khi có người lớn đi cùng.",
            },
            {
                q: "Tôi có thể sử dụng điện thoại trong phòng chiếu không?",
                a: "Vui lòng tắt âm thanh điện thoại và không sử dụng màn hình sáng trong suốt buổi chiếu để không ảnh hưởng đến những người xung quanh. Quay phim hoặc chụp ảnh màn hình trong phòng chiếu là hành vi vi phạm bản quyền và bị nghiêm cấm. Nếu phát hiện, chúng tôi sẽ tiến hành xử lí theo quy định.",
            },
            {
                q: "Rạp có chỗ đậu xe không?",
                a: "Hầu hết các cụm rạp Nekusora đều nằm trong trung tâm thương mại và có bãi giữ xe của tòa nhà. Phí giữ xe tính theo quy định của trung tâm thương mại, không thuộc quản lý của Nekusora Cinema.",
            },
            {
                q: "Còn các quy định nào nữa không?",
                a: "Ngoài các quy định kể trên, khách hàng vui lòng tuân thủ các quy định tại nơi công cộng, giữ gìn văn hóa ứng xử văn minh và lịch sự trong suốt thời gian sử dụng dịch vụ tại rạp. Chúng tôi nghiêm cấm mọi hành vi vi phạm tiêu chuẩn cộng đồng, bao gồm nhưng không giới hạn như: gây mất trật tự, chen lấn, sử dụng ngôn từ kích động, xúc phạm hoặc làm ảnh hưởng đến trải nghiệm xem phim của những người xung quanh, các hành vi riêng tư quá đà, thiếu chuẩn mực hoặc gây phản cảm trong phòng chiếu cũng như khu vực chung. Tuyệt đối nghiêm cấm các hành vi vi phạm pháp luật. Mọi trường hợp cố tình vi phạm sẽ bị từ chối phục vụ, mời ra khỏi rạp ngay lập tức và bàn giao cho cơ quan chức năng xử lý theo đúng quy định của pháp luật.",
            },
        ],
    },
    {
        category: "Hỗ trợ & Liên hệ",
        items: [
            {
                q: "Tôi liên hệ hỗ trợ bằng cách nào?",
                a: "Bạn có thể liên hệ Nekusora Cinema qua: Hotline xxxx xxxx (8:00 - 22:00 mỗi ngày), email support.nekusoracinema@gmail.com, hoặc nhắn tin qua fanpage Facebook / Zalo chính thức của rạp.",
            },
            {
                q: "Tôi muốn tổ chức sự kiện hoặc chiếu phim riêng tại Nekusora có được không?",
                a: "Được. Nekusora Cinema hỗ trợ đặt phòng chiếu riêng cho sự kiện doanh nghiệp, sinh nhật, ra mắt phim và các dịp đặc biệt. Vui lòng liên hệ qua email support.nekusoracinema@gmail.com để được tư vấn và báo giá chi tiết.",
            },
        ],
    },
];

const HelperFAQ = () => {
    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold">Câu hỏi thường gặp</h1>
                <p className="text-base-content/60 text-sm">
                    Tìm nhanh các câu trả lời về đặt vé, tài khoản, ưu đãi và các quy định tại Nekusora Cinema.
                </p>
            </div>

            {FAQ_DATA.map((section) => (
                <div key={section.category}>
                    <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-base font-bold text-primary uppercase tracking-wide">
                            {section.category}
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {section.items.map((item) => (
                            <div
                                key={item.q}
                                className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl"
                            >
                                <input type="checkbox" />
                                <div className="collapse-title font-medium text-sm pr-10">
                                    {item.q}
                                </div>
                                <div className="collapse-content text-sm text-base-content/70 leading-relaxed">
                                    {item.a}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default HelperFAQ;