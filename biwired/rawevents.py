from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from biwired.assets import Asset
from biwired.events import BiwiredEvent

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
    # handle assets
    if raw_event["type"] == "asset_started":
        # create new asset
        asset = Asset(self, raw_event["asset"])
        asset.name = raw_event["file_name"]
        asset.size = raw_event["file_size"]
        asset.mime_type = raw_event["file_mime_type"]
        
        # add new asset to repository
        self.assets[raw_event["asset"]] = asset
        
        # hide moved properties
        del raw_event["file_name"]
        del raw_event["file_size"]
        del raw_event["file_mime_type"]
    elif raw_event["type"] == "new_asset":
        # if the asset wasn't created by asset_started, create it now
        if raw_event["asset"] not in self.assets:
            asset = Asset(self, raw_event["asset"])
            asset.name = raw_event["file_name"]
            asset.size = raw_event["file_size"]
            asset.mime_type = raw_event["file_mime_type"]
            
            # add to repository
            self.assets[raw_event["asset"]] = asset
    
        # expand entry in repository
        self.assets[raw_event["asset"]].success = raw_event["success"]
        self.assets[raw_event["asset"]].key = raw_event["key"]
        self.assets[raw_event["asset"]].token = raw_event["token"]
    
    return BiwiredEvent(self, raw_event)
