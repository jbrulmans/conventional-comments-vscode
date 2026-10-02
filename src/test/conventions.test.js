"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_assert_1 = require("node:assert");
var node_test_1 = require("node:test");
var conventions_1 = require("../conventions");
var set = function (text, label, decoration, prettified) {
    if (prettified === void 0) { prettified = false; }
    return (0, conventions_1.applyEdit)(text, (0, conventions_1.setPrefix)(text, label, decoration, prettified));
};
(0, node_test_1.describe)("createBadgeMarkdown", function () {
    (0, node_test_1.it)("builds a label-only badge", function () {
        node_assert_1.strict.equal((0, conventions_1.createBadgeMarkdown)("praise"), "[![praise](https://img.shields.io/badge/praise-28A745)](https://pullpo.io/cc?l=praise) ");
    });
    (0, node_test_1.it)("escapes dashes and uses the decoration color", function () {
        node_assert_1.strict.equal((0, conventions_1.createBadgeMarkdown)("suggestion", "non-blocking"), "[![suggestion(non-blocking)](https://img.shields.io/badge/suggestion-non--blocking-9CA3AF?labelColor=3B82F6)](https://pullpo.io/cc?l=suggestion&d=non-blocking) ");
    });
    (0, node_test_1.it)("matches BADGE_CC_REGEX", function () {
        var m = (0, conventions_1.createBadgeMarkdown)("issue", "blocking").match(conventions_1.BADGE_CC_REGEX);
        node_assert_1.strict.deepEqual([m === null || m === void 0 ? void 0 : m[1], m === null || m === void 0 ? void 0 : m[2]], ["issue", "blocking"]);
    });
});
(0, node_test_1.describe)("parsePrefix", function () {
    (0, node_test_1.it)("returns undefined without a prefix", function () {
        node_assert_1.strict.equal((0, conventions_1.parsePrefix)("just a comment"), undefined);
    });
    (0, node_test_1.it)("parses plain prefixes", function () {
        node_assert_1.strict.deepEqual((0, conventions_1.parsePrefix)("nitpick(if-minor): rename this"), {
            label: "nitpick",
            decoration: "if-minor",
            prettified: false,
            length: "nitpick(if-minor): ".length,
        });
    });
    (0, node_test_1.it)("parses badge prefixes", function () {
        var parsed = (0, conventions_1.parsePrefix)((0, conventions_1.buildPrefix)("todo", undefined, true) + "add tests");
        node_assert_1.strict.equal(parsed === null || parsed === void 0 ? void 0 : parsed.label, "todo");
        node_assert_1.strict.equal(parsed === null || parsed === void 0 ? void 0 : parsed.decoration, undefined);
        node_assert_1.strict.equal(parsed === null || parsed === void 0 ? void 0 : parsed.prettified, true);
    });
});
(0, node_test_1.describe)("setPrefix", function () {
    (0, node_test_1.it)("adds a plain prefix", function () {
        node_assert_1.strict.equal(set("use a map here", "suggestion"), "suggestion: use a map here");
    });
    (0, node_test_1.it)("replaces an existing prefix and keeps the subject", function () {
        node_assert_1.strict.equal(set("suggestion(non-blocking): use a map here", "issue"), "issue: use a map here");
    });
    (0, node_test_1.it)("adds a decoration", function () {
        node_assert_1.strict.equal(set("suggestion: use a map here", "suggestion", "blocking"), "suggestion(blocking): use a map here");
    });
    (0, node_test_1.it)("puts the subject on its own line in badge form", function () {
        node_assert_1.strict.equal(set("question:   why?", "question", undefined, true), (0, conventions_1.createBadgeMarkdown)("question") + "\nwhy?");
    });
});
(0, node_test_1.describe)("removePrefix", function () {
    (0, node_test_1.it)("removes plain and badge prefixes", function () {
        var plain = "chore: bump deps";
        node_assert_1.strict.equal((0, conventions_1.applyEdit)(plain, (0, conventions_1.removePrefix)(plain)), "bump deps");
        var badge = (0, conventions_1.buildPrefix)("chore", "if-minor", true) + "bump deps";
        node_assert_1.strict.equal((0, conventions_1.applyEdit)(badge, (0, conventions_1.removePrefix)(badge)), "bump deps");
    });
    (0, node_test_1.it)("does nothing without a prefix", function () {
        node_assert_1.strict.equal((0, conventions_1.removePrefix)("bump deps"), undefined);
    });
});
(0, node_test_1.describe)("togglePrefixFormat", function () {
    (0, node_test_1.it)("round-trips between plain and badge", function () {
        var plain = "thought(non-blocking): maybe later";
        var badge = (0, conventions_1.applyEdit)(plain, (0, conventions_1.togglePrefixFormat)(plain));
        node_assert_1.strict.equal(badge, (0, conventions_1.buildPrefix)("thought", "non-blocking", true) + "maybe later");
        node_assert_1.strict.equal((0, conventions_1.applyEdit)(badge, (0, conventions_1.togglePrefixFormat)(badge)), plain);
    });
});
(0, node_test_1.describe)("mapOffset", function () {
    (0, node_test_1.it)("shifts cursors after the prefix and clamps cursors inside it", function () {
        var edit = (0, conventions_1.setPrefix)("issue: abc", "suggestion", undefined, false);
        node_assert_1.strict.equal((0, conventions_1.mapOffset)("issue: ab".length, edit), "suggestion: ab".length);
        node_assert_1.strict.equal((0, conventions_1.mapOffset)(2, edit), "suggestion: ".length);
    });
});
