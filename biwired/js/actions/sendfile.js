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

if (!repo.biwired_injected) {
	//create copies of original methods
	repo.send_asset_metadata_old = repo.send_asset_metadata;
	repo._on_asset_upload_complete_old = repo._on_asset_upload_complete;
	
	//wire doesn't create a confirmation event by default
	//create proxy method to fabricate event
	repo._on_asset_upload_complete = function(convo, rawEvent) {
		var event = {};
		event.type = "new_asset";
		event.time = new Date(rawEvent.time).getTime() / 1000;
		event.id = rawEvent.id;
		event.author = rawEvent.from;
		event.conversation = rawEvent.conversation;
		event.status = "uploaded";
		event.key = rawEvent.data.key;
		event.token = rawEvent.data.token;
		
		window.biwired_events.push(event);
		
		return repo._on_asset_upload_complete_old(convo, rawEvent);
	}
	
	repo.biwired_injected = true;
}

//create proxy method to obtain message id
repo.send_asset_metadata = function() {
	var proxyArgs = arguments;
	
	return new Promise(function(resolve) {
		repo.send_asset_metadata_old(...proxyArgs).then(function(event) {
			//return message id to Python, continue uploading
			callback(event.id);
			resolve(event);
		},
		function(resolve) {
			//on error
			callback(null);
			resolve()
		});
	});
}

repo.upload_file(conversation, window.biwired_fileInput.files[0], arguments[1]);
