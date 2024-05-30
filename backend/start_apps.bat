@echo off
cd ./global-cookie-databases
call .venv\Scripts\activate
start cmd /k flask --app app.py run

cd ../crawler-cmp
call .venv\Scripts\activate
start cmd /k flask --app test run --port 5001

