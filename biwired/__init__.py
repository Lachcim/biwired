from selenium import webdriver

class Biwired:  
    def __init__(self):
        self.driver = None
        
        self.assets = {}
        
    def start_driver(self, driver=None):
        # provide default driver
        if not driver:
            options = webdriver.ChromeOptions()
            options.add_argument("headless")
            options.add_argument("log-level=3")
            options.add_argument("user-agent=Mozilla/5.0 Chrome/80.0 Biwired/0.1")
            options.add_experimental_option("excludeSwitches", ["enable-logging"])
            
            driver = webdriver.Chrome(chrome_options=options)
        
        # start: request login screen
        self.driver = driver
        self.driver.get("https://app.wire.com/auth/#login")
        
    from biwired.auth import log_in
    from biwired.helpers import (find_element,
                                 wait_for_element,
                                 get_credentials,
                                 execute_script)
    from biwired.rawevents import (subscribe_to_events,
                                   get_new_events,
                                   pull_new_events)
