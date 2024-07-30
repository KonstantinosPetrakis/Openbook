# Openbook

## Overview
An open source toy social media platform built with React and 2 identical backends, one in Django Ninja and one in Express.js.

<img src="docs/register.png" width="300px">
<img src="docs/login.png" width="300px">
<img src="docs/profile.png" width="300px">
<img src="docs/notifications.png" width="300px">
<img src="docs/search.png" width="300px">
<img src="docs/post.png" width="300px">
<img src="docs/chat.png" width="300px">

## Development install
### Frontend
```bash
cd frontend
cp .env.example .env # set VITE_BACKEND_TYPE to either 'python or 'node'
npm install
npm run dev
```

### Database
Setup an empty PostgreSQL database.

### Django backend
```bash
cd django-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Fill database credentials
python manage.py migrate
python manage.py runserver
python manage.py test # Optional (in a separate terminal)
```

### Express backend
```bash
cd express-backend
npm install
cp .env.example .env # Fill database credentials
npx prisma migrate dev --name init 
npm run dev
npm run test # Optional (in a separate terminal)
```

## TODO
- [ ] Add docker-compose for easier setup