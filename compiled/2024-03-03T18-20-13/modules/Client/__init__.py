from ProjectUtility import PROJECT_NAME, STORAGE_SERVER, getDLL
StorageManager = getDLL("StorageManager")
LocalStorage = getattr(StorageManager, "LocalStorage", lambda _:_)
LocalStorage(STORAGE_SERVER, PROJECT_NAME)

from . import Server
from . import Renderer
from . import PhaseHandler