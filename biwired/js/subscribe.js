window.biwired_events = [];
window.biwired_takenIds = new Set();
window.biwired_assets = {};

amplify.subscribe("wire.webapp.conversation.event_from_backend", function(rawEvent) {
	//create event
	var event = {};
	
	//supply basic data
	event.raw_type = rawEvent.type;
	event.time = new Date(rawEvent.time).getTime() / 1000 || null;
	
	// SECTION: BASIC CONVERSATION EVENTS
	if (rawEvent.type == "conversation.message-add") {
		event.type = "new_message";
		event.id = rawEvent.id;
		event.author = rawEvent.from;
		event.content = rawEvent.data.content;
		event.conversation = rawEvent.conversation;
		
		event.quote = rawEvent.data.quote ? rawEvent.data.quote.message_id : null;
		event.mentions = [];
		for (var i in rawEvent.data.mentions)
			event.mentions.push(atob(rawEvent.mentions[i]).substr(6));
		
		if (rawEvent.data.replacing_message_id) {
			event.type = "message_edited";
			event.message = rawEvent.data.replacing_message_id;
		}
	}
	else if (rawEvent.type == "conversation.asset-add") {
		event.type = "new_asset";
		event.id = rawEvent.id;
		event.author = rawEvent.from;
		event.conversation = rawEvent.conversation;
		
		//two modes of asset handling:
		//1. start event without key + finish event with key (web app)
		//2. full asset event with key (mobile app)
		
		if (!rawEvent.data.status) {
			//this handles (1.start)
			event.type = "asset_started";
			
			//data sent through this event overrides consequent data because it's more truthful
			//this includes the original file size and image names
			event.file_size = rawEvent.data.content_length;
			event.file_mime_type = rawEvent.data.content_type;
			event.file_name = rawEvent.data.info.name;
		}
		else {
			//this handles (1.finish and 2)
			
			//if this is case 2, include previously unsupplied file info
			if (!biwired_takenIds.has(event.id)) {
				event.file_size = rawEvent.data.content_length;
				event.file_mime_type = rawEvent.data.content_type;
				event.file_name = rawEvent.data.info.name;
			}
			
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
	else if (rawEvent.type == "conversation.knock") {
		event.type = "new_ping";
		event.pinger = rawEvent.from;
		event.conversation = rawEvent.conversation;
	}
	else if (rawEvent.type == "conversation.location") {
		event.type = "new_location";
		event.id = rawEvent.id;
		event.locator = rawEvent.from;
		event.conversation = rawEvent.conversation;
		event.latitude = rawEvent.data.latitude;
		event.longitude = rawEvent.data.longitude;
		event.location_name = rawEvent.data.name;
		event.zoom_level = rawEvent.data.zoom;
	}
	else if (rawEvent.type == "conversation.message-delete") {
		event.type = "message_deleted";
		event.message = rawEvent.data.message_id;
		event.deleter = rawEvent.from;
	}
	else if (rawEvent.type == "conversation.delete-everywhere") {
		//deletion timestamp, suppress
		return;
	}
	else if (rawEvent.type == "conversation.message-hidden") {
		event.type = "message_hidden";
		event.message = rawEvent.data.message_id;
	}
	// SECTION: CONVERSATION METADATA
	else if (rawEvent.type == "conversation.one2one-creation") {
		//conversation authorship event, suppress
		return;
	}
	else if (rawEvent.type == "conversation.group-creation") {
		//conversation authorship event, suppress
		return;
	}
	else if (rawEvent.type == "conversation.create") {
		event.type = "new_conversation";
		event.creator = rawEvent.from;
		event.conversation = rawEvent.data.id;
	}
	else if (rawEvent.type == "conversation.member-join") {
		event.type = "member_added";
		event.members = rawEvent.data.user_ids;
		event.adder = rawEvent.from;
		event.conversation = rawEvent.conversation;
	}
	else if (rawEvent.type == "conversation.member-leave") {
		event.type = "member_removed";
		event.members = rawEvent.data.user_ids;
		event.remover = rawEvent.from;
		event.conversation = rawEvent.conversation;
	}
	else if (rawEvent.type == "conversation.member-update") {
		//suppress irrelevant conversation updates
		if (!rawEvent.data.conversation_role)
			return;
		
		if (rawEvent.data.conversation_role == "wire_admin") {
			event.type = "admin_added";
			event.adder = rawEvent.from;
		}
		else {
			event.type = "admin_removed";
			event.remover = rawEvent.from;
		}
		event.member = rawEvent.data.target;
		event.conversation = rawEvent.data.conversationId || rawEvent.conversation;
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
