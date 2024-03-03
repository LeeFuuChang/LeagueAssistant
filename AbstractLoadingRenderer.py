from ProjectUtility import user32, PROJECT_NAME, STORAGE_SERVER, getDLL
StorageManager = getDLL("StorageManager")
LocalStorage = getattr(StorageManager, "LocalStorage")

from PyQt5.QtWidgets import QWidget, QLabel, QProgressBar
from PyQt5.QtCore import Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QIcon, QImage, QPixmap

from PIL import Image
import requests as rq
import random, os, io
import traceback
import threading
import time



def imageToPixmap(im):
    if im.mode == "RGB":
        r, g, b = im.split()
        im = Image.merge("RGB", (b, g, r))
    elif  im.mode == "RGBA":
        r, g, b, a = im.split()
        im = Image.merge("RGBA", (b, g, r, a))
    elif im.mode == "L":
        im = im.convert("RGBA")
    elif im.mode == "P":
        im = im.convert("RGBA")
        r, g, b, a = im.split()
        im = Image.merge("RGBA", (b, g, r, a))
    im2 = im.convert("RGBA")
    data = im2.tobytes("raw", "RGBA")
    qim = QImage(data, im.size[0], im.size[1], QImage.Format_ARGB32)
    pixmap = QPixmap.fromImage(qim)
    return pixmap

def loadBytesImage(bstring):
    return Image.open(io.BytesIO(bstring))



class TaskThread(threading.Thread):
    running = {}
    def __init__(self, target, interval=0, delay=0, tries=5, fargs=(), onFinished=lambda:None):
        super(self.__class__, self).__init__(target=self.wrappedFunction, daemon=True)
        self.target = target
        self.threadName = self.target.__name__
        self.event = threading.Event()
        self.interval = interval
        self.delay = delay
        self.tries = tries
        self.fargs = fargs
        self.onFinished = onFinished

    def finish(self):
        if(self.threadName in self.running): 
            del self.running[self.threadName]
        if(not self.event.is_set()):
            self.event.set()
            self.onFinished()

    def wrappedFunction(self):
        passed = False
        time.sleep(self.delay)
        while(not self.event.is_set() and not passed and self.tries != 0):
            try:
                passed = self.target(*self.fargs)
            except Exception as e:
                print(traceback.format_exc())
            finally:
                self.tries -= 1
                time.sleep(self.interval)
        else: self.finish()

    def start(self):
        if(self.threadName not in self.running):
            self.running[self.threadName] = self
            super().start()
        return self.running[self.threadName]



class AbstractLoadingWindow(QWidget):
    iconPath = LocalStorage(STORAGE_SERVER, PROJECT_NAME).path(os.path.join("logo", "Filled.png"), True)

    displayLoadingStatusSignal = pyqtSignal()

    _size = int(user32.GetSystemMetrics(1) / 4)
    _padding = int(_size / 10)
    _fontsize = int(_padding / 3)


    def __init__(self):
        super(AbstractLoadingWindow, self).__init__()
        self.status = ["載入中 . . .", 0]
        self.loadingTimer = QTimer(self)
        self.splashArtTimer = QTimer(self)
        self.loadingFunctions = []
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setWindowTitle(f"{PROJECT_NAME}-{self.__class__.__name__}")
        self.setWindowIcon(QIcon(self.iconPath))
        self.resize(self._size*1.65, self._size)
        self.setupComponents()
        self.splashArtTimer.timeout.connect(self.changeBackgroundSplashArt)
        self.splashArtTimer.timeout.emit()
        self.splashArtTimer.setInterval(10000)
        self.splashArtTimer.start()
        self.displayLoadingStatusSignal.connect(self.displayLoadingStatus)


    def notify(self, obj, event):
        error = False
        try:
            super().notify(obj, event)
        except Exception as e:
            error = True
        finally:
            if error: self.close()


    def setLoadingTimer(self, intervalFunction, interval):
        self.loadingTimer.timeout.connect(intervalFunction)
        self.loadingTimer.timeout.emit()
        self.loadingTimer.setInterval(interval)
        self.loadingTimer.start()


    def setupComponents(self):
        self.LoadingSplashArt = QLabel(self)
        self.LoadingSplashArt.setGeometry(0, 0, self.width(), self.height())

        self.LoadingProgress = QProgressBar(self)
        self.LoadingProgress.setRange(0, 100)
        self.LoadingProgress.setTextVisible(False)
        self.LoadingProgress.setOrientation(Qt.Horizontal)
        self.LoadingProgress.move(self._padding, self.height()-(self._padding*2))
        self.LoadingProgress.resize(self.width()-(self._padding*2), self._padding)

        self.LoadingStatus = QLabel(self)
        self.LoadingStatus.setText("載入中 . . .")
        self.LoadingStatus.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)
        self.LoadingStatus.font().setPointSize(self._fontsize)
        self.LoadingStatus.setStyleSheet(f"color:#000000;padding:0 {int(self._padding/2)}px;")
        self.LoadingStatus.move(self._padding, self.height()-(self._padding*2))
        self.LoadingStatus.resize(self.width()-(self._padding*2), self._padding)

        self.ProgressLabel = QLabel(self)
        self.ProgressLabel.setText("0%")
        self.ProgressLabel.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self.ProgressLabel.font().setPointSize(self._fontsize)
        self.ProgressLabel.setStyleSheet(f"color:#000000;padding:0 {int(self._padding/2)}px;")
        self.ProgressLabel.move(self._padding, self.height()-(self._padding*2))
        self.ProgressLabel.resize(self.width()-(self._padding*2), self._padding)


    def getRandomSplashArt(self):
        LATEST_RDD_VERSION = rq.get("http://ddragon.leagueoflegends.com/api/versions.json").json()[0]
        championJson = rq.get(f"http://ddragon.leagueoflegends.com/cdn/{LATEST_RDD_VERSION}/data/zh_TW/champion.json").json()
        championNames = list(championJson["data"].keys())
        random.shuffle(championNames)
        for champion in championNames:
            try:
                data = rq.get(f"http://ddragon.leagueoflegends.com/cdn/{LATEST_RDD_VERSION}/data/en_US/champion/{champion}.json").json()
                skin = random.choice(data["data"][champion]["skins"])["num"]
                data = rq.get(f"http://ddragon.leagueoflegends.com/cdn/img/champion/splash/{champion}_{skin}.jpg")
            except Exception as e:
                continue
            return data.content


    def changeBackgroundSplashArt(self):
        splashArtByte = self.getRandomSplashArt()
        if(splashArtByte):
            splashArtLabelGeometry = self.LoadingSplashArt.frameGeometry()
            splashArt = loadBytesImage(splashArtByte)
            splashArtWidth, splashArtHeight = splashArt.size
            if(int(splashArtHeight * (splashArtLabelGeometry.width()/splashArtWidth)) >= splashArtLabelGeometry.height()):
                resizeRatio = (splashArtLabelGeometry.width()/splashArtWidth)
            else: resizeRatio = (splashArtLabelGeometry.height()/splashArtHeight)
            splashArtTargetSize = (int(splashArtWidth*resizeRatio), int(splashArtHeight*resizeRatio))
            resizedSplashArt = splashArt.resize(splashArtTargetSize)
            pixmap = imageToPixmap(resizedSplashArt)
            self.LoadingSplashArt.setPixmap(pixmap)


    def updateLoadingStatus(self, status=None, progress=None):
        if(isinstance(status, str)): self.status[0] = status
        if(isinstance(progress, int)): self.status[1] = progress
        return True


    def displayLoadingStatus(self):
        self.LoadingStatus.setText(self.status[0])
        self.LoadingStatus.repaint()
        self.ProgressLabel.setText(f"{self.status[1]}%")
        self.ProgressLabel.repaint()
        self.LoadingProgress.setValue(self.status[1])
        self.LoadingProgress.repaint()


    def startLoadingIndex(self, idx):
        if(idx < len(self.loadingFunctions)):
            self.displayLoadingStatusSignal.emit()
            self.loadingThreadWorker = TaskThread(
                target=self.loadingFunctions[idx], 
                delay=0.1,
                tries=10, 
                onFinished=lambda i=idx+1:self.startLoadingIndex(i)
            ).start()
        else: self.close()


    def startLoading(self):
        self.startLoadingIndex(0)
        self.setLoadingTimer(self.displayLoadingStatusSignal.emit, 1000)


    def closeEvent(self, e):
        self.loadingTimer.stop()
        super().closeEvent(e)
        os._exit(0)


    def showEvent(self, e):
        super().showEvent(e)
        self.move(
            int((user32.GetSystemMetrics(0)-self.width())/2), 
            int((user32.GetSystemMetrics(1)-self.height())/2)
        )


