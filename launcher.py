from PyQt5.QtWidgets import QApplication

import time, sys, os
setattr(sys, "kwargs", {k:v for k,v in [arg.split("=") for arg in sys.argv if "=" in arg]})
sys.kwargs["--mode"] = sys.kwargs.get("--mode", "RELEASE").upper()

from AbstractLoadingRenderer import AbstractLoadingWindow
from ProjectUtility import PROJECT_NAME, CLOUD_SERVER, STORAGE_SERVER, runAdmin, ensureAdmin, getDLL
MainUpdater = getattr(getDLL("VersionManager"), "MainUpdater")


class LauncherWindow(AbstractLoadingWindow):
    def __init__(self):
        super(self.__class__, self).__init__()
        self.loadingFunctions = [self.setupLocalStorage, self.checkUpdate]

    def setupLocalStorage(self):
        StorageManager = getDLL("StorageManager")
        LocalStorage = getattr(StorageManager, "LocalStorage")
        self.updateLoadingStatus(status="正在更新本地檔案 . . .", progress=0)
        return LocalStorage(STORAGE_SERVER, PROJECT_NAME).setup(progressCallback=self.updateLoadingStatus)

    def checkUpdate(self):
        try:
            self.updateLoadingStatus(status="正在檢查版本更新 . . .", progress=0)
            path = MainUpdater(PROJECT_NAME, CLOUD_SERVER).checkForUpdate(progressCallback=self.updateLoadingStatus)
            if(not os.path.exists(path)): return False
            self.updateLoadingStatus(status="已更新至最新版本 . . .", progress=100)
            time.sleep(3)
            runAdmin(path, " ".join([f"{k}={v}" for k,v in sys.kwargs.items()]))
            return True
        except Exception as e: return False


def main():
    app = QApplication([*sys.argv, "--ignore-gpu-blacklist"])
    launcherWindow = LauncherWindow()
    launcherWindow.show()
    launcherWindow.startLoading()
    sys.exit(app.exec_())
if __name__ == "__main__" and ensureAdmin(): main()