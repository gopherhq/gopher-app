const { expect } = require("chai");
const GopherHelper = require("../lib/gopher-helper");
const _ = require("lodash");

describe("Gopher Helper", function() {
  const webhookJson = require("./fixtures/task-created-webhook.json");
  // TODO: Improve testing different types of webhooks
  // const webhookJson = require("./fixtures/task-triggered-webhook.json");
  // const webhookJson = require("./fixtures/task-action-received-webhook.json");
  // const webhookJson = require("./fixtures/task-updated-webhook.json");
  // const webhookJson = require("./fixtures/extension-triggered-webhook.json"); //expected failures for undefined
  // const webhookJson = require("./fixtures/extension-settings-viewed-webhook.json");
  // const webhookJson = require("./fixtures/extension-settings-pre-saved-webhook.json");

  const request = {};
  request.body = webhookJson;
  response = {};
  response.locals = {};
  gopherHelper = new GopherHelper(request, response);
  const responseJson = gopherHelper.webhook.responseJson;

  describe("settings helpers", function() {
    it("creates an empty, namespaced settings form", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize).to.haveOwnProperty("JSONSchema");
      expect(settings.memorize).to.haveOwnProperty("uiSchema");
      expect(settings.memorize.JSONSchema.title).to.equal("Memorize Settings");
      done();
    });

    it("adds a form input", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.input({ name: "first_name", title: "First name" });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.JSONSchema.properties).to.haveOwnProperty(
        "first_name"
      );
      expect(settings.memorize.JSONSchema.properties.first_name).to.deep.equal({
        type: "string",
        title: "First name",
        description: undefined
      });
      done();
    });

    it("adds a form input with a default value", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.input({
        name: "first_name",
        title: "First name",
        defaultValue: "Joe"
      });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.formData.first_name).to.equal("Joe");
      done();
    });

    it("overwrites default input value when populating", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.input({
        name: "first_name",
        title: "First name",
        defaultValue: "Joe"
      });
      newForm.populate({ first_name: "Bob" });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.formData.first_name).to.equal("Bob");
      done();
    });

    it("adds a textarea input", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.textarea({ name: "essay", title: "essay" });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.JSONSchema.properties).to.haveOwnProperty(
        "essay"
      );
      done();
    });

    it("adds an alert dialog", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.alert({ name: "dialog", title: "An Alert Dialog" });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.JSONSchema.properties).to.haveOwnProperty(
        "alert"
      );
      done();
    });

    it("adds a markdown text block", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.text(`--------------
  ## ️⚠️ Connect Github
  This is a text block here. Leading spaces can break this.
  And this is a new line. Here is a new line
  
  [Connect Github](http://www.google.com)
  
  ------------------
  `);

      const fields =
        gopherHelper.webhook.responseJson.settings.memorize.JSONSchema
          .properties;
      const hasMarkdown = Object.keys(fields).some(key => key.includes("_md_"));
      expect(hasMarkdown).to.be.true;
      done();
    });

    it("Adds a checkbox", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize"
      });
      newForm.checkbox({ name: "notifications", title: "Notifications" });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.JSONSchema.properties).to.haveOwnProperty(
        "notifications"
      );
      done();
    });

    it("inserts custom schemas in the right locations", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize"
      });
      newForm.insert({
        name: "my_selection",
        JSONSchema: {
          title: "Something direct",
          type: "string",
          enum: ["foo", "bar", "show", "far"]
        },
        uiSchema: {
          "ui:placeholder": "Choose one"
        }
      });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.JSONSchema.properties).to.haveOwnProperty(
        "my_selection"
      );
      expect(settings.memorize.uiSchema).to.haveOwnProperty("my_selection");
      expect(settings.memorize.uiSchema.my_selection).to.deep.equal({
        "ui:placeholder": "Choose one"
      });
      done();
    });

    it("Adds a select dropdown box", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize"
      });
      newForm.select({
        name: "select_something",
        options: ["Red", "Blue", "Green"],
        placeholder: "Select something",
        title: "What's your favorite color?",
        description: "This tells a lot about a person",
        helpText: "(Hint: Blue is the best)"
      });
      const settings = gopherHelper.webhook.responseJson.settings;
      expect(settings.memorize.JSONSchema.properties).to.haveOwnProperty(
        "select_something"
      );
      expect(settings.memorize.uiSchema).to.haveOwnProperty("select_something");
      expect(settings.memorize.uiSchema.select_something).to.deep.equal({
        "ui:help": "(Hint: Blue is the best)",
        "ui:placeholder": "Select something",
        "ui:emptyValue": ""
      });
      done();
    });

    it("builds an array of separate JSON Schema forms", function(done) {
      const firstForm = gopherHelper.webhook.settingsPage({
        namespace: "github",
        title: "Github Settings"
      });
      firstForm.input({
        name: "first_name",
        title: "First Name"
      });
      firstForm.populate({ first_name: "Bob" });

      const secondForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Github Settings"
      });
      secondForm.input({
        name: "first_name",
        title: "First Name"
      });
      secondForm.populate({ first_name: "Joe" });
      const settings = gopherHelper.responseJson.settings;
      expect(settings).to.haveOwnProperty("github");
      expect(settings).to.haveOwnProperty("memorize");
      expect(settings.github.formData.first_name).to.equal("Bob");
      done();
    });

    it("gets new and old settings from pre-save webhook");
    it("sets newly set data from extension.settings_pre_saved hook");

    it("adds a custom submit button with url params", function(done) {
      const newForm = gopherHelper.webhook.settingsPage({
        namespace: "memorize",
        title: "Memorize Settings"
      });
      newForm.submitButton({
        submitText: "Submit Me",
        urlParams: { foo: "bar" }
      });
      const settings = gopherHelper.responseJson.settings;
      expect(settings.memorize.formMeta).to.haveOwnProperty("submitText");
      expect(settings.memorize.formMeta).to.haveOwnProperty("urlParams");
      done();
    });
  });

  describe("task data", function() {
    // Dependent tests
    it("gets task data", done => {
      _.set(
        gopherHelper.webhook,
        "requestJson.task.stored_data.frequency_pref",
        "1.5"
      );
      const fq = gopherHelper.webhook.getTaskData("frequency_pref");
      expect(fq).to.equal("1.5");
      done();
    });

    it("sets task data with an object", done => {
      gopherHelper.webhook.setTaskData({ frequency_pref: "5" });
      done();
    });

    it("sets task data using object path and string", done => {
      gopherHelper.webhook.setTaskData("frequency_pref", "8");
      expect(
        gopherHelper.webhook.responseJson.task.stored_data.frequency_pref
      ).to.equal("8");
      done();
    });

    it("gets default if key doesn't exist", done => {
      const data = gopherHelper.webhook.getTaskData("not_here", "foo");
      expect(data).to.equal("foo");
      done();
    });

    it("prioritizes newly set responseJson data", done => {
      const fq = gopherHelper.webhook.getTaskData("frequency_pref");
      expect(fq).to.equal("8");
      done();
    });

    it("lets data accumulate with requestJson values and added data", done => {
      _.set(gopherHelper.webhook, "requestJson.task.stored_data", null);
      _.set(gopherHelper.webhook, "responseJson.task.stored_data", null);
      // data can be set on the
      _.set(gopherHelper.webhook, "requestJson.task.stored_data", {
        foo: "bar",
        second: { inside: "value" }, // this will be overridden
        third: { another: "value" }
      });
      gopherHelper.webhook.setTaskData({ first: "value" });
      gopherHelper.webhook.setTaskData({ second: "value" });
      expect(gopherHelper.webhook.responseJson.task.stored_data).to.deep.eq({
        first: "value",
        foo: "bar",
        second: "value", // since we shallowly merge, this gets overwritten
        third: {
          another: "value" // left untouched from request object since it was never reset
        }
      });
      done();
    });

    it("gets the reference email", done => {
      const email = gopherHelper.webhook.getReferenceEmail();
      expect(email.from).to.equal("esweetland@gmail.com");
      done();
    });

    it("gets and sets reference email by merging", done => {
      gopherHelper.webhook.setReferenceEmail({ to: ["fdsa@fdsa.com"] });
      const newEmail = gopherHelper.webhook.getReferenceEmail();
      expect(newEmail.to).to.deep.equal(["fdsa@fdsa.com"]);
      expect(newEmail.from).to.equal("esweetland@gmail.com");
      done();
    });

    it("gets a reply_to address from reference email or source", done => {
      let email = gopherHelper.webhook.getReplyTo();
      expect(email).to.equal("esweetland@gmail.com");
      gopherHelper.webhook.set(
        "task.reference_email.reply_to",
        "fdas@fdsa.com"
      );
      email = gopherHelper.webhook.getReplyTo();
      expect(email).to.equal("fdas@fdsa.com");
      done();
    });

    it("sets the trigger time nautally", done => {
      gopherHelper.webhook.setTriggerTime("1day");
      expect(gopherHelper.responseJson.task.trigger_timeformat).to.eq("1day");
      done();
    });

    it("sets the trigger reminder time with a timestamp", done => {
      gopherHelper.webhook.setTriggerTimestamp(100000000);
      expect(gopherHelper.responseJson.task.trigger_time).to.equal(100000000);
      done();
    });

    it("marks a task as completed", done => {
      gopherHelper.webhook.completeTask();
      expect(gopherHelper.responseJson.task.completed).to.equal(1);
      done();
    });
  });

  describe("deeply gets and sets object data", function() {
    // Dependent tests
    beforeEach(function() {
      // gopherHelper.set("task.stored_data", null);
      _.set(gopherHelper, "webhook.responseJson.task.stored_data", null);
      _.set(gopherHelper, "webhook.requestJson.task.stored_data", null);
    });

    it("getting task data gets it responseJson first and requestJson second", done => {
      gopherHelper.webhook.requestJson.task.stored_data = {
        foo: "bar"
      };
      gopherHelper.webhook.responseJson.task.stored_data = {
        shoe: "far"
      };
      const taskData = gopherHelper.webhook.getTaskData();
      expect(taskData).to.deep.eq({
        shoe: "far"
      });
      done();
    });

    it("merges task data when passed an object", done => {
      gopherHelper.webhook.setTaskData({ new: "value" });
      expect(gopherHelper.responseJson.task.stored_data).to.deep.eq({
        new: "value"
      });
      done();
    });

    it("only shallow-merges task data when passed only an object", done => {
      gopherHelper.webhook.setTaskData({ new: { inside: "key" } });
      gopherHelper.webhook.setTaskData({ new: "value" });
      expect(JSON.stringify(responseJson.task.stored_data)).to.eq(
        '{"new":"value"}'
      );
      done();
    });

    it("deeply, non-destructively sets properties when passed a JSON path string", done => {
      gopherHelper.webhook.setTaskData({ pref: 1, new: { inside: "key" } });
      gopherHelper.webhook.setTaskData("new.inside", "updated_key");
      expect(responseJson.task.stored_data).to.deep.eq({
        pref: 1,
        new: { inside: "updated_key" }
      });
      done();
    });

    it("shallow merges a 'deep object' using a json path string", done => {
      gopherHelper.webhook.setTaskData({
        new: { inside: "key", nested_obj: { key: "v" } }
      });
      gopherHelper.webhook.setTaskData("new", { anohter_inside: "overridden" });
      expect(JSON.stringify(responseJson.task.stored_data)).to.eq(
        `{"new":{"inside":"key","nested_obj":{"key":"v"},"anohter_inside":"overridden"}}`
      );
      done();
    });

    it("array data ovewrites and does not merge", done => {
      gopherHelper.webhook.setTaskData("frequency_pref", "8");
      gopherHelper.webhook.setTaskData(["a", "b"]);
      expect(responseJson.task.stored_data).to.deep.eq(["a", "b"]);
      gopherHelper.webhook.setTaskData({ foo: { bar: { something: "here" } } });
      // Note: If lodash _.set tries to set a object path on an array, it turns the array into an object.
      gopherHelper.webhook.setTaskData("foo.bar", ["no", "more"]);
      expect(responseJson.task.stored_data.foo.bar).to.deep.eq(["no", "more"]);
      done();
    });

    it("deeply gets a data key", done => {
      gopherHelper.webhook.setTaskData({
        foo: { bar: "baz" }
      });
      const data = gopherHelper.webhook.getTaskData("foo.bar");
      expect(data).to.equal("baz");
      done();
    });
  });

  describe("extension", function() {
    it("sets extension data", done => {
      gopherHelper.webhook.setExtensionData({
        crm: {
          key: "23432",
          name: "bob"
        }
      });
      expect(responseJson.extension.stored_data.crm).to.deep.equal({
        key: "23432",
        name: "bob"
      });
      done();
    });

    it("gets extension data", done => {
      const data = gopherHelper.webhook.getExtensionData("crm.name");
      expect(data).to.equal("bob");
      done();
    });

    it("shallow merges extension data", done => {
      gopherHelper.webhook.setExtensionData({
        crm: {
          another: "key"
        }
      });
      expect(responseJson.extension.stored_data.crm).to.deep.equal({
        another: "key"
      });
      done();
    });

    it("sets extension data using lodash _.set string", done => {
      gopherHelper.webhook.setExtensionData("crm", {
        key: "9876",
        name: "joe"
      });
      expect(responseJson.extension.stored_data.crm).to.deep.equal({
        another: "key",
        key: "9876",
        name: "joe"
      });
      done();
    });

    it("invites other people to use the extension", done => {
      gopherHelper.webhook.invite(["newuser@fdsa.com"]);
      expect(gopherHelper.responseJson.extension.invite).to.deep.equal([
        "newuser@fdsa.com"
      ]);
      done();
    });
  });

  describe("sending email", function() {
    it("adds outbound email to response", done => {
      gopherHelper.webhook.addEmail({
        to: "fdas@fdsa.com",
        subject: "testing",
        body: [
          {
            type: "title",
            text: "Testing from Gopher"
          }
        ]
      });
      expect(gopherHelper.responseJson).to.haveOwnProperty("send_messages");
      expect(gopherHelper.responseJson.send_messages[0].to).to.equal(
        "fdas@fdsa.com"
      );
      done();
    });

    // Depends on above test
    it("adds outbound email to response", done => {
      gopherHelper.webhook.quickReply("quick reply");
      expect(gopherHelper.responseJson).to.haveOwnProperty("send_messages");
      expect(gopherHelper.responseJson.send_messages[1].body[0].text).to.equal(
        "quick reply"
      );
      expect(gopherHelper.responseJson.send_messages[1].subject).to.equal(
        "quick reply"
      );
      done();
    });

    it("returns a mutable reference to the new email", done => {
      const email = gopherHelper.webhook.addEmail({
        to: "fdas@fdsa.com",
        subject: "testing",
        body: [
          {
            type: "title",
            text: "Testing from Gopher"
          }
        ]
      });
      email.subject = "new subject";
      const lastEmailIndex = gopherHelper.responseJson.send_messages.length - 1;
      expect(
        gopherHelper.responseJson.send_messages[lastEmailIndex].subject
      ).to.equal("new subject");
      done();
    });
  });

  describe("helpers", function() {
    it("makes webhook req / res JSON available", done => {
      expect(gopherHelper.webhook.requestJson).to.be.an("object");
      expect(gopherHelper.webhook.responseJson).to.be.an("object");
      done();
    });

    it("sets the version of the response", done => {
      expect(gopherHelper.webhook.responseJson).to.haveOwnProperty("version");
      done();
    });

    it("exposes the get and set method for any value", done => {
      gopherHelper.webhook.set("task.unexpected_future_field", "foo");
      expect(gopherHelper.webhook.get("task.unexpected_future_field")).to.equal(
        "foo"
      );
      done();
    });

    // TODO: This fails when running action_received webhook
    it("exposes command as gopher.command", done => {
      expect(gopherHelper.command).to.equal("memorize");
      done();
    });

    it("exposes event as gopher.webhook.event", done => {
      expect(gopherHelper.event).to.equal("task.created");
      done();
    });

    it.skip("exposes action as gopher.action", done => {
      expect(gopherHelper.action).to.equal("frequency.0-2");
      done();
    });
  });
});
