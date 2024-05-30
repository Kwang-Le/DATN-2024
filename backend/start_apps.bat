@echo off
cd ./global-cookie-databases
call .venv\Scripts\activate
start cmd /k flask --app global_cookie_db_app.py run

cd ../crawler-cmp
call .venv\Scripts\activate
start cmd /k flask --app cmp_app.py run --port 5001

