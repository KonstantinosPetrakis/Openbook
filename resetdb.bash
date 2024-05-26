#!/bin/bash

dropdb openbook 
createdb openbook
rm -rf prisma/migrations
rm -rf storage/public
mkdir storage/public
npx prisma migrate dev --name init > /dev/null 2>&1 
