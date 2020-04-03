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

    def download(self, path="assets", name=None, safe=True):
        # don't download failed assets
        if not self.success:
            return False
        
        # compose default name: key + extension
        if not name:
            name = self.key + os.path.splitext(self.name)[1]
            
        # compose path
        path = os.path.join(path, name)
        
        # obtain asset url
        asset_url = self.parent.execute_async_script("getasseturl", self.key, self.token)
        
        # download file
        try:
            opener = urllib.request.build_opener()
            opener.addheaders = [("User-agent", "Mozilla/5.0 Chrome/80.0")]
            urllib.request.install_opener(opener)
            urllib.request.urlretrieve(asset_url, path)
            
            return True
        except BaseException as e:
            if not safe:
                raise e
            
            return False
