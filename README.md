## Lý do dự án này mạnh mẽ 

- Những gì đã áp dụng được, xây dựng hyper recommend không dùng mô hình
- Thiết kế một công cụ đề xuất có tính xác định (không sử dụng runtime LLM):
- Kết hợp 2 luồng hành vi: sự kiện `bookVariant` + sự kiện `order`
- Chuẩn hóa thành `bookVariantId`
- Mở rộng các ứng viên bằng biểu đồ mua kèm từ `order_items`

- Trọng tâm kỹ thuật:
- Xếp hạng có thể giải thích được (`scoreEvent` + suy giảm theo thời gian)

- Luồng xử lý lỗi nhanh cho người dùng có tín hiệu thấp
- Giá trị kinh doanh:
- Đề xuất cá nhân hóa dựa trên ý định thực tế (xem/giỏ hàng + thanh toán)