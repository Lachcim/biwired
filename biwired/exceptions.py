class BiwiredError(Exception):
    pass
            
class CredentialsError(BiwiredError):
    pass
   
class ElementMissingError(BiwiredError):
    pass

class ConnectivityError(BiwiredError):
    pass
