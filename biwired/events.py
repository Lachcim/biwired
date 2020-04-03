from datetime import datetime

class BiwiredEvent: 
    def __init__(self, parent=None, raw_event=None):
        self.type = None
        self.parent = parent
        
        if not raw_event:
            return
        
        # inherit data from raw event
        for key, value in raw_event.items():            
            if key == "time":
                # datetime for valid times, None for 0 and None
                setattr(self, key, datetime.fromtimestamp(value) if bool(value) else None)
            else:
                setattr(self, key, value)
                
    def __str__(self):
        # format time, question mark for unknown times
        time = self.time.strftime("%Y-%m-%d %H:%M:%S") if self.time else "?"
        header = "{0} [#{1}]".format(time, self.id[:5])
    
        if self.type == "new_message":
            return "{0} #{1} sent message to #{2}: {3}".format(header, self.author[:5], self.conversation[:5], self.content)
        elif self.type == "message_edited":
            return "{0} #{1} edited message #{2}: {3}".format(header, self.author[:5], self.message[:5], self.content)
        elif self.type == "message_delivered":
            return "{0} #{1} received message #{2}".format(header, self.reader[:5], self.message[:5])
        elif self.type == "reaction_added":
            return "{0} #{1} reacted to message #{2}".format(header, self.reactor[:5], self.message[:5])
        elif self.type == "reaction_removed":
            return "{0} #{1} unreacted to message #{2}".format(header, self.reactor[:5], self.message[:5])
        elif self.type == "unknown": 
            return "{0} unknown event: {1} {2}".format(header, self.raw_type, self.raw_data)
        else:
            return "invalid event"
