import traceback
import threading
import logging
import time


class TaskThread(threading.Thread):
    running = {}
    def __init__(self, target, delay=0, tries=5, fargs=(), onFinished=lambda:None):
        super(self.__class__, self).__init__(target=self.wrappedFunction, daemon=True)
        self.target = target
        self.threadName = self.target.__name__
        self.event = threading.Event()
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
        time.sleep(self.delay)
        while(not self.event.is_set() and self.tries != 0):
            try:
                self.tries -= 1
                if(bool(self.target(*self.fargs))): break
            except Exception as e:
                logging.error(traceback.format_exc())
        self.finish()

    def start(self):
        if(self.threadName not in self.running):
            self.running[self.threadName] = self
            super().start()
        return self.running[self.threadName]


class SteppedTaskThread(threading.Thread):
    running = {}
    def __init__(self, targets, delay=0, tries=5, fargs=(), onFinished=lambda:None):
        super(self.__class__, self).__init__(target=self.wrappedFunction, daemon=True)
        self.targets = targets
        self.threadName = "+".join([t.__name__ for t in self.targets])
        self.targetIndex = 0
        self.event = threading.Event()
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
        time.sleep(self.delay)
        while(not self.event.is_set() and self.targetIndex<len(self.targets) and self.tries != 0):
            try:
                self.tries -= 1
                self.targetIndex += bool(self.targets[self.targetIndex](*self.fargs))
            except Exception as e:
                logging.error(traceback.format_exc())
        self.finish()

    def start(self):
        if(self.threadName not in self.running):
            self.running[self.threadName] = self
            super().start()
        return self.running[self.threadName]
