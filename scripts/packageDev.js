var exec = require("child_process").exec;

// Load existing publisher
var manifest = require("../vss-extension.json");
var extensionName = manifest.name;

// Package extension
var command = `tfx extension create --overrides-file configs/dev.json --manifest-globs vss-extension.json --extension-id ${extensionName}-dev --no-prompt`;
exec(command, function() {
    console.log("Package created");
});