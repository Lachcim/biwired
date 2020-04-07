from datetime import datetime
import os.path

class Message:
    def __init__(self, parent, mother_event={}):
        self.parent = parent
        
        self.id = mother_event.get("id")
        self.author = mother_event.get("author")
        self.time = mother_event.get("time")
        self.edited_time = None
        self.conversation = mother_event.get("conversation")
        self.mentions = set(mother_event.get("mentions", []))
        self.quote = mother_event.get("quote")
        self.reactions = set()
        self.content = None
        
        if self.time:
            self.time = datetime.fromtimestamp(self.time)
        
        if mother_event.get("type"): 
            if mother_event["type"] == "new_message":
                self.content = mother_event["content"]
            elif mother_event["type"] in ["new_asset", "asset_started"]:
                self.content = Asset(self.parent, mother_event)
            elif mother_event["type"] == "new_location":
                self.content = Location(mother_event)
            elif mother_event["type"] == "message_edited":
                self.content = mother_event["content"]
                self.time = datetime.fromtimestamp(mother_event["original_time"])
                self.edited_time = datetime.fromtimestamp(mother_event["time"])

class MessageAlias:
    def __init__(self, parent, of):
        object.__setattr__(self, "alias_parent", parent)
        object.__setattr__(self, "alias_of", of)
        
    def __getattr__(self, attribute):        
        return getattr(self.alias_parent.messages[self.alias_of], attribute)
        
    def __setattr__(self, attribute, value):        
        if not hasattr(self.alias_parent.messages[self.alias_of], attribute):
            raise AttributeError
            
        setattr(self.alias_parent.messages[self.alias_of], attribute, value)

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
        
        self.id = raw_convo.get("id")
        self.name = raw_convo.get("name")
        self.creator = raw_convo.get("creator")
        self.type = raw_convo.get("type")
        self.members = raw_convo.get("members")
        self.admins = raw_convo.get("admins")
            
    def __str__(self):
        return self.name
            
    def get_messages(self):
        messages = filter(lambda x: x.conversation == self.id, self.parent.messages.values())
        return sorted(messages, key=lambda x: x.time)
            
class User:
    def __init__(self, parent, raw_user={}):
        self.parent = parent
        
        self.id = raw_user.get("id")
        self.name = raw_user.get("name")
        self.handle = raw_user.get("handle")
        self.is_self = raw_user.get("is_self", False)
        self.conversation = raw_user.get("conversation")
            
    def __str__(self):
        return self.name
