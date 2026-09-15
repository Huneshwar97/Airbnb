npm init -y
npm i -D typescript@5.9.3 tsx@4.23.13 @types/node@24.13.4 @types/express@5.0.6
npx tsc --init
npm i express@5.2.1 dotenv@17.4.2
npm i -D prisma@6.19.3
npm i @prisma/client@6.19.3
npx prisma init --datasource-provider mysql 
npx prisma generate
npx prisma migrate dev --name init





------------------------git--------------------
git init
git remote add origin https://github.com/Huneshwar97/Airbnb.git
haman-yadav@LAPTOP-HNT6IKPV ~/project/Airbnb (master)$ git remote -v
origin  https://github.com/Huneshwar97/Airbnb.git (fetch)
origin  https://github.com/Huneshwar97/Airbnb.git (push)


----------DB issue----------------
sudo mysql

CREATE USER 'booking_app'@'localhost' IDENTIFIED BY 'Mysql123Secure'; GRANT ALL PRIVILEGES ON airbnb_booking_dev.* TO 'booking_app'@'localhost'; GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON *.* TO 'booking_app'@'localhost'; FLUSH PRIVILEGES;

------ version clash----------
Confirmed twice now: TS7 crashes ts-node (moot since we use tsx instead), but real `tsc` type-checking on this project's actual dependencies (redlock, ioredis) also throws new errors under TS7 that don't exist under 5.9.3. tsx itself works with either version — it never touches the typescript package — but the pin is still needed for `npm run build`.


inned to the latest 6.x line, not 7.x/8.x — Prisma 7 needs a separate prisma.config.ts and mandatory custom output path; not worth the migration risk here.