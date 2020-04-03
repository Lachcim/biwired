window.biwired_events = [];
window.biwired_takenIds = new Set();

amplify.subscribe("wire.webapp.conversation.event_from_backend", function(rawEvent) {
	var event = {};
	
	event.id = rawEvent.id;
	event.raw_type = rawEvent.type;
	event.time = new Date(rawEvent.time).getTime() / 1000 || null;
	
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
		
		//asset upload start vs finish
		if (!window.biwired_takenIds.has("asset" + event.id)) {
			event.file_size = rawEvent.data.content_length;
			event.file_mime_type = rawEvent.data.content_length;
			event.file_name = rawEvent.data.info.name;
			
			window.biwired_takenIds.add("asset" + event.id)
		}
		else {
			event.type = "asset_finished";
			event.asset = event.id;
			
			//mock new id
			var charCode = event.id.charCodeAt(0) + 1;
			if (charCode == 58 || charCode == 123) charCode = 48;
			event.id = String.fromCharCode(charCode) + event.id.substr(1);
			event.id[8] = "X"; //mark counterfeit id
			
			//suppress irrelevant states
			if (rawEvent.data.status != "uploaded" && rawEvent.data.status != "upload-failed")
				return;
			
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
});
