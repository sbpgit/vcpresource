/*global QUnit*/

sap.ui.define([
	"vcpapp/vcprestrictions/controller/Details.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Details Controller");

	QUnit.test("I should test the Details controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
