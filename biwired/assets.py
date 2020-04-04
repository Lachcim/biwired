import os.path
import urllib.request

class Asset:
    def __init__(self, parent, id):
        self.parent = parent
        self.id = id
        
        self.name = None
        self.size = None
        self.mime_type = None
        
        self.success = False
        self.key = None
        self.token = None

    def download(self, name=None):
        # don't download failed assets
        if not self.success:
            return False
        
        # compose default name: key + extension
        if not name:
            name = self.key + os.path.splitext(self.name)[1]
            
        self.parent.execute_script("downloadasset", self.id, name)
        
        return True
