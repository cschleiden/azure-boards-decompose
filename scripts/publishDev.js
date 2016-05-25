var exec = require("child_process").exec;

var manifest = require("../vss-extension.json");
var extensionName = manifest.name;
var extensionPublisher = manifest.publisher;
var extensionVersion = manifest.version;

// Package extension
var command = `tfx extension publish --vsix ${extensionPublisher}.${extensionName}-dev-${extensionVersion}.vsix --no-prompt`;
exec(command, function() {
    console.log("Package published.");
});