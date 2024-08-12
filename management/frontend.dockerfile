FROM node:20-alpine

COPY frontend /frontend
WORKDIR /frontend
RUN npm install
CMD npm run build
