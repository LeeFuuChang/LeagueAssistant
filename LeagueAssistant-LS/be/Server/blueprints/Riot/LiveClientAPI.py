import requests as rq
import sys
import os

class LiveClientAPI:
    url = f"https://127.0.0.1:2999/liveclientdata/"

    @classmethod
    def get(cls, endpoint, payload={}):
        LocalStorage = getattr(sys.modules["StorageManager"], "LocalStorage")
        data = {"success": False}
        response = ""
        try:
            path = LocalStorage.path(os.path.join("auth", "riot.pem"))
            response = rq.get(cls.url+endpoint, params=payload, verify=path).json()
            if("errorCode" in response): 
                data = {
                    "success": False, 
                    "reason": "ERROR_CODE_IN_RESPONSE", 
                    "response": response
                }
            else: 
                data = {
                    "success":True, 
                    "reason": "SUCCESS", 
                    "response": response
                }
        except Exception as e:
            data = {
                "success": False, 
                "reason": f"EXCEPTION:{str(e)}", 
                "response": response
            }
        finally: return data
