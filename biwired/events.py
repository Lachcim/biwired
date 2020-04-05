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
        # format universal header
        time = self.time.strftime("%Y-%m-%d %H:%M:%S") if self.time else "?"
        header = "{0} [#{1}]".format(time, self.id[:5]) if self.id else time
    
        if self.type == "new_message":
            return "{0} #{1} sent message to #{2}: {3}".format(header,
                                                               self.author[:5],
                                                               self.conversation[:5],
                                                               self.content)
        elif self.type == "message_edited":
            return "{0} #{1} edited message #{2}: {3}".format(header,
                                                              self.author[:5],
                                                              self.message[:5],
                                                              self.content)
        elif self.type == "new_asset":
            if self.success:
                return "{0} #{1} uploaded asset #{2} to #{3}".format(header,
                                                                     self.author[:5],
                                                                     self.asset[:5],
                                                                     self.conversation[:5])
            else:
                return "{0} #{1} failed to upload asset #{2} to #{3}".format(header,
                                                                             self.author[:5],
                                                                             self.asset[:5],
                                                                             self.conversation[:5])
        elif self.type == "asset_started":
            return "{0} #{1} started uploading asset to #{2}".format(header,
                                                                     self.author[:5],
                                                                     self.conversation[:5])
        elif self.type == "message_delivered":
            return "{0} #{1} received message #{2}".format(header,
                                                           self.reader[:5],
                                                           self.message[:5])
        elif self.type == "reaction_added":
            return "{0} #{1} reacted to message #{2}".format(header,
                                                             self.reactor[:5],
                                                             self.message[:5])
        elif self.type == "reaction_removed":
            return "{0} #{1} unreacted to message #{2}".format(header,
                                                               self.reactor[:5],
                                                               self.message[:5])
        elif self.type == "new_ping":
            return "{0} #{1} pinged conversation #{2}".format(header,
                                                              self.pinger[:5],
                                                              self.conversation[:5])
        elif self.type == "new_location":
            return "{0} #{1} sent their location: {2} ({3}, {4})".format(header,
                                                                  self.locator[:5],
                                                                  self.location_name,
                                                                  self.latitude,
                                                                  self.longitude)
        elif self.type == "message_deleted":
            return "{0} #{1} deleted message #{2}".format(header,
                                                          self.deleter[:5],
                                                          self.message[:5])
        elif self.type == "message_hidden":
            return "{0} message #{1} was hidden by another client".format(header,
                                                                          self.message[:5])
        elif self.type == "new_conversation":
            return "{0} a new conversation #{1} was created by {2}".format(header,
                                                                           self.conversation[:5],
                                                                           self.creator[:5])
        elif self.type == "member_added":
            return "{0} #{1} added {2} to the conversation #{3}".format(header,
                                                                         self.adder[:5],
                                                                         ", ".join(["#{0}".format(x[:5]) for x in self.members]),
                                                                         self.conversation[:5])
        elif self.type == "member_removed":
            return "{0} #{1} removed {2} from the conversation #{3}".format(header,
                                                                            self.remover[:5],
                                                                            ", ".join(["#{0}".format(x[:5]) for x in self.members]),
                                                                            self.conversation[:5])
        elif self.type == "admin_added":
            return "{0} #{1} made #{2} an admin of #{3}".format(header,
                                                                self.adder[:5],
                                                                self.member[:5],
                                                                self.conversation[:5])
        elif self.type == "admin_removed":
            return "{0} #{1} removed #{2} from admins of #{3}".format(header,
                                                                      self.remover[:5],
                                                                      self.member[:5],
                                                                      self.conversation[:5])
        elif self.type == "unknown": 
            return "{0} unknown event: {1} {2}".format(header,
                                                       self.raw_type,
                                                       self.raw_data)
        else:
            return "invalid event"
