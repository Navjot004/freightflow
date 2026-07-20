import requests

# 1. Login
login_data = {
    "username": "Test1@gmail.com",
    "password": "Password123!" # guessing the password
}
res = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
if res.status_code != 200:
    print("Login failed:", res.text)
else:
    token = res.json()["access_token"]
    # 2. Get HOS summary
    headers = {"Authorization": f"Bearer {token}"}
    res2 = requests.get("http://localhost:8000/api/v1/drivers/me/hos/summary", headers=headers)
    print("HOS Status Code:", res2.status_code)
    print("HOS Response:", res2.text)
