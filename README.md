# FX Bulletin Studio

Ứng dụng chạy hoàn toàn trên máy để biến file Excel **FX MARKET BULLETIN** thành bản tin ngoại hối theo phong cách VietinBank.

## Dùng ngay trên web

[Mở FX Bulletin Studio](https://fx-bulletin-studio-nguyen-xuan-tung.hasagi0908.chatgpt.site)

Link public này không yêu cầu đăng nhập. File Excel vẫn được đọc và xử lý trực tiếp trong trình duyệt của người dùng.

## Lần đầu sử dụng

1. Mở thư mục `fx-bulletin-generator`.
2. Double-click file `start-app.bat`.
3. Giữ cửa sổ màu đen đang chạy; trình duyệt sẽ tự mở tại `http://localhost:3000`.

Nếu máy chưa có thư viện cần thiết, lần chạy đầu có thể mất vài phút. Các lần sau sẽ nhanh hơn.

## Công việc hằng ngày

1. Cập nhật và lưu file Excel theo template hiện tại.
2. Double-click `start-app.bat` nếu ứng dụng chưa chạy.
3. Kéo thả file Excel vào app hoặc bấm **Upload Excel**.
4. Kiểm tra Preview và các ghi chú (nếu có).
5. Bấm **Export PDF**. Bản tin được dàn thành **một trang A3 dọc**; trong hộp thoại in, chọn **Save as PDF** và bật **Background graphics** để giữ nền xanh đầy đủ.
6. Hoặc dùng Chrome **Capture full-size screenshot** để chụp toàn bộ `bulletin-container`.

## Các nút trên Preview

- **Upload New Excel**: quay lại để chọn file khác.
- **Refresh**: đọc lại file vừa chọn.
- **Full Screen**: mở chế độ toàn màn hình.
- **Print**: mở hộp thoại in.
- **Export PDF**: mở chế độ in tối ưu cho lưu PDF; toolbar sẽ tự ẩn.

## Dữ liệu và quyền riêng tư

- File Excel được đọc trực tiếp trong trình duyệt.
- App không gửi workbook lên máy chủ hoặc dịch vụ bên ngoài.
- Nội dung Excel được giữ nguyên; app chỉ đọc, format và hiển thị.

## Cấu trúc Excel được hỗ trợ

Parser ưu tiên nhận diện theo heading/anchor thay vì số dòng cố định, gồm:

- HIGHLIGHTED NEWS OF THE DAY
- Today’s Event Calendar
- Market Highlights
- Quick Assessment
- CURRENCIES
- COMMODITIES
- Domestic Market: USD/VND
- Detailed Analysis (kể cả nội dung nằm trong Excel text box)
- RECOMMENDATIONS
- RECOMMENDED USE OF INFORMATION

Nếu thiếu section, app vẫn tạo Preview từ phần còn lại và hiển thị cảnh báo dễ hiểu.

## Dành cho người bảo trì

```powershell
pnpm install
pnpm dev
pnpm build
```

Tech stack: React, TypeScript, Vinext/Vite, SheetJS, JSZip và Lucide Icons.
