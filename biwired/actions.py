import re
import biwired.datatypes

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
    result = self.execute_async_script("sendmessage", conversation, content, mentions, quoting)
    return result["messageId"] if result else None
