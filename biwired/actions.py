import os.path
import re
from biwired.datatypes import *

def send_message(self, conversation, content, quoting=None, mentions=None, translate_mentions=True):
    # initialize empty array for mentions
    mentions = mentions or []
    
    # find and translate mentions in text message
    if translate_mentions:
        # construct pattern
        l = "[a-z0-9]"
        pattern = re.compile("@{}-{}-{}-{}-{}".format(l * 8, l * 4, l * 4, l * 4, l * 12))
        
        # keep translating until there is nothing left
        position = 0
        match = pattern.search(content, position)
        while match:
            # ignore mentions to missing users
            if not match.group()[1:] in self.users:
                position = match.end()
                match = pattern.search(content, position)
                continue
        
            head = content[:match.start() + 1]
            user = self.users[match.group()[1:]].name
            tail = content[match.end():]
            
            content = head + user + tail
            mention = {"index": match.start(), "name": user, "id": match.group()[1:]}
            mentions.append(mention)
            
            position = match.start() + len(user)
            match = pattern.search(content, position)
    
    # execute script
    result = self.execute_async_script("actions/sendmessage", conversation, content, mentions, quoting)
    return result["messageId"] if result else None
    
def send_file(self, conversation, file_path, is_image=False):
    # type image path into file input
    self.find_element("#biwired_fileInput").send_keys(os.path.abspath(file_path))
    
    return self.execute_async_script("actions/sendfile", conversation, is_image)

def download_asset(self, id, name=None):
    asset = self.messages[id].content
    
    if not isinstance(asset, Asset):
        return False
    
    if asset.status != "uploaded":
        return False
    
    # compose default name: key + extension
    if not name:
        name = asset.key + os.path.splitext(asset.name)[1]
        
    self.execute_script("actions/downloadasset", id, name)
    
    return True
    
def get_conversation_messages(self, id):
    if not self.conversations[id]:
        return None

    messages = filter(lambda x: x.conversation == id, self.messages.values())
    return sorted(messages, key=lambda x: x.time)
