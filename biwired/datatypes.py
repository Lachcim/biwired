from datetime import datetime
import os.path
import urllib.request

class Message:
    def __init__(self, parent, mother_event=None):
        self.parent = parent
        
        self.id = None
        self.author = None
        self.time = None
        self.conversation = None
        self.content = None
        
        if mother_event:
            self.id = mother_event["id"]
            self.author = mother_event["author"]
            self.time = mother_event["time"]
            self.conversation = mother_event["conversation"]
            
            if mother_event["type"] == "new_message":
                self.content = mother_event["content"]
            elif mother_event["type"] in ["new_asset", "asset_started"]:
                self.content = Asset(self.parent, mother_event)
            elif mother_event["type"] == "new_location":
                self.content = Location(mother_event)

class Asset:
    def __init__(self, parent, mother_event={}):
        self.parent = parent
        
        self.message_id = mother_event.get("id")
        self.name = mother_event.get("file_name")
        self.size = mother_event.get("file_size")
        self.mime_type = mother_event.get("file_mime_type")
        
        self.status = mother_event.get("status")
        self.key = mother_event.get("key")
        self.token = mother_event.get("token")

    def download(self, name=None):
        # only download uploaded resources
        if self.status != "uploaded":
            return False
        
        # compose default name: key + extension
        if not name:
            name = self.key + os.path.splitext(self.name)[1]
            
        self.parent.execute_script("downloadasset", self.message_id, name)
        
        return True

class Location:
    def __init__(self, mother_event={}):
        self.name = mother_event.get("location_name")
        self.latitude = mother_event.get("latitude")
        self.longitude = mother_event.get("longitude")
        self.zoom_level = mother_event.get("zoom_level")

class Conversation:
    def __init__(self, parent, raw_convo={}):
        self.parent = parent
        
        # inherit data from raw convo
        for key, value in raw_convo.items():
            setattr(self, key, value)
            
    def __str__(self):
        return self.name
            
    def get_messages(self):
        messages = filter(lambda x: x.conversation == self.id, self.parent.messages.values())
        return sorted(messages, key=lambda x: x.time)
            
class User:
    def __init__(self, parent, raw_convo={}):
        self.parent = parent
        
        # inherit data from raw user
        for key, value in raw_convo.items():
            setattr(self, key, value)
            
    def __str__(self):
        return self.name
