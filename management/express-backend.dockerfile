FROM node:20-alpine

COPY /express-backend /express-backend
WORKDIR /express-backend
RUN npm install
# https://github.com/kelektiv/node.bcrypt.js/issues/528#issuecomment-1187658714
RUN apk --no-cache add --virtual builds-dependencies build-base python3 make && npm i bcrypt && npm rebuild bcrypt --build-from-source 
RUN npm uninstall express-fileupload
CMD npx prisma generate && npx prisma migrate deploy && node ./src/index.js