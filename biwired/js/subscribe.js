window.biwired_events = [];

amplify.subscribe("wire.webapp.conversation.event_from_backend", function(rawEvent) {
	var event = {};
	
	if (rawEvent.type == "conversation.message-add") {
		event.type = "newMessage";
		event.id = rawEvent.id;
		event.author = rawEvent.from;
		event.timestamp = new Date(rawEvent.time).getTime();
		event.content = rawEvent.data.content;
		event.conversation = rawEvent.conversation;
	}
	else {
		event.type = "unknown";
		event.rawType = rawEvent.type;
	}
	
	window.biwired_events.push(event);
});
