var biwired_assetService = ko.dataFor(document.getElementById("wire-main")).userRepository.asset_service;
var biwired_callback = arguments[arguments.length - 1];

biwired_assetService.generateAssetUrlV3(arguments[0], arguments[1], true).then(function(url) {
	biwired_callback(url);
},
function() {
	biwired_callback(null);
});
