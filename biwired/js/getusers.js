var users = ko.dataFor(document.getElementById("wire-main")).userRepository.users();
var output = [];

for (var i in users) {
	var user = {};
	user.id = users[i].id;
	user.name = users[i].name();
	user.handle = users[i].username();
	user.is_self = users[i].is_me;
	user.conversation = users[i].connection().conversationId;
	
	var connectionDict = {
		"accepted": "connected",
		"blocked": "blocked", //blocked by us
		"cancelled": "withdrawn", //cancelled by sender (either us or them)
		"ignored": "incoming", //ignored by us, displays as "sent" to sender
		"pending": "incoming",
		"sent": "outgoing",
		"unknown": "unconnected"
	};
	user.connection = connectionDict[users[i].connection().status()];
	
	output.push(user);
}

return output;
