from ProjectUtility import PROJECT_NAME, HTTPS, LOCAL_HOST, STORAGE_SERVER, getDLL

import requests.packages.urllib3
requests.packages.urllib3.disable_warnings()

import requests as rq
import os

class LiveClientAPI:
    url = f"{HTTPS}{LOCAL_HOST}:2999/liveclientdata/"

    @classmethod
    def get(cls, endpoint, payload={}):
        StorageManager = getDLL("StorageManager")
        LocalStorage = getattr(StorageManager, "LocalStorage")
        data = {"success": False}
        response = ""
        try:
            path = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(os.path.join("auth", "riot.pem"))
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