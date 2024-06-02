#!/bin/bash

dropdb openbook 
createdb openbook
rm -rf prisma/migrations
rm -rf storage
mkdir storage
mkdir storage/public
mkdir storage/private
npx prisma migrate dev --name init > /dev/null 2>&1 
