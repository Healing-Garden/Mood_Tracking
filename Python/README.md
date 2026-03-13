---
title: Mood Tracking Mental Health AI
emoji: 🧠
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Mood Tracking AI Module

Python module cho xử lý AI/ML trong dự án Mood Tracking.

## 📋 Cấu trúc Project

```
AI/
├── src/
│   ├── models/          # Các ML models
│   ├── utils/           # Utility functions
│   ├── api/             # API endpoints
│   └── __init__.py
├── data/                # Dữ liệu training/testing
├── notebooks/           # Jupyter notebooks cho analysis
├── requirements.txt     # Dependencies
├── main.py              # Entry point
└── README.md
```

## 🚀 Hướng dẫn cài đặt

### 1. Tạo Virtual Environment

```bash
cd AI
python -m venv venv
```

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 2. Cài đặt Dependencies

```bash
pip install -r requirements.txt
```

### 3. Chạy Project

```bash
python main.py
```

## 📦 Libraries chính

- **numpy, pandas**: Data processing
- **scikit-learn**: Machine Learning
- **tensorflow**: Deep Learning
- **matplotlib, seaborn**: Data visualization
- **flask**: Web API
- **requests**: HTTP requests

## 📝 Các bước tiếp theo

1. Chuẩn bị dữ liệu training
2. Phát triển models
3. Tạo API endpoints
4. Tích hợp với backend (BE)
