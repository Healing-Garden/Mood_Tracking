# Hướng dẫn Triển khai Module Python (AI Service)

Tài liệu này cung cấp hướng dẫn chi tiết để triển khai module AI trong thư mục `Python`. Module này đã được tối ưu hóa Docker để build nhanh hơn và tiết kiệm tài nguyên trên Cloud.

---

## 🚀 1. Tối ưu hóa Docker (Đã thực hiện)

Chúng tôi đã cập nhật `Dockerfile` với các kỹ thuật:
*   **Multi-stage Build**: Tách biệt quá trình build (cần compiler) và quá trình chạy (runtime), giúp giảm dung lượng image đáng kể.
*   **Pip Cache**: Sử dụng `--mount=type=cache` để lưu lại các gói thư viện đã tải, giúp build lại cực nhanh.
*   **Non-root User**: Chạy ứng dụng dưới quyền user `appuser` để tăng tính bảo mật.

---

## 💻 2. Cách chạy Local (Development)

### Yêu cầu
*   Python 3.10+
*   MongoDB, Redis, ChromaDB (Có thể chạy bằng Docker)

### Các bước thực hiện
1.  **Tạo môi trường ảo:**
    ```bash
    python -m venv venv
    venv\Scripts\activate  # Windows
    source venv/bin/activate  # Linux/macOS
    ```
2.  **Cài đặt thư viện:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Cấu hình biến môi trường:**
    *   Mở file `.env` và điền đầy đủ `OPENAI_API_KEY`, `GEMINI_API_KEY`, `MONGODB_URI`.
4.  **Chạy ứng dụng:**
    ```bash
    python src/main.py
    ```
    Ứng dụng sẽ chạy tại `http://localhost:8000`. Xem tài liệu API tại `/docs`.

---

## 🐳 3. Cách chạy bằng Docker Compose

Đây là cách tốt nhất để chạy toàn bộ stack công nghệ một cách đồng bộ.

```bash
docker-compose up -d --build
```
*   **AI Service**: `http://localhost:8000`
*   **Redis**: `localhost:6379`
*   **ChromaDB**: `localhost:8001` (Mapping từ port 8000 của container)

---

## ☁️ 4. Triển khai lên Cloud (Railway/VPS)

### Lưu ý về Tài nguyên (Resource Consumption)
Dựa trên phân tích, module này có các thành phần tiêu tốn tài nguyên sau:
1.  **PyTorch & Transformers**: Rất tốn RAM (~1-2GB). Nếu RAM trên Cloud thấp (< 2GB), hệ thống có khả năng bị OOM (Out Of Memory).
2.  **ChromaDB**: Lưu trữ vector trong RAM. Càng nhiều dữ liệu, RAM càng tăng.
3.  **Prophet**: Tiêu tốn CPU khi tính toán dự báo (Inference).

### Các bước Deploy (Railway)
1.  Kết nối GitHub repo chứa thư mục `Python`.
2.  Railway sẽ tự động nhận diện `Dockerfile`.
3.  **Thiết lập biến môi trường**: Copy toàn bộ nội dung từ `.env` vào tab **Variables** trên Railway.
4.  **Health Check**: Đường dẫn `/health` đã được cấu hình trong Dockerfile để Railway kiểm tra trạng thái sống của app.

---

## ✅ Kiểm tra sau khi Deploy
1.  **Swagger UI**: `https://your-app-url.up.railway.app/docs`
2.  **Health**: `https://your-app-url.up.railway.app/health` - Phải trả về `{"status": "healthy"}`.
