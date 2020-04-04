window.biwired_events = [];
window.biwired_takenIds = new Set();
window.biwired_assets = {};

//wire permits duplicate event ids, generate fake id to guarantee uniqueness
function biwired_guaranteeUniqueness(id) {
	while (biwired_takenIds.has(id)) {	
		var charCode = id.charCodeAt(0) + 1;
		
		if (charCode == 58) charCode = 97;
		else if (charCode == 123) charCode = 48;
		
		id = String.fromCharCode(charCode) + id.substr(1);
	}
	
	return id;
}

amplify.subscribe("wire.webapp.conversation.event_from_backend", function(rawEvent) {
	//create event
	var event = {};
	
	//supply basic data
	event.id = biwired_guaranteeUniqueness(rawEvent.id);
	event.raw_id = rawEvent.id;
	event.raw_type = rawEvent.type;
	event.time = new Date(rawEvent.time).getTime() / 1000 || null;
	
	//type-specific code
	if (rawEvent.type == "conversation.message-add") {
		event.type = "new_message";
		event.author = rawEvent.from;
		event.content = rawEvent.data.content;
		event.conversation = rawEvent.conversation;
		
		if (rawEvent.data.replacing_message_id) {
			event.type = "message_edited";
			event.message = rawEvent.data.replacing_message_id;
		}
	}
	else if (rawEvent.type == "conversation.asset-add") {
		event.type = "new_asset"
		event.author = rawEvent.from;
		event.conversation = rawEvent.conversation;
		
		//two modes of asset handling:
		//1. start event without key + finish event with key (web app)
		//2. full asset event with key (mobile app)
		
		if (!rawEvent.data.status) {
			//this handles (1.start)
			event.type = "asset_started";
			event.asset = event.raw_id;
			
			//data sent through this event overrides consequent data because it's more truthful
			//this includes the original file size and image names
			event.file_size = rawEvent.data.content_length;
			event.file_mime_type = rawEvent.data.content_type;
			event.file_name = rawEvent.data.info.name;
		}
		else {
			//this handles (1.finish and 2)
			
			//if this is case 2, include previously unsupplied file info
			if (!biwired_takenIds.has(event.raw_id)) {
				event.file_size = rawEvent.data.content_length;
				event.file_mime_type = rawEvent.data.content_type;
				event.file_name = rawEvent.data.info.name;
			}
			
			//in case 1, the original event id matches the start event's id
			event.asset = event.raw_id;
			
			//mark as successful and provide key and token unless failed
			event.success = rawEvent.data.status == "uploaded";
			event.key = rawEvent.data.key || null;
			event.token = rawEvent.data.token || null;
		}
	}
	else if (rawEvent.type == "conversation.confirmation") {
		event.type = "message_delivered";
		event.reader = rawEvent.from;
		event.message = message_id;
		
		//suppress event for other clients
		if (window.biwired_takenIds.has(event.type + event.message))
			return;
			
		window.biwired_takenIds.add(event.type + event.message);
	}
	else if (rawEvent.type == "conversation.reaction") {
		event.type = rawEvent.data.reaction ? "reaction_added" : "reaction_removed";
		event.message = rawEvent.data.message_id;
		event.reactor = rawEvent.from;
	}
	else if (rawEvent.type == "conversation.member-update") {
		//last read timestamp update, suppress
		return;
	}
	else if (rawEvent.type == "conversation.one2one-creation") {
		if (event.time == null) {
			//conversation authorship event, suppress
			return;
		}
	}
	else {
		event.type = "unknown";
		event.raw_data = rawEvent;
	}
	
	window.biwired_events.push(event);
	window.biwired_takenIds.add(event.id);
});

amplify.subscribe("wire.webapp.conversation.message.added", function(rawEvent) {
	//save assets for downloading
	
	if (rawEvent.type != "conversation.asset-add")
		return;
	
	window.biwired_assets[rawEvent.id] = rawEvent.assets;
});
