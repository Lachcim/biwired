import os.path
from selenium import webdriver

class Biwired:  
    def __init__(self):
        self.driver = None
        
        self.messages = {}
        self.conversations = {}
        self.users = {}
        self.self_user = None
        
    def __del__(self):
        if self.driver:
            try:
                # kill driver, ignore exceptions due to Python shutting down
                self.driver.quit()
            except:
                pass
        
    def start_driver(self, driver=None, downloads="assets"):
        # provide default driver
        if not driver:
            options = webdriver.ChromeOptions()
            options.add_argument("headless")
            options.add_argument("log-level=3")
            options.add_argument("user-agent=Mozilla/5.0 Chrome/80.0 Biwired/0.1")
            options.add_experimental_option("excludeSwitches", ["enable-logging"])
            
            prefs = {
                "profile.default_content_settings.popups": 0,
                "profile.default_content_setting_values.automatic_downloads": 1,
                "download.default_directory": os.path.abspath(downloads)
            }
            options.add_experimental_option("prefs", prefs)
            
            driver = webdriver.Chrome(chrome_options=options)
        
        # start: request login screen
        self.driver = driver
        self.driver.get("https://app.wire.com/auth/#login")
        
    from biwired.actions import (send_message,
                                 send_file)
    from biwired.auth import log_in
    from biwired.helpers import (find_element,
                                 wait_for_element,
                                 execute_script,
                                 execute_async_script)
    from biwired.rawevents import (subscribe_to_events,
                                   get_new_events,
                                   pull_new_events,
                                   process_event,
                                   get_conversations,
                                   get_users)
