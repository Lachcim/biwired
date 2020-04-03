if (arguments[0] == 0) {
	//batch mode
	var output = window.biwired_events.slice();
	window.biwired_events = [];
	return output;
}
else if (arguments[0] == 1) {
	//single mode
	return window.biwired_events.shift();
}
else if (arguments[0] == 2) {
	//check mode
	return window.biwired_events.length > 0;
}
