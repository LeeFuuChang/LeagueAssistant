import importlib, sys
setattr(sys, "kwargs", {k:v for k,v in [arg.split("=") for arg in sys.argv if "=" in arg]})
sys.kwargs["--mode"] = sys.kwargs.get("--mode", "RELEASE").upper()

from ProjectUtility import PROJECT_NAME, STORAGE_SERVER, ensureAdmin, getDLL

def main():
    LocalStorage = getattr(getDLL("StorageManager"), "LocalStorage", None)
    sys.path.append(LocalStorage(STORAGE_SERVER, PROJECT_NAME).path("be"))
    sys.modules["app"] = importlib.import_module("app")
    sys.modules["app"].run()
if __name__ == "__main__" and ensureAdmin(): main()