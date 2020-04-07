var repo = ko.dataFor(document.getElementById("wire-main")).actions.conversationRepository;
var conversations = repo.conversations();
var callback = arguments[arguments.length - 1];

//obtain conversation entity
var conversation = null;
for (var i in conversations)
	if (conversations[i].id == arguments[0]) {
		conversation = conversations[i];
		break;
	}
	
if (!conversation) {
	callback(null);
	return;
}

//create proxy method to obtain message id
var uploadEvent;
var sam = repo.send_asset_metadata;
repo.send_asset_metadata = function() {
	var proxyArgs = arguments;
	
	return new Promise(function(resolve) {
		sam.apply(repo, proxyArgs).then(function(event) {
			//return message id to Python, continue uploading
			callback(event.id);
			uploadEvent = event;
			resolve(event);
		});
	});
}

repo.upload_file(conversation, window.biwired_fileInput.files[0], arguments[1])
