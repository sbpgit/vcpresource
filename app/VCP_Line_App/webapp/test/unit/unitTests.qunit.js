/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"vcpapp/vcp_line_apps/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
