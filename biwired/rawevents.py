from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from biwired.events import BiwiredEvent
from biwired.messages import Message

def subscribe_to_events(self):
    self.execute_script("subscribe")
    
def get_new_events(self):
    # collect events in batch mode
    events = self.execute_script("collectevents", 0)
    
    # process raw events
    events = [self.process_event(event) for event in events]
        
    return events
    
def pull_new_events(self, timeout=0, frequency=0.1):
    # attempt to collect event
    event = self.execute_script("collectevents", 1)
    
    while not event:
        wait = WebDriverWait(self.driver, timeout if timeout > 0 else 60, frequency)
        
        try:
            # wait until event appears
            wait.until(lambda x: self.execute_script("collectevents", 2))
        except TimeoutException:
            # if the timeout is non-zero, return nothing, otherwise keep trying
            if timeout > 0:
                return None
            else:
                continue
                
        event = self.execute_script("collectevents", 1)
            
    return self.process_event(event)

def process_event(self, raw_event):
    if raw_event["type"] in ["new_message", "asset_started", "new_location"]:
        # register message
        self.messages[raw_event["id"]] = Message(self, raw_event)
    elif raw_event["type"] == "new_asset":
        # register new message or update entry in repository
        if raw_event["id"] not in self.messages:
            self.messages[raw_event["id"]] = Message(self, raw_event)
        else:
            self.messages[raw_event["id"]].content.status = raw_event["status"]
            self.messages[raw_event["id"]].content.key = raw_event["key"]
            self.messages[raw_event["id"]].content.token = raw_event["token"]
            
            # overwrite event data with previously gathered one
            raw_event["file_name"] = self.messages[raw_event["id"]].content.name
            raw_event["file_size"] = self.messages[raw_event["id"]].content.name
            raw_event["file_mime_type"] = self.messages[raw_event["id"]].content.name
    
    return BiwiredEvent(self, raw_event)
