window.biwired_events = [];
window.biwired_takenIds = new Set();
window.biwired_assets = {};
window.biwired_blockedUsers = new Set();
window.biwired_outgoingConnections = new Set();

amplify.subscribe("wire.webapp.conversation.event_from_backend", function(rawEvent) {
	var event = {};
	
	//supply basic data
	event.raw_type = rawEvent.type;
	event.time = new Date(rawEvent.time).getTime() / 1000 || null;
	
	//SECTION: BASIC CONVERSATION EVENTS
	if (rawEvent.type == "conversation.message-add") {
		event.type = "new_message";
		event.id = rawEvent.id;
		event.author = rawEvent.from;
		event.content = rawEvent.data.content;
		event.conversation = rawEvent.conversation;
		
		event.quote = rawEvent.data.quote ? rawEvent.data.quote.message_id : null;
		event.mentions = [];
		for (var i in rawEvent.data.mentions)
			event.mentions.push(atob(rawEvent.data.mentions[i]).substr(6));
		
		//suppress preview updates
		if (window.biwired_takenIds.has(event.type + event.id)) return;
		window.biwired_takenIds.add(event.type + event.id);
		
		if (rawEvent.data.replacing_message_id) {
			event.type = "message_edited";
			event.replacing_id = rawEvent.data.replacing_message_id;
			event.original_time = event.time;
			event.time = new Date(rawEvent.edited_time).getTime() / 1000;
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
			event.status = "uploading";
			
			//data sent through this event overrides subsequent data because it's more truthful
			//this includes the original file size and image names
			event.file_size = rawEvent.data.content_length;
			event.file_mime_type = rawEvent.data.content_type;
			event.file_name = rawEvent.data.info.name;
			
			//mark subsequent event as case 1
			window.biwired_takenIds.add(event.type + event.id);
		}
		else {
			//this handles (1.finish and 2)
			
			//if this is case 2, include previously unsupplied file info
			if (!biwired_takenIds.has("asset_started" + event.id)) {
				event.file_size = rawEvent.data.content_length;
				event.file_mime_type = rawEvent.data.content_type;
				event.file_name = rawEvent.data.info.name;
			}
			
			//mark as successful and provide key and token unless failed
			event.status = rawEvent.data.status == "uploaded" ? "uploaded" : "failed";
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
		event.author = rawEvent.from;
		event.conversation = rawEvent.conversation;
		event.latitude = rawEvent.data.location.latitude;
		event.longitude = rawEvent.data.location.longitude;
		event.location_name = rawEvent.data.location.name;
		event.zoom_level = rawEvent.data.location.zoom;
		event.raw_data = rawEvent;
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
	//SECTION: CONVERSATION METADATA
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
	//SECTION: MISC
	else if (rawEvent.type == "conversation.connect-request") {
		//outgoing connection request, suppress
		return;
	}
	else {
		event.type = "unknown";
		event.raw_data = rawEvent;
	}
	
	window.biwired_events.push(event);
});

amplify.subscribe("wire.webapp.conversation.message.added", function(rawEvent) {
	//save assets for downloading
	
	if (rawEvent.type != "conversation.asset-add")
		return;
	
	window.biwired_assets[rawEvent.id] = rawEvent.assets;
});

amplify.subscribe("wire.webapp.user.event_from_backend", function(rawEvent) {
	var event = {};
	
	//supply basic data
	event.raw_type = rawEvent.type;
	event.time = null;
	
	//SECTION: CONNECTION REQUESTS AND UPDATES
	if (rawEvent.type == "user.connection") {
		//supply more basic data
		event.time = new Date(rawEvent.connection.last_update).getTime() / 1000 || null;
		event.user = rawEvent.connection.to;
		
		//handle different connection states
		if (rawEvent.connection.status == "pending" || rawEvent.connection.status == "sent") {
			if (rawEvent.connection.status == "sent")
				window.biwired_outgoingConnections.add(event.user);
			
			event.type = "new_request";
			event.incoming = !window.biwired_outgoingConnections.has(event.user);
			event.message = rawEvent.connection.message.trim() || null;
		}
		else if (rawEvent.connection.status == "cancelled") {
			event.type = "request_withdrawn";
			event.incoming = !window.biwired_outgoingConnections.has(event.user);
			
			if (!event.incoming)
				window.biwired_outgoingConnections.delete(event.user);
		}
		else if (rawEvent.connection.status == "accepted") {
			if (window.biwired_blockedUsers.has(event.user)) {
				event.type = "user_unblocked";
				
				window.biwired_blockedUsers.delete(event.user);
			}
			else {
				event.type = "request_accepted";
				event.conversation = rawEvent.connection.conversation;
				event.incoming = !window.biwired_outgoingConnections.has(event.user);
				
				if (!event.incoming)
					window.biwired_outgoingConnections.delete(event.user);
			}
		}
		else if (rawEvent.connection.status == "blocked") {
			event.type = "user_blocked";
			window.biwired_blockedUsers.add(event.user);
		}
	}
	else {
		event.type = "unknown";
		event.raw_data = rawEvent;
	}
	
	window.biwired_events.push(event);
});
