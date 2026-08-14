/*global QUnit*/

sap.ui.define([
	"vcpapp/vcp_cprestrictionsavail/controller/Restrictions.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Restrictions Controller");

	QUnit.test("I should test the Restrictions controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
