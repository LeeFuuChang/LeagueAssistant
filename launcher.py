from LoadingWindow import AbstractLoadingWindow

import urllib3
urllib3.disable_warnings()

import requests as rq
import time, sys, os, re
setattr(sys, "kwargs", {k:v for k,v in [arg.split("=") for arg in sys.argv if "=" in arg]})
sys.kwargs["--mode"] = sys.kwargs.get("--mode", "RELEASE").upper()

from ProjectUtility import PROJECT_NAME, CLOUD_SERVER, STORAGE_SERVER
from ProjectUtility import getExecutableRoot, getPackage, downloadFileByStep, ensureAdmin, runAdmin
LocalStorage = getattr(getPackage("StorageManager"), "LocalStorage")(STORAGE_SERVER, PROJECT_NAME)



def updateMainProgram(progressCallback):
    version = rq.get(f"{CLOUD_SERVER}/Version", verify=False).json().get("latest", "")
    if(not version): return ""

    targetFolder = getExecutableRoot()
    tempFilePath = os.path.join(targetFolder, f"{PROJECT_NAME}-{int(time.time())}.tmp")
    realFilePath = os.path.join(targetFolder, f"{PROJECT_NAME}-{version}.exe")
    if(os.path.exists(realFilePath)): return realFilePath

    for file in os.listdir(targetFolder):
        if not os.path.isfile(file): continue
        if not re.match(fr"^{PROJECT_NAME}-([0-9]+\.)+exe$", file): continue
        os.remove(os.path.join(targetFolder, file))

    fileStream = rq.get(f"{CLOUD_SERVER}/Download/Latest", verify=False, stream=True)
    for completed, ready_size, total_size, time_passed in downloadFileByStep(tempFilePath, realFilePath, fileStream):
        if(not total_size): return ""
        if(completed): return realFilePath

        estimation = time_passed / (ready_size+1) * (total_size-ready_size)
        timeString = f"Updating . . . [ Estimated time remaining: {int(estimation/60):>2}m {int(estimation%60):>2}s ]"
        progressCallback(timeString, round((ready_size/total_size)*100))

    return ""



def runMainProgram():
    targetFolder = getExecutableRoot()

    matchedFiles = []

    for file in os.listdir(targetFolder):
        if not os.path.isfile(file): continue
        if not re.match(fr"^{PROJECT_NAME}-([0-9]+\.)+exe$", file): continue
        matchedFiles.append(file)
        os.remove(os.path.join(targetFolder, file))

    matchedFiles.sort(key=lambda f:[int(n) for n in f.replace(f"ABC-", "").split(".")[:-1]], reverse=True)

    runAdmin(os.path.join(targetFolder, matchedFiles[0]), [f"{k}={v}" for k,v in sys.kwargs.items()])



def updateLoaderStatus(loader:AbstractLoadingWindow, text, progress):
    loader.text = text
    loader.progress = progress



def main():
    loader = AbstractLoadingWindow()
    loader.setTasks([
        lambda : updateLoaderStatus("", 0),
        lambda : LocalStorage.setup(lambda t,p : updateLoaderStatus(loader, t, p)),
        lambda : updateLoaderStatus("", 0),
        lambda : updateMainProgram(lambda t,p : updateLoaderStatus(loader, t, p)),
        runMainProgram,
    ])
    loader.exec_()
if __name__ == "__main__" and ensureAdmin(): main()
