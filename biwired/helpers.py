import json
import os.path
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from biwired.exceptions import ElementMissingError, CredentialsError

def find_element(self, query):
    try:
        return self.driver.find_element_by_css_selector(query)
    except NoSuchElementException:
        return None
        
def wait_for_element(self, query, timeout=10, frequency=0.1):
    wait = WebDriverWait(self.driver, timeout, frequency)
    
    try:
        wait.until(lambda x: self.find_element(query))
    except TimeoutException:
        raise ElementMissingError
        
def get_credentials(self, path):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        raise CredentialsError("Failed to read credentials")

def execute_script(self, script, *args):
    path = __file__
    path = os.path.abspath(path)
    path = os.path.dirname(path)
    path = os.path.join(path, "js", "{0}.js".format(script))
    
    with open(path) as f:
        return self.driver.execute_script(f.read(), *args)
