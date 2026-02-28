# Mood_Tracking

**Version**
node -v: 20.19.x or later

**Git comment**

- git clone https://github.com/Healing-Garden/Mood_Tracking.git
- git add .
- git commit -m "comment"
- git pull origin
- git push origin (branch)

* If don't have personal branch:

- git checkout -b (name)
- git checkout //change branch
- git branch //show branch

**Backend**
Step 1: cd BE

Step 2: install library

- npm init -y
- npm install express mongoose dotenv bcrypt jsonwebtoken cors cookie-parser
- npm install -D nodemon

Step 3: run BE project

- npm run dev

**Frontend**

Step 1: cd frontend

Step 2: install library

- npm install

Step 3:

- npm run dev

**Python**

Step 1: cd Python
Step 2: Open docker
Step 3: pip install -r requirements.txt
Step 4: docker run -d -p 6379:6379 redis:7-alpine
Step 5: docker run -d -p 8001:8000 chromadb/chroma:latest
Step 6: python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
