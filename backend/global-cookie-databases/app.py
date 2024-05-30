from flask import Flask, request, jsonify
import json

import requests
from util import extract_cookies_name, find_all_cookies_matches
from checkcmp import run_reachability_check
app = Flask(__name__)


@app.route("/", methods=['POST'])
def check_cookies():
    data = request.json
    # data = json.loads(request.json)
    cookie_name_list = extract_cookies_name(data)
    cookies_matches = find_all_cookies_matches(cookie_name_list)
    print(data)
    return jsonify({'success': True, 'data': cookies_matches})


@app.route("/cmp", methods=['POST'])
def check_cmp():
    data = request.json
    print(data)
    # data = json.loads(request.json)
    url, check_result = run_reachability_check(data)
    print("result", check_result)
    if check_result is not None:
        response = requests.post(
            "http://127.0.0.1:5001/scraper", json={"url": url, "cmp_type": check_result})
        pass
    return jsonify({'success': check_result})
