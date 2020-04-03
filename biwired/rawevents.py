from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from biwired.assets import Asset
from biwired.events import BiwiredEvent

def subscribe_to_events(self):
    self.execute_script("subscribe")
    
def get_new_events(self):
    # collect events in batch mode
    events = self.execute_script("collectevents", 0)
    
    for event in events:
        event = self.process_event(event)
        
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
    # handle assets
    if raw_event["type"] == "new_asset":
        # create new asset
        asset = Asset(self, raw_event["id"])
        asset.name = raw_event["file_name"]
        asset.size = raw_event["file_size"]
        asset.mime_type = raw_event["file_mime_type"]
        
        # add new asset to repository
        self.assets[raw_event["id"]] = asset
        
        # recreate attributes
        del raw_event["file_name"]
        del raw_event["file_size"]
        del raw_event["file_mime_type"]
        raw_event["asset"] = raw_event["id"]
    elif raw_event["type"] == "asset_finished":
        # update entry in repository
        self.assets[raw_event["asset"]].success = raw_event["success"]
        self.assets[raw_event["asset"]].key = raw_event["key"]
        self.assets[raw_event["asset"]].token = raw_event["token"]
    
    return BiwiredEvent(self, raw_event)
