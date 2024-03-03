import requests.packages.urllib3
requests.packages.urllib3.disable_warnings()

import requests as rq
import logging, time, sys, re, os
logger = logging.getLogger()



def getExecutableRoot():
    if getattr(sys, "frozen", False): return os.path.dirname(sys.executable)
    else: return os.path.dirname(os.path.abspath(sys.modules["__main__"].__file__))



class BinaryTempFile:
    def __init__(self, tempPath, realPath, mode):
        self.tempPath = tempPath
        self.realPath = realPath
        self.mode = mode
        self.file = None

    def __enter__(self):
        self.file = open(self.tempPath, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        if(self.file is not None): self.file.close()
        self.file = None
        if(os.path.exists(self.realPath)): os.remove(self.realPath)
        os.rename(self.tempPath, self.realPath)



class AbstractUpdater:
    __url_base__ = None
    __target_dir__ = getExecutableRoot()
    __project_name__ = None

    def __new__(cls, projectName, cloudURL):
        if hasattr(cls, "_instance"): return cls._instance
        cls._instance = object.__new__(cls)
        cls._instance.__url_base__ = cloudURL
        cls._instance.__project_name__ = projectName
        return cls._instance

    def preProcess(self): pass

    def sufProcess(self): pass

    def estimateRemainingTime(self, ready_size, total_size, time_passed): 
        return time_passed / (ready_size+1) * (total_size-ready_size)

    def iterate(self, generator, progressCallback=None, status_prefix="", status_suffix=""):
        if(progressCallback is None): progressCallback = (lambda status=None,progress=None:0)
        start_time = time.time()
        for completed, ready_size, total_size in generator:
            if(not total_size): return False
            estimation = self.estimateRemainingTime(ready_size, total_size, time.time()-start_time)
            timeString = f"[ 剩餘時間 {int(estimation/60):>2}分{int(estimation%60):>2}秒 ]"
            status = f"{status_prefix} {timeString} {status_suffix}"
            progressCallback(status=status, progress=round((ready_size/total_size)*100))
            if(completed): break
        return True

    def updateByStep(self, realFilePath, downloadVersionEndpoint):
        try:
            tempFilePath = os.path.join(self.__target_dir__, f"{self.__project_name__}-{int(time.time())}.tmp")

            stream = rq.get(f"{self.__url_base__}/Download/{downloadVersionEndpoint}", verify=False, stream=True)

            total_size = int(stream.headers.get("Content-Length", 0))
            chunk_size = 4096
            ready_size = 0

            yield False, ready_size, total_size

            for file in os.listdir(self.__target_dir__):
                if not os.path.isfile(file): continue
                if not re.match(fr"^{self.__project_name__}.*\.(bin|tmp)$", file): continue
                os.remove(os.path.join(self.__target_dir__, file))

            self.preProcess()

            with BinaryTempFile(tempFilePath, realFilePath, "wb") as f:
                for data in stream.iter_content(chunk_size=chunk_size):
                    f.write(data)
                    ready_size += len(data)
                    yield False, ready_size, total_size

            self.sufProcess()
            yield True, ready_size, total_size
        except Exception as e: 
            logger.error(e)
            os._exit(0)



class MainUpdater(AbstractUpdater):
    def preProcess(self):
        for file in os.listdir(self.__target_dir__):
            if not os.path.isfile(file): continue
            if not re.match(fr"^{self.__project_name__}-([0-9]+\.)+exe$", file): continue
            os.remove(os.path.join(self.__target_dir__, file))

    def checkForUpdate(self, progressCallback=None):
        version = rq.get(f"{self.__url_base__}/Version", verify=False).json().get("latest", "")
        if(not version): return ""
        realFilePath = os.path.join(self.__target_dir__, f"{self.__project_name__}-{version}.exe")
        if(os.path.exists(realFilePath)): return realFilePath
        generator = self.updateByStep(realFilePath, "Latest")
        success = self.iterate(generator, progressCallback=progressCallback, status_prefix="正在下載更新檔 . . .")
        return (realFilePath if(success)else "")



class LauncherUpdater(AbstractUpdater):
    def checkForUpdate(self, progressCallback=None):
        realFilePath = os.path.join(self.__target_dir__, f"{self.__project_name__}-Launcher.exe")
        generator = self.updateByStep(realFilePath, "Launcher")
        success = self.iterate(generator, progressCallback=progressCallback, status_prefix="正在更新啟動器 . . .")
        return (realFilePath if(success)else "")