import redis
import os
from dotenv import load_dotenv

# Load local .env
load_dotenv()

def migrate():
    # Cấu hình nguồn (Local Redis)
    source_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Cấu hình đích (Upstash Redis)
    target_url = input("Nhập URL Redis Upstash (có dạng rediss://...): ").strip()
    
    if not target_url:
        print("Lỗi: Bạn chưa nhập URL đích!")
        return

    try:
        source_client = redis.from_url(source_url)
        target_client = redis.from_url(target_url)
        
        source_client.ping()
        print(f"--- Đã kết nối nguồn: {source_url}")
        target_client.ping()
        print(f"--- Đã kết nối đích: Upstash")

        keys = list(source_client.scan_iter("*"))
        total = len(keys)
        print(f"Tìm thấy {total} keys. Đang bắt đầu di chuyển...")

        for i, key in enumerate(keys):
            ttl = source_client.ttl(key)
            value = source_client.dump(key)
            
            if value:
                try:
                    target_client.delete(key)
                    target_client.restore(key, 0 if ttl <= 0 else ttl * 1000, value)
                except Exception as e:
                    print(f"Lỗi khi chuyển key {key}: {e}")
            
            if (i + 1) % 10 == 0 or (i + 1) == total:
                print(f"Đã chuyển: {i + 1}/{total}")

        print("\nHoàn tất di chuyển dữ liệu Redis!")

    except Exception as e:
        print(f"Lỗi: {e}")

if __name__ == "__main__":
    migrate()
