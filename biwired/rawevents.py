from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException

def subscribe_to_events(self):
    self.execute_script("subscribe")
    
def get_new_events(self):
    # collect events in batch mode
    return self.execute_script("collectevents", 0)
    
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
            
    return event
