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
