import sqlite3

def find_all_cookies_matches(cookies_list):
    # Connect to the database
    conn = sqlite3.connect("output.sqlite")
    cursor = conn.cursor()

    # Find all cookies that match with name 
    sql="SELECT * FROM [open-cookie-database] WHERE [Cookie / Data Key name] IN ({seq})".format(
    seq=','.join(['?']*len(cookies_list)))

    cursor.execute(sql, cookies_list)
    cookies_matches = cursor.fetchall()
    print("all matching cookies", cookies_matches)

    # Commit changes and close connection
    conn.commit()
    conn.close()
    return cookies_matches

def extract_cookies_name(data):
    cookie_name_list = []
    for cookie in data:
        cookie_name_list.append(cookie['name'])
    print(cookie_name_list)
    return cookie_name_list


    

