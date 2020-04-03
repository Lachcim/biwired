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

