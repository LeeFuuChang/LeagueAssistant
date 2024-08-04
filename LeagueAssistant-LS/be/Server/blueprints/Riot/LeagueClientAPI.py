import requests as rq
import json as JSON
import logging
import socket
import psutil
import os

os.environ["RIOT_AUTH_PORT_0"] = ""
os.environ["RIOT_AUTH_PORT_1"] = ""
os.environ["RIOT_AUTH_TOKEN_0"] = ""
os.environ["RIOT_AUTH_TOKEN_1"] = ""
os.environ["LOL_INSTALL_DIRECTORY"] = ""

class LeagueClientAPI:
    @staticmethod
    def ping(host, port, timeout=2):
        sock = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        sock.settimeout(timeout)
        try: sock.connect((host, port))
        except: return False
        else: return sock.close() is None

    @staticmethod
    def updateRiotAuth():
        os.environ["RIOT_AUTH_PORT_0"] = ""
        os.environ["RIOT_AUTH_PORT_1"] = ""
        os.environ["RIOT_AUTH_TOKEN_0"] = ""
        os.environ["RIOT_AUTH_TOKEN_1"] = ""
        os.environ["LOL_INSTALL_DIRECTORY"] = ""
        try:
            for proc in psutil.process_iter():
                try:
                    if(proc.name().strip() != os.environ["LOL_CLIENT_PROCESS_NAME"]): continue
                except: continue
                for segment in proc.cmdline():
                    if "--app-port" in segment:
                        os.environ["RIOT_AUTH_PORT_0"] = segment.split("=")[1]
                    if "--riotclient-app-port" in segment:
                        os.environ["RIOT_AUTH_PORT_1"] = segment.split("=")[1]
                    if "--remoting-auth-token" in segment:
                        os.environ["RIOT_AUTH_TOKEN_0"] = segment.split("=")[1]
                    if "--riotclient-auth-token" in segment:
                        os.environ["RIOT_AUTH_TOKEN_1"] = segment.split("=")[1]
                    if "--install-directory" in segment:
                        os.environ["LOL_INSTALL_DIRECTORY"] = segment.split("=")[1]
                logging.info(f"API_AUTH_0: {os.environ['RIOT_AUTH_PORT_0']} {os.environ['RIOT_AUTH_TOKEN_0']}")
                logging.info(f"API_AUTH_1: {os.environ['RIOT_AUTH_PORT_1']} {os.environ['RIOT_AUTH_TOKEN_1']}")
                logging.info(f"LOL_FOLDER: {os.environ['LOL_INSTALL_DIRECTORY']}")
        except Exception as e:
            logging.error(f"Error updateRiotAuth: {e}")
        finally:
            if(not (
                os.environ["RIOT_AUTH_PORT_0"] and
                os.environ["RIOT_AUTH_PORT_1"] and
                os.environ["RIOT_AUTH_TOKEN_0"] and
                os.environ["RIOT_AUTH_TOKEN_1"] and
                os.environ["LOL_INSTALL_DIRECTORY"]
            )): return False
            else: return True

    @classmethod
    def isRiotAuthValid(cls, authId=None, retry=0, maxRetries=3):
        if(retry == maxRetries): return False
        if(authId is None): return (
            cls.isRiotAuthValid(0, retry, maxRetries)
            and
            cls.isRiotAuthValid(1, retry, maxRetries)
        )
        AuthPort = os.environ.get(f"RIOT_AUTH_PORT_{authId}", None)
        AuthToken = os.environ.get(f"RIOT_AUTH_TOKEN_{authId}", None)
        if not (AuthPort and AuthToken and cls.ping("127.0.0.1", int(AuthPort), 2)):
            cls.updateRiotAuth()
            return cls.isRiotAuthValid(authId, retry+1, maxRetries)
        return True

    @classmethod
    def send(cls, method, authId, route, params=None, data=None, json=None):
        if(not cls.isRiotAuthValid(authId, 0, 3)): return {
            "success": False, 
            "reason": f"RIOT_AUTH_{authId}_INVALID",
            "response": {}
        }
        AuthPort = os.environ[f"RIOT_AUTH_PORT_{authId}"]
        AuthToken = os.environ[f"RIOT_AUTH_TOKEN_{authId}"]
        response = ""
        try:
            res = method(
                f"https://127.0.0.1:{AuthPort}/{route}", 
                params=params, 
                data=data,
                json=json,
                auth=("riot", AuthToken), 
                verify=False,
            )
            response = (res.json() if(res.text)else res.text)
            if("errorCode" in res.text or "errorCode" in response): 
                return {
                    "success": False, 
                    "reason": "ERROR_CODE_IN_RESPONSE", 
                    "response": response
                }
            return {
                "success":True, 
                "reason": "SUCCESS", 
                "response": response
            }
        except Exception as e:
            return {
                "success": False, 
                "reason": f"EXCEPTION:{str(e)}", 
                "response": response
            }

    @classmethod
    def get(cls, authId, route, payload={}):
        return cls.send(rq.get, authId, route, params=payload)

    @classmethod
    def post(cls, authId, route, payload={}):
        response = cls.send(rq.post, authId, route, data=JSON.dumps(payload))
        if(response["success"]): return response
        return cls.send(rq.post, authId, route, data=payload)

    @classmethod
    def delete(cls, authId, route, payload={}):
        response = cls.send(rq.delete, authId, route, data=JSON.dumps(payload))
        if(response["success"]): return response
        return cls.send(rq.delete, authId, route, data=payload)

    @classmethod
    def patch(cls, authId, route, payload={}):
        response = cls.send(rq.patch, authId, route, data=JSON.dumps(payload))
        if(response["success"]): return response
        return cls.send(rq.patch, authId, route, data=payload)