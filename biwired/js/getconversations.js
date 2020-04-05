var conversations = ko.dataFor(document.getElementById("wire-main")).actions.conversationRepository.conversations();
var output = [];

for (var i in conversations) {
	var conversation = {};
	conversation.id = conversations[i].id;
	conversation.name = conversations[i].display_name();
	conversation.creator = conversations[i].creator;
	conversation.type = ["group", "self", "one2one", "connect"][conversations[i].type()];
	conversation.members = [];
	conversation.admins = [];
	
	var roles = conversations[i].roles();
	for (var x in roles) {
		conversation.members.push(x);
		if (roles[x] == "wire_admin") conversation.admins.push(x);
	}
	
	if (conversation.type == "connect") {
		var otherParty = conversations[i].participating_user_ids()[0];
		conversation.members.push(otherParty);
		conversation.admins.push(otherParty);
	}
	
	output.push(conversation);
}

return output;
