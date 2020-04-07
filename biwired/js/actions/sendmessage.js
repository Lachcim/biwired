var repo = ko.dataFor(document.getElementById("wire-main")).actions.conversationRepository;
var bar = ko.dataFor(document.getElementById("conversation-input-bar-text"));
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
	
//create mention entities
var mentions = [];
for (var i in arguments[2]) {
	var rawMention = arguments[2][i];
	
	//spoof objects to call mention creating function
	bar.editedMention = function() {
		return {"startIndex": rawMention.index};
	};
	var userEntity = {
		"name": function() { return rawMention.name; },
		"id": rawMention.id
	};
	
	mentions.push(bar._createMentionEntity(userEntity));
}

//create quote entity
var quote = null;
if (arguments[3]) {
	var replyEntity = {
		"conversation_id": arguments[0],
		"id": arguments[3]
	};
	
	//invalid quotes are non-fatal
	try { quote = await bar._generateQuote(replyEntity); }
	catch {}
}	

repo.sendText(conversation, arguments[1], mentions, quote).then(callback, callback);
