@echo off
cd ./global-cookie-databases
python -m venv venv
call venv\Scripts\activate
pip install -r ./requirements.txt

cd ../crawler-cmp
python -m venv venv
call venv\Scripts\activate
pip install -r ./requirements.txt