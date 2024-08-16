from PyQt5.QtWidgets import QWidget, QLabel, QGraphicsOpacityEffect
from PyQt5.QtCore import QObject, QEvent, Qt, pyqtSignal


class ClickableLabel(QLabel):
    leftButtonClicked:pyqtSignal = pyqtSignal()
    rightButtonClicked:pyqtSignal = pyqtSignal()

    _opacity:float = 1

    _fontColor:str = "#FFFFFF"
    _backgroundColor:str = "#000000"


    def __init__(self, parent:QWidget) -> None:
        super(self.__class__, self).__init__(parent)

        self.opacityEffect = QGraphicsOpacityEffect(self)
        self.opacityEffect.setOpacity(1)
        self.setGraphicsEffect(self.opacityEffect)

        self.setAlignment(Qt.AlignCenter)

        self.installEventFilter(self)


    def eventFilter(self, obj:QObject, event:QEvent) -> bool:
        if obj != self: return False
        if event.type() == QEvent.MouseButtonRelease:
            if event.button() == Qt.LeftButton:
                self.leftButtonClicked.emit()
                event.accept()
                return True
            if event.button() == Qt.RightButton:
                self.rightButtonClicked.emit()
                event.accept()
                return True
        return False


    def setOpacity(self, opacity:float) -> None:
        self._opacity = opacity
        return self.opacityEffect.setOpacity(self._opacity)


    def setFontColor(self, color:str) -> None:
        self._fontColor = color
        return self.setStyleSheet(f"color:{self._fontColor}; background-color:{self._backgroundColor}")


    def setBackgroundColor(self, color:str) -> None:
        self._backgroundColor = color
        return self.setStyleSheet(f"color:{self._fontColor}; background-color:{self._backgroundColor}")
