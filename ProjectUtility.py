import requests as rq
import importlib, random, ctypes, sys, os
user32 = ctypes.WinDLL("user32", use_last_error=True)
user32.SetProcessDPIAware()

PROJECT_NAME = "LeagueAssistant"

LOL_GAME_PROCESS_NAME = "League of Legends.exe"

LOCAL_HOST = "127.0.0.1"
HTTPS = "https://"
HTTP = "http://"

APP_USER_MODEL_ID = f"{PROJECT_NAME}.App.User.Model.Id"
ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_USER_MODEL_ID)

CLOUD_SERVER = f"https://www.leefuuchang.in/projects/{PROJECT_NAME}"
STORAGE_SERVER = f"https://www.leefuuchang.in/projects/{PROJECT_NAME}/Storage"


def runAdmin(path, argstring):
    return ctypes.windll.shell32.ShellExecuteW(None, "runas", path, argstring, None, 1)


def ensureAdmin():
    try: isAdmin = ctypes.windll.shell32.IsUserAnAdmin()
    except: isAdmin = False
    if isAdmin or sys.argv[0].endswith(".py"): return True
    return sys.exit(runAdmin(sys.executable, " ".join(sys.argv)))


def getExecutableRoot():
    if getattr(sys, "frozen", False): return os.path.dirname(sys.executable)
    else: return os.path.dirname(os.path.abspath(sys.modules["__main__"].__file__))


def randomUserAgent():
    return random.choice([
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; WOW64) Gecko/20100101 Firefox/61.0",
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36",
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36",
        "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)",
        "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10.5; en-US; rv:1.9.2.15) Gecko/20110303 Firefox/3.6.15"
    ])


def getDLL(name, tries=10):
    # print("DLL", name, name in sys.modules)
    if(name in sys.modules): return sys.modules[name]
    root = getExecutableRoot()
    if(root not in sys.path): sys.path.append(root)
    path = os.path.join(root, f"{name}.pyd")
    for file in os.listdir(root):
        fname, fext = os.path.splitext(file)
        if(fname != name or fext.endswith("py")): continue
        try: os.remove(os.path.join(root, file))
        except Exception as e: continue
    for t in range(tries):
        print(f"DLL Installing {name} (tries:{t})")
        try: 
            res = rq.get(f"{STORAGE_SERVER}/{name}.pyd", headers={"User-Agent": randomUserAgent()})
            with open(path, "wb") as f: f.write(res.content)
        except Exception as e: continue
        break
    if(os.path.exists(path)): sys.modules[name] = importlib.import_module(name)
    return sys.modules.get(name, None)