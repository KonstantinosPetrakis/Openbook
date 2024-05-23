#!/bin/bash

dropdb openbook 
createdb openbook
rm -rf prisma/migrations
npx prisma migrate dev --name init > /dev/null 2>&1 
