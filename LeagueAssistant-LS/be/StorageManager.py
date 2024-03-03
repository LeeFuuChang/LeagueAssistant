import requests.packages.urllib3
requests.packages.urllib3.disable_warnings()

import xml.etree.ElementTree as ET
import requests as rq
import logging, shutil, time, sys, os, re
logger = logging.getLogger()


def getExecutableRoot():
    if getattr(sys, "frozen", False): return os.path.dirname(sys.executable)
    else: return os.path.dirname(os.path.abspath(sys.modules["__main__"].__file__))


class LocalStorage:
    __url_base__ = None
    __app_root__ = None
    __exe_root__ = getExecutableRoot()


    def __new__(cls, storageURL, projectName="LeagueAssistant"):
        """
        description
            get an instance of the class, if haven't created, create one then return it
        return
            LocalStorage:
            >> an instance of LocalStorage
        """
        if hasattr(cls, "_instance"): return cls._instance
        cls._instance = object.__new__(cls)
        cls._instance.__url_base__ = storageURL
        cls._instance.__app_root__ = os.path.join(cls.__exe_root__, f"{projectName}-LS")
        return cls._instance


    def updateFile(self, _path, _name, _type):
        fileName = f"{_name}.{_type}"
        targetPath = os.path.join(self.__app_root__, _path, fileName)
        sourcePath = os.path.join(self.__url_base__, _path, f"{_name}.{_type}")
        fileFailed = True
        try:
            response = rq.get(sourcePath.replace("\\", "/"), verify=False)
            if(response.status_code//100 == 2):
                fileFailed = False
                os.makedirs(os.path.dirname(targetPath), exist_ok=True)
                with open(targetPath, "wb") as f: f.write(response.content)
            else: logger.info(f"LS-Update failed on {(_path, _name, _type)} {response}")
        except Exception as e: logger.error(f"LS-Update error on {(_path, _name, _type)} {e}")
        if(fileFailed and os.path.exists(targetPath)): os.remove(targetPath)


    def setup(self, f_type:str="^.+$", progressCallback=lambda status=None,progress=None:0) -> str:
        """
        description
            construct local storage file structure base on `./struct.xml`
        params
            f_type: str = "^.+$"
            >> regex expression to filter file tag's 'type' attribute
        return
            str:
            >> root's 'name' attribute
        """
        setupTime_S = time.time()
        struct = os.path.join(self.__url_base__, "struct.xml")
        root = ET.fromstring(rq.get(struct.replace("\\", "/"), verify=False).text)
        totalCount, checkCount = len(root.findall(".//file")), 0
        if(not os.path.exists(self.__app_root__)): os.mkdir(self.__app_root__)
        versionFile = os.path.join(self.__app_root__, "storage.version")
        if(not os.path.exists(versionFile)): open(versionFile, "w").close()
        with open(versionFile, "r") as f: currentHexVersion = f.read()
        CHVN = int(f"0{currentHexVersion}", 16)
        LHVN = int(f"0{root.attrib['version']}", 16)
        updatingStorage = (CHVN < LHVN)
        if(updatingStorage): logger.info(f"Updating storage from {CHVN} to {LHVN}")
        def walk(root, parent, path):
            nonlocal progressCallback, totalCount, checkCount
            path = os.path.join(path, parent.attrib["name"])
            if(parent.tag == "folder"):
                if(not os.path.exists(path)): os.mkdir(path)
                children = {"folder":set(), "file":set(), "type":set(["version"])}
                for child in parent: children[child.tag].add(walk(root, child, path))
                if(sys.kwargs.get("--mode", None) != "DEBUG") and getattr(sys, "frozen", False):
                    for child in os.listdir(path):
                        childPath = os.path.join(path, child)
                        childName, childType = os.path.splitext(child)
                        if(childType[1:] in children["type"]): continue
                        needed_file = (os.path.isfile(childPath) and childName in children["file"]) 
                        needed_dir = (os.path.isdir(childPath) and childName in children["folder"]) 
                        if(needed_file or needed_dir): continue
                        if(os.path.isfile(childPath)): os.remove(childPath)
                        else: shutil.rmtree(childPath, ignore_errors=True)
            elif(parent.tag == "file"):
                checkCount += 1
                filePath = f"{path}.{parent.attrib['type']}"
                lastUpdatedOnVersion = int(f"0{parent.attrib['updated']}", 16)
                alreadyExist = os.path.exists(filePath)
                fileTypeMatched = re.match(f_type, parent.attrib["type"])
                if(alreadyExist):
                    with open(filePath, "rb") as f: fileContent = f.read()
                else: fileContent = b""
                updateCuzStorage = (CHVN<lastUpdatedOnVersion and lastUpdatedOnVersion<=LHVN)
                updateCuzMissing = (not alreadyExist and fileTypeMatched)
                updateCuzContent = (not fileContent)
                needUpdateFile = (updateCuzStorage or updateCuzMissing or updateCuzContent)
                if(not needUpdateFile): return parent.attrib["name"]
                elif(updateCuzStorage): logger.info(f"LS-Update: Storage: {parent.attrib['name']:>15} {parent.attrib['type']:>5} {parent.attrib['path']}")
                elif(updateCuzMissing): logger.info(f"LS-Update: Missing: {parent.attrib['name']:>15} {parent.attrib['type']:>5} {parent.attrib['path']}")
                elif(updateCuzContent): logger.info(f"LS-Update: Content: {parent.attrib['name']:>15} {parent.attrib['type']:>5} {parent.attrib['path']}")
                self.updateFile(_path=parent.attrib["path"],
                                _name=parent.attrib["name"],
                                _type=parent.attrib["type"])
                estimation = (time.time() - setupTime_S) / checkCount * (totalCount-checkCount)
                statString = f"正在更新本地檔案 . . . [ 剩餘時間 {int(estimation/60):>2}分{int(estimation%60):>2}秒 ]"
                progressCallback(status=statString, progress=round((checkCount/totalCount)*100))
            return parent.attrib["name"]
        rootName = walk(root, root, self.__exe_root__)
        with open(versionFile, "w") as f: f.write(root.attrib["version"])
        return rootName


    def path(self, path:str, fast=False) -> str:
        """
        params
            path: str
            >> string representation of relative path to the requested file
        return
            str:
            >> absolute path to the requested file
        """
        filePath = os.path.normpath(os.path.join(self.__app_root__, path))
        if(not os.path.exists(filePath)): 
            _path, _file = os.path.split(path)
            _name, _type = os.path.splitext(_file)
            if(not fast): self.setup(f_type=f"^{_type[1:]}$")
            else: self.updateFile(_path, _name, _type[1:])
        return (filePath if(os.path.exists(filePath))else "")