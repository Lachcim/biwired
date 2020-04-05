from biwired.exceptions import CredentialsError, ConnectivityError
from biwired.helpers import get_credentials

def log_in(self, username=None, password=None, credentials_path="credentials.json"):
    # get credentials from file if needed
    if not username or not password:
        credentials = get_credentials(credentials_path)
        username = credentials["username"]
        password = credentials["password"]

    # type username and password into login form and submit
    self.wait_for_element("[name=email]")
    self.find_element("[name=email]").click()
    self.find_element("[name=email]").send_keys(username)
    self.find_element("[name=password-login]").click()
    self.find_element("[name=password-login]").send_keys(password)
    self.find_element("[data-uie-name=do-sign-in]").click()
    
    # handle intermediate windows and buttons
    self.wait_for_element(("#wire-main,"
                           "[data-uie-name=go-remove-device],"
                           "[data-uie-name=do-history-confirm],"
                           "[data-uie-name=error-message][data-uie-value]"))
    
    # handle error message
    if self.find_element("[data-uie-name=error-message]"):
        error_type = self.find_element("[data-uie-name=error-message][data-uie-value]") \
                         .get_attribute("data-uie-value")
        
        if error_type in ["invalid-credentials", "bad-request"]:
            raise CredentialsError("Invalid credentials")
        else:
            raise ConnectivityError(error_type)
    
    # handle device removal list
    if self.find_element("[data-uie-name=go-remove-device]"):
        # pick first device and type in password, submit
        self.find_element("[data-uie-name=go-remove-device]").click()
        self.wait_for_element("[data-uie-name=remove-device-password]")
        self.find_element("[data-uie-name=remove-device-password]").send_keys(password)
        self.find_element("[data-uie-name=do-remove-device]").click()
        
        # wait for history confirmation dialog
        self.wait_for_element("[data-uie-name=do-history-confirm]")
       
    # handle history confirmation dialog
    if self.find_element("[data-uie-name=do-history-confirm]"):
        self.find_element("[data-uie-name=do-history-confirm]").click()
    
    # wait until the main application has loaded
    self.wait_for_element("#wire-main.show")
    
    # start collecting events
    self.subscribe_to_events()
    self.get_conversations()
    self.get_users()
